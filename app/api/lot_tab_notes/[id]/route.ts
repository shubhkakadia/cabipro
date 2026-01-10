import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const lotTab = await prisma.lot_tab.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!lotTab) {
      return NextResponse.json(
        { status: false, message: "Lot tab not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot tab notes fetched successfully",
        data: lotTab,
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
    console.error("Error in GET /api/lot_tab_notes/[id]:", error);
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
    const { notes } = await request.json();

    // Check if lot_tab exists and belongs to this organization
    const existingLotTab = await prisma.lot_tab.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingLotTab) {
      return NextResponse.json(
        { status: false, message: "Lot tab not found" },
        { status: 404 }
      );
    }

    const lotTab = await prisma.lot_tab.update({
      where: { id },
      data: { notes },
    });

    const logged = await withLogging(
      request,
      "lot_tab",
      id,
      "UPDATE",
      `Lot tab notes updated successfully`
    );

    if (!logged) {
      console.error(`Failed to log lot tab notes update: ${id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot tab notes updated successfully",
        data: lotTab,
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
    console.error("Error in PATCH /api/lot_tab_notes/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
