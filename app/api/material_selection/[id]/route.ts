import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);

    // Get material_selection id from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { status: false, message: "Material selection ID is required" },
        { status: 400 }
      );
    }

    // Fetch material_selection with current version and all nested details
    const materialSelection = await prisma.material_selection.findFirst({
      where: {
        id: id,
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
            createdAt: true,
          },
        },
      },
    });

    if (!materialSelection) {
      return NextResponse.json(
        { status: false, message: "Material selection not found" },
        { status: 404 }
      );
    }

    // Fetch media separately to avoid Prisma client issues
    const media = await prisma.media.findMany({
      where: {
        material_selection_id: id,
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
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error fetching material selection:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
