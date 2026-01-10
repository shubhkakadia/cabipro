import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { notes } = await request.json();

    // Check if lot_file exists and belongs to this organization
    const existingLotFile = await prisma.lot_file.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingLotFile) {
      return NextResponse.json(
        { status: false, message: "Lot file not found" },
        { status: 404 }
      );
    }

    const lotFile = await prisma.lot_file.update({
      where: { id },
      data: { notes },
    });

    const logged = await withLogging(
      request,
      "lot_file",
      id,
      "UPDATE",
      `Lot file updated successfully: ${lotFile.filename}`
    );

    if (!logged) {
      console.error(`Failed to log lot file update: ${id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot file updated successfully",
        data: lotFile,
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
    console.error("Error in PATCH /api/lot_file/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
