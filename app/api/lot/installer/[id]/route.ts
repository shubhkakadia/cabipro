import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import type { LotStatus } from "@/generated/prisma/enums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const userType = user.userType;

    if (!id) {
      return NextResponse.json(
        { status: false, message: "id is required" },
        { status: 400 },
      );
    }

    // Build the where clause based on user type
    let installerWhereClause = {
      status: "ACTIVE" as LotStatus,
      is_deleted: false,
      installer_id: id,
      organization_id: user.organizationId,
    };

    let adminWhereClause = {
      status: "ACTIVE" as LotStatus,
      is_deleted: false,
      organization_id: user.organizationId,
    };

    const activeLots = await prisma.lot.findMany({
      where:
        userType === "master-admin" || userType === "admin" || userType === "owner"
          ? adminWhereClause
          : installerWhereClause,
      include: {
        project: {
          select: {
            name: true,
            project_id: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(
      {
        status: true,
        message:
          userType === "master-admin" || userType === "admin" || userType === "owner"
            ? "All active lots fetched successfully"
            : "Installer lots fetched successfully",
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
    console.error("Error in GET /api/lot/installer:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
