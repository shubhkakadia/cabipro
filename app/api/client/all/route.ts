import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const clients = await prisma.client.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        contacts: true,
        projects: {
          where: {
            is_deleted: false,
          },
          include: {
            lots: {
              where: {
                is_deleted: false,
              },
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(
      {
        status: true,
        message: "Clients fetched successfully",
        data: clients,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/client/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
