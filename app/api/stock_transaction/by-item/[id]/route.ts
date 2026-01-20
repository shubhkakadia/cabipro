import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify item exists and belongs to this organization
    const item = await prisma.item.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { status: false, message: "Item not found" },
        { status: 404 },
      );
    }

    const stockTransactions = await prisma.stock_transaction.findMany({
      where: {
        item_id: id,
        item: {
          organization_id: user.organizationId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Stock transactions fetched successfully",
        data: stockTransactions,
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
    console.error("Error fetching stock transactions by item:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
