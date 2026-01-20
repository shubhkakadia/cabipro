import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { deleteAllAuthCookies, COOKIE_NAMES } from "@/lib/cookies";
import { prisma } from "@/lib/db";

/**
 * Extract JWT token from Authorization Bearer header
 */
function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Extract tokens from Authorization header or cookies
    const adminToken = request.cookies.get(
      COOKIE_NAMES.ADMIN_AUTH_TOKEN,
    )?.value;
    const userToken =
      extractTokenFromHeader(request) ||
      request.cookies.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

    // Try admin token first (only if adminToken exists)
    if (adminToken) {
      const adminPayload = await verifyAdminToken(adminToken);
      if (adminPayload) {
        // Delete admin session from database
        try {
          await prisma.admin_sessions.deleteMany({
            where: {
              token: adminToken,
            },
          });
        } catch (error) {
          console.error("Error deleting admin session:", error);
          // Continue with logout even if session deletion fails
        }

        // Create response
        const response = NextResponse.json({
          message: "Logout successful",
        });

        // Delete authentication-related cookies (auth/admin/org-slug)
        deleteAllAuthCookies(response);

        return response;
      }
    }

    // Fall back to user token (only if userToken exists)
    if (userToken) {
      const userPayload = await verifyToken(userToken);
      if (userPayload) {
        // Delete user session from database
        try {
          await prisma.sessions.deleteMany({
            where: {
              token: userToken,
            },
          });
        } catch (error) {
          console.error("Error deleting session:", error);
          // Continue with logout even if session deletion fails
        }

        // Create response
        const response = NextResponse.json({
          message: "Logout successful",
        });

        // Delete authentication-related cookies (auth/admin/org-slug)
        deleteAllAuthCookies(response);

        return response;
      }
    }

    // No valid token found
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 },
    );
  }
}
