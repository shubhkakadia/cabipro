import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const config = await prisma.constants_config.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!config) {
      return NextResponse.json(
        { status: false, message: "Config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, message: "Config fetched successfully", data: config },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/config/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { category, value } = await request.json();

    // Check if config exists and belongs to this organization
    const existingConfig = await prisma.constants_config.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { status: false, message: "Config not found" },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: {
      category?: string;
      value?: string;
    } = {};

    if (category !== undefined) {
      updateData.category = category;
    }

    if (value !== undefined) {
      updateData.value = value;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { status: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    const config = await prisma.constants_config.update({
      where: { id: id },
      data: updateData,
    });

    const logged = await withLogging(
      request,
      "constants_config",
      id,
      "UPDATE",
      `Config updated successfully: ${config.category}`
    );

    if (!logged) {
      console.error(`Failed to log config update: ${id} - ${config.category}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Config updated successfully",
        data: config,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/config/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Check if config exists and belongs to this organization
    const existingConfig = await prisma.constants_config.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { status: false, message: "Config not found" },
        { status: 404 }
      );
    }

    // Delete the config record
    const config = await prisma.constants_config.delete({
      where: { id: id },
    });

    const logged = await withLogging(
      request,
      "constants_config",
      id,
      "DELETE",
      `Config deleted successfully: ${config.category}`
    );

    if (!logged) {
      console.error(`Failed to log config deletion: ${id} - ${config.category}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Config deleted successfully",
        data: config,
        ...(logged
          ? {}
          : { warning: "Note: Deletion succeeded but logging failed" }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/config/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
