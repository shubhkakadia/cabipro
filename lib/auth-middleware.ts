import { NextRequest, NextResponse } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { verifyToken, JWTPayload } from "./auth";
import { verifyAdminToken, AdminJWTPayload } from "./admin-auth";
import { prisma } from "./db";
import { COOKIE_NAMES } from "./cookies";



/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Extract JWT token from request
 * Checks both Authorization header (Bearer token) and cookies
 *
 * @param request - Next.js request object
 * @returns Token string or null if not found
 */
export function extractToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  // Try cookie as fallback
  const tokenCookie = request.cookies.get(COOKIE_NAMES.AUTH_TOKEN);
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Core validation logic for user authentication
 * Verifies token, session, organization, and user account status
 *
 * @param token - JWT token string
 * @returns Promise resolving to verified user JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
async function validateUserAuth(token: string): Promise<JWTPayload> {
  const payload = await verifyToken(token);

  if (!payload) {
    throw new AuthenticationError(
      "Invalid or expired token. Please log in again.",
      401
    );
  }

  // Check if session exists and is valid
  const session = await prisma.sessions.findUnique({
    where: { token },
    select: {
      id: true,
      expires_at: true,
      user_id: true,
      organization_id: true,
    },
  });

  if (!session) {
    throw new AuthenticationError(
      "Session not found. Please log in again.",
      401
    );
  }

  // Check if session is expired
  if (session.expires_at < new Date()) {
    throw new AuthenticationError("Session expired. Please log in again.", 401);
  }

  // Verify session matches the token payload
  if (
    session.user_id !== payload.userId ||
    session.organization_id !== payload.organizationId
  ) {
    throw new AuthenticationError(
      "Session mismatch. Please log in again.",
      401
    );
  }

  // Verify organization is still active
  const organization = await prisma.organization.findUnique({
    where: { id: session.organization_id },
    select: {
      is_active: true,
      is_deleted: true,
    },
  });

  if (!organization || !organization.is_active || organization.is_deleted) {
    throw new AuthenticationError(
      "Organization is inactive. Please contact cabipro.",
      403
    );
  }

  // Verify user account is still active
  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: {
      is_active: true,
    },
  });

  if (!user || !user.is_active) {
    throw new AuthenticationError(
      "User account is inactive. Please contact your administrator.",
      403
    );
  }

  return payload;
}

/**
 * Require authentication for organization users
 * Verifies JWT token and returns user payload
 *
 * Usage in API routes:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   try {
 *     const user = await requireAuth(request);
 *     // user.userId, user.organizationId, user.email, user.userType are available
 *     // Your protected route logic here
 *   } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *       return NextResponse.json(
 *         { error: error.message },
 *         { status: error.statusCode }
 *       );
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param request - Next.js request object
 * @returns Promise resolving to verified user JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const token = extractToken(request);

  if (!token) {
    throw new AuthenticationError(
      "Authentication required. Please provide a valid token.",
      401
    );
  }

  return await validateUserAuth(token);
}

/**
 * Require authentication for organization users (server component version)
 * Works with cookies from next/headers instead of NextRequest
 *
 * Usage in server components/layouts:
 * ```ts
 * export default async function Layout({ children }) {
 *   try {
 *     const cookieStore = await cookies();
 *     const payload = await requireAuthFromCookies(cookieStore);
 *     // payload.userId, payload.organizationId, etc. are available
 *   } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *       redirect("/login");
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param cookieStore - Cookies from next/headers
 * @returns Promise resolving to verified user JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
export async function requireAuthFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<JWTPayload> {
  const token = cookieStore.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

  if (!token) {
    throw new AuthenticationError(
      "Authentication required. Please provide a valid token.",
      401
    );
  }

  return await validateUserAuth(token);
}

/**
 * Require authentication for admin users
 * Verifies admin JWT token and returns admin payload
 *
 * Usage in API routes:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   try {
 *     const admin = await requireAdminAuth(request);
 *     // admin.adminId, admin.email, admin.role are available
 *     // Your protected admin route logic here
 *   } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *       return NextResponse.json(
 *         { error: error.message },
 *         { status: error.statusCode }
 *       );
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param request - Next.js request object
 * @returns Promise resolving to verified admin JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
export function extractAdminToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  // Try admin cookie as fallback
  const tokenCookie = request.cookies.get(COOKIE_NAMES.ADMIN_AUTH_TOKEN);
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Core validation logic for admin authentication
 * Verifies token, session, and admin account status
 *
 * @param token - JWT token string
 * @returns Promise resolving to verified admin JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
async function validateAdminAuth(token: string): Promise<AdminJWTPayload> {
  const payload = await verifyAdminToken(token);

  if (!payload) {
    throw new AuthenticationError(
      "Invalid or expired admin token. Please log in again.",
      401
    );
  }

  // Check if admin session exists and is valid
  const session = await prisma.admin_sessions.findUnique({
    where: { token },
    select: {
      id: true,
      expires_at: true,
      admin_id: true,
    },
  });

  if (!session) {
    throw new AuthenticationError(
      "Admin session not found. Please log in again.",
      401
    );
  }

  // Check if session is expired
  if (session.expires_at < new Date()) {
    throw new AuthenticationError(
      "Admin session expired. Please log in again.",
      401
    );
  }

  // Verify session matches the token payload
  if (session.admin_id !== payload.adminId) {
    throw new AuthenticationError(
      "Admin session mismatch. Please log in again.",
      401
    );
  }

  // Verify admin account is still active and not deleted
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: {
      is_active: true,
      is_deleted: true,
    },
  });

  if (!admin || !admin.is_active || admin.is_deleted) {
    throw new AuthenticationError(
      "Admin account is inactive. Please contact support.",
      403
    );
  }

  return payload;
}

/**
 * Require authentication for admin users
 * Verifies admin JWT token and returns admin payload
 *
 * Usage in API routes:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   try {
 *     const admin = await requireAdminAuth(request);
 *     // admin.adminId, admin.email, admin.role are available
 *     // Your protected admin route logic here
 *   } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *       return NextResponse.json(
 *         { error: error.message },
 *         { status: error.statusCode }
 *       );
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param request - Next.js request object
 * @returns Promise resolving to verified admin JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<AdminJWTPayload> {
  const token = extractAdminToken(request);

  if (!token) {
    throw new AuthenticationError(
      "Admin authentication required. Please provide a valid token.",
      401
    );
  }

  return await validateAdminAuth(token);
}

/**
 * Require authentication for admin users (server component version)
 * Works with cookies from next/headers instead of NextRequest
 *
 * Usage in server components/layouts:
 * ```ts
 * export default async function AdminLayout({ children }) {
 *   try {
 *     const cookieStore = await cookies();
 *     const payload = await requireAdminAuthFromCookies(cookieStore);
 *     // payload.adminId, payload.email, etc. are available
 *   } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *       redirect("/login");
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @param cookieStore - Cookies from next/headers
 * @returns Promise resolving to verified admin JWT payload
 * @throws AuthenticationError if token is missing or invalid
 */
export async function requireAdminAuthFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<AdminJWTPayload> {
  const token = cookieStore.get(COOKIE_NAMES.ADMIN_AUTH_TOKEN)?.value;

  if (!token) {
    throw new AuthenticationError(
      "Admin authentication required. Please provide a valid token.",
      401
    );
  }

  return await validateAdminAuth(token);
}

/**
 * Check if user (client) is authenticated from cookies
 * Returns the payload if authenticated, null otherwise
 * Does not throw - use this for optional auth checks
 *
 * @param cookieStore - Cookies from next/headers
 * @returns Promise resolving to user JWT payload or null
 */
export async function checkUserAuthFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<JWTPayload | null> {
  const token = cookieStore.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

  if (!token) {
    return null;
  }

  try {
    return await validateUserAuth(token);
  } catch {
    return null;
  }
}

/**
 * Check if admin is authenticated from cookies
 * Returns the payload if authenticated, null otherwise
 * Does not throw - use this for optional auth checks
 *
 * @param cookieStore - Cookies from next/headers
 * @returns Promise resolving to admin JWT payload or null
 */
export async function checkAdminAuthFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<AdminJWTPayload | null> {
  const token = cookieStore.get(COOKIE_NAMES.ADMIN_AUTH_TOKEN)?.value;

  if (!token) {
    return null;
  }

  try {
    return await validateAdminAuth(token);
  } catch {
    return null;
  }
}

/**
 * Get the authentication status and type from cookies
 * Useful for determining where to redirect users
 *
 * @param cookieStore - Cookies from next/headers
 * @returns Object with isAuthenticated, isAdmin, and isClient flags
 */
export async function getAuthStatusFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  redirectPath: string | null;
}> {
  // Check admin auth first
  const adminPayload = await checkAdminAuthFromCookies(cookieStore);
  if (adminPayload) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      isClient: false,
      redirectPath: "/admin",
    };
  }

  // Check user/client auth
  const userPayload = await checkUserAuthFromCookies(cookieStore);
  if (userPayload) {
    return {
      isAuthenticated: true,
      isAdmin: false,
      isClient: true,
      redirectPath: "/app",
    };
  }

  return {
    isAuthenticated: false,
    isAdmin: false,
    isClient: false,
    redirectPath: null,
  };
}

/**
 * Helper function to create an error response for authentication failures
 * Use this in catch blocks to return consistent error responses
 *
 * @param error - The error that was thrown
 * @returns NextResponse with error details
 */
export function createAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle unexpected errors
  const errorMessage =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    { error: "Authentication failed", details: errorMessage },
    { status: 500 }
  );
}
