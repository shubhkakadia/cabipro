import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  requireAuthFromCookies,
  AuthenticationError,
  checkAdminAuthFromCookies,
} from "@/lib/auth-middleware";

/**
 * Protected layout for organization/client routes
 * Verifies authentication for organization/client routes (path-based routing; no subdomains)
 * Redirects admins to /admin if they try to access client routes
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // First check if an admin is trying to access client routes
  const adminAuth = await checkAdminAuthFromCookies(cookieStore);
  if (adminAuth) {
    // Admin users should not access client routes - redirect to admin
    redirect("/admin");
  }

  // Now check for client authentication
  try {
    await requireAuthFromCookies(cookieStore);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  return <>{children}</>;
}
