import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const mtos = await prisma.materials_to_order.findMany({
      where: {
        organization_id: user.organizationId,
      },
      include: {
        project: {
          select: { id: true, name: true, project_id: true },
        },
        lots: {
          select: { id: true, lot_id: true, name: true },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            quantity_used: true,
            quantity_ordered: true,
            quantity_ordered_po: true,
            notes: true,
            ordered_items: {
              select: {
                quantity: true,
              },
            },
            item: {
              select: {
                id: true,
                category: true,
                image: true,
                description: true,
                quantity: true,
                measurement_unit: true,
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
                supplier_id: true,
                supplier: {
                  select: { id: true, name: true },
                },
              },
            },
            reserve_item_stock: true,
          },
        },
        media: {
          where: { is_deleted: false },
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
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in GET /api/materials_to_order/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
