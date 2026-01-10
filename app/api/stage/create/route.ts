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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { lot_id, name, status, notes, startDate, endDate, assigned_to } =
      await request.json();

    // Verify lot exists and belongs to this organization
    const lot = await prisma.lot.findFirst({
      where: {
        id: lot_id,
        organization_id: user.organizationId,
      },
      include: {
        project: {
          select: {
            id: true,
            project_id: true,
            name: true,
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
          { status: 404 }
        );
      }
    }

    // Use transaction to ensure atomicity - stage creation and employee assignments succeed or fail together
    const newStage = await prisma.$transaction(async (tx) => {
      // Create the stage
      const createdStage = await tx.stage.create({
        data: {
          lot_id: lot.id,
          organizationId: user.organizationId,
          name: name.toLowerCase(),
          status,
          notes: notes || null,
          startDate:
            startDate && startDate.trim() !== ""
              ? processDateTimeField(startDate)
              : null,
          endDate:
            endDate && endDate.trim() !== ""
              ? processDateTimeField(endDate)
              : null,
        },
      });

      // Create the stage_employee relationships if assigned_to is provided
      // If this fails, the stage creation will be rolled back
      if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
        await tx.stage_employee.createMany({
          data: assigned_to.map((employee_id: string) => ({
            stage_id: createdStage.id,
            employee_id: employee_id,
          })),
          skipDuplicates: true, // Skip if the relationship already exists
        });
      }

      return createdStage;
    });

    // Fetch the complete stage with all relationships for response
    const stage = await prisma.stage.findFirst({
      where: {
        id: newStage.id,
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

    if (!stage) {
      return NextResponse.json(
        { status: false, message: "Failed to fetch created stage" },
        { status: 500 }
      );
    }

    // lot id and project name for logging
    const logged = await withLogging(
      request,
      "stage",
      stage.id,
      "CREATE",
      `Stage created successfully: ${stage.name} for lot: ${
        stage.lot.lot_id
      } and project: ${stage.lot.project?.name || "Unknown"}`
    );

    if (!logged) {
      console.error(
        `Failed to log stage creation: ${stage.id} - ${stage.name}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Stage created successfully",
        data: stage,
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
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
    console.error("Error in POST /api/stage/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
