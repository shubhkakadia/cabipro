"use client";
import { LayoutDashboard, Building2, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navdata = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin",
      access: false,
      subtabs: [],
    },
    {
      icon: Building2,
      label: "Organisations",
      href: "/admin/organisations",
      access: false,
      subtabs: [],
    },
  ];

  return (
    <div className="bg-white w-60 h-[calc(100vh-4rem)] border-r border-emerald-200 shrink-0">
      <div className="flex flex-col h-full px-4 py-4 gap-4">
        <div className="flex flex-col justify-between flex-1 min-h-0 gap-4">
          <div className="flex flex-col overflow-y-auto pr-1 gap-1">
            {navdata.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  item.subtabs.length === 0 &&
                  pathname.startsWith(item.href + "/"));

              // Regular item without subtabs
              return (
                <button
                  onClick={() => {
                    router.push(item.href);
                  }}
                  key={item.href}
                  className={`cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 flex items-center gap-2 border ${
                    isActive
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-transparent text-teal-700 hover:border-teal-600 hover:bg-teal-50"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-white"
                        : "text-teal-600 group-hover:text-emerald-700"
                    }`}
                  />
                  <h1
                    className={`text-sm font-medium flex-1 text-left ${
                      isActive
                        ? "text-white"
                        : "text-teal-700 group-hover:text-emerald-700"
                    }`}
                  >
                    {item.label}
                  </h1>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/admin/settings");
              }}
              className={`cursor-pointer rounded-lg px-3 py-2.5 border transition-all duration-200 flex items-center gap-2 ${
                pathname === "/admin/settings"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-transparent text-teal-700 hover:border-teal-600 hover:bg-teal-50"
              }`}
            >
              <Settings
                className={`w-4 h-4 ${
                  pathname === "/admin/settings"
                    ? "text-white"
                    : "text-teal-600 group-hover:text-emerald-700"
                }`}
              />
              <h1
                className={`text-sm font-medium ${
                  pathname === "/admin/settings"
                    ? "text-white"
                    : "text-teal-700 group-hover:text-emerald-700"
                }`}
              >
                Settings
              </h1>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
