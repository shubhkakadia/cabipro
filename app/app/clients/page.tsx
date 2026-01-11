"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  RotateCcw,
  Funnel,
  ArrowUpDown,
  Sheet,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import PaginationFooter from "@/components/PaginationFooter";
import "react-toastify/dist/ReactToastify.css";
import AppHeader from "@/components/AppHeader";
import { useExcelExport } from "@/hooks/useExcelExport";

// Type definitions
interface Project {
  lots?: Lot[];
  [key: string]: unknown;
}

interface Lot {
  status: string;
  [key: string]: unknown;
}

interface Contact {
  first_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  [key: string]: unknown;
}

interface Client {
  id: string;
  name: string;
  type?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  projects?: Project[];
  contacts?: Contact[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "relevance">(
    "asc"
  );
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Data objects
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientType, setSelectedClientType] = useState<string[]>([]);
  const [distinctClientType, setDistinctClientType] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [showClientTypeFilterDropdown, setShowClientTypeFilterDropdown] =
    useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Flags
  const [error, setError] = useState<string | null>(null);

  const availableColumns = useMemo(
    () => [
      "Client ID",
      "Client Name",
      "Client Email",
      "Client Phone",
      "Client Type",
      "Number of Projects",
      "Client Address",
      "Client Website",
      "Client Notes",
      "Contact Name",
      "Contact Email",
      "Contact Phone",
      "Contact Notes",
      "Client Created At",
      "Client Updated At",
    ],
    []
  );

  // Helper functions used in memoized values
  const countActiveProjects = (client: Client): number => {
    if (!client.projects || client.projects.length === 0) return 0;
    return client.projects.filter((project: Project) => {
      const lots = project.lots || [];
      if (lots.length === 0) return true; // Projects with no lots are considered active
      return lots.some((lot: Lot) => lot.status === "ACTIVE");
    }).length;
  };

  const countCompletedProjects = (client: Client): number => {
    if (!client.projects || client.projects.length === 0) return 0;
    return client.projects.filter((project: Project) => {
      const lots = project.lots || [];
      return lots.some((lot: Lot) => lot.status === "COMPLETED");
    }).length;
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    const filtered = clients.filter((client: Client) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (client.name && client.name.toLowerCase().includes(searchLower)) ||
          (client.type && client.type.toLowerCase().includes(searchLower)) ||
          (client.email && client.email.toLowerCase().includes(searchLower)) ||
          (client.projects &&
            client.projects.length.toString().includes(searchLower)) ||
          (client.type && client.type.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Client type filter
      if (selectedClientType.length === 0) {
        return false;
      }

      return selectedClientType.includes(client.type || "");
    });

    // Sort clients
    filtered.sort((a: Client, b: Client) => {
      let aValue: string | number =
        (a[sortField as keyof Client] as string) || "";
      let bValue: string | number =
        (b[sortField as keyof Client] as string) || "";

      // Handle projects sorting (by count)
      if (
        sortField === "number_of_projects" ||
        sortField === "active_projects"
      ) {
        aValue = countActiveProjects(a);
        bValue = countActiveProjects(b);
      } else if (sortField === "completed_projects") {
        aValue = countCompletedProjects(a);
        bValue = countCompletedProjects(b);
      }

      // Handle relevance sorting (by search match)
      if (sortOrder === "relevance" && search) {
        const searchLower = search.toLowerCase();
        const aMatch = String(aValue).toLowerCase().includes(searchLower);
        const bMatch = String(bValue).toLowerCase().includes(searchLower);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      // Convert to string for comparison (except for projects which is numeric)
      if (
        sortField !== "number_of_projects" &&
        sortField !== "active_projects" &&
        sortField !== "completed_projects"
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
  }, [clients, search, sortField, sortOrder, selectedClientType]);

  // Data-fetching effects
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/client/all", {
        withCredentials: true,
      });

      if (response.data.status) {
        setClients(response.data.data);
        // Extract distinct client types
        const types = [
          ...new Set(
            response.data.data
              .map((client: Client) => client.type || "")
              .filter(Boolean)
          ),
        ] as string[];
        setDistinctClientType(types);
        setSelectedClientType(types); // Select all by default
      } else {
        setError(response.data.message || "Failed to fetch clients");
      }
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch clients. Please try again."
        );
      } else {
        setError("Failed to fetch clients. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Event listeners or subscriptions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowSortDropdown(false);
        setShowClientTypeFilterDropdown(false);
        setShowColumnDropdown(false);
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

  // Initialize selectedColumns with all available columns by default
  useEffect(() => {
    if (selectedColumns.length === 0) {
      setSelectedColumns([...availableColumns]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Column mapping for Excel export
  const columnMap = useMemo(() => {
    return {
      "Client ID": (client: Client) => client.id || "",
      "Client Name": (client: Client) => client.name || "",
      "Client Email": (client: Client) => client.email || "",
      "Client Phone": (client: Client) => client.phone || "",
      "Client Type": (client: Client) => client.type || "",
      "Number of Projects": (client: Client) =>
        (client.projects ? client.projects.length : 0).toString(),
      "Client Address": (client: Client) => client.address || "",
      "Client Website": (client: Client) => client.website || "",
      "Client Notes": (client: Client) => client.notes || "",
      "Contact Name": (client: Client) => {
        const firstContact =
          client.contacts && client.contacts.length > 0
            ? client.contacts[0]
            : null;
        return firstContact?.first_name || "";
      },
      "Contact Email": (client: Client) => {
        const firstContact =
          client.contacts && client.contacts.length > 0
            ? client.contacts[0]
            : null;
        return firstContact?.email || "";
      },
      "Contact Phone": (client: Client) => {
        const firstContact =
          client.contacts && client.contacts.length > 0
            ? client.contacts[0]
            : null;
        return firstContact?.phone || "";
      },
      "Contact Notes": (client: Client) => {
        const firstContact =
          client.contacts && client.contacts.length > 0
            ? client.contacts[0]
            : null;
        return firstContact?.notes || "";
      },
      "Client Created At": (client: Client) =>
        client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "",
      "Client Updated At": (client: Client) =>
        client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : "",
    };
  }, []);

  // Initialize Excel export hook
  const { exportToExcel, isExporting } = useExcelExport<Client>({
    columnMap,
    filenamePrefix: "clients",
    sheetName: "Clients",
    selectedColumns,
    availableColumns,
  });

  // Handlers (handleChange, handleSubmit)
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

  const handleClientTypeToggle = (clientType: string) => {
    if (clientType === "Select All") {
      if (selectedClientType.length === distinctClientType.length) {
        // If all client types are selected, unselect all (show no data)
        setSelectedClientType([]);
      } else {
        // If not all client types are selected, select all
        setSelectedClientType([...distinctClientType]);
      }
    } else {
      setSelectedClientType((prev) =>
        prev.includes(clientType)
          ? prev.filter((type: string) => type !== clientType)
          : [...prev, clientType]
      );
    }
  };

  const handleColumnToggle = (column: string) => {
    if (column === "Select All") {
      if (selectedColumns.length === availableColumns.length) {
        // If all columns are selected, unselect all
        setSelectedColumns([]);
      } else {
        // If not all columns are selected, select all
        setSelectedColumns([...availableColumns]);
      }
    } else {
      setSelectedColumns((prev) =>
        prev.includes(column)
          ? prev.filter((c: string) => c !== column)
          : [...prev, column]
      );
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
    setSortField("name");
    setSortOrder("asc");
    setSelectedClientType([...distinctClientType]); // Reset to all roles selected
  };

  // Local helpers (formatters, validators)
  const isAnyFilterActive = () => {
    return (
      search !== "" || // Search is not empty
      selectedClientType.length !== distinctClientType.length || // Role filter is not showing all roles
      sortField !== "name" || // Sort field is not default
      sortOrder !== "asc" // Sort order is not default
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

  // Pagination calculations
  const totalItems = filteredAndSortedClients.length;
  const startIndex = itemsPerPage === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 0 ? totalItems : startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  return (
    <div className="bg-tertiary">
      <AppHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                  <p className="text-sm text-slate-600 font-medium">
                    Loading clients details...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-red-600 mb-4 font-medium">
                    {error}
                  </p>
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
                      Clients
                    </h1>
                    <button
                      onClick={() => router.push("/app/clients/addclient")}
                      className="cursor-pointer hover:bg-emerald-500 transition-all duration-200 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Client
                    </button>
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
                            placeholder="Search Client with name, client type"
                            className="w-full text-slate-800 p-2 pl-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm font-normal"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>

                        {/* reset, sort by, filter by, export to excel */}
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
                              onClick={() =>
                                setShowClientTypeFilterDropdown(
                                  !showClientTypeFilterDropdown
                                )
                              }
                              className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              <Funnel className="h-4 w-4" />
                              <span>Filter by Client Type</span>
                              {distinctClientType.length -
                                selectedClientType.length >
                                0 && (
                                <span className="bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                  {distinctClientType.length -
                                    selectedClientType.length}
                                </span>
                              )}
                            </button>
                            {showClientTypeFilterDropdown && (
                              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                <div className="py-1">
                                  <label className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 sticky top-0 bg-white border-b border-slate-200 cursor-pointer">
                                    <span className="font-semibold">
                                      Select All
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedClientType.length ===
                                        distinctClientType.length
                                      }
                                      onChange={() =>
                                        handleClientTypeToggle("Select All")
                                      }
                                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                    />
                                  </label>
                                  {distinctClientType.map((role: string) => (
                                    <label
                                      key={role}
                                      className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    >
                                      <span>{role}</span>
                                      <input
                                        type="checkbox"
                                        checked={selectedClientType.includes(
                                          role
                                        )}
                                        onChange={() =>
                                          handleClientTypeToggle(role)
                                        }
                                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="relative dropdown-container">
                            <button
                              onClick={() =>
                                setShowSortDropdown(!showSortDropdown)
                              }
                              className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                              <span>Sort by</span>
                            </button>
                            {showSortDropdown && (
                              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleSort("name")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Client Name {getSortIcon("name")}
                                  </button>
                                  <button
                                    onClick={() => handleSort("type")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Client Type {getSortIcon("type")}
                                  </button>
                                  <button
                                    onClick={() => handleSort("email")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Client Email {getSortIcon("email")}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSort("active_projects")
                                    }
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Active Projects{" "}
                                    {getSortIcon("active_projects")}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSort("completed_projects")
                                    }
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Completed Projects{" "}
                                    {getSortIcon("completed_projects")}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="relative dropdown-container flex items-center">
                            <button
                              onClick={() =>
                                exportToExcel(filteredAndSortedClients)
                              }
                              disabled={
                                isExporting ||
                                filteredAndSortedClients.length === 0 ||
                                selectedColumns.length === 0
                              }
                              className={`flex items-center gap-2 transition-all duration-200 text-slate-700 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg text-sm font-medium ${
                                isExporting ||
                                filteredAndSortedClients.length === 0 ||
                                selectedColumns.length === 0
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer hover:bg-slate-100"
                              }`}
                            >
                              <Sheet className="h-4 w-4" />
                              <span>
                                {isExporting
                                  ? "Exporting..."
                                  : "Export to Excel"}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                setShowColumnDropdown(!showColumnDropdown)
                              }
                              disabled={
                                isExporting ||
                                filteredAndSortedClients.length === 0
                              }
                              className={`flex items-center transition-all duration-200 text-slate-700 border border-slate-300 px-2 py-2 rounded-r-lg text-sm font-medium ${
                                isExporting ||
                                filteredAndSortedClients.length === 0
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer hover:bg-slate-100"
                              }`}
                            >
                              <ChevronDown className="h-5 w-5" />
                            </button>
                            {showColumnDropdown && (
                              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                <div className="py-1">
                                  <label className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 sticky top-0 bg-white border-b border-slate-200 cursor-pointer">
                                    <span className="font-semibold">
                                      Select All
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedColumns.length ===
                                        availableColumns.length
                                      }
                                      onChange={() =>
                                        handleColumnToggle("Select All")
                                      }
                                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                    />
                                  </label>
                                  {availableColumns.map((column) => (
                                    <label
                                      key={column}
                                      className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    >
                                      <span>{column}</span>
                                      <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(
                                          column
                                        )}
                                        onChange={() =>
                                          handleColumnToggle(column)
                                        }
                                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                      />
                                    </label>
                                  ))}
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
                                  Client Name
                                  {getSortIcon("name")}
                                </div>
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("type")}
                              >
                                <div className="flex items-center gap-2">
                                  Client Type
                                  {getSortIcon("type")}
                                </div>
                              </th>
                              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                Client Email
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("active_projects")}
                              >
                                <div className="flex items-center gap-2">
                                  Active Projects
                                  {getSortIcon("active_projects")}
                                </div>
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("completed_projects")}
                              >
                                <div className="flex items-center gap-2">
                                  Completed Projects
                                  {getSortIcon("completed_projects")}
                                </div>
                              </th>
                            </tr>
                          </thead>

                          <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                              <tr>
                                <td
                                  className="px-4 py-4 text-sm text-slate-500 text-center"
                                  colSpan={5}
                                >
                                  Loading clients...
                                </td>
                              </tr>
                            ) : error ? (
                              <tr>
                                <td
                                  className="px-4 py-4 text-sm text-red-600 text-center"
                                  colSpan={5}
                                >
                                  {error}
                                </td>
                              </tr>
                            ) : paginatedClients.length === 0 ? (
                              <tr>
                                <td
                                  className="px-4 py-4 text-sm text-slate-500 text-center"
                                  colSpan={5}
                                >
                                  {search
                                    ? "No clients found matching your search"
                                    : "No clients found"}
                                </td>
                              </tr>
                            ) : (
                              paginatedClients.map((client: Client) => (
                                <tr
                                  key={client.id}
                                  className="hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                                  onClick={() => {
                                    router.push(`/app/clients/${client.id}`);
                                  }}
                                >
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                                    <span className="text-slate-700">
                                      {client.name || "-"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                    {client.type || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {client.email || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                    <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                                      {countActiveProjects(client)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                    <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">
                                      {countCompletedProjects(client)}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fixed Pagination Footer */}
                    {!loading && !error && (
                      <PaginationFooter
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
