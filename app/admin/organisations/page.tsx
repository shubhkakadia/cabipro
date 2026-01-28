"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PaginationFooter from "@/components/PaginationFooter";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

// Type definitions
interface Organisation {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo?: string;
  plan: "STARTER" | "PLUS" | "PRO" | "ENTERPRISE";
  plan_expires_at?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  owner_id?: string;
  owner_name: string;
  total_users: number;
  total_projects: number;
}

// Plan colors mapping
const PLAN_COLORS = {
  STARTER: "bg-slate-100 text-slate-700",
  PLUS: "bg-blue-100 text-blue-700",
  PRO: "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
};

// Plan pricing (placeholder - update with actual pricing)
const PLAN_PRICES = {
  STARTER: "$0/mo",
  PLUS: "$29/mo",
  PRO: "$99/mo",
  ENTERPRISE: "Custom",
};

export default function OrganisationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "relevance">(
    "desc",
  );
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Data objects
  const [organisations, setOrganisations] = useState<Organisation[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Flags
  const [error, setError] = useState<string | null>(null);

  // Filter and sort organisations
  const filteredAndSortedOrganisations = useMemo(() => {
    const filtered = organisations.filter((org: Organisation) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (org.name && org.name.toLowerCase().includes(searchLower)) ||
          (org.email && org.email.toLowerCase().includes(searchLower)) ||
          (org.owner_name &&
            org.owner_name.toLowerCase().includes(searchLower)) ||
          (org.plan && org.plan.toLowerCase().includes(searchLower)) ||
          (org.slug && org.slug.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sort organisations
    filtered.sort((a: Organisation, b: Organisation) => {
      let aValue: string | number | boolean =
        (a[sortField as keyof Organisation] as string) || "";
      let bValue: string | number | boolean =
        (b[sortField as keyof Organisation] as string) || "";

      // Handle relevance sorting (by search match)
      if (sortOrder === "relevance" && search) {
        const searchLower = search.toLowerCase();
        const aMatch = String(aValue).toLowerCase().includes(searchLower);
        const bMatch = String(bValue).toLowerCase().includes(searchLower);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      // Convert to string for comparison (except for numeric fields)
      if (
        sortField !== "total_users" &&
        sortField !== "total_projects" &&
        sortField !== "is_active"
      ) {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else if (sortOrder === "desc") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return 0;
    });

    return filtered;
  }, [organisations, search, sortField, sortOrder]);

  // Data-fetching effects
  const fetchOrganisations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/organisations/all", {
        withCredentials: true,
      });

      if (response.data.status) {
        setOrganisations(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch organisations");
      }
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch organisations. Please try again.",
        );
      } else {
        setError("Failed to fetch organisations. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganisations();
  }, [fetchOrganisations]);

  // Event listeners or subscriptions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // UI-sync effects
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc" && search) {
        setSortOrder("relevance");
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setSortField("createdAt");
    setSortOrder("desc");
  };

  // Local helpers
  const isAnyFilterActive = () => {
    return (
      search !== "" || // Search is not empty
      sortField !== "createdAt" || // Sort field is not default
      sortOrder !== "desc" // Sort order is not default
    );
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    if (sortOrder === "asc")
      return <ArrowUp className="h-4 w-4 text-primary" />;
    if (sortOrder === "desc")
      return <ArrowDown className="h-4 w-4 text-primary" />;
    return null; // No icon for relevance
  };

  // Normalize logo path - remove /public prefix if present (Next.js serves public folder from root)
  const normalizeLogoPath = (
    path: string | null | undefined,
  ): string | null => {
    if (!path) return null;
    // Remove /public prefix if it exists, since Next.js serves public folder from root
    const normalized = path.startsWith("/public/")
      ? path.replace("/public", "")
      : path;
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  // Pagination calculations
  const totalItems = filteredAndSortedOrganisations.length;
  const startIndex = itemsPerPage === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 0 ? totalItems : startIndex + itemsPerPage;
  const paginatedOrganisations = filteredAndSortedOrganisations.slice(
    startIndex,
    endIndex,
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-sm text-slate-600 font-medium">
              Loading organisations...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 mb-4 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="cursor-pointer btn-primary px-4 py-2 text-sm font-medium rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-slate-700">
                Organisations
              </h1>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              {/* Fixed Header Section */}
              <div className="p-4 shrink-0 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  {/* search bar */}
                  <div className="flex items-center gap-2 flex-1 max-w-2xl relative">
                    <Search className="h-4 w-4 absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search organisations by name, owner, plan..."
                      className="w-full text-slate-800 p-2 pl-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm font-normal"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* reset, sort by */}
                  <div className="flex items-center gap-2">
                    {isAnyFilterActive() && (
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Reset</span>
                      </button>
                    )}

                    <div className="relative dropdown-container">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        <span>Sort by</span>
                      </button>
                      {showSortDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={() => handleSort("name")}
                              className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Organisation Name {getSortIcon("name")}
                            </button>
                            <button
                              onClick={() => handleSort("owner_name")}
                              className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Owner Name {getSortIcon("owner_name")}
                            </button>
                            <button
                              onClick={() => handleSort("plan")}
                              className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Plan {getSortIcon("plan")}
                            </button>
                            <button
                              onClick={() => handleSort("total_users")}
                              className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Total Users {getSortIcon("total_users")}
                            </button>
                            <button
                              onClick={() => handleSort("createdAt")}
                              className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              Created Date {getSortIcon("createdAt")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Table Section */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-full">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th
                          className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Organisation
                            {getSortIcon("name")}
                          </div>
                        </th>
                        <th
                          className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => handleSort("owner_name")}
                        >
                          <div className="flex items-center gap-2">
                            Owner
                            {getSortIcon("owner_name")}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th
                          className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => handleSort("plan")}
                        >
                          <div className="flex items-center gap-2">
                            Plan
                            {getSortIcon("plan")}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th
                          className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => handleSort("total_users")}
                        >
                          <div className="flex items-center gap-2">
                            Users
                            {getSortIcon("total_users")}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td
                            className="px-4 py-4 text-sm text-slate-500 text-center"
                            colSpan={7}
                          >
                            Loading organisations...
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td
                            className="px-4 py-4 text-sm text-red-600 text-center"
                            colSpan={7}
                          >
                            {error}
                          </td>
                        </tr>
                      ) : paginatedOrganisations.length === 0 ? (
                        <tr>
                          <td
                            className="px-4 py-4 text-sm text-slate-500 text-center"
                            colSpan={7}
                          >
                            {search
                              ? "No organisations found matching your search"
                              : "No organisations found"}
                          </td>
                        </tr>
                      ) : (
                        paginatedOrganisations.map((org: Organisation) => (
                          <tr
                            key={org.id}
                            className="hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                            onClick={() => {
                              router.push(`/admin/organisations/${org.id}`);
                            }}
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {org.logo ? (
                                  <Image
                                    src={normalizeLogoPath(org.logo) || ""}
                                    alt={org.name}
                                    width={40}
                                    height={40}
                                    className="rounded-lg border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-700">
                                    {org.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {org.slug}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              {org.owner_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <div className="flex flex-col gap-1">
                                {org.email && (
                                  <span className="text-xs">{org.email}</span>
                                )}
                                {org.phone && (
                                  <span className="text-xs font-medium">
                                    {org.phone}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${PLAN_COLORS[org.plan]}`}
                              >
                                {org.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                              {PLAN_PRICES[org.plan]}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              <span className="text-slate-600">
                                {org.total_users}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  org.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {org.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Footer */}
              <PaginationFooter
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
