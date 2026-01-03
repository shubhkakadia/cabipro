import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const {
      lot_file_id,
      prepared_by_office,
      prepared_by_production,
      delivered_to_site,
      installed,
    } = await request.json();

    // Verify lot_file exists and belongs to this organization
    const lotFile = await prisma.lot_file.findFirst({
      where: {
        id: lot_file_id,
        organization_id: user.organizationId,
      },
    });

    if (!lotFile) {
      return NextResponse.json(
        { status: false, message: "Lot file not found" },
        { status: 404 }
      );
    }

    const existingMaintenanceChecklist =
      await prisma.maintenance_checklist.findUnique({
        where: { lot_file_id },
      });

    const maintenance_checklist =
      await prisma.maintenance_checklist.upsert({
        where: { lot_file_id },
        update: {
          prepared_by_office,
          prepared_by_production,
          delivered_to_site,
          installed,
        },
        create: {
          lot_file_id,
          prepared_by_office,
          prepared_by_production,
          delivered_to_site,
          installed,
        },
      });

    const logged = await withLogging(
      request,
      "maintenance_checklist",
      maintenance_checklist.id,
      existingMaintenanceChecklist ? "UPDATE" : "CREATE",
      `Maintenance checklist upserted successfully: ${maintenance_checklist.id}`
    );

    if (!logged) {
      console.error(
        `Failed to log maintenance checklist upsert: ${maintenance_checklist.id}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Maintenance checklist upserted successfully",
        data: maintenance_checklist,
        ...(logged
          ? {}
          : { warning: "Note: Upsert succeeded but logging failed" }),
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
    console.error("Error in POST /api/maintenance_checklist/upsert:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
