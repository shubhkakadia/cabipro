import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import {
  uploadFile,
  deleteFileByRelativePath,
  getFileFromFormData,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; statementId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id, statementId } = await params;

    // Validate supplier exists and belongs to this organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { status: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    // Validate statement exists and belongs to this supplier
    const existingStatement = await prisma.supplier_statement.findFirst({
      where: {
        id: statementId,
        supplier_id: supplier.id,
        supplier: {
          organization_id: user.organizationId,
        },
      },
      include: { supplier_file: true },
    });

    if (!existingStatement) {
      return NextResponse.json(
        { status: false, message: "Statement not found" },
        { status: 404 }
      );
    }

    // Check Content-Type
    const contentType = request.headers.get("Content-Type");
    const isFormData =
      contentType && contentType.includes("multipart/form-data");

    let month_year: string | undefined;
    let due_date: string | undefined;
    let amount: string | undefined;
    let payment_status: string | undefined;
    let notes: string | undefined;
    let file: File | null = null;

    if (isFormData) {
      const formData = await request.formData();
      const fileResult = getFileFromFormData(formData, "file");
      file = fileResult instanceof File ? fileResult : null;
      month_year = formData.get("month_year") as string | undefined;
      due_date = formData.get("due_date") as string | undefined;
      amount = formData.get("amount") as string | undefined;
      payment_status = formData.get("payment_status") as string | undefined;
      notes = formData.get("notes") as string | undefined;
    } else {
      const body = await request.json();
      month_year = body.month_year;
      due_date = body.due_date;
      amount = body.amount;
      payment_status = body.payment_status;
      notes = body.notes;
    }

    // Validate payment status if provided
    if (payment_status && !["PENDING", "PAID"].includes(payment_status)) {
      return NextResponse.json(
        { status: false, message: "Payment status must be PENDING or PAID" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (month_year !== undefined) updateData.month_year = month_year;
    if (due_date !== undefined) updateData.due_date = new Date(due_date);
    if (amount !== undefined)
      updateData.amount = amount ? parseFloat(amount) : null;
    if (payment_status !== undefined)
      updateData.payment_status = payment_status;
    if (notes !== undefined) updateData.notes = notes || null;

    // Handle file upload if new file is provided
    let oldFileUrl = null;
    if (file) {
      // Store old file URL for deletion after successful update
      if (existingStatement.supplier_file) {
        oldFileUrl = existingStatement.supplier_file.url;
      }

      // Get organization slug for file path
      const organizationSlug = getOrganizationSlugFromRequest(request);
      if (!organizationSlug) {
        throw new Error("Organization slug not found");
      }

      // Upload new file first (before deleting old one)
      const sanitizedMonthYear = (
        month_year || existingStatement.month_year
      ).replace(/[^a-zA-Z0-9_-]/g, "_");
      const uploadResult = await uploadFile(file, {
        subDir: `suppliers/${supplier.id}/statements`,
        filenameStrategy: "id-based",
        idPrefix: `${supplier.id}_statement_${sanitizedMonthYear}`,
        organizationSlug,
      });

      // Store upload result for use in transaction
      (updateData as Record<string, unknown>)._fileUploadResult = uploadResult;
      (updateData as Record<string, unknown>)._hasExistingFile =
        !!existingStatement.supplier_file;
      (updateData as Record<string, unknown>)._existingFileId =
        existingStatement.supplier_file_id;
    }

    // Wrap all database updates in a single transaction to ensure atomicity
    const updatedStatement = await prisma.$transaction(async (tx) => {
      // Update or create supplier_file if new file was uploaded
      const fileUploadResult = (updateData as Record<string, unknown>)
        ._fileUploadResult as
        | {
            relativePath: string;
            originalFilename: string;
            mimeType: string;
            extension: string;
            size: number;
          }
        | undefined;
      const hasExistingFile = (updateData as Record<string, unknown>)
        ._hasExistingFile as boolean | undefined;
      const existingFileId = (updateData as Record<string, unknown>)
        ._existingFileId as string | undefined;

      if (file && fileUploadResult) {
        if (hasExistingFile && existingFileId) {
          // Update existing file record
          await tx.supplier_file.update({
            where: { id: existingFileId },
            data: {
              url: fileUploadResult.relativePath,
              filename: fileUploadResult.originalFilename,
              mime_type: fileUploadResult.mimeType,
              extension: fileUploadResult.extension,
              size: fileUploadResult.size,
            },
          });
        } else {
          // Create new file record
          const newFile = await tx.supplier_file.create({
            data: {
              organization_id: user.organizationId,
              url: fileUploadResult.relativePath,
              filename: fileUploadResult.originalFilename,
              file_type: "statement",
              mime_type: fileUploadResult.mimeType,
              extension: fileUploadResult.extension,
              size: fileUploadResult.size,
            },
          });
          updateData.supplier_file_id = newFile.id;
        }
      }

      // Clean up temporary fields before updating statement
      delete (updateData as Record<string, unknown>)._fileUploadResult;
      delete (updateData as Record<string, unknown>)._hasExistingFile;
      delete (updateData as Record<string, unknown>)._existingFileId;

      // Update statement (all updates happen atomically)
      return await tx.supplier_statement.update({
        where: { id: statementId },
        include: {
          supplier_file: true,
          supplier: {
            select: {
              name: true,
            },
          },
        },
        data: updateData,
      });
    });

    // Only delete old file after all database updates succeed
    if (file && oldFileUrl) {
      try {
        await deleteFileByRelativePath(oldFileUrl);
      } catch (deleteError) {
        // Log error but don't fail the request - old file cleanup is best effort
        console.error(`Failed to delete old file: ${oldFileUrl}`, deleteError);
      }
    }

    const logged = await withLogging(
      request,
      "supplier_statement",
      statementId,
      "UPDATE",
      `Statement updated successfully: ${updatedStatement.month_year} for supplier: ${updatedStatement.supplier.name}`
    );
    if (!logged) {
      console.error(
        `Failed to log statement update: ${statementId} - ${updatedStatement.month_year}`
      );
    }
    return NextResponse.json(
      {
        status: true,
        message: "Statement updated successfully",
        data: updatedStatement,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error updating statement:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; statementId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id, statementId } = await params;

    // Validate supplier exists and belongs to this organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { status: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    // Validate statement exists and belongs to this supplier
    const statement = await prisma.supplier_statement.findFirst({
      where: {
        id: statementId,
        supplier_id: supplier.id,
        supplier: {
          organization_id: user.organizationId,
        },
      },
      include: {
        supplier_file: true,
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!statement) {
      return NextResponse.json(
        { status: false, message: "Statement not found" },
        { status: 404 }
      );
    }

    // Soft delete supplier_file if it exists (before deleting statement)
    if (statement.supplier_file && !statement.supplier_file.is_deleted) {
      await prisma.supplier_file.update({
        where: { id: statement.supplier_file.id },
        data: { is_deleted: true },
      });
    }

    // Delete statement (cascade will handle supplier_file relationship, but file is already soft deleted)
    await prisma.supplier_statement.delete({
      where: { id: statementId },
    });

    const logged = await withLogging(
      request,
      "supplier_statement",
      statementId,
      "DELETE",
      `Statement deleted successfully: ${statement.month_year} for supplier: ${statement.supplier.name}`
    );
    if (!logged) {
      console.error(
        `Failed to log statement deletion: ${statementId} - ${statement.month_year}`
      );
      return NextResponse.json(
        {
          status: true,
          message: "Statement deleted successfully",
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        status: true,
        message: "Statement deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error deleting statement:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
