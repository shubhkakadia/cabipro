import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";
import { withLogging } from "@/lib/withLogging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify user exists and belongs to the same organization
    const targetUser = await prisma.users.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        employee: {
          include: {
            image: true,
          },
        },
        module_access: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { status: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, message: "User fetched successfully", data: targetUser },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in GET /api/user/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    let body: Record<string, unknown>;
    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }
    const { user_type, is_active, module_access, password, old_password } =
      body;

    // Verify user exists and belongs to the same organization
    const existingUser = await prisma.users.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { status: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If old_password is provided, verify it before updating password
    if (old_password && password) {
      if (typeof old_password !== "string" || typeof password !== "string") {
        return NextResponse.json(
          { status: false, message: "Invalid password format" },
          { status: 400 }
        );
      }
      const isValidPassword = await bcrypt.compare(
        old_password,
        existingUser.password
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { status: false, message: "Current password is incorrect" },
          { status: 401 }
        );
      }
    }

    // Build update data object with proper typing
    interface UpdateData {
      user_type?: string;
      is_active?: boolean;
      password?: string;
    }

    const updateData: UpdateData = {};

    // Only include fields that are provided (for password reset, only password is sent)
    if (user_type !== undefined) {
      updateData.user_type =
        typeof user_type === "string" ? user_type : undefined;
    }
    if (is_active !== undefined) {
      updateData.is_active =
        typeof is_active === "boolean"
          ? is_active
          : is_active === "true" || is_active === true;
    }

    // Only update password if it's provided and not empty
    if (password && typeof password === "string" && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    await prisma.users.update({
      where: { id: id },
      data: {
        ...(updateData.user_type !== undefined && {
          user_type: updateData.user_type,
        }),
        ...(updateData.is_active !== undefined && {
          is_active: updateData.is_active,
        }),
        ...(updateData.password !== undefined && {
          password: updateData.password,
        }),
      },
    });

    // Update module_access if provided
    if (module_access !== undefined && module_access !== null) {
      if (typeof module_access !== "object" || Array.isArray(module_access)) {
        return NextResponse.json(
          { status: false, message: "Invalid module_access format" },
          { status: 400 }
        );
      }

      const moduleAccessData = module_access as Record<string, boolean>;

      // Use upsert to handle case where module_access doesn't exist
      await prisma.module_access.upsert({
        where: { user_id: id },
        update: {
          all_clients: moduleAccessData.all_clients ?? false,
          add_clients: moduleAccessData.add_clients ?? false,
          client_details: moduleAccessData.client_details ?? false,
          dashboard: moduleAccessData.dashboard ?? false,
          delete_media: moduleAccessData.delete_media ?? false,
          all_employees: moduleAccessData.all_employees ?? false,
          add_employees: moduleAccessData.add_employees ?? false,
          employee_details: moduleAccessData.employee_details ?? false,
          all_projects: moduleAccessData.all_projects ?? false,
          add_projects: moduleAccessData.add_projects ?? false,
          project_details: moduleAccessData.project_details ?? false,
          all_suppliers: moduleAccessData.all_suppliers ?? false,
          add_suppliers: moduleAccessData.add_suppliers ?? false,
          supplier_details: moduleAccessData.supplier_details ?? false,
          all_items: moduleAccessData.all_items ?? false,
          add_items: moduleAccessData.add_items ?? false,
          item_details: moduleAccessData.item_details ?? false,
          usedmaterial: moduleAccessData.usedmaterial ?? false,
          logs: moduleAccessData.logs ?? false,
          lotatglance: moduleAccessData.lotatglance ?? false,
          materialstoorder: moduleAccessData.materialstoorder ?? false,
          purchaseorder: moduleAccessData.purchaseorder ?? false,
          statements: moduleAccessData.statements ?? false,
          site_photos: moduleAccessData.site_photos ?? false,
          config: moduleAccessData.config ?? false,
          organizationId: user.organizationId,
        },
        create: {
          user_id: id,
          organizationId: user.organizationId,
          all_clients: moduleAccessData.all_clients ?? false,
          add_clients: moduleAccessData.add_clients ?? false,
          client_details: moduleAccessData.client_details ?? false,
          dashboard: moduleAccessData.dashboard ?? false,
          delete_media: moduleAccessData.delete_media ?? false,
          all_employees: moduleAccessData.all_employees ?? false,
          add_employees: moduleAccessData.add_employees ?? false,
          employee_details: moduleAccessData.employee_details ?? false,
          all_projects: moduleAccessData.all_projects ?? false,
          add_projects: moduleAccessData.add_projects ?? false,
          project_details: moduleAccessData.project_details ?? false,
          all_suppliers: moduleAccessData.all_suppliers ?? false,
          add_suppliers: moduleAccessData.add_suppliers ?? false,
          supplier_details: moduleAccessData.supplier_details ?? false,
          all_items: moduleAccessData.all_items ?? false,
          add_items: moduleAccessData.add_items ?? false,
          item_details: moduleAccessData.item_details ?? false,
          usedmaterial: moduleAccessData.usedmaterial ?? false,
          logs: moduleAccessData.logs ?? false,
          lotatglance: moduleAccessData.lotatglance ?? false,
          materialstoorder: moduleAccessData.materialstoorder ?? false,
          purchaseorder: moduleAccessData.purchaseorder ?? false,
          statements: moduleAccessData.statements ?? false,
          site_photos: moduleAccessData.site_photos ?? false,
          config: moduleAccessData.config ?? false,
        },
      });
    }

    // Fetch complete user with all relations for response
    const completeUser = await prisma.users.findUnique({
      where: { id: id },
      include: {
        employee: {
          include: {
            image: true,
          },
        },
        module_access: true,
      },
    });

    if (!completeUser) {
      return NextResponse.json(
        { status: false, message: "Failed to fetch updated user" },
        { status: 500 }
      );
    }

    const logged = await withLogging(
      request,
      "user",
      id,
      "UPDATE",
      `User updated successfully: ${completeUser.first_name} ${completeUser.last_name}`
    );
    if (!logged) {
      console.error(`Failed to log user update: ${id}`);
    }
    return NextResponse.json(
      {
        status: true,
        message: "User updated successfully",
        data: completeUser,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
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
    console.error("Error in PATCH /api/user/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify user exists and belongs to the same organization before deletion
    const existingUser = await prisma.users.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { status: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Delete the user
    const deletedUser = await prisma.users.delete({
      where: { id: id },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const logged = await withLogging(
      request,
      "user",
      id,
      "DELETE",
      `User deleted successfully: ${deletedUser.first_name} ${deletedUser.last_name}`
    );
    if (!logged) {
      console.error(
        `Failed to log user deletion: ${id} - ${deletedUser.first_name} ${deletedUser.last_name}`
      );
      return NextResponse.json(
        {
          status: true,
          message: "User deleted successfully",
          data: deletedUser,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { status: true, message: "User deleted successfully", data: deletedUser },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in DELETE /api/user/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
