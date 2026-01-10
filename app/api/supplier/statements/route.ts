import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Filter statements where supplier is not deleted and belongs to this organization
    const statements = await prisma.supplier_statement.findMany({
      where: {
        supplier: {
          organization_id: user.organizationId,
          is_deleted: false,
        },
      },
      include: {
        supplier: true,
        supplier_file: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(
      {
        status: true,
        message: "Statements fetched successfully",
        data: statements,
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
    console.error("Error in GET /api/supplier/statements:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}