import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { body } = await request.json();
    const moduleAccess = await prisma.module_access.create({
      data: {
        ...body,
        organizationId: user.organizationId,
      },
    });
    return NextResponse.json({
      status: true,
      message: "Module access created successfully",
      data: moduleAccess,
    });
  } catch (error) {
    console.error("Error in POST /api/module_access/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
