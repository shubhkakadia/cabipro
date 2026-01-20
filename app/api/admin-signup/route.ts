import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateAdminToken } from "@/lib/admin-auth";
import { setAdminAuthCookie, getSessionExpiryDate } from "@/lib/cookies";
import { uploadFile } from "@/lib/filehandler";
import { Role } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const image_file = formData.get("image") as File | null;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json(
        {
          error:
            "First name, last name, email, password, and role are required",
        },
        { status: 400 },
      );
    }
    const roleMap: Record<string, Role> = {
      superadmin: Role.SUPERADMIN,
      admin: Role.ADMIN,
      manager: Role.MANAGER,
      staff: Role.STAFF,
    };

    // Validate role
    const validRoles = ["superadmin", "admin", "manager", "staff"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be one of: superadmin, admin, manager, staff" },
        { status: 400 },
      );
    }

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Handle image upload if provided
    let imagePath: string | null = null;
    if (image_file && image_file.size > 0) {
      // Validate file size (max 5MB)
      if (image_file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image size must be less than 5MB" },
          { status: 400 },
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
      ];
      if (!image_file.type || !allowedTypes.includes(image_file.type)) {
        return NextResponse.json(
          { error: "Image must be an image file (PNG, JPG, GIF, or WebP)" },
          { status: 400 },
        );
      }

      // Upload image file
      try {
        const uploadResult = await uploadFile(image_file, {
          uploadDir: "public/uploads",
          subDir: "admins",
          filenameStrategy: "unique",
          idPrefix: "admin",
        });

        imagePath = uploadResult.relativePath.startsWith("/")
          ? uploadResult.relativePath
          : `/${uploadResult.relativePath}`;
      } catch (error) {
        console.error("Error uploading image file:", error);
        return NextResponse.json(
          { error: "Failed to upload image. Please try again." },
          { status: 500 },
        );
      }
    }

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        image: imagePath,
        role: roleMap[role] as Role,
        is_active: true,
        is_deleted: false,
      },
    });

    // Generate admin JWT token
    const tokenPayload = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = await generateAdminToken(tokenPayload);

    // Create admin session
    const expiresAt = getSessionExpiryDate();

    await prisma.admin_sessions.create({
      data: {
        admin_id: admin.id,
        token: token,
        admin_type: admin.role,
        expires_at: expiresAt,
      },
    });

    // Create response
    const response = NextResponse.json({
      message: "Admin signup successful",
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
        image: admin.image,
      },
    });

    // Set admin authentication cookie
    const proto = request.headers.get("x-forwarded-proto");
    const secure = proto
      ? proto === "https"
      : request.nextUrl.protocol === "https:";
    setAdminAuthCookie(token, response, expiresAt, secure);

    return response;
  } catch (error) {
    console.error("Admin signup error:", error);

    // Handle Prisma unique constraint errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "An error occurred during admin signup. Please try again." },
      { status: 500 },
    );
  }
}
