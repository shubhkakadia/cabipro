import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateToken } from "@/lib/auth";
import {
  setAuthCookie,
  setOrganizationSlugCookie,
  getSessionExpiryDate,
} from "@/lib/cookies";
import { uploadFile } from "@/lib/filehandler";
import { generateSlug, generateUniqueSlug } from "@/lib/unique-slug";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Personal details
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Organization details
    const organization_name = formData.get("organization_name") as string;
    const organization_email = formData.get("organization_email") as
      | string
      | null;
    const organization_phone = formData.get("organization_phone") as
      | string
      | null;
    const organization_address = formData.get("organization_address") as
      | string
      | null;
    const organization_logo_file = formData.get(
      "organization_logo",
    ) as File | null;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required" },
        { status: 400 },
      );
    }

    if (!organization_name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Check if organization with this name already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { name: organization_name },
      select: { id: true },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this name already exists" },
        { status: 409 },
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(organization_name);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Validate and upload logo file BEFORE transaction
    const logoFile =
      organization_logo_file && organization_logo_file.size > 0
        ? organization_logo_file
        : null;

    let logoUploadResult: {
      relativePath: string;
      filename: string;
      mimeType: string;
      extension: string;
      fileType: string;
      size: number;
    } | null = null;

    if (logoFile) {
      // Validate file size (max 5MB)
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Logo size must be less than 5MB" },
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
      if (!logoFile.type || !allowedTypes.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "Logo must be an image file (PNG, JPG, GIF, or WebP)" },
          { status: 400 },
        );
      }

      // Upload logo file before transaction
      try {
        const uploadResult = await uploadFile(logoFile, {
          subDir: "",
          filenameStrategy: "unique",
          idPrefix: "logo",
          organizationSlug: uniqueSlug,
        });

        // Normalize path for Next.js - remove /public prefix since Next.js serves public folder from root
        let normalizedPath = uploadResult.relativePath.startsWith("/")
          ? uploadResult.relativePath
          : `/${uploadResult.relativePath}`;
        // Remove /public prefix if present
        if (normalizedPath.startsWith("/public/")) {
          normalizedPath = normalizedPath.replace("/public", "");
        }

        logoUploadResult = {
          relativePath: normalizedPath,
          filename: uploadResult.filename,
          mimeType: uploadResult.mimeType,
          extension: uploadResult.extension,
          fileType: uploadResult.fileType,
          size: uploadResult.size,
        };
      } catch (error) {
        console.error("Error uploading logo file:", error);
        return NextResponse.json(
          { error: "Failed to upload logo. Please try again." },
          { status: 500 },
        );
      }
    }

    // Create user and organization in a transaction with timeout
    const result = await prisma.$transaction(async (tx) => {
      // Create organization with logo URL
      const organization = await tx.organization.create({
        data: {
          name: organization_name,
          slug: uniqueSlug,
          email: organization_email || null,
          phone: organization_phone || null,
          address: organization_address || null,
          logo: logoUploadResult?.relativePath || null,
          plan: "STARTER", // Default plan
          is_active: true,
          is_deleted: false,
        },
      });

      // Create user
      const user = await tx.users.create({
        data: {
          email,
          password: hashedPassword,
          first_name,
          last_name,
          user_type: "OWNER", // Default user type for signup
          organization_id: organization.id,
          emailVerified: false,
          is_active: true,
        },
      });

      // Create module access with default permissions for owner
      await tx.module_access.create({
        data: {
          user_id: user.id,
          organizationId: organization.id,
          all_clients: true,
          add_clients: true,
          client_details: true,
          dashboard: true,
          delete_media: true,
          all_employees: true,
          add_employees: true,
          employee_details: true,
          all_projects: true,
          add_projects: true,
          project_details: true,
          all_suppliers: true,
          add_suppliers: true,
          supplier_details: true,
          all_items: true,
          add_items: true,
          item_details: true,
          logs: true,
          lotatglance: true,
          materialstoorder: true,
          purchaseorder: true,
          statements: true,
          site_photos: true,
          config: true,
          usedmaterial: true,
        },
      });

      // Create media entry for logo if logo was uploaded
      if (logoUploadResult) {
        await tx.media.create({
          data: {
            organization_id: organization.id,
            url: logoUploadResult.relativePath,
            filename: logoUploadResult.filename,
            file_type: logoUploadResult.fileType.toUpperCase(),
            mime_type: logoUploadResult.mimeType,
            extension: logoUploadResult.extension,
            size: logoUploadResult.size,
            is_deleted: false,
          },
        });
      }

      return { user, organization };
    });

    // Generate JWT token
    const tokenPayload = {
      userId: result.user.id,
      organizationId: result.organization.id,
      email: result.user.email,
      userType: result.user.user_type,
    };

    const token = await generateToken(tokenPayload);

    // Create session
    const expiresAt = getSessionExpiryDate();

    await prisma.sessions.create({
      data: {
        user_id: result.user.id,
        organization_id: result.organization.id,
        token: token,
        user_type: result.user.user_type,
        expires_at: expiresAt,
      },
    });

    // Simple path-based routing (no subdomains)
    const redirectUrl = "/app";

    // Create response
    const response = NextResponse.json({
      message: "Signup successful",
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        userType: result.user.user_type,
        organizationId: result.organization.id,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        logo: result.organization.logo,
      },
      redirectUrl,
    });

    // Set authentication cookie
    const proto = request.headers.get("x-forwarded-proto");
    const secure = proto
      ? proto === "https"
      : request.nextUrl.protocol === "https:";
    setAuthCookie(token, response, undefined, expiresAt, secure);
    setOrganizationSlugCookie(
      result.organization.slug,
      response,
      expiresAt,
      secure,
    );

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    // Handle Prisma unique constraint errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Email or organization name already exists" },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: "An error occurred during signup. Please try again." },
      { status: 500 },
    );
  }
}
