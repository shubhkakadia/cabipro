"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Routes where we don't want header and footer
  const hideHeaderFooter =
    pathname === "/app" ||
    pathname?.startsWith("/app/") ||
    pathname === "/admin" ||
    pathname?.startsWith("/admin/");

  if (hideHeaderFooter) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
