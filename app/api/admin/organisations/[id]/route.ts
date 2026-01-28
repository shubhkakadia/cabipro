import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    await requireAdminAuth(request);

    const { id } = await params;

    // Fetch organisation with detailed information
    const organisation = await prisma.organization.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
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
            first_name: true,
            last_name: true,
            createdAt: true,
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
            clients: true,
            image: true, // For storage count
          },
        },
        module_access: {
          select: {
            id: true,
            all_clients: true,
            dashboard: true,
            all_employees: true,
            all_projects: true,
            all_suppliers: true,
            all_items: true,
            logs: true,
            materialstoorder: true,
            purchaseorder: true,
          },
        },
      },
    });

    if (!organisation) {
      return NextResponse.json(
        {
          status: false,
          message: "Organisation not found",
        },
        { status: 404 },
      );
    }

    // Get owner name
    const owner = organisation.users[0];
    const ownerName = owner
      ? `${owner.first_name} ${owner.last_name}`.trim()
      : "No Owner";

    // Transform module access to addon format
    const moduleAccess = organisation.module_access[0] || {};
    const enabledModules = {
      all_clients: moduleAccess.all_clients || false,
      dashboard: moduleAccess.dashboard || false,
      all_employees: moduleAccess.all_employees || false,
      all_projects: moduleAccess.all_projects || false,
      all_suppliers: moduleAccess.all_suppliers || false,
      all_items: moduleAccess.all_items || false,
      logs: moduleAccess.logs || false,
      materialstoorder: moduleAccess.materialstoorder || false,
      purchaseorder: moduleAccess.purchaseorder || false,
    };

    const transformedOrganisation = {
      id: organisation.id,
      name: organisation.name,
      slug: organisation.slug,
      email: organisation.email,
      phone: organisation.phone,
      address: organisation.address,
      logo: organisation.logo,
      plan: organisation.plan,
      plan_expires_at: organisation.plan_expires_at,
      is_active: organisation.is_active,
      createdAt: organisation.createdAt,
      updatedAt: organisation.updatedAt,
      owner_name: ownerName,
      total_users: organisation._count.users,
      total_projects: organisation._count.projects,
      total_clients: organisation._count.clients,
      total_files: organisation._count.image,
      enabled_modules: enabledModules,
    };

    return NextResponse.json(
      {
        status: true,
        message: "Organisation fetched successfully",
        data: transformedOrganisation,
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
    console.error("Error in GET /api/admin/organisations/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
