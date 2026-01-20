import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import {
  uploadMultipleFiles,
  validateMultipartRequest,
  getFileFromFormData,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

// Upload media files to MTO
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify MTO exists and belongs to this organization
    const mto = await prisma.materials_to_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!mto) {
      return NextResponse.json(
        { status: false, message: "Materials to order not found" },
        { status: 404 },
      );
    }

    // Handle multipart/form-data
    const formData = await validateMultipartRequest(request);
    const files = getFileFromFormData(formData, "files", true); // getAll = true

    if (!files || (Array.isArray(files) && files.length === 0)) {
      return NextResponse.json(
        { status: false, message: "No files provided" },
        { status: 400 },
      );
    }

    const filesArray = Array.isArray(files) ? files : [files];

    // Get organization slug for file path
    const organizationSlug = getOrganizationSlugFromRequest(request);
    if (!organizationSlug) {
      throw new Error("Organization slug not found");
    }

    // Upload multiple files
    const uploadResults = await uploadMultipleFiles(filesArray, {
      subDir: `materials_to_order/${mto.project_id || "general"}`,
      filenameStrategy: "original",
      organizationSlug,
    });

    if (uploadResults.successful.length === 0) {
      return NextResponse.json(
        { status: false, message: "Failed to upload files" },
        { status: 500 },
      );
    }

    // Create media records in database
    const uploadedMedia = await Promise.all(
      uploadResults.successful.map((result) =>
        prisma.media.create({
          data: {
            organization_id: user.organizationId,
            url: result.relativePath,
            filename: result.originalFilename,
            file_type: result.fileType,
            mime_type: result.mimeType,
            extension: result.extension,
            size: result.size,
            materials_to_orderId: id,
          },
        }),
      ),
    );

    // log all the uploaded media ids
    const logged = await Promise.all(
      uploadedMedia.map((media) =>
        withLogging(
          request,
          "media",
          media.id,
          "CREATE",
          `Media uploaded successfully: ${media.filename} for MTO: ${mto.id}`,
        ),
      ),
    );

    const hasLoggingFailures = logged.some((log) => !log);
    if (hasLoggingFailures) {
      console.error(`Failed to log some media uploads for MTO: ${id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: `${uploadedMedia.length} file(s) uploaded successfully`,
        data: uploadedMedia,
        ...(hasLoggingFailures
          ? { warning: "Note: Upload succeeded but some logging failed" }
          : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in media upload:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Delete media file from MTO
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { status: false, message: "mediaId is required" },
        { status: 400 },
      );
    }

    // Verify MTO exists and belongs to this organization
    const mto = await prisma.materials_to_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        project: {
          select: {
            project_id: true,
            name: true,
          },
        },
      },
    });

    if (!mto) {
      return NextResponse.json(
        { status: false, message: "Materials to order not found" },
        { status: 404 },
      );
    }

    // Find the media record (only if not already deleted and belongs to organization)
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        materials_to_orderId: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    if (!media) {
      return NextResponse.json(
        { status: false, message: "Media not found" },
        { status: 404 },
      );
    }

    // Mark as deleted (soft delete) - don't physically delete the file
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: { is_deleted: true },
    });

    // Log the deletion action
    const logged = await withLogging(
      request,
      "media",
      updatedMedia.id,
      "DELETE",
      `Media deleted successfully: ${updatedMedia.filename} for MTO: ${
        mto.id
      } (Project: ${mto.project?.name || "N/A"})`,
    );

    if (!logged) {
      console.error(
        `Failed to log media deletion: ${updatedMedia.id} - ${updatedMedia.filename}`,
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Media marked as deleted successfully",
        data: {
          fileId: updatedMedia.id,
          filename: updatedMedia.filename,
        },
        ...(logged
          ? {}
          : { warning: "Note: Deletion succeeded but logging failed" }),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
