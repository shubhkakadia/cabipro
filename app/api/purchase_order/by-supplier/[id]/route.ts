import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

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

    const pos = await prisma.purchase_order.findMany({
      where: {
        supplier_id: id,
        organization_id: user.organizationId,
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        mto: {
          select: {
            id: true,
            project: {
              select: { id: true, project_id: true, name: true },
            },
            status: true,
          },
        },
        items: {
          include: {
            item: {
              include: {
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
                image: true,
              },
            },
          },
        },
        orderedBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        invoice_url: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Purchase orders fetched successfully",
        data: pos,
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
    console.error("Error in GET /api/purchase_order/by-supplier/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
