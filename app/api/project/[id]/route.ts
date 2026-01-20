import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        client: true,
        lots: {
          where: {
            is_deleted: false,
          },
        },
        materials_to_order: {
          include: {
            lots: {
              where: {
                is_deleted: false,
              },
              include: {
                project: true,
              },
            },
            items: {
              include: {
                item: {
                  include: {
                    sheet: true,
                    handle: true,
                    hardware: true,
                    accessory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { status: false, message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { status: true, message: "Project fetched successfully", data: project },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in GET /api/project/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { name, client_id } = await request.json();

    // Check if project exists and belongs to this organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { status: false, message: "Project not found" },
        { status: 404 },
      );
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (client_id !== undefined) {
      if (client_id === null || client_id === "") {
        updateData.client_id = null;
      } else {
        // Verify client exists and belongs to this organization
        const client = await prisma.client.findFirst({
          where: {
            id: client_id,
            organization_id: user.organizationId,
          },
        });

        if (!client) {
          return NextResponse.json(
            { status: false, message: "Client not found" },
            { status: 404 },
          );
        }

        updateData.client_id = client_id;
      }
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { status: false, message: "No fields to update" },
        { status: 400 },
      );
    }

    const project = await prisma.project.update({
      where: { id: existingProject.id },
      data: updateData,
    });

    const logged = await withLogging(
      request,
      "project",
      existingProject.id,
      "UPDATE",
      `Project updated successfully: ${project.name}`,
    );

    if (!logged) {
      console.error(`Failed to log project update: ${id} - ${project.name}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Project updated successfully",
        data: project,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
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
    console.error("Error in PATCH /api/project/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Check if project exists and is not already deleted
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { status: false, message: "Project not found" },
        { status: 404 },
      );
    }

    if (existingProject.is_deleted) {
      return NextResponse.json(
        { status: false, message: "Project already deleted" },
        { status: 400 },
      );
    }

    // Soft delete the project record (set is_deleted flag)
    const project = await prisma.project.update({
      where: { id: existingProject.id },
      data: { is_deleted: true },
    });

    const logged = await withLogging(
      request,
      "project",
      existingProject.id,
      "DELETE",
      `Project deleted successfully: ${project.name}`,
    );

    if (!logged) {
      console.error(`Failed to log project deletion: ${id} - ${project.name}`);
      return NextResponse.json(
        {
          status: true,
          message: "Project deleted successfully",
          data: project,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { status: true, message: "Project deleted successfully", data: project },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in DELETE /api/project/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
