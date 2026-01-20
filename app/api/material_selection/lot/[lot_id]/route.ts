import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lot_id: string }> },
) {
  try {
    const user = await requireAuth(request);

    // Get lot_id from params
    const { lot_id } = await params;

    if (!lot_id) {
      return NextResponse.json(
        { status: false, message: "Lot ID is required" },
        { status: 400 },
      );
    }

    // Verify lot exists and belongs to this organization
    const lot = await prisma.lot.findFirst({
      where: {
        id: lot_id,
        organization_id: user.organizationId,
      },
    });

    if (!lot) {
      return NextResponse.json(
        { status: false, message: "Lot not found" },
        { status: 404 },
      );
    }

    // Fetch material_selection by lot_id with current version and all nested details
    const materialSelection = await prisma.material_selection.findFirst({
      where: {
        lot_id: lot.id,
        organization_id: user.organizationId,
      },
      include: {
        currentVersion: {
          include: {
            areas: {
              include: {
                items: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            project_id: true,
            name: true,
          },
        },
        quote: {
          select: {
            id: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        lot: {
          select: {
            id: true,
            lot_id: true,
            name: true,
          },
        },
        versions: {
          select: {
            id: true,
            version_number: true,
            is_current: true,
            createdAt: true,
          },
          orderBy: {
            version_number: "desc",
          },
        },
      },
    });

    if (!materialSelection) {
      return NextResponse.json(
        {
          status: true,
          message: "No material selection found for this lot",
          data: null,
        },
        { status: 200 },
      );
    }

    // Fetch media separately
    const media = await prisma.media.findMany({
      where: {
        material_selection_id: materialSelection.id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    // Add media to the response
    const materialSelectionWithMedia = {
      ...materialSelection,
      media: media,
    };

    return NextResponse.json(
      {
        status: true,
        message: "Material selection fetched successfully",
        data: materialSelectionWithMedia,
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
    console.error("Error fetching material selection:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
