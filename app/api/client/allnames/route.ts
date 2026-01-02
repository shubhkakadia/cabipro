import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const clients = await prisma.client.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    
    return NextResponse.json(
      {
        status: true,
        message: "Clients fetched successfully",
        data: clients
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/client/allnames:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
