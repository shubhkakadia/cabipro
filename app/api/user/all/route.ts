import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

interface User {
  id: string;
  email: string;
  user_type: string;
  employee: {
    first_name: string;
    last_name: string | null;
  } | null;
}
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const users = await prisma.users.findMany({
      where: {
        organization_id: user.organizationId,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        user_type: true,
        first_name: true,
        last_name: true,
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    // Transform data to include display name
    const transformedUsers = users.map(
      (user: User & { first_name: string; last_name: string }) => {
        let displayName = user.email;
        const userFullName =
          `${user.first_name || ""} ${user.last_name || ""}`.trim();

        if (userFullName) {
          displayName = userFullName;
        } else if (user.employee) {
          displayName =
            `${user.employee.first_name || ""} ${user.employee.last_name || ""}`.trim();
        }

        return {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          name: displayName || user.email,
        };
      },
    );

    return NextResponse.json(
      {
        status: true,
        message: "Users fetched successfully",
        data: transformedUsers,
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
    console.error("Error in GET /api/user/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
