import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { deleteAuthCookie, deleteAdminAuthCookie } from "@/lib/cookies";
import { prisma } from "@/lib/db";
import { extractToken, extractAdminToken } from "@/lib/auth-middleware";

/**
 * GET /api/me
 * Returns the current authenticated user's or admin's information
 * Supports both admin and user authentication
 * If session is expired, deletes the session and returns sessionExpired flag
 */
export async function GET(request: NextRequest) {
  try {
    // Try admin token first
    const adminToken = extractAdminToken(request);

    if (adminToken) {
      // Try admin authentication
      const adminPayload = await verifyAdminToken(adminToken);
      if (adminPayload) {
        // Check if admin session exists in database
        const adminSession = await prisma.admin_sessions.findUnique({
          where: { token: adminToken },
          select: {
            id: true,
            expires_at: true,
            admin_id: true,
          },
        });

        if (!adminSession) {
          return NextResponse.json(
            {
              error: "Admin session not found. Please log in again.",
              sessionExpired: true,
            },
            { status: 401 },
          );
        }

        // Check if admin session is expired
        if (adminSession.expires_at < new Date()) {
          // Delete expired admin session from database
          try {
            await prisma.admin_sessions.delete({
              where: { token: adminToken },
            });
          } catch (error) {
            console.error("Error deleting expired admin session:", error);
            // Continue even if deletion fails
          }

          // Return response with sessionExpired flag and delete admin cookie
          const response = NextResponse.json(
            {
              error: "Session expired. Please log in again.",
              sessionExpired: true,
            },
            { status: 401 },
          );
          deleteAdminAuthCookie(response);
          return response;
        }

        // Verify admin session matches the token payload
        if (adminSession.admin_id !== adminPayload.adminId) {
          return NextResponse.json(
            {
              error: "Admin session mismatch. Please log in again.",
              sessionExpired: true,
            },
            { status: 401 },
          );
        }

        // Fetch admin details
        const admin = await prisma.admin.findUnique({
          where: { id: adminPayload.adminId },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            image: true,
            is_active: true,
            is_deleted: true,
          },
        });

        if (!admin) {
          return NextResponse.json(
            { error: "Admin not found." },
            { status: 404 },
          );
        }

        // Check if admin account is active
        if (!admin.is_active || admin.is_deleted) {
          return NextResponse.json(
            { error: "Admin account is inactive. Please contact support." },
            { status: 403 },
          );
        }

        // Return admin object (excluding sensitive fields)
        return NextResponse.json({
          admin: {
            id: admin.id,
            email: admin.email,
            firstName: admin.first_name,
            lastName: admin.last_name,
            role: admin.role,
            image: admin.image,
          },
          isAdmin: true,
        });
      }
    }

    // If admin authentication failed or no admin token, try user authentication
    const userToken = extractToken(request);
    if (!userToken) {
      return NextResponse.json(
        { error: "Authentication required. Please provide a valid token." },
        { status: 401 },
      );
    }

    const userPayload = await verifyToken(userToken);
    if (!userPayload) {
      return NextResponse.json(
        {
          error: "Invalid or expired token. Please log in again.",
          sessionExpired: true,
        },
        { status: 401 },
      );
    }

    // Check if user session exists in database
    const userSession = await prisma.sessions.findUnique({
      where: { token: userToken },
      select: {
        id: true,
        expires_at: true,
        user_id: true,
        organization_id: true,
      },
    });

    if (!userSession) {
      return NextResponse.json(
        {
          error: "Session not found. Please log in again.",
          sessionExpired: true,
        },
        { status: 401 },
      );
    }

    // Check if user session is expired
    if (userSession.expires_at < new Date()) {
      // Delete expired user session from database
      try {
        await prisma.sessions.delete({
          where: { token: userToken },
        });
      } catch (error) {
        console.error("Error deleting expired session:", error);
        // Continue even if deletion fails
      }

      // Return response with sessionExpired flag and delete user cookie
      const response = NextResponse.json(
        {
          error: "Session expired. Please log in again.",
          sessionExpired: true,
        },
        { status: 401 },
      );
      deleteAuthCookie(response);
      return response;
    }

    // Verify user session matches the token payload
    if (
      userSession.user_id !== userPayload.userId ||
      userSession.organization_id !== userPayload.organizationId
    ) {
      return NextResponse.json(
        {
          error: "Session mismatch. Please log in again.",
          sessionExpired: true,
        },
        { status: 401 },
      );
    }

    // Verify organization is still active
    const organization = await prisma.organization.findUnique({
      where: { id: userSession.organization_id },
      select: {
        is_active: true,
        is_deleted: true,
        name: true,
        logo: true,
      },
    });

    if (!organization || !organization.is_active || organization.is_deleted) {
      return NextResponse.json(
        { error: "Organization is inactive. Please contact cabipro." },
        { status: 403 },
      );
    }

    // Fetch user details
    const user = await prisma.users.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        user_type: true,
        organization_id: true,
        is_active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if user account is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          error: "User account is inactive. Please contact your administrator.",
        },
        { status: 403 },
      );
    }

    // Return user object (excluding sensitive fields)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        organizationId: user.organization_id,
      },
      organization: organization
        ? {
            name: organization.name,
            logo: organization.logo,
          }
        : null,
      isAdmin: false,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user information." },
      { status: 500 },
    );
  }
}
