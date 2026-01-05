import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import type { TabKind } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { lot_id, tab, notes } = await request.json();

    // Verify lot exists and belongs to this organization
    const lot = await prisma.lot.findFirst({
      where: {
        lot_id: lot_id,
        organization_id: user.organizationId,
      },
    });

    if (!lot) {
      return NextResponse.json(
        { status: false, message: "Lot not found" },
        { status: 404 }
      );
    }

    // Check if lot_tab already exists for this lot and tab combination
    const existingLotTab = await prisma.lot_tab.findFirst({
      where: {
        lot_id: lot.id,
        tab: tab as TabKind,
        organization_id: user.organizationId,
      },
    });

    if (existingLotTab) {
      // Update existing lot_tab instead of creating a new one
      const updatedLotTab = await prisma.lot_tab.update({
        where: { id: existingLotTab.id },
        data: { notes },
      });

      const logged = await withLogging(
        request,
        "lot_tab",
        existingLotTab.id,
        "UPDATE",
        `Lot tab notes updated successfully`
      );

      if (!logged) {
        console.error(
          `Failed to log lot tab notes update: ${existingLotTab.id}`
        );
      }

      return NextResponse.json(
        {
          status: true,
          message: "Lot tab notes updated successfully",
          data: updatedLotTab,
          ...(logged
            ? {}
            : { warning: "Note: Update succeeded but logging failed" }),
        },
        { status: 200 }
      );
    }

    // Create new lot_tab
    const lotTab = await prisma.lot_tab.create({
      data: {
        organization_id: user.organizationId,
        lot_id: lot.id,
        tab: tab as TabKind,
        notes,
      },
    });

    const logged = await withLogging(
      request,
      "lot_tab",
      lotTab.id,
      "CREATE",
      `Lot tab notes saved successfully`
    );

    if (!logged) {
      console.error(`Failed to log lot tab notes creation: ${lotTab.id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Lot tab notes saved successfully",
        data: lotTab,
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
    console.error("Error in POST /api/lot_tab_notes/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
