import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdminAuth(request);

    // Fetch all organisations with their owner (first user in organization)
    const organisations = await prisma.organization.findMany({
      where: {
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logo: true,
        plan: true,
        plan_expires_at: true,
        is_active: true,
        createdAt: true,
        updatedAt: true,
        users: {
          where: {
            is_active: true,
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            employee: {
              select: {
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1, // Get the first/owner user
        },
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include owner information
    const transformedOrganisations = organisations.map((org) => {
      const owner = org.users[0];
      const ownerName = owner
        ? `${owner.first_name} ${owner.last_name}`.trim()
        : "No Owner";

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        phone: org.phone,
        logo: org.logo,
        plan: org.plan,
        plan_expires_at: org.plan_expires_at,
        is_active: org.is_active,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        owner_id: owner?.id,
        owner_name: ownerName,
        total_users: org._count.users,
        total_projects: org._count.projects,
      };
    });

    return NextResponse.json(
      {
        status: true,
        message: "Organisations fetched successfully",
        data: transformedOrganisations,
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
    console.error("Error in GET /api/admin/organisations/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
