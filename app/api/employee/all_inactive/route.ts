import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const employees = await prisma.employees.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        is_active: false,
      },
      include: {
        image: true,
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Employees fetched successfully",
        data: employees,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/employee/all_inactive:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
