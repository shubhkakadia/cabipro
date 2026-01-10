import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminAuthFromCookies, AuthenticationError, checkUserAuthFromCookies } from "@/lib/auth-middleware";
import AppHeader from "@/components/AppHeader";

/**
 * Protected layout for admin routes
 * Verifies admin authentication (no subdomains; path-based routing only)
 * Redirects clients to /app if they try to access admin routes
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  // First check if a client user is trying to access admin routes
  const clientAuth = await checkUserAuthFromCookies(cookieStore);
  if (clientAuth) {
    // Client users should not access admin routes - redirect to app
    redirect("/app");
  }
  
  // Now check for admin authentication
  try {
    await requireAdminAuthFromCookies(cookieStore);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <>
      <AppHeader variant="admin" />
      {children}
    </>
  );
}

