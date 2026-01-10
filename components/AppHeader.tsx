"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useLogout } from "@/lib/useLogout";

// Hook to detect if component is mounted (client-side)
// This avoids hydration mismatch for user data from localStorage
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // Client returns true
    () => false // Server returns false
  );
}

interface AppHeaderProps {
  variant?: "app" | "admin";
}

export default function AppHeader({ variant = "app" }: AppHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const mounted = useIsMounted();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useLogout();

  const user = useAppSelector((state) => state.user);

  // Normalize logo path - remove /public prefix if present (Next.js serves public folder from root)
  const normalizeLogoPath = (
    path: string | null | undefined
  ): string | null => {
    if (!path) return null;
    // Remove /public prefix if it exists, since Next.js serves public folder from root
    const normalized = path.startsWith("/public/")
      ? path.replace("/public", "")
      : path;
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  // Get logo source - use default during SSR, actual logo after mount to avoid hydration mismatch
  // During SSR and initial client render, this will be "/logo.webp"
  // After hydration, mounted will be true and we'll use the actual logo from Redux
  const logoSrc =
    mounted && user.organizationLogo
      ? normalizeLogoPath(user.organizationLogo) || "/versel.png"
      : "/versel.png";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const getInitials = () => {
    if (!mounted) return ""; // Return empty during SSR to avoid hydration mismatch
    const first = user.firstName?.charAt(0)?.toUpperCase() || "";
    const last = user.lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "U";
  };

  const settingsPath =
    variant === "admin" ? "/admin/settings" : "/app/settings";
  const dashboardPath = variant === "admin" ? "/admin" : "/app";

  // Get the display name based on variant
  const getDisplayName = () => {
    if (variant === "admin") {
      return "CabiPro Admin";
    }
    // For client, show organization name (only after mount to avoid hydration mismatch)
    return mounted ? user.organizationName || "Dashboard" : "Dashboard";
  };

  // Get the display name for user profile (organization name for client, "CabiPro Admin" for admin)
  const getProfileDisplayName = () => {
    if (variant === "admin" || user.isAdmin) {
      return "CabiPro Admin";
    }
    // For client, show organization name (only after mount to avoid hydration mismatch)
    return mounted ? user.organizationName || "User" : "";
  };

  return (
    <header className="top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm h-16 sticky">
      <nav className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <Link
            href={dashboardPath}
            className="flex items-center gap-2 text-xl font-bold text-slate-900 transition-colors hover:text-emerald-600"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Image
                loading="lazy"
                src={logoSrc}
                alt="logo"
                width={120}
                height={120}
                className="drop-shadow-sm rounded-lg"
                suppressHydrationWarning
              />
            </div>

            <span className="hidden sm:inline">{getDisplayName()}</span>
            <span className="sm:hidden">
              {variant === "admin"
                ? "Admin"
                : mounted
                ? user.organizationName || "Dashboard"
                : "Dashboard"}
            </span>
          </Link>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {/* Profile Photo or Initials */}
            {user.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white ring-2 ring-white">
                {getInitials()}
              </div>
            )}

            {/* Name */}
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-medium text-slate-700">
                {mounted
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "User"
                  : ""}
              </span>
              <p className="text-xs text-slate-500">
                {getProfileDisplayName()}
              </p>
            </div>

            {/* Chevron */}
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 transition-all duration-200 ${
              dropdownOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            }`}
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info Header */}
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {mounted
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "User"
                  : ""}
              </p>
              <p className="text-xs text-slate-500">
                {getProfileDisplayName()}
              </p>
              <p className="truncate text-xs text-slate-500 mt-1">
                {mounted ? user.email : ""}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href={settingsPath}
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                role="menuitem"
              >
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                role="menuitem"
              >
                <svg
                  className="h-4 w-4 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
