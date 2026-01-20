"use client";
import {
  LayoutDashboard,
  IdCardLanyard,
  Settings,
  User,
  PanelsTopLeft,
  InspectionPanel,
  Warehouse,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  Settings2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import versions from "@/config/versions.json";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(true);
  const [suppliersDropdownOpen, setSuppliersDropdownOpen] = useState(true);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(true);

  const navdata = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/app",
      access: false,
      subtabs: [],
    },
    {
      icon: IdCardLanyard,
      label: "Employees",
      href: "/app/employees",
      access: false,
      subtabs: [],
    },
    {
      icon: User,
      label: "Clients",
      href: "/app/clients",
      access: false,
      subtabs: [],
    },
    {
      icon: PanelsTopLeft,
      label: "Projects",
      href: "/app/projects",
      access: false,
      subtabs: [
        {
          name: "Lots at a Glance",
          href: "/app/projects/lotatglance",
        },
      ],
    },
    {
      icon: InspectionPanel,
      label: "Suppliers",
      href: "/app/suppliers",
      access: false,
      subtabs: [
        {
          name: "Materials to Order",
          href: "/app/suppliers/materialstoorder",
          access: false,
        },
        {
          name: "Purchase Order",
          href: "/app/suppliers/purchaseorder",
          access: false,
        },
        {
          name: "Statements",
          href: "/app/suppliers/statements",
          access: false,
        },
      ],
    },
    {
      icon: Warehouse,
      label: "Inventory",
      href: "/app/inventory",
      access: false,
      subtabs: [
        {
          name: "Used Material",
          href: "/app/inventory/usedmaterial",
          access: false,
        },
      ],
    },
    // { icon: Landmark, label: "Finance", href: "/admin/finance", subtabs: [] },
    {
      icon: Trash2,
      label: "Deleted Media",
      href: "/app/deletefiles",
      subtabs: [],
      access: false,
    },
    {
      icon: FileText,
      label: "Logs",
      href: "/app/logs",
      subtabs: [],
      access: false,
    },
    {
      icon: Settings2,
      label: "Config",
      href: "/app/config",
      subtabs: [],
      access: false,
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
                (item.subtabs.length === 0 &&
                  pathname.startsWith(item.href + "/"));
              const isParentActive = pathname.startsWith(item.href);

              if (item.subtabs.length > 0) {
                // Get dropdown state based on label
                const dropdownOpen =
                  item.label === "Projects"
                    ? projectDropdownOpen
                    : item.label === "Suppliers"
                      ? suppliersDropdownOpen
                      : item.label === "Inventory"
                        ? inventoryDropdownOpen
                        : false;

                const toggleDropdown = () => {
                  if (item.label === "Projects")
                    setProjectDropdownOpen((prev) => !prev);
                  else if (item.label === "Suppliers")
                    setSuppliersDropdownOpen((prev) => !prev);
                  else if (item.label === "Inventory")
                    setInventoryDropdownOpen((prev) => !prev);
                };

                return (
                  <div key={item.href} className="space-y-1">
                    <div
                      className={`w-full rounded-lg border transition-all duration-200 flex items-center gap-2 px-3 py-2 ${
                        isParentActive
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "border-transparent text-teal-700 hover:border-teal-600 hover:bg-teal-50"
                      }`}
                    >
                      <button
                        onClick={() => {
                          router.push(item.href);
                        }}
                        className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                      >
                        <item.icon
                          className={`w-4 h-4 ${
                            isParentActive
                              ? "text-white"
                              : "text-teal-600 group-hover:text-emerald-700"
                          }`}
                        />
                        <h1
                          className={`text-sm font-medium ${
                            isParentActive
                              ? "text-white"
                              : "text-teal-700 group-hover:text-emerald-700"
                          }`}
                        >
                          {item.label}
                        </h1>
                      </button>

                      <button
                        onClick={toggleDropdown}
                        className="p-1.5 rounded-md hover:bg-teal-100 transition-colors duration-200 cursor-pointer"
                        aria-label={
                          dropdownOpen
                            ? `Close ${item.label.toLowerCase()} dropdown`
                            : `Open ${item.label.toLowerCase()} dropdown`
                        }
                      >
                        {dropdownOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-teal-600 group-hover:text-emerald-700" />
                        )}
                      </button>

                      {/* <div
                        className="p-1.5 rounded-md hover:bg-teal-100 transition-colors duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        aria-label={`Open ${item.label} in new tab`}
                      >
                        <SquareArrowOutUpRight className="w-3.5 h-3.5 text-teal-600 group-hover:text-emerald-700" />
                      </div> */}
                    </div>

                    {dropdownOpen && (
                      <div className="mt-1.5 space-y-1.5 ml-2">
                        {item.subtabs.map((link) => {
                          const isActiveSub = pathname === link.href;
                          return (
                            <button
                              key={link.href}
                              onClick={() => {
                                router.push(link.href);
                              }}
                              className={`w-full text-left cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                                isActiveSub
                                  ? "bg-emerald-600 text-white border-emerald-700"
                                  : "border-transparent text-teal-700 hover:border-teal-600 hover:bg-teal-50"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {link.name}
                              </span>
                              {/* <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="ml-auto p-1.5 rounded-md hover:bg-teal-100 transition-colors duration-200 cursor-pointer"
                              >
                                <SquareArrowOutUpRight className="w-3.5 h-3.5 text-teal-600 group-hover:text-emerald-700" />
                              </div> */}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

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
                  {/* <div
                    className="p-1.5 rounded-md hover:bg-teal-100 transition-colors duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    aria-label={`Open ${item.label} in new tab`}
                  >
                    <SquareArrowOutUpRight className="w-3.5 h-3.5 text-teal-600 group-hover:text-emerald-700" />
                  </div> */}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/app/settings");
              }}
              className={`cursor-pointer rounded-lg px-3 py-2.5 border transition-all duration-200 flex items-center gap-2 ${
                pathname === "/app/settings"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-transparent text-teal-700 hover:border-teal-600 hover:bg-teal-50"
              }`}
            >
              <Settings
                className={`w-4 h-4 ${
                  pathname === "/app/settings"
                    ? "text-white"
                    : "text-teal-600 group-hover:text-emerald-700"
                }`}
              />
              <h1
                className={`text-sm font-medium ${
                  pathname === "/app/settings"
                    ? "text-white"
                    : "text-teal-700 group-hover:text-emerald-700"
                }`}
              >
                Settings
              </h1>
              {/* <div
                className="ml-auto p-1.5 rounded-md hover:bg-teal-100 transition-colors duration-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                aria-label="Open Settings in new tab"
              >
                <SquareArrowOutUpRight className="w-3.5 h-3.5 text-teal-600 group-hover:text-emerald-700" />
              </div> */}
            </button>
            <p className="text-xs text-teal-600/80 text-center mt-2 px-2">
              v{versions.version}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
