import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const projects = await prisma.project.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        client: true,
        lots: {
          where: {
            is_deleted: false,
          },
        },
      },
      orderBy: {
        client: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Projects fetched successfully",
        data: projects,
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
    console.error("Error in GET /api/project/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
