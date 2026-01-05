import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import {
  uploadFile,
  validateMultipartRequest,
  getFileFromFormData,
  deleteFileByRelativePath,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Validate supplier exists and belongs to this organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { status: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    // Fetch all statements for this supplier
    const statements = await prisma.supplier_statement.findMany({
      where: {
        supplier_id: supplier.id,
        supplier: {
          organization_id: user.organizationId,
        },
      },
      include: {
        supplier_file: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Statements fetched successfully",
        data: statements,
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
    console.error("Error fetching statements:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

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

    // Validate and parse multipart/form-data
    const formData = await validateMultipartRequest(request);
    const fileResult = getFileFromFormData(formData, "file");
    const file = fileResult instanceof File ? fileResult : null;
    const month_year = formData.get("month_year");
    const due_date = formData.get("due_date");
    const amount = formData.get("amount");
    const payment_status = formData.get("payment_status");
    const notes = formData.get("notes");

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { status: false, message: "File is required" },
        { status: 400 }
      );
    }

    if (!month_year) {
      return NextResponse.json(
        { status: false, message: "Month/Year is required" },
        { status: 400 }
      );
    }

    if (!due_date) {
      return NextResponse.json(
        { status: false, message: "Due date is required" },
        { status: 400 }
      );
    }

    if (!payment_status || !["PENDING", "PAID"].includes(payment_status as string)) {
      return NextResponse.json(
        { status: false, message: "Payment status must be PENDING or PAID" },
        { status: 400 }
      );
    }

    // Get organization slug for file path
    const organizationSlug = getOrganizationSlugFromRequest(request);
    if (!organizationSlug) {
      throw new Error("Organization slug not found");
    }

    // Handle file upload (must happen before transaction)
    const sanitizedMonthYear = (month_year as string).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadResult = await uploadFile(file, {
      subDir: `suppliers/${id}/statements`,
      filenameStrategy: "id-based",
      idPrefix: `${id}_statement_${sanitizedMonthYear}`,
      organizationSlug,
    });

    // Wrap both database writes in a transaction to ensure atomicity
    let statement;
    try {
      statement = await prisma.$transaction(async (tx) => {
        // Create supplier_file record
        const supplierFile = await tx.supplier_file.create({
          data: {
            organization_id: user.organizationId,
            url: uploadResult.relativePath,
            filename: uploadResult.originalFilename,
            file_type: "statement",
            mime_type: uploadResult.mimeType,
            extension: uploadResult.extension,
            size: uploadResult.size,
          },
        });

        // Create supplier_statement record
        return await tx.supplier_statement.create({
          data: {
            month_year: month_year as string,
            due_date: new Date(due_date as string),
            amount: amount ? parseFloat(amount as string) : null,
            payment_status: payment_status as "PENDING" | "PAID",
            notes: (notes as string) || null,
            supplier_file_id: supplierFile.id,
            supplier_id: supplier.id,
          },
          include: {
            supplier_file: true,
          },
        });
      });
    } catch (transactionError) {
      // If transaction fails, clean up the uploaded file
      try {
        await deleteFileByRelativePath(uploadResult.relativePath);
      } catch (deleteError) {
        console.error(
          `Failed to clean up uploaded file after transaction failure: ${uploadResult.relativePath}`,
          deleteError
        );
      }
      // Re-throw the original transaction error
      throw transactionError;
    }

    const logged = await withLogging(
      request,
      "supplier_statement",
      statement.id,
      "CREATE",
      `Statement uploaded successfully: ${statement.month_year} for supplier: ${supplier.name}`
    );
    if (!logged) {
      console.error(`Failed to log statement upload: ${statement.id} - ${statement.month_year}`);
      return NextResponse.json(
        {
          status: true,
          message: "Statement uploaded successfully",
          data: statement,
          warning: "Note: Creation succeeded but logging failed"
        },
        { status: 201 }
      );
    }
    return NextResponse.json(
      {
        status: true,
        message: "Statement uploaded successfully",
        data: statement,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error uploading statement:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
