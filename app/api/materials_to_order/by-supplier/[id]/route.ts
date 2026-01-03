import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify supplier exists and belongs to this organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { status: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    // Fetch all materials_to_order that contain items linked to this supplier
    const mtos = await prisma.materials_to_order.findMany({
      where: {
        organization_id: user.organizationId,
        items: {
          some: {
            item: {
              supplier_id: id,
              is_deleted: false,
            },
          },
        },
      },
      include: {
        // Fetch related project but only selected fields
        project: {
          select: { id: true, name: true, project_id: true },
        },

        // Include lots information
        lots: {
          select: {
            id: true,
            lot_id: true,
            name: true,
          },
        },

        // Include creator info
        createdBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },

        // Include media files (not deleted)
        media: {
          where: {
            is_deleted: false,
          },
        },

        // Include only items belonging to this supplier
        items: {
          where: {
            item: {
              supplier_id: id,
              is_deleted: false,
            },
          },
          include: {
            // Fetch selected item details and its linked sub-types
            item: {
              include: {
                image: true,
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
                supplier: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Materials to orders fetched successfully",
        data: mtos,
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
    console.error("Error in GET /api/materials_to_order/by-supplier/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
