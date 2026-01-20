import { NextRequest, NextResponse } from "next/server";

/**
 * Cookie names for different authentication types
 */
export const COOKIE_NAMES = {
  AUTH_TOKEN: "auth-token",
  ADMIN_AUTH_TOKEN: "admin-auth-token",
  ORG_SLUG: "org-slug",
} as const;

/**
 * Session TTL (Time To Live) in days
 * This is the single source of truth for session expiration
 */
export const SESSION_TTL_DAYS = 7;

/**
 * Calculate session expiry date based on SESSION_TTL_DAYS
 * @returns Date object representing when the session expires
 */
export function getSessionExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

/**
 * Cookie configuration for secure authentication cookies
 * These settings ensure cookies are protected from XSS attacks
 */
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  sameSite: "lax" as const, // CSRF protection (lax allows same-site navigation)
  path: "/", // Available site-wide
  maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS, // Session TTL in seconds
};

function buildCookieOptions(expiresAt?: Date, secure?: boolean) {
  // Prefer an explicit expiry when we have a session expiry (keeps cookies in sync with session lifetime).
  if (expiresAt) {
    return {
      ...COOKIE_OPTIONS,
      secure: secure ?? process.env.NODE_ENV === "production",
      expires: expiresAt,
      // Keep maxAge aligned too; some clients use one or the other.
      maxAge: Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      ),
    };
  }

  return {
    ...COOKIE_OPTIONS,
    secure: secure ?? process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + COOKIE_OPTIONS.maxAge * 1000),
  };
}

/**
 * Set authentication cookie for organization users
 * Uses HTTP-only cookies to protect from XSS attacks
 *
 * Usage in API routes:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const result = await authenticateUser(email, password, orgSlug);
 *   const response = NextResponse.json({ user: result.user });
 *   await setAuthCookie(result.token, response);
 *   return response;
 * }
 * ```
 *
 * @param token - JWT token to store in cookie
 * @param response - NextResponse object to set cookie on
 * @param cookieName - Optional custom cookie name (defaults to auth-token)
 */
export function setAuthCookie(
  token: string,
  response: NextResponse,
  cookieName: string = COOKIE_NAMES.AUTH_TOKEN,
  expiresAt?: Date,
  secure?: boolean,
): void {
  response.cookies.set(cookieName, token, {
    ...buildCookieOptions(expiresAt, secure),
  });
}

/**
 * Set authentication cookie for admin users
 * Uses HTTP-only cookies to protect from XSS attacks
 *
 * Usage in API routes:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const result = await authenticateAdmin(email, password);
 *   const response = NextResponse.json({ admin: result.admin });
 *   await setAdminAuthCookie(result.token, response);
 *   return response;
 * }
 * ```
 *
 * @param token - Admin JWT token to store in cookie
 * @param response - NextResponse object to set cookie on
 */
export function setAdminAuthCookie(
  token: string,
  response: NextResponse,
  expiresAt?: Date,
  secure?: boolean,
): void {
  setAuthCookie(
    token,
    response,
    COOKIE_NAMES.ADMIN_AUTH_TOKEN,
    expiresAt,
    secure,
  );
}

/**
 * Store the organization slug (tenant identifier) alongside the session.
 * Kept HTTP-only to prevent tampering; server uses it when needed.
 */
export function setOrganizationSlugCookie(
  slug: string,
  response: NextResponse,
  expiresAt?: Date,
  secure?: boolean,
): void {
  response.cookies.set(COOKIE_NAMES.ORG_SLUG, slug, {
    ...buildCookieOptions(expiresAt, secure),
  });
}

export function getOrganizationSlugCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAMES.ORG_SLUG);
  return cookie?.value || null;
}

/**
 * Get authentication cookie from request
 * Extracts the auth token from cookies
 *
 * Usage in API routes:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const token = getAuthCookie(request);
 *   if (!token) {
 *     return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
 *   }
 *   // Use token...
 * }
 * ```
 *
 * @param request - NextRequest object to read cookie from
 * @param cookieName - Optional custom cookie name (defaults to auth-token)
 * @returns Token string or null if not found
 */
export function getAuthCookie(
  request: NextRequest,
  cookieName: string = COOKIE_NAMES.AUTH_TOKEN,
): string | null {
  const cookie = request.cookies.get(cookieName);
  return cookie?.value || null;
}

/**
 * Get admin authentication cookie from request
 * Extracts the admin auth token from cookies
 *
 * @param request - NextRequest object to read cookie from
 * @returns Admin token string or null if not found
 */
export function getAdminAuthCookie(request: NextRequest): string | null {
  return getAuthCookie(request, COOKIE_NAMES.ADMIN_AUTH_TOKEN);
}

/**
 * Delete authentication cookie
 * Clears the auth cookie by setting it to expire immediately
 *
 * Usage in logout API routes:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const response = NextResponse.json({ message: "Logged out" });
 *   deleteAuthCookie(response);
 *   return response;
 * }
 * ```
 *
 * @param response - NextResponse object to delete cookie on
 * @param cookieName - Optional custom cookie name (defaults to auth-token)
 */
export function deleteAuthCookie(
  response: NextResponse,
  cookieName: string = COOKIE_NAMES.AUTH_TOKEN,
): void {
  response.cookies.set(cookieName, "", {
    ...COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // Set to epoch time to delete immediately
    maxAge: 0,
  });
}

/**
 * Delete admin authentication cookie
 * Clears the admin auth cookie by setting it to expire immediately
 *
 * @param response - NextResponse object to delete cookie on
 */
export function deleteAdminAuthCookie(response: NextResponse): void {
  deleteAuthCookie(response, COOKIE_NAMES.ADMIN_AUTH_TOKEN);
}

export function deleteOrganizationSlugCookie(response: NextResponse): void {
  deleteAuthCookie(response, COOKIE_NAMES.ORG_SLUG);
}

/**
 * Delete all authentication cookies
 * Useful for logout endpoints that need to clear both user and admin cookies
 *
 * @param response - NextResponse object to delete cookies on
 */
export function deleteAllAuthCookies(response: NextResponse): void {
  deleteAuthCookie(response, COOKIE_NAMES.AUTH_TOKEN);
  deleteAdminAuthCookie(response);
  deleteOrganizationSlugCookie(response);
}
