import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const activeLots = await prisma.lot.findMany({
      where: {
        organization_id: user.organizationId,
        status: "ACTIVE",
        is_deleted: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_id: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        stages: {
          select: {
            id: true,
            name: true,
            status: true,
            notes: true,
            startDate: true,
            endDate: true,
            assigned_to: {
              include: {
                employee: {
                  select: {
                    id: true,
                    employee_id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          client: {
            name: "asc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Active lots fetched successfully",
        data: activeLots,
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
    console.error("Error in GET /api/lot/active:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
