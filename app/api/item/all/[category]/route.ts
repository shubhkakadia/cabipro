import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import type { Category } from "@/generated/prisma/enums";

const CATEGORIES = ["sheet", "handle", "hardware", "accessory", "edging_tape"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { category } = await params;
    const normalizedCategory = category.toLowerCase();

    if (!CATEGORIES.includes(normalizedCategory)) {
      return NextResponse.json(
        { status: false, message: "Invalid category" },
        { status: 400 },
      );
    }

    // Dynamically construct include object based on category
    const include: Record<string, boolean> = {
      image: true, // Always include image relation
    };

    // Map category to its corresponding relation
    const categoryRelationMap: Record<string, string> = {
      sheet: "sheet",
      handle: "handle",
      hardware: "hardware",
      accessory: "accessory",
      edging_tape: "edging_tape",
    };

    const relationName = categoryRelationMap[normalizedCategory];
    if (relationName) {
      include[relationName] = true;
    }

    const items = await prisma.item.findMany({
      where: {
        organization_id: user.organizationId,
        category: normalizedCategory.toUpperCase() as Category,
        is_deleted: false,
      },
      include,
    });

    return NextResponse.json(
      { status: true, message: "Items fetched successfully", data: items },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/item/all/[category]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
