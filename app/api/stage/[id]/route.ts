import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

// Helper function to process date/time fields
function processDateTimeField(value: string | null | undefined): Date | null {
  if (!value || value === "" || value === "null") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { name, status, notes, startDate, endDate, assigned_to } =
      await request.json();

    // Verify stage exists and belongs to this organization
    const existingStage = await prisma.stage.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        lot: {
          include: {
            project: {
              select: {
                id: true,
                project_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingStage) {
      return NextResponse.json(
        { status: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    // Verify employees belong to this organization if assigned_to is provided
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const employees = await prisma.employees.findMany({
        where: {
          id: { in: assigned_to },
          organization_id: user.organizationId,
        },
        select: { id: true },
      });

      if (employees.length !== assigned_to.length) {
        return NextResponse.json(
          {
            status: false,
            message:
              "One or more employees not found or do not belong to your organization",
          },
          { status: 404 },
        );
      }
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name ? name.toLowerCase() : undefined;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (startDate !== undefined) {
      updateData.startDate =
        startDate && startDate.trim() !== ""
          ? processDateTimeField(startDate)
          : null;
    }
    if (endDate !== undefined) {
      updateData.endDate =
        endDate && endDate.trim() !== "" ? processDateTimeField(endDate) : null;
    }

    // Use transaction to ensure atomicity - all operations succeed or all fail
    // Use transaction to ensure atomicity - all operations succeed or all fail
    await prisma.$transaction(async (tx) => {
      // Update the stage basic information
      const updatedStage = await tx.stage.update({
        where: { id: id },
        data: updateData,
      });

      // Handle employee assignments: delete all existing, then create new ones
      // First, delete all existing assignments for this stage
      await tx.stage_employee.deleteMany({
        where: { stage_id: id },
      });

      // Then create new assignments if any
      // If this fails, the entire transaction (including stage update and delete) will roll back
      if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
        await tx.stage_employee.createMany({
          data: assigned_to.map((employee_id: string) => ({
            stage_id: id,
            employee_id: employee_id,
          })),
          skipDuplicates: true, // Safety check, though should be unnecessary after delete
        });
      }

      return updatedStage;
    });

    // Fetch the updated stage with all relationships
    const updatedStage = await prisma.stage.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        lot: {
          select: {
            id: true,
            lot_id: true,
            project: {
              select: {
                id: true,
                project_id: true,
                name: true,
              },
            },
          },
        },
        assigned_to: {
          include: {
            employee: {
              select: {
                id: true,
                employee_id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!updatedStage) {
      return NextResponse.json(
        { status: false, message: "Failed to fetch updated stage" },
        { status: 500 },
      );
    }

    const logged = await withLogging(
      request,
      "stage",
      id,
      "UPDATE",
      `Stage updated successfully: ${updatedStage.name} for lot: ${
        updatedStage.lot.lot_id
      } and project: ${updatedStage.lot.project?.name || "Unknown"}`,
    );

    if (!logged) {
      console.error(`Failed to log stage update: ${id} - ${updatedStage.name}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Stage updated successfully",
        data: updatedStage,
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
    console.error("Error in PATCH /api/stage/[id]:", error);
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

    // Fetch stage with project info before deletion for logging
    const stageForLogging = await prisma.stage.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      include: {
        lot: {
          select: {
            id: true,
            lot_id: true,
            project: {
              select: {
                id: true,
                project_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!stageForLogging) {
      return NextResponse.json(
        { status: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    const stage = await prisma.stage.delete({
      where: { id },
    });

    const logged = await withLogging(
      request,
      "stage",
      id,
      "DELETE",
      `Stage deleted successfully: ${stageForLogging.name} for lot: ${
        stageForLogging.lot.lot_id
      } and project: ${stageForLogging.lot.project?.name || "Unknown"}`,
    );

    if (!logged) {
      console.error(
        `Failed to log stage deletion: ${id} - ${stageForLogging.name}`,
      );
      return NextResponse.json(
        {
          status: true,
          message: "Stage deleted successfully",
          data: stage,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { status: true, message: "Stage deleted successfully", data: stage },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in DELETE /api/stage/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
