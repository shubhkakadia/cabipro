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
    const { lot_id, name, project_id, startDate, installationDueDate, notes } =
      await request.json();

    // Check if lot already exists in this organization
    const existingLot = await prisma.lot.findFirst({
      where: {
        lot_id: lot_id.toLowerCase(),
        organization_id: user.organizationId,
      },
    });

    if (existingLot) {
      return NextResponse.json(
        {
          status: false,
          message: "Lot already exists by this lot id: " + lot_id.toLowerCase(),
        },
        { status: 409 }
      );
    }

    // Verify project exists and belongs to this organization
    const project = await prisma.project.findFirst({
      where: {
        project_id: project_id.toLowerCase(),
        organization_id: user.organizationId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          status: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    const lot = await prisma.lot.create({
      data: {
        organization_id: user.organizationId,
        lot_id: lot_id.toLowerCase(),
        name,
        project_id: project.id,
        startDate: startDate ? processDateTimeField(startDate) : null,
        installationDueDate: installationDueDate
          ? processDateTimeField(installationDueDate)
          : null,
        notes,
        status: "ACTIVE",
      },
      include: {
        project: true,
      },
    });

    const logged = await withLogging(
      request,
      "lot",
      lot.id,
      "CREATE",
      `Lot created successfully: ${lot.name} for project: ${lot.project.name}`
    );

    if (!logged) {
      console.error(`Failed to log lot creation: ${lot.id} - ${lot.name}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot created successfully",
        data: lot,
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
    console.error("Error in POST /api/lot/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
