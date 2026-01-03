import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import type { LotStatus } from "@/generated/prisma/enums";

// Helper function to process date/time fields
function processDateTimeField(value: string | null | undefined): Date | null {
  if (!value || value === "" || value === "null") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const lot = await prisma.lot.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        installer: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        project: {
          include: {
            client: true,
          },
        },
        stages: {
          include: {
            assigned_to: {
              include: {
                employee: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
        tabs: {
          include: {
            files: {
              where: {
                is_deleted: false,
              },
              include: {
                maintenance_checklist: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { status: false, message: "Lot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, message: "Lot fetched successfully", data: lot },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in GET /api/lot/[id]:", error);
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
    const { name, startDate, installationDueDate, notes, status, installer_id } =
      await request.json();

    // Check if lot exists and belongs to this organization
    const existingLot = await prisma.lot.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        project: true,
      },
    });

    if (!existingLot) {
      return NextResponse.json(
        { status: false, message: "Lot not found" },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? processDateTimeField(startDate) : null;
    }

    if (installationDueDate !== undefined) {
      updateData.installationDueDate = installationDueDate
        ? processDateTimeField(installationDueDate)
        : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status !== undefined) {
      // Validate status value
      const validStatuses: LotStatus[] = ["ACTIVE", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status as LotStatus)) {
        return NextResponse.json(
          {
            status: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (installer_id !== undefined) {
      if (installer_id === null || installer_id === "") {
        updateData.installer_id = null;
      } else {
        // Verify installer exists and belongs to this organization
        const installerExists = await prisma.employees.findFirst({
          where: {
            id: installer_id,
            organization_id: user.organizationId,
          },
          select: { id: true },
        });
        if (!installerExists) {
          return NextResponse.json(
            { status: false, message: "Invalid installer selected" },
            { status: 400 }
          );
        }
        updateData.installer_id = installer_id;
      }
    }

    // Update the lot only if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { status: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    const lot = await prisma.lot.update({
      where: { id: id },
      data: updateData,
      include: {
        project: true,
        installer: {
          select: {
            id: true,
            employee_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const logged = await withLogging(
      request,
      "lot",
      id,
      "UPDATE",
      `Lot updated successfully: ${lot.name} for project: ${lot.project.name}`
    );

    if (!logged) {
      console.error(`Failed to log lot update: ${id} - ${lot.name}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot updated successfully",
        data: lot,
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
    console.error("Error in PATCH /api/lot/[id]:", error);
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

    // Fetch lot with project before soft deleting
    const lotToDelete = await prisma.lot.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        project: true,
      },
    });

    if (!lotToDelete) {
      return NextResponse.json(
        { status: false, message: "Lot not found" },
        { status: 404 }
      );
    }

    if (lotToDelete.is_deleted) {
      return NextResponse.json(
        { status: false, message: "Lot already deleted" },
        { status: 400 }
      );
    }

    // Soft delete the lot record (set is_deleted flag)
    const lot = await prisma.lot.update({
      where: { id: id },
      data: { is_deleted: true },
    });

    const logged = await withLogging(
      request,
      "lot",
      id,
      "DELETE",
      `Lot deleted successfully: ${lotToDelete.name} for project: ${lotToDelete.project.name}`
    );

    if (!logged) {
      console.error(`Failed to log lot deletion: ${id} - ${lotToDelete.name}`);
      return NextResponse.json(
        {
          status: true,
          message: "Lot deleted successfully",
          data: lot,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: true, message: "Lot deleted successfully", data: lot },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in DELETE /api/lot/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
