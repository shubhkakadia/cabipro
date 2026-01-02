import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthStatusFromCookies } from "@/lib/auth-middleware";

/**
 * Layout for login page
 * Redirects authenticated users to their respective dashboards
 */
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authStatus = await getAuthStatusFromCookies(cookieStore);

  // If user is already authenticated, redirect to their dashboard
  if (authStatus.isAuthenticated && authStatus.redirectPath) {
    redirect(authStatus.redirectPath);
  }

  return <>{children}</>;
}

