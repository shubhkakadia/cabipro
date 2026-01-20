import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import {
  setAuthCookie,
  setAdminAuthCookie,
  setOrganizationSlugCookie,
  deleteOrganizationSlugCookie,
} from "@/lib/cookies";
import { prisma } from "@/lib/db";

function isSecureRequest(request: NextRequest): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return request.nextUrl.protocol === "https:";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let email: string | undefined;
    let password: string | undefined;

    // Robust body parsing: support JSON and form posts; avoid throwing on empty bodies.
    if (contentType.includes("application/json")) {
      try {
        const body = await request.json();
        email = body?.email;
        password = body?.password;
      } catch {
        // fall through to 400 below
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const form = await request.formData();
        email = (form.get("email") as string | null) || undefined;
        password = (form.get("password") as string | null) || undefined;
      } catch {
        // fall through to 400 below
      }
    } else {
      // Try JSON as a best-effort fallback (some clients forget to set content-type)
      try {
        const body = await request.json();
        email = body?.email;
        password = body?.password;
      } catch {
        // fall through to 400 below
      }
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Try admin authentication first
    const adminResult = await authenticateAdmin(email, password);

    if (adminResult) {
      // Admin login successful
      const response = NextResponse.json({
        message: "Login successful",
        admin: adminResult.admin,
        isAdmin: true,
        redirectPath: "/admin",
      });

      // Set admin authentication cookie
      const secure = isSecureRequest(request);
      setAdminAuthCookie(
        adminResult.token,
        response,
        adminResult.expiresAt,
        secure,
      );
      // Admin sessions should not carry an organization slug cookie.
      deleteOrganizationSlugCookie(response);

      return response;
    }

    // Try user authentication
    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Get organization slug for redirect
    const organization = await prisma.organization.findUnique({
      where: { id: result.user.organizationId },
      select: { slug: true, name: true, logo: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Create response with user data and organization slug
    const response = NextResponse.json({
      message: "Login successful",
      user: result.user,
      organizationSlug: organization.slug,
      organizationName: organization.name,
      organizationLogo: organization.logo,
      isAdmin: false,
      redirectPath: "/app",
    });

    // Set authentication cookie
    const secure = isSecureRequest(request);
    setAuthCookie(result.token, response, undefined, result.expiresAt, secure);
    setOrganizationSlugCookie(
      organization.slug,
      response,
      result.expiresAt,
      secure,
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
