"use client";
import React, { useEffect, useState, useCallback } from "react";
// import CRMLayout from "@/components/tabs";
// import { AdminRoute } from "@/components/ProtectedRoute";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FolderKanban,
  Layers,
  ClipboardList,
  ShoppingCart,
  Package,
  RefreshCcw,
  History,
  User,
  ChevronDown,
  Calendar,
  Clock,
  RotateCcw,
  Database,
  HardDrive,
  Target,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Sidebar from "@/components/sidebar";
import AppHeader from "@/components/AppHeader";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palette for charts
const CHART_COLORS = [
  "#B92F34", // Primary Red
  "#000080", // Primary Blue
  "#059669", // Emerald
  "#7C3AED", // Violet
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
];

// Type definitions
interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
  prefix?: string;
  onClick?: () => void;
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface DashboardData {
  activeProjects?: number;
  activeLots?: number;
  activeMTOs?: number;
  activePurchaseOrders?: number;
  projectsCompletedThisMonth?: number;
  averageProjectDuration?: number;
  totalSpent?: Array<{ month_year: string }>;
  topstagesDue?: Stage[];
  lotsByStage?: Array<{ name: string; _count: number }>;
  MTOsByStatus?: Array<{ status: string; _count: number }>;
  purchaseOrdersByStatus?: Array<{ status: string; _count: number }>;
  top10items?: Item[];
}

interface Stage {
  stage_id: string;
  name: string;
  status: string;
  endDate?: string;
  lot_id?: string;
  lot?: {
    project?: {
      name: string;
    };
  };
}

interface Item {
  id: string;
  category: string;
  quantity: number;
  description?: string;
  sheet?: { brand: string; color: string };
  handle?: { brand: string; color: string };
  hardware?: { brand: string; name: string };
  accessory?: { name: string };
  edging_tape?: { brand: string; color: string };
}

interface Log {
  id: string;
  action: string;
  description?: string;
  entity_type?: string;
  createdAt: string;
  user?: {
    username?: string;
  };
}

interface StorageUsage {
  database?: { size_mb: number };
  uploads?: { size_mb: number };
  timestamp?: string;
}

interface EmployeeData {
  first_name?: string;
  last_name?: string;
}

interface SearchResults {
  clients?: Array<{ client_id: string; [key: string]: unknown }>;
  employees?: Array<{ employee_id: string; [key: string]: unknown }>;
  projects?: Array<{ project_id: string; [key: string]: unknown }>;
  suppliers?: Array<{ supplier_id: string; [key: string]: unknown }>;
  items?: Array<{ item_id: string; [key: string]: unknown }>;
  [key: string]: Array<Record<string, unknown>> | undefined;
}

// KPI Card Component
const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  prefix = "",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-300 group ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
          {title}
        </p>
        <h3 className="text-xl font-bold text-slate-800">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div
        className={`p-2 rounded-lg ${color} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
);

// Chart Card Wrapper Component
const ChartCard: React.FC<ChartCardProps> = ({
  title,
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
  >
    <div className="px-5 py-4 border-b border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// Format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Get action color
const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    LOGIN: "bg-violet-100 text-violet-700",
    LOGOUT: "bg-slate-100 text-slate-700",
  };
  return colors[action] || "bg-slate-100 text-slate-700";
};

// Calculate days left from end date
const getDaysLeft = (endDate: string | undefined): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  // Check if date is invalid
  if (isNaN(end.getTime())) return null;

  const now = new Date();
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get days left badge color and text
const getDaysLeftBadge = (
  daysLeft: number | null | undefined
): { color: string; text: string } => {
  if (daysLeft === null || daysLeft === undefined) {
    return { color: "bg-slate-100 text-slate-600", text: "No due date" };
  }
  if (daysLeft < 0) {
    return {
      color: "bg-red-100 text-red-700",
      text: `${Math.abs(daysLeft)}d overdue`,
    };
  }
  if (daysLeft === 0) {
    return { color: "bg-red-100 text-red-700", text: "Due today" };
  }
  if (daysLeft <= 3) {
    return { color: "bg-amber-100 text-amber-700", text: `${daysLeft}d left` };
  }
  if (daysLeft <= 7) {
    return {
      color: "bg-yellow-100 text-yellow-700",
      text: `${daysLeft}d left`,
    };
  }
  return {
    color: "bg-emerald-100 text-emerald-700",
    text: `${daysLeft}d left`,
  };
};

// Get status color
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-slate-100 text-slate-600",
    NOT_STARTED: "bg-slate-100 text-slate-600",
  };
  return colors[status] || "bg-slate-100 text-slate-600";
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [logsData, setLogsData] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [dashboardYearFilter, setDashboardYearFilter] = useState("all");
  const [dashboardYearDropdownOpen, setDashboardYearDropdownOpen] =
    useState(false);
  const [dashboardMonthFilter, setDashboardMonthFilter] = useState("all");
  const [dashboardMonthDropdownOpen, setDashboardMonthDropdownOpen] =
    useState(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeData] = useState<EmployeeData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare month and year for API request
      const month =
        dashboardMonthFilter === "all" ? "all" : dashboardMonthFilter;
      const year = dashboardYearFilter === "all" ? "all" : dashboardYearFilter;

      const response = await axios.post(
        "/api/dashboard",
        {
          month,
          year,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.status) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("Dashboard API Error:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "An error occurred while fetching dashboard data"
        );
      } else {
        setError("An error occurred while fetching dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }, [dashboardMonthFilter, dashboardYearFilter]);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);

      const response = await axios.get("/api/logs", {
        withCredentials: true,
      });

      if (response.data.status) {
        const sortedLogs = (response.data.data || [])
          .sort(
            (a: Log, b: Log) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10) as Log[];
        setLogsData(sortedLogs);
      }
    } catch (err) {
      console.error("Logs API Error:", err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchStorageUsage = async () => {
    try {
      setStorageLoading(true);
      const response = await fetch("/storage-usage.json");
      if (response.ok) {
        const data = await response.json();
        setStorageUsage(data);
      }
    } catch (err) {
      console.error("Storage Usage Error:", err);
    } finally {
      setStorageLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return "Good Morning!";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon!";
    } else {
      return "Good Evening!";
    }
  };

  // Format date and time with seconds
  const formatDateTime = () => {
    return currentTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchDashboard();
    fetchLogs();
    fetchStorageUsage();
  }, [fetchDashboard, fetchLogs, dashboardYearFilter, dashboardMonthFilter]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch employee data when userData is available (commented out)
  // useEffect(() => {
  //   if (userData?.user?.employee_id) {
  //     fetchEmployeeData();
  //   }
  // }, [userData?.user?.employee_id, fetchEmployeeData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dashboard-year-dropdown-container")) {
        setDashboardYearDropdownOpen(false);
      }
      if (!target.closest(".dashboard-month-dropdown-container")) {
        setDashboardMonthDropdownOpen(false);
      }
      if (!target.closest(".global-search-container")) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset month filter when year changes to "all"
  useEffect(() => {
    if (dashboardYearFilter === "all") {
      setDashboardMonthFilter("all");
    }
  }, [dashboardYearFilter]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch search results when debounced term changes
  useEffect(() => {
    const runSearch = async () => {
      if (!debouncedSearch) {
        setSearchResults(null);
        return;
      }
      try {
        setSearchLoading(true);
        const response = await axios.post(
          "/api/search",
          { search: debouncedSearch },
          {
            withCredentials: true,
          }
        );
        if (response.data?.status) {
          setSearchResults(response.data.data);
          setShowSearchDropdown(true);
        } else {
          setSearchResults(null);
          setShowSearchDropdown(false);
        }
      } catch (err) {
        console.error("Search API Error:", err);
        setSearchResults(null);
        setShowSearchDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    };
    runSearch();
  }, [debouncedSearch]);

  const renderSearchSection = () => {
    const handleSelectResult = (key: string, item: Record<string, unknown>) => {
      let path = null;
      switch (key) {
        case "clients":
          path = item.client_id ? `/admin/clients/${item.client_id}` : null;
          break;
        case "employees":
          path = item.employee_id
            ? `/admin/employees/${item.employee_id}`
            : null;
          break;
        case "projects":
          path = item.project_id ? `/admin/projects/${item.project_id}` : null;
          break;
        case "suppliers":
          path = item.supplier_id
            ? `/admin/suppliers/${item.supplier_id}`
            : null;
          break;
        case "items":
          path = item.item_id ? `/admin/inventory/${item.item_id}` : null;
          break;
        default:
          break;
      }
      if (path) {
        setShowSearchDropdown(false);
        router.push(path);
      }
    };

    const groups = [
      {
        key: "clients",
        label: "Clients",
        fields: ["client_name", "client_type"],
      },
      {
        key: "employees",
        label: "Employees",
        fields: ["first_name", "last_name", "role"],
      },
      { key: "projects", label: "Projects", fields: ["project_name"] },
      { key: "suppliers", label: "Suppliers", fields: ["supplier_name"] },
      {
        key: "items",
        label: "Items",
        fields: ["category", "name", "brand", "color", "type", "sub_category"],
      },
    ];

    const hasResults =
      searchResults &&
      groups.some((g) => {
        const results = searchResults[g.key];
        return Array.isArray(results) && results.length > 0;
      });

    return (
      <div className="relative min-w-md global-search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients, employees, projects..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
          onFocus={() => searchResults && setShowSearchDropdown(true)}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-slate-300 border-t-secondary rounded-full animate-spin"></div>
          </div>
        )}
        {showSearchDropdown && hasResults && (
          <div className="absolute z-20 mt-1 w-full max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
            {groups.map(({ key, label, fields }) => {
              const list =
                (searchResults?.[key] as Array<Record<string, unknown>>) || [];
              if (!list.length) return null;
              return (
                <div
                  key={key}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500 font-semibold bg-slate-50">
                    {label}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {list.map((item: Record<string, unknown>, idx: number) => {
                      const itemKey = (item.id ||
                        item[`${key}_id`] ||
                        `item-${idx}`) as string;
                      return (
                        <li key={itemKey}>
                          <button
                            type="button"
                            onClick={() => handleSelectResult(key, item)}
                            className="cursor-pointer w-full text-left px-3 py-2 hover:bg-slate-50"
                          >
                            <div className="text-sm text-slate-800 font-medium truncate">
                              {fields
                                .map((f) => item[f])
                                .filter(Boolean)
                                .join(" • ") || "No label"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {key === "items"
                                ? [
                                    item.brand,
                                    item.color,
                                    item.type,
                                    item.sub_category,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")
                                : key === "projects" &&
                                  typeof item.number_of_lots === "number"
                                ? `${item.number_of_lots} lots`
                                : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {showSearchDropdown &&
          !hasResults &&
          debouncedSearch &&
          !searchLoading && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-3 text-sm text-slate-500">
              No results
            </div>
          )}
      </div>
    );
  };

  // Get all available years from dashboard data (from multiple sources)
  const getAllDashboardYears = (): string[] => {
    const years = new Set<string>();

    // Get years from totalSpent
    if (dashboardData?.totalSpent) {
      dashboardData.totalSpent.forEach((item: { month_year: string }) => {
        const year = item.month_year.split("-")[0];
        years.add(year);
      });
    }

    // Get years from stages due dates
    if (dashboardData?.topstagesDue) {
      dashboardData.topstagesDue.forEach((stage: Stage) => {
        if (stage.endDate) {
          const date = new Date(stage.endDate);
          if (!isNaN(date.getTime())) {
            years.add(date.getFullYear().toString());
          }
        }
      });
    }

    return Array.from(years).sort(
      (a: string, b: string) => Number(b) - Number(a)
    );
  };

  // Format month number to month name
  const formatMonthName = (monthNumber: string | number): string => {
    const num =
      typeof monthNumber === "string" ? parseInt(monthNumber) : monthNumber;
    const date = new Date(2000, num - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long" });
  };

  // Get available months for selected year
  const getAvailableMonthsForYear = () => {
    if (dashboardYearFilter === "all") {
      return [];
    }

    // Return all 12 months regardless of available data
    // This ensures the dropdown always shows all months when a year is selected
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  // Format storage size
  const formatStorageSize = (sizeMB: number): string => {
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(2)} KB`;
    }
    if (sizeMB < 1024) {
      return `${sizeMB.toFixed(2)} MB`;
    }
    return `${(sizeMB / 1024).toFixed(2)} GB`;
  };

  // Format timestamp in Adelaide timezone
  const formatTimestampAdelaide = (timestamp: string | undefined): string => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-AU", {
      timeZone: "Australia/Adelaide",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Transform lotsByStage for Chart.js doughnut chart (commented out until chart.js is available)
  const getLotsByStageChartData = () => {
    if (!dashboardData?.lotsByStage || dashboardData.lotsByStage.length === 0)
      return null;

    return {
      labels: dashboardData.lotsByStage.map(
        (item: { name: string; _count: number }) =>
          item.name.charAt(0).toUpperCase() + item.name.slice(1)
      ),
      datasets: [
        {
          data: dashboardData.lotsByStage.map(
            (item: { name: string; _count: number }) => item._count
          ),
          backgroundColor: CHART_COLORS.slice(
            0,
            dashboardData.lotsByStage.length
          ),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  // Transform MTOsByStatus for Chart.js doughnut chart
  const getMTOsByStatusChartData = () => {
    if (!dashboardData?.MTOsByStatus || dashboardData.MTOsByStatus.length === 0)
      return null;

    return {
      labels: dashboardData.MTOsByStatus.map(
        (item: { status: string; _count: number }) =>
          item.status.replace(/_/g, " ")
      ),
      datasets: [
        {
          data: dashboardData.MTOsByStatus.map(
            (item: { status: string; _count: number }) => item._count
          ),
          backgroundColor: CHART_COLORS.slice(
            0,
            dashboardData.MTOsByStatus.length
          ),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  // Transform purchaseOrdersByStatus for Chart.js doughnut chart
  const getPOsByStatusChartData = () => {
    if (
      !dashboardData?.purchaseOrdersByStatus ||
      dashboardData.purchaseOrdersByStatus.length === 0
    )
      return null;

    return {
      labels: dashboardData.purchaseOrdersByStatus.map(
        (item: { status: string; _count: number }) =>
          item.status.replace(/_/g, " ")
      ),
      datasets: [
        {
          data: dashboardData.purchaseOrdersByStatus.map(
            (item: { status: string; _count: number }) => item._count
          ),
          backgroundColor: CHART_COLORS.slice(
            0,
            dashboardData.purchaseOrdersByStatus.length
          ),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  // Get filtered and sorted stages due (by least days left first)
  const getSortedStagesDue = (): Stage[] => {
    if (!dashboardData?.topstagesDue) return [];

    // First, filter out stages without endDate
    let filtered = dashboardData.topstagesDue.filter((stage: Stage) => {
      if (!stage.endDate) return false;
      const date = new Date(stage.endDate);
      return !isNaN(date.getTime());
    });

    // Filter by year
    if (dashboardYearFilter !== "all") {
      filtered = filtered.filter((stage: Stage) => {
        const date = new Date(stage.endDate!);
        return date.getFullYear().toString() === dashboardYearFilter;
      });
    }

    // Filter by month
    if (dashboardMonthFilter !== "all" && dashboardYearFilter !== "all") {
      filtered = filtered.filter((stage: Stage) => {
        const date = new Date(stage.endDate!);
        return date.getMonth() + 1 === parseInt(dashboardMonthFilter);
      });
    }

    return filtered.sort((a: Stage, b: Stage) => {
      const daysLeftA = getDaysLeft(a.endDate);
      const daysLeftB = getDaysLeft(b.endDate);
      if (daysLeftA === null) return 1;
      if (daysLeftB === null) return -1;
      return daysLeftA - daysLeftB;
    });
  };

  const lotsByStageChartData = getLotsByStageChartData();
  const mtosByStatusChartData = getMTOsByStatusChartData();
  const posByStatusChartData = getPOsByStatusChartData();
  const sortedStagesDue = getSortedStagesDue();

  // Chart.js options for doughnut charts
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: { label: string; parsed: number }) => {
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-tertiary">
      <AppHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto h-full">
          <div className="h-full w-full overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                  <p className="text-sm text-slate-600 font-medium">
                    Loading dashboard...
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
                    onClick={() => {
                      fetchDashboard();
                      fetchLogs();
                    }}
                    className="cursor-pointer btn-primary px-4 py-2 text-sm font-medium rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Header with Greeting */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <h1 className="text-5xl font-bold text-slate-800">
                          {getGreeting()}
                        </h1>
                        <h1 className="text-5xl font-bold text-slate-800">
                          {employeeData && (
                            <span className="text-secondary">
                              {employeeData.first_name || ""}
                              {employeeData.last_name &&
                                ` ${employeeData.last_name}`}
                            </span>
                          )}
                        </h1>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      {/* <Calendar className="w-5 h-5" /> */}
                      <p className="text-base font-medium">
                        {formatDateTime()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderSearchSection()}
                    {/* Storage Usage - Compact Display */}
                    {storageLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                        <span>Loading storage...</span>
                      </div>
                    ) : storageUsage ? (
                      <div
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg cursor-help"
                        title={`Last updated: ${formatTimestampAdelaide(
                          storageUsage.timestamp
                        )} (Adelaide time)`}
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-slate-600">
                            DB:{" "}
                            {formatStorageSize(
                              storageUsage.database?.size_mb || 0
                            )}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-slate-600">
                            Files:{" "}
                            {formatStorageSize(
                              storageUsage.uploads?.size_mb || 0
                            )}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <span className="text-xs font-semibold text-slate-700">
                          Total:{" "}
                          {formatStorageSize(
                            (storageUsage.database?.size_mb || 0) +
                              (storageUsage.uploads?.size_mb || 0)
                          )}
                        </span>
                      </div>
                    ) : null}
                    {/* Reset Filters Button - Only show when filters are applied */}
                    {(dashboardYearFilter !== "all" ||
                      dashboardMonthFilter !== "all") && (
                      <button
                        onClick={() => {
                          setDashboardYearFilter("all");
                          setDashboardMonthFilter("all");
                          setDashboardYearDropdownOpen(false);
                          setDashboardMonthDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Reset filters to default"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                    )}
                    {/* Year Filter Dropdown */}
                    <div className="relative dashboard-year-dropdown-container">
                      <button
                        onClick={() =>
                          setDashboardYearDropdownOpen(
                            !dashboardYearDropdownOpen
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {dashboardYearFilter === "all"
                          ? "All Years"
                          : dashboardYearFilter}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {dashboardYearDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setDashboardYearFilter("all");
                              setDashboardYearDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                              dashboardYearFilter === "all"
                                ? "text-secondary font-medium"
                                : "text-slate-600"
                            }`}
                          >
                            All Years
                          </button>
                          {getAllDashboardYears().map((year: string) => (
                            <button
                              key={year}
                              onClick={() => {
                                setDashboardYearFilter(year);
                                setDashboardYearDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                dashboardYearFilter === year
                                  ? "text-secondary font-medium"
                                  : "text-slate-600"
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Month Filter Dropdown */}
                    <div className="relative dashboard-month-dropdown-container">
                      <button
                        onClick={() => {
                          if (dashboardYearFilter !== "all") {
                            setDashboardMonthDropdownOpen(
                              !dashboardMonthDropdownOpen
                            );
                          }
                        }}
                        disabled={dashboardYearFilter === "all"}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          dashboardYearFilter === "all"
                            ? "text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                            : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        {dashboardMonthFilter === "all"
                          ? "All Months"
                          : formatMonthName(dashboardMonthFilter)}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {dashboardMonthDropdownOpen &&
                        dashboardYearFilter !== "all" && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setDashboardMonthFilter("all");
                                setDashboardMonthDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                dashboardMonthFilter === "all"
                                  ? "text-secondary font-medium"
                                  : "text-slate-600"
                              }`}
                            >
                              All Months
                            </button>
                            {getAvailableMonthsForYear().map((month) => (
                              <button
                                key={month}
                                onClick={() => {
                                  setDashboardMonthFilter(month.toString());
                                  setDashboardMonthDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                  dashboardMonthFilter === month.toString()
                                    ? "text-secondary font-medium"
                                    : "text-slate-600"
                                }`}
                              >
                                {formatMonthName(month)}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <button
                      onClick={() => {
                        fetchDashboard();
                        fetchLogs();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <KPICard
                    title="Active Projects"
                    value={dashboardData?.activeProjects || 0}
                    icon={FolderKanban}
                    color="bg-linear-to-br from-blue-500 to-blue-600"
                    subtitle="Currently in progress"
                    onClick={() => router.push("/admin/projects")}
                  />
                  <KPICard
                    title="Active Lots"
                    value={dashboardData?.activeLots || 0}
                    icon={Layers}
                    color="bg-linear-to-br from-emerald-500 to-emerald-600"
                    subtitle="Across all projects"
                    onClick={undefined}
                  />
                  <KPICard
                    title="Active MTOs"
                    value={dashboardData?.activeMTOs || 0}
                    icon={ClipboardList}
                    color="bg-linear-to-br from-violet-500 to-violet-600"
                    subtitle="Materials to order"
                    onClick={() =>
                      router.push("/admin/suppliers/materialstoorder")
                    }
                  />
                  <KPICard
                    title="Purchase Orders"
                    value={dashboardData?.activePurchaseOrders || 0}
                    icon={ShoppingCart}
                    color="bg-linear-to-br from-amber-500 to-amber-600"
                    subtitle="Active orders"
                    onClick={() =>
                      router.push("/admin/suppliers/purchaseorder")
                    }
                  />
                  <KPICard
                    title="Projects Completed"
                    value={dashboardData?.projectsCompletedThisMonth || 0}
                    icon={Target}
                    color="bg-linear-to-br from-green-500 to-green-600"
                    subtitle="This month"
                    onClick={undefined}
                  />
                  <KPICard
                    title="Avg Project Duration"
                    value={
                      dashboardData &&
                      dashboardData.averageProjectDuration &&
                      dashboardData.averageProjectDuration > 0
                        ? dashboardData.averageProjectDuration
                        : 0
                    }
                    icon={Clock}
                    color="bg-linear-to-br from-rose-500 to-rose-600"
                    subtitle={
                      dashboardData &&
                      dashboardData.averageProjectDuration &&
                      dashboardData.averageProjectDuration > 0
                        ? `${dashboardData.averageProjectDuration} days`
                        : "No completed projects"
                    }
                    onClick={undefined}
                  />
                </div>

                {/* Stages Due */}
                <ChartCard title="Upcoming Stage Deadlines">
                  {sortedStagesDue.length > 0 ? (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Stage
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Project / Lot
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Due Date
                            </th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Time Left
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedStagesDue.map((stage: Stage) => {
                            const daysLeft = getDaysLeft(stage.endDate);
                            const badge = getDaysLeftBadge(daysLeft);
                            return (
                              <tr
                                key={stage.stage_id}
                                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="py-3 px-3">
                                  <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700 capitalize">
                                      {stage.name}
                                    </span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-sm text-slate-600">
                                  {stage.lot?.project?.name ? (
                                    <span>
                                      <span className="font-medium">
                                        {stage.lot.project.name}
                                      </span>
                                      <span className="text-slate-400 mx-1">
                                        /
                                      </span>
                                      <span>{stage.lot_id}</span>
                                    </span>
                                  ) : (
                                    stage.lot_id
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase ${getStatusColor(
                                      stage.status
                                    )}`}
                                  >
                                    {stage.status?.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-sm text-slate-600">
                                  {stage.endDate &&
                                  new Date(stage.endDate).getFullYear() > 2000
                                    ? new Date(
                                        stage.endDate
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "-"}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {badge.text}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      No upcoming stage deadlines
                    </div>
                  )}
                </ChartCard>

                {/* Status Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Lots by Stage */}
                  <ChartCard title="Lots by Stage">
                    {lotsByStageChartData ? (
                      <div style={{ height: "250px" }}>
                        <Doughnut
                          data={lotsByStageChartData}
                          options={doughnutChartOptions}
                        />
                      </div>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                        No lot data available
                      </div>
                    )}
                  </ChartCard>

                  {/* MTOs by Status */}
                  <ChartCard title="Material to Order by Status">
                    {mtosByStatusChartData ? (
                      <div style={{ height: "250px" }}>
                        <Doughnut
                          data={mtosByStatusChartData}
                          options={doughnutChartOptions}
                        />
                      </div>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                        No MTO data available
                      </div>
                    )}
                  </ChartCard>

                  {/* Purchase Orders by Status */}
                  <ChartCard title="Purchase Orders by Status">
                    {posByStatusChartData ? (
                      <div style={{ height: "250px" }}>
                        <Doughnut
                          data={posByStatusChartData}
                          options={doughnutChartOptions}
                        />
                      </div>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                        No purchase order data available
                      </div>
                    )}
                  </ChartCard>
                </div>

                {/* Top Items and Logs - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Top 10 Items */}
                  <ChartCard title="Top 10 Items">
                    {dashboardData &&
                    dashboardData.top10items &&
                    dashboardData.top10items.length > 0 ? (
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-slate-100">
                              <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                                #
                              </th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Category
                              </th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Details
                              </th>
                              <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Qty
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData &&
                              dashboardData.top10items &&
                              dashboardData.top10items.map(
                                (item: Item, index: number) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-2 text-center">
                                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-linear-to-br from-slate-600 to-slate-700 rounded-full">
                                        {index + 1}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="inline-flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-700">
                                          {item.category}
                                        </span>
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-xs text-slate-600">
                                      {item.sheet && (
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">
                                          {item.sheet.brand} -{" "}
                                          {item.sheet.color}
                                        </span>
                                      )}
                                      {item.handle && (
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">
                                          {item.handle.brand} -{" "}
                                          {item.handle.color}
                                        </span>
                                      )}
                                      {item.hardware && (
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">
                                          {item.hardware.brand} -{" "}
                                          {item.hardware.name}
                                        </span>
                                      )}
                                      {item.accessory && (
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">
                                          {item.accessory.name}
                                        </span>
                                      )}
                                      {item.edging_tape && (
                                        <span className="bg-slate-100 px-2 py-1 rounded-full">
                                          {item.edging_tape.brand} -{" "}
                                          {item.edging_tape.color}
                                        </span>
                                      )}
                                      {!item.sheet &&
                                        !item.handle &&
                                        !item.hardware &&
                                        !item.accessory &&
                                        !item.edging_tape &&
                                        (item.description || "-")}
                                    </td>
                                    <td className="py-3 px-3 text-xs text-slate-700 text-right font-medium">
                                      {item.quantity}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No items data available
                      </div>
                    )}
                  </ChartCard>

                  {/* Recent Logs */}
                  <ChartCard title="Recent Activity">
                    {logsLoading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                      </div>
                    ) : logsData.length > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto space-y-3">
                        {logsData.map((log: Log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                          >
                            <div className="p-2 bg-slate-100 rounded-full">
                              <History className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${getActionColor(
                                    log.action
                                  )}`}
                                >
                                  {log.action}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatTimeAgo(log.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 truncate">
                                {log.description ||
                                  `${log.action} on ${log.entity_type}`}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400">
                                  {log.user?.username || "System"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-slate-400 text-sm">
                        No recent activity
                      </div>
                    )}
                  </ChartCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
