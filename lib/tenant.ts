import { NextRequest } from "next/server";
import { PrismaClient } from "../generated/prisma/client";
import {
  setOrganizationId,
  withOrganizationContext,
} from "./prisma-middleware";
import { COOKIE_NAMES } from "./cookies";

/**
 * Get the organization slug from the request
 * In the simplified path-based routing model, the org slug is stored in a cookie
 * with the same expiry as the user's session.
 *
 * @param request - Next.js request object
 * @returns The organization slug or null
 */
export function getOrganizationSlugFromRequest(
  request: NextRequest,
): string | null {
  return request.cookies.get(COOKIE_NAMES.ORG_SLUG)?.value || null;
}

/**
 * Look up an organization by its slug (tenant identifier)
 *
 * @param prisma - Prisma client instance
 * @param slug - Organization slug
 * @returns The organization object or null if not found
 */
export async function getOrganizationBySlug(
  prisma: PrismaClient,
  slug: string,
) {
  return prisma.organization.findUnique({
    where: {
      slug: slug,
      is_active: true,
      is_deleted: false,
    },
  });
}

/**
 * Get the current tenant/organization from the request
 * Extracts org slug from cookie, looks up organization, and returns it
 *
 * @param prisma - Prisma client instance
 * @param request - Next.js request object
 * @returns The organization object or null if not found
 */
export async function getCurrentTenant(
  prisma: PrismaClient,
  request: NextRequest,
) {
  const slug = getOrganizationSlugFromRequest(request);

  if (!slug) {
    return null;
  }

  return getOrganizationBySlug(prisma, slug);
}

/**
 * Require an organization from the request
 * Throws an error if no organization is found
 *
 * @param prisma - Prisma client instance
 * @param request - Next.js request object
 * @returns The organization object (never null, throws if not found)
 * @throws Error if organization is not found
 */
export async function requireOrganization(
  prisma: PrismaClient,
  request: NextRequest,
) {
  const organization = await getCurrentTenant(prisma, request);

  if (!organization) {
    throw new Error(
      `Organization not found for slug: ${getOrganizationSlugFromRequest(request) || "none"}`,
    );
  }

  return organization;
}

/**
 * Set the organization context from the request
 * This extracts the organization and sets it in the AsyncLocalStorage context
 * so that all subsequent Prisma queries are automatically filtered
 *
 * @param prisma - Prisma client instance
 * @param request - Next.js request object
 * @returns The organization object or null if not found
 */
export async function setOrganizationContext(
  prisma: PrismaClient,
  request: NextRequest,
) {
  const organization = await getCurrentTenant(prisma, request);

  if (organization) {
    setOrganizationId(organization.id);
  }

  return organization;
}

/**
 * Wrapper function to run code with organization context from request
 * This is a convenience function that combines getting the organization
 * and running code within that organization's context
 *
 * @param prisma - Prisma client instance
 * @param request - Next.js request object
 * @param fn - Function to run with organization context
 * @returns The result of the function
 * @throws Error if organization is not found
 */
export async function withOrganizationFromRequest<T>(
  prisma: PrismaClient,
  request: NextRequest,
  fn: (organization: { id: string; slug: string; name: string }) => Promise<T>,
): Promise<T> {
  const organization = await requireOrganization(prisma, request);

  return withOrganizationContext(organization.id, () => fn(organization));
}

/**
 * Middleware helper for Next.js API routes
 * Use this at the start of your API route handlers to automatically
 * set up organization context
 *
 * Example:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const organization = await setupOrganizationFromRequest(prisma, request);
 *   // Now all Prisma queries are automatically filtered by organization_id
 *   const projects = await prisma.project.findMany();
 *   return NextResponse.json({ projects });
 * }
 * ```
 *
 * @param prisma - Prisma client instance
 * @param request - Next.js request object
 * @returns The organization object
 * @throws Error if organization is not found
 */
export async function setupOrganizationFromRequest(
  prisma: PrismaClient,
  request: NextRequest,
) {
  return requireOrganization(prisma, request).then((org) => {
    setOrganizationId(org.id);
    return org;
  });
}
