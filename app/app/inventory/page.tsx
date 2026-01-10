"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "@/components/sidebar";
import PaginationFooter from "@/components/PaginationFooter";
import axios from "axios";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useExcelExport } from "@/hooks/useExcelExport";
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
  ImageIcon,
  X,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import StockTally from "@/components/StockTally";
import MultiSelectDropdown from "./components/MultiSelectDropdown";
import AppHeader from "@/components/AppHeader";

// Type definitions
interface Sheet {
  brand?: string;
  color?: string;
  finish?: string;
  dimensions?: string;
  face?: string;
  is_sunmica?: boolean;
  description?: string;
}

interface Handle {
  brand?: string;
  color?: string;
  type?: string;
  material?: string;
  dimensions?: string;
}

interface Hardware {
  brand?: string;
  name?: string;
  type?: string;
  sub_category?: string;
  dimensions?: string;
}

interface Accessory {
  name?: string;
}

interface EdgingTape {
  brand?: string;
  color?: string;
  finish?: string;
  dimensions?: string;
  description?: string;
}

interface Item {
  id: string;
  category: string;
  quantity: number;
  description?: string;
  supplier_reference?: string;
  price?: number;
  measurement_unit?: string;
  image?: {
    url: string;
    filename?: string;
  };
  sheet?: Sheet;
  handle?: Handle;
  hardware?: Hardware;
  accessory?: Accessory;
  edging_tape?: EdgingTape;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface Tab {
  id: string;
  label: string;
}

interface Filters {
  quantity_min: string;
  quantity_max: string;
  sheet_brand: string[];
  sheet_color: string[];
  sheet_finish: string[];
  sheet_face: string[];
  handle_brand: string[];
  handle_color: string[];
  handle_type: string[];
  handle_material: string[];
  hardware_brand: string[];
  hardware_name: string[];
  hardware_type: string[];
  hardware_sub_category: string[];
  accessory_name: string[];
  edging_tape_brand: string[];
  edging_tape_color: string[];
  edging_tape_finish: string[];
  edging_tape_dimensions: string[];
}

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("sheet");
  const tabs: Tab[] = [
    { id: "sheet", label: "Sheet" },
    { id: "sunmica", label: "Sunmica" },
    { id: "edging_tape", label: "Edging Tape" },
    { id: "handle", label: "Handle" },
    { id: "hardware", label: "Hardware" },
    { id: "accessory", label: "Accessory" },
  ];
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("brand");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "relevance">(
    "asc"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Stock Tally states
  const [showStockTallyModal, setShowStockTallyModal] = useState(false);

  // Define available columns for export based on active tab
  const getAvailableColumns = () => {
    if (activeTab === "sheet" || activeTab === "sunmica") {
      return [
        "Brand",
        "Color",
        "Finish",
        "Dimensions",
        "Quantity",
        "Description",
        "Category",
        "Price (including GST)",
        "Face",
        "IsSunmica",
        "CreatedAt",
        "UpdatedAt",
      ];
    } else if (activeTab === "handle") {
      return [
        "Brand",
        "Color",
        "Type",
        "Material",
        "Dimensions",
        "Quantity",
        "Description",
        "Category",
        "Price (including GST)",
        "CreatedAt",
        "UpdatedAt",
      ];
    } else if (activeTab === "hardware") {
      return [
        "Quantity",
        "Description",
        "Category",
        "Price (including GST)",
        "Name",
        "Type",
        "Dimensions",
        "CreatedAt",
        "UpdatedAt",
      ];
    } else if (activeTab === "accessory") {
      return [
        "Quantity",
        "Description",
        "Category",
        "Price (including GST)",
        "Name",
        "CreatedAt",
        "UpdatedAt",
      ];
    } else if (activeTab === "edging_tape") {
      return [
        "Quantity",
        "Description",
        "Category",
        "Price (including GST)",
        "Brand",
        "Color",
        "Finish",
        "Dimensions",
        "CreatedAt",
        "UpdatedAt",
      ];
    }
    return [];
  };

  const availableColumns = getAvailableColumns();

  // Initialize selected columns with all columns
  const [selectedColumns, setSelectedColumns] = useState(() => [
    ...getAvailableColumns(),
  ]);

  // Update selected columns when active tab changes
  useEffect(() => {
    const newColumns = getAvailableColumns();
    setSelectedColumns([...newColumns]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Filter states - now supporting multiple selections
  const [filters, setFilters] = useState<Filters>({
    // Common filters
    quantity_min: "",
    quantity_max: "",
    // Sheet filters
    sheet_brand: [],
    sheet_color: [],
    sheet_finish: [],
    sheet_face: [],
    // Handle filters
    handle_brand: [],
    handle_color: [],
    handle_type: [],
    handle_material: [],
    // Hardware filters
    hardware_brand: [],
    hardware_name: [],
    hardware_type: [],
    hardware_sub_category: [],
    // Accessory filters
    accessory_name: [],
    // Edging Tape filters
    edging_tape_brand: [],
    edging_tape_color: [],
    edging_tape_finish: [],
    edging_tape_dimensions: [],
  });

  // Utility functions to extract distinct values for dropdowns
  const getDistinctValues = (field: string, data: Item[]): string[] => {
    const values = new Set<string>();
    data.forEach((item: Item) => {
      let value: string | undefined = undefined;
      if (field.startsWith("sheet_")) {
        const sheetField = field.replace("sheet_", "") as keyof Sheet;
        value = item.sheet?.[sheetField] as string | undefined;
      } else if (field.startsWith("handle_")) {
        const handleField = field.replace("handle_", "") as keyof Handle;
        value = item.handle?.[handleField] as string | undefined;
      } else if (field.startsWith("hardware_")) {
        const hardwareField = field.replace("hardware_", "") as keyof Hardware;
        value = item.hardware?.[hardwareField] as string | undefined;
      } else if (field.startsWith("accessory_")) {
        const accessoryField = field.replace(
          "accessory_",
          ""
        ) as keyof Accessory;
        value = item.accessory?.[accessoryField] as string | undefined;
      } else if (field.startsWith("edging_tape_")) {
        const edging_tapeField = field.replace(
          "edging_tape_",
          ""
        ) as keyof EdgingTape;
        value = item.edging_tape?.[edging_tapeField] as string | undefined;
      }

      if (value && typeof value === "string" && value.trim() !== "") {
        values.add(value.trim());
      }
    });
    return Array.from(values).sort();
  };

  const fetchData = useCallback(async (category: string) => {
    if (!category) {
      toast.error("Category is required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // For sunmica, fetch sheet items and filter client-side
      const apiCategory = category === "sunmica" ? "sheet" : category;

      const response = await axios.get(`/api/item/all/${apiCategory}`, {
        withCredentials: true,
      });

      if (response.data.status) {
        let items = response.data.data as Item[];
        // Filter items based on category
        if (category === "sunmica") {
          // Sunmica tab: show ONLY sunmica items
          items = items.filter((item: Item) => item.sheet?.is_sunmica === true);
        } else if (category === "sheet") {
          // Sheet tab: show ONLY non-sunmica items (exclude sunmica)
          items = items.filter((item: Item) => item.sheet?.is_sunmica !== true);
        }
        setData(items);
      } else {
        setError(response.data.message || "Failed to fetch items");
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to fetch items");
      } else {
        setError("Failed to fetch items");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowSortDropdown(false);
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when clicking outside the filter popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterPopup && !target.closest(".filter-popup")) {
        setShowFilterPopup(false);
      }
    };

    if (showFilterPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showFilterPopup]);

  useEffect(() => {
    fetchData(activeTab);
    setSelectedCategories([activeTab]); // Initialize with current active tab
    // Set default sort field based on active tab
    if (activeTab === "accessory") {
      setSortField("name");
    } else {
      setSortField("brand");
    }
  }, [activeTab, fetchData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item: Item) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (item.description || "").toLowerCase().includes(searchLower) ||
          (item.supplier_reference || "").toLowerCase().includes(searchLower) ||
          (item.sheet?.brand || "").toLowerCase().includes(searchLower) ||
          (item.sheet?.color || "").toLowerCase().includes(searchLower) ||
          (item.sheet?.description || "").toLowerCase().includes(searchLower) ||
          (item.handle?.brand || "").toLowerCase().includes(searchLower) ||
          (item.handle?.color || "").toLowerCase().includes(searchLower) ||
          (item.edging_tape?.brand || "").toLowerCase().includes(searchLower) ||
          (item.edging_tape?.color || "").toLowerCase().includes(searchLower) ||
          (item.edging_tape?.description || "")
            .toLowerCase()
            .includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Quantity range filter
      if (
        filters.quantity_min !== "" &&
        item.quantity < Number(filters.quantity_min)
      ) {
        return false;
      }
      if (
        filters.quantity_max !== "" &&
        item.quantity > Number(filters.quantity_max)
      ) {
        return false;
      }

      // Sheet specific filters
      if (activeTab === "sheet" || activeTab === "sunmica") {
        if (
          filters.sheet_brand.length > 0 &&
          !filters.sheet_brand.some((brand) =>
            item.sheet?.brand?.toLowerCase().includes(brand.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.sheet_color.length > 0 &&
          !filters.sheet_color.some((color) =>
            item.sheet?.color?.toLowerCase().includes(color.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.sheet_finish.length > 0 &&
          !filters.sheet_finish.some((finish) =>
            item.sheet?.finish?.toLowerCase().includes(finish.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.sheet_face.length > 0 &&
          !filters.sheet_face.some((face) =>
            item.sheet?.face?.toLowerCase().includes(face.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Handle specific filters
      if (activeTab === "handle") {
        if (
          filters.handle_brand.length > 0 &&
          !filters.handle_brand.some((brand) =>
            item.handle?.brand?.toLowerCase().includes(brand.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.handle_color.length > 0 &&
          !filters.handle_color.some((color) =>
            item.handle?.color?.toLowerCase().includes(color.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.handle_type.length > 0 &&
          !filters.handle_type.some((type) =>
            item.handle?.type?.toLowerCase().includes(type.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.handle_material.length > 0 &&
          !filters.handle_material.some((material) =>
            item.handle?.material
              ?.toLowerCase()
              .includes(material.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Hardware specific filters
      if (activeTab === "hardware") {
        if (
          filters.hardware_brand.length > 0 &&
          !filters.hardware_brand.some((brand) =>
            item.hardware?.brand?.toLowerCase().includes(brand.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.hardware_name.length > 0 &&
          !filters.hardware_name.some((name) =>
            item.hardware?.name?.toLowerCase().includes(name.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.hardware_type.length > 0 &&
          !filters.hardware_type.some((type) =>
            item.hardware?.type?.toLowerCase().includes(type.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.hardware_sub_category.length > 0 &&
          !filters.hardware_sub_category.some((subCategory) =>
            item.hardware?.sub_category
              ?.toLowerCase()
              .includes(subCategory.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Accessory specific filters
      if (activeTab === "accessory") {
        if (
          filters.accessory_name.length > 0 &&
          !filters.accessory_name.some((name) =>
            item.accessory?.name?.toLowerCase().includes(name.toLowerCase())
          )
        ) {
          return false;
        }
      }
      // Edging Tape specific filters
      if (activeTab === "edging_tape") {
        if (
          filters.edging_tape_brand.length > 0 &&
          !filters.edging_tape_brand.some((brand) =>
            item.edging_tape?.brand?.toLowerCase().includes(brand.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.edging_tape_color.length > 0 &&
          !filters.edging_tape_color.some((color) =>
            item.edging_tape?.color?.toLowerCase().includes(color.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.edging_tape_finish.length > 0 &&
          !filters.edging_tape_finish.some((finish) =>
            item.edging_tape?.finish
              ?.toLowerCase()
              .includes(finish.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          filters.edging_tape_dimensions.length > 0 &&
          !filters.edging_tape_dimensions.some((dimensions) =>
            item.edging_tape?.dimensions
              ?.toLowerCase()
              .includes(dimensions.toLowerCase())
          )
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort data
    filtered.sort((a: Item, b: Item) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      // Handle nested object sorting
      if (sortField === "brand") {
        aValue =
          a.sheet?.brand ||
          a.handle?.brand ||
          a.hardware?.brand ||
          a.edging_tape?.brand ||
          "";
        bValue =
          b.sheet?.brand ||
          b.handle?.brand ||
          b.hardware?.brand ||
          b.edging_tape?.brand ||
          "";
      } else if (sortField === "color") {
        aValue =
          a.sheet?.color || a.handle?.color || a.edging_tape?.color || "";
        bValue =
          b.sheet?.color || b.handle?.color || b.edging_tape?.color || "";
      } else if (sortField === "finish") {
        aValue = a.sheet?.finish || a.edging_tape?.finish || "";
        bValue = b.sheet?.finish || b.edging_tape?.finish || "";
      } else if (sortField === "type") {
        aValue = a.handle?.type || a.hardware?.type || "";
        bValue = b.handle?.type || b.hardware?.type || "";
      } else if (sortField === "material") {
        aValue = a.handle?.material || "";
        bValue = b.handle?.material || "";
      } else if (sortField === "name") {
        aValue = a.hardware?.name || a.accessory?.name || "";
        bValue = b.hardware?.name || b.accessory?.name || "";
      } else if (sortField === "sub_category") {
        aValue = a.hardware?.sub_category || "";
        bValue = b.hardware?.sub_category || "";
      } else if (sortField === "dimensions") {
        aValue =
          a.sheet?.dimensions ||
          a.handle?.dimensions ||
          a.hardware?.dimensions ||
          a.edging_tape?.dimensions ||
          "";
        bValue =
          b.sheet?.dimensions ||
          b.handle?.dimensions ||
          b.hardware?.dimensions ||
          b.edging_tape?.dimensions ||
          "";
      } else if (sortField === "quantity") {
        aValue = a.quantity || 0;
        bValue = b.quantity || 0;
      } else {
        aValue = (a[sortField as keyof Item] as string | number) || "";
        bValue = (b[sortField as keyof Item] as string | number) || "";
      }

      // Handle relevance sorting (by search match)
      if (sortOrder === "relevance" && search) {
        const searchLower = search.toLowerCase();
        const aMatch = String(aValue).toLowerCase().includes(searchLower);
        const bMatch = String(bValue).toLowerCase().includes(searchLower);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      // Handle numeric sorting for quantity
      if (sortField === "quantity") {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (sortOrder === "asc") {
          return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
        } else if (sortOrder === "desc") {
          return aNum > bNum ? -1 : aNum < bNum ? 1 : 0;
        }
        return 0;
      }

      // Convert to string for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortOrder === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else if (sortOrder === "desc") {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
      return 0;
    });

    return filtered;
  }, [data, search, sortField, sortOrder, activeTab, filters]);

  // Pagination logic
  const totalItems = filteredAndSortedData.length;
  const startIndex = itemsPerPage === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 0 ? totalItems : startIndex + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Reset to first page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> relevance -> asc
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder("relevance");
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setShowSortDropdown(false);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check if any filters are active (not in default state)
  const isAnyFilterActive = () => {
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      if (key === "quantity_min" || key === "quantity_max") {
        return value !== "";
      }
      return Array.isArray(value) ? value.length > 0 : value !== "";
    });
    const defaultSortField = activeTab === "accessory" ? "name" : "brand";
    return (
      search !== "" || // Search is not empty
      selectedCategories.length !== 1 || // Category filter is not showing current tab only
      sortField !== defaultSortField || // Sort field is not default
      sortOrder !== "asc" || // Sort order is not default
      hasActiveFilters // Any filter is active
    );
  };

  const handleReset = () => {
    setSearch("");
    // Set default sort field based on active tab
    const defaultSortField = activeTab === "accessory" ? "name" : "brand";
    setSortField(defaultSortField);
    setSortOrder("asc");
    setSelectedCategories([activeTab]); // Reset to current active tab
    setCurrentPage(1);
    // Reset all filters
    setFilters({
      quantity_min: "",
      quantity_max: "",
      sheet_brand: [],
      sheet_color: [],
      sheet_finish: [],
      sheet_face: [],
      handle_brand: [],
      handle_color: [],
      handle_type: [],
      handle_material: [],
      hardware_brand: [],
      hardware_name: [],
      hardware_type: [],
      hardware_sub_category: [],
      accessory_name: [],
      edging_tape_brand: [],
      edging_tape_color: [],
      edging_tape_finish: [],
      edging_tape_dimensions: [],
    });
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

  const handleFilterChange = (
    field: keyof Filters,
    value: string | string[]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      quantity_min: "",
      quantity_max: "",
      sheet_brand: [],
      sheet_color: [],
      sheet_finish: [],
      sheet_face: [],
      handle_brand: [],
      handle_color: [],
      handle_type: [],
      handle_material: [],
      hardware_brand: [],
      hardware_name: [],
      hardware_type: [],
      hardware_sub_category: [],
      accessory_name: [],
      edging_tape_brand: [],
      edging_tape_color: [],
      edging_tape_finish: [],
      edging_tape_dimensions: [],
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "quantity_min" || key === "quantity_max") {
        return count + (value !== "" ? 1 : 0);
      }
      return (
        count + (Array.isArray(value) ? value.length : value !== "" ? 1 : 0)
      );
    }, 0);
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

  // Column mapping for Excel export - dynamic based on activeTab
  const columnMap = useMemo(() => {
    const baseMap: Record<string, (item: Item) => string | number> = {
      Quantity: (item: Item) => item.quantity || 0,
      Description: (item: Item) => item.description || "",
      Category: (item: Item) => item.category || "",
      "Price (including GST)": (item: Item) => item.price || 0,
      CreatedAt: (item: Item) =>
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
      UpdatedAt: (item: Item) =>
        item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "",
    };

    if (activeTab === "sheet" || activeTab === "sunmica") {
      return {
        ...baseMap,
        Brand: (item: Item) => item.sheet?.brand || "",
        Color: (item: Item) => item.sheet?.color || "",
        Finish: (item: Item) => item.sheet?.finish || "",
        Dimensions: (item: Item) => item.sheet?.dimensions || "",
        Face: (item: Item) => item.sheet?.face || "",
        IsSunmica: (item: Item) => (item.sheet?.is_sunmica ? "Yes" : "No"),
      };
    } else if (activeTab === "handle") {
      return {
        ...baseMap,
        Brand: (item: Item) => item.handle?.brand || "",
        Color: (item: Item) => item.handle?.color || "",
        Type: (item: Item) => item.handle?.type || "",
        Material: (item: Item) => item.handle?.material || "",
        Dimensions: (item: Item) => item.handle?.dimensions || "",
      };
    } else if (activeTab === "hardware") {
      return {
        ...baseMap,
        Name: (item: Item) => item.hardware?.name || "",
        Type: (item: Item) => item.hardware?.type || "",
        Dimensions: (item: Item) => item.hardware?.dimensions || "",
      };
    } else if (activeTab === "accessory") {
      return {
        ...baseMap,
        Name: (item: Item) => item.accessory?.name || "",
      };
    } else if (activeTab === "edging_tape") {
      return {
        ...baseMap,
        Brand: (item: Item) => item.edging_tape?.brand || "",
        Color: (item: Item) => item.edging_tape?.color || "",
        Finish: (item: Item) => item.edging_tape?.finish || "",
        Dimensions: (item: Item) => item.edging_tape?.dimensions || "",
      };
    }
    return baseMap;
  }, [activeTab]);

  // Initialize Excel export hook
  const { exportToExcel, isExporting } = useExcelExport({
    columnMap,
    filenamePrefix: `${activeTab}_inventory_export`,
    sheetName: `${
      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
    } Inventory`,
    selectedColumns:
      selectedColumns.length === availableColumns.length
        ? undefined
        : selectedColumns,
  }) as {
    exportToExcel: (data: Item[]) => Promise<void>;
    isExporting: boolean;
  };

  // Compute dynamic column count for table states
  const columnCount = useMemo(() => {
    // Base: Image, Quantity
    if (activeTab === "sheet" || activeTab === "sunmica") return 1 + 4 + 1; // brand,color,finish,dimensions
    if (activeTab === "handle") return 1 + 5 + 1; // brand,color,type,material,dimensions
    if (activeTab === "hardware") return 1 + 4 + 1; // brand,name,type,dimensions
    if (activeTab === "accessory") return 1 + 1 + 1; // name
    if (activeTab === "edging_tape") return 1 + 4 + 1; // brand,color,finish,dimensions
    return 6;
  }, [activeTab]);

  return (
    <div className="bg-tertiary">
      <AppHeader />
      <div className="flex mt-16 h-[calc(100vh-64px)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                <p className="text-sm text-slate-600 font-medium">
                  Loading inventory details...
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
                    Inventory
                  </h1>
                  <button
                    onClick={() => router.push("/app/inventory/additem")}
                    className="cursor-pointer hover:bg-emerald-600 transition-all duration-200 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                  {/* Tabs Section */}
                  <div className="px-4 shrink-0 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? "border-secondary text-secondary"
                              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Fixed Header Section */}
                  <div className="p-4 shrink-0 border-b border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      {/* search bar */}
                      <div className="flex items-center gap-2 flex-1 max-w-lg relative">
                        <Search className="h-4 w-4 absolute left-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder={`Search ${
                            activeTab === "edging_tape"
                              ? "edging tape"
                              : activeTab
                          } items by description, supplier reference, brand, color`}
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
                                {activeTab !== "accessory" && (
                                  <button
                                    onClick={() => handleSort("brand")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Brand {getSortIcon("brand")}
                                  </button>
                                )}
                                {activeTab !== "accessory" &&
                                  activeTab !== "hardware" && (
                                    <button
                                      onClick={() => handleSort("color")}
                                      className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                    >
                                      Color {getSortIcon("color")}
                                    </button>
                                  )}
                                {activeTab === "accessory" && (
                                  <button
                                    onClick={() => handleSort("name")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Name {getSortIcon("name")}
                                  </button>
                                )}
                                {(activeTab === "sheet" ||
                                  activeTab === "sunmica") && (
                                  <button
                                    onClick={() => handleSort("finish")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Finish {getSortIcon("finish")}
                                  </button>
                                )}
                                {activeTab === "handle" && (
                                  <button
                                    onClick={() => handleSort("type")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Type {getSortIcon("type")}
                                  </button>
                                )}
                                {activeTab === "hardware" && (
                                  <button
                                    onClick={() => handleSort("name")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Name {getSortIcon("name")}
                                  </button>
                                )}
                                {activeTab === "hardware" && (
                                  <button
                                    onClick={() => handleSort("sub_category")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Sub Category {getSortIcon("sub_category")}
                                  </button>
                                )}
                                {activeTab === "handle" && (
                                  <button
                                    onClick={() => handleSort("material")}
                                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                  >
                                    Material {getSortIcon("material")}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSort("quantity")}
                                  className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                >
                                  Quantity {getSortIcon("quantity")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setShowFilterPopup(true)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium relative"
                        >
                          <Funnel className="h-4 w-4" />
                          <span>Filter</span>
                          {getActiveFilterCount() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                              {getActiveFilterCount()}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setShowStockTallyModal(true)}
                          disabled={filteredAndSortedData.length === 0}
                          className={`flex items-center gap-2 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium relative ${
                            filteredAndSortedData.length === 0
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:bg-slate-100"
                          }`}
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>Stock Tally</span>
                        </button>

                        <div className="relative dropdown-container flex items-center">
                          <button
                            onClick={() => exportToExcel(filteredAndSortedData)}
                            disabled={
                              isExporting ||
                              filteredAndSortedData.length === 0 ||
                              selectedColumns.length === 0
                            }
                            className={`flex items-center gap-2 transition-all duration-200 text-slate-700 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg text-sm font-medium ${
                              isExporting ||
                              filteredAndSortedData.length === 0 ||
                              selectedColumns.length === 0
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:bg-slate-100"
                            }`}
                          >
                            <Sheet className="h-4 w-4" />
                            <span>
                              {isExporting ? "Exporting..." : "Export to Excel"}
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              setShowColumnDropdown(!showColumnDropdown)
                            }
                            disabled={
                              isExporting || filteredAndSortedData.length === 0
                            }
                            className={`flex items-center transition-all duration-200 text-slate-700 border border-slate-300 px-2 py-2 rounded-r-lg text-sm font-medium ${
                              isExporting || filteredAndSortedData.length === 0
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
                                      checked={selectedColumns.includes(column)}
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
                            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                              Image
                            </th>
                            {(activeTab === "sheet" ||
                              activeTab === "sunmica" ||
                              activeTab === "handle" ||
                              activeTab === "hardware" ||
                              activeTab === "edging_tape") && (
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("brand")}
                              >
                                <div className="flex items-center gap-2">
                                  Brand
                                  {getSortIcon("brand")}
                                </div>
                              </th>
                            )}
                            {(activeTab === "sheet" ||
                              activeTab === "sunmica" ||
                              activeTab === "handle" ||
                              activeTab === "edging_tape") && (
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("color")}
                              >
                                <div className="flex items-center gap-2">
                                  Color
                                  {getSortIcon("color")}
                                </div>
                              </th>
                            )}
                            {(activeTab === "sheet" ||
                              activeTab === "sunmica" ||
                              activeTab === "edging_tape") && (
                              <>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("finish")}
                                >
                                  <div className="flex items-center gap-2">
                                    Finish
                                    {getSortIcon("finish")}
                                  </div>
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                  Dimensions
                                </th>
                              </>
                            )}
                            {activeTab === "handle" && (
                              <>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("type")}
                                >
                                  <div className="flex items-center gap-2">
                                    Type
                                    {getSortIcon("type")}
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("material")}
                                >
                                  <div className="flex items-center gap-2">
                                    Material
                                    {getSortIcon("material")}
                                  </div>
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                  Dimensions
                                </th>
                              </>
                            )}
                            {activeTab === "hardware" && (
                              <>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("name")}
                                >
                                  <div className="flex items-center gap-2">
                                    Name
                                    {getSortIcon("name")}
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("sub_category")}
                                >
                                  <div className="flex items-center gap-2">
                                    Sub Category
                                    {getSortIcon("sub_category")}
                                  </div>
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                  Dimensions
                                </th>
                              </>
                            )}
                            {activeTab === "accessory" && (
                              <>
                                <th
                                  className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                  onClick={() => handleSort("name")}
                                >
                                  <div className="flex items-center gap-2">
                                    Name
                                    {getSortIcon("name")}
                                  </div>
                                </th>
                              </>
                            )}
                            <th
                              className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                              onClick={() => handleSort("quantity")}
                            >
                              <div className="flex items-center gap-2">
                                Quantity
                                {getSortIcon("quantity")}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {loading ? (
                            <tr>
                              <td
                                className="px-4 py-4 text-sm text-slate-500 text-center"
                                colSpan={columnCount}
                              >
                                Loading {activeTab} items...
                              </td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td
                                className="px-4 py-4 text-sm text-red-600 text-center"
                                colSpan={columnCount}
                              >
                                {error}
                              </td>
                            </tr>
                          ) : paginatedData.length === 0 ? (
                            <tr>
                              <td
                                className="px-4 py-4 text-sm text-slate-500 text-center"
                                colSpan={columnCount}
                              >
                                {search
                                  ? `No ${activeTab} items found matching your search`
                                  : `No ${activeTab} items found`}
                              </td>
                            </tr>
                          ) : (
                            paginatedData.map((item) => (
                              <tr
                                key={item.id}
                                onClick={() => {
                                  router.push(`/app/inventory/${item.id}`);
                                  // dispatch(
                                  //   replaceTab({
                                  //     id: uuidv4(),
                                  //     title: getItemTitle(item),
                                  //     href: `/app/inventory/${item.item_id}`,
                                  //   })
                                  // );
                                }}
                                className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                              >
                                <td className="px-4 py-2">
                                  <div className="w-10 h-10">
                                    {item.image?.url ? (
                                      <Image
                                        src={`/${item.image.url}`}
                                        alt={item.description || "Item"}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-200 rounded-md text-center flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {(activeTab === "sheet" ||
                                  activeTab === "sunmica" ||
                                  activeTab === "handle" ||
                                  activeTab === "hardware" ||
                                  activeTab === "edging_tape") && (
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                                    {item.sheet?.brand ||
                                      item.handle?.brand ||
                                      item.hardware?.brand ||
                                      item.edging_tape?.brand ||
                                      "N/A"}
                                  </td>
                                )}
                                {(activeTab === "sheet" ||
                                  activeTab === "sunmica" ||
                                  activeTab === "handle" ||
                                  activeTab === "edging_tape") && (
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                    {item.sheet?.color ||
                                      item.handle?.color ||
                                      item.edging_tape?.color ||
                                      "N/A"}
                                  </td>
                                )}
                                {(activeTab === "sheet" ||
                                  activeTab === "sunmica" ||
                                  activeTab === "edging_tape") && (
                                  <>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.sheet?.finish ||
                                        item.edging_tape?.finish ||
                                        "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.sheet?.dimensions ||
                                        item.edging_tape?.dimensions ||
                                        "N/A"}
                                    </td>
                                  </>
                                )}
                                {activeTab === "handle" && (
                                  <>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.handle?.type || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.handle?.material || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.handle?.dimensions || "N/A"}
                                    </td>
                                  </>
                                )}
                                {activeTab === "hardware" && (
                                  <>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                                      {item.hardware?.name || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.hardware?.sub_category || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                      {item.hardware?.dimensions || "N/A"}
                                    </td>
                                  </>
                                )}
                                {activeTab === "accessory" && (
                                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                                    {item.accessory?.name || "N/A"}
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 border border-green-200">
                                    {item.quantity || 0}
                                    {item.measurement_unit && (
                                      <span className="ml-1 text-green-700">
                                        {item.measurement_unit}
                                      </span>
                                    )}
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

        {/* Filter Popup Modal */}
        {showFilterPopup && (
          <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
            <div className="filter-popup bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] m-4 flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">
                  Filter{" "}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Items
                </h2>
                <button
                  onClick={() => setShowFilterPopup(false)}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Common Filters */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantity Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={filters.quantity_min}
                          onChange={(e) =>
                            handleFilterChange("quantity_min", e.target.value)
                          }
                          placeholder="Min quantity"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          min="0"
                        />
                        <input
                          type="number"
                          value={filters.quantity_max}
                          onChange={(e) =>
                            handleFilterChange("quantity_max", e.target.value)
                          }
                          placeholder="Max quantity"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sheet Filters */}
                {(activeTab === "sheet" || activeTab === "sunmica") && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-700 text-sm tracking-wide">
                      {activeTab === "sunmica" ? "Sunmica" : "Sheet"} Specific
                      Filters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelectDropdown
                        label="Brand"
                        field="sheet_brand"
                        options={getDistinctValues("sheet_brand", data)}
                        selectedValues={filters.sheet_brand}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select brands..."
                      />

                      <MultiSelectDropdown
                        label="Color"
                        field="sheet_color"
                        options={getDistinctValues("sheet_color", data)}
                        selectedValues={filters.sheet_color}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select colors..."
                      />

                      <MultiSelectDropdown
                        label="Finish"
                        field="sheet_finish"
                        options={getDistinctValues("sheet_finish", data)}
                        selectedValues={filters.sheet_finish}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select finishes..."
                      />

                      <MultiSelectDropdown
                        label="Face"
                        field="sheet_face"
                        options={getDistinctValues("sheet_face", data)}
                        selectedValues={filters.sheet_face}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select faces..."
                      />
                    </div>
                  </div>
                )}

                {/* Handle Filters */}
                {activeTab === "handle" && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                      Handle Specific Filters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelectDropdown
                        label="Brand"
                        field="handle_brand"
                        options={getDistinctValues("handle_brand", data)}
                        selectedValues={filters.handle_brand}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select brands..."
                      />

                      <MultiSelectDropdown
                        label="Color"
                        field="handle_color"
                        options={getDistinctValues("handle_color", data)}
                        selectedValues={filters.handle_color}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select colors..."
                      />

                      <MultiSelectDropdown
                        label="Type"
                        field="handle_type"
                        options={getDistinctValues("handle_type", data)}
                        selectedValues={filters.handle_type}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select types..."
                      />

                      <MultiSelectDropdown
                        label="Material"
                        field="handle_material"
                        options={getDistinctValues("handle_material", data)}
                        selectedValues={filters.handle_material}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select materials..."
                      />
                    </div>
                  </div>
                )}

                {/* Hardware Filters */}
                {activeTab === "hardware" && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                      Hardware Specific Filters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelectDropdown
                        label="Brand"
                        field="hardware_brand"
                        options={getDistinctValues("hardware_brand", data)}
                        selectedValues={filters.hardware_brand}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select brands..."
                      />

                      <MultiSelectDropdown
                        label="Name"
                        field="hardware_name"
                        options={getDistinctValues("hardware_name", data)}
                        selectedValues={filters.hardware_name}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select names..."
                      />

                      <MultiSelectDropdown
                        label="Type"
                        field="hardware_type"
                        options={getDistinctValues("hardware_type", data)}
                        selectedValues={filters.hardware_type}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select types..."
                      />

                      <MultiSelectDropdown
                        label="Sub Category"
                        field="hardware_sub_category"
                        options={getDistinctValues(
                          "hardware_sub_category",
                          data
                        )}
                        selectedValues={filters.hardware_sub_category}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select sub categories..."
                      />
                    </div>
                  </div>
                )}

                {/* Accessory Filters */}
                {activeTab === "accessory" && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                      Accessory Specific Filters
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      <MultiSelectDropdown
                        label="Name"
                        field="accessory_name"
                        options={getDistinctValues("accessory_name", data)}
                        selectedValues={filters.accessory_name}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select names..."
                      />
                    </div>
                  </div>
                )}
                {/* Edging Tape Filters */}
                {activeTab === "edging_tape" && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                      Edging Tape Specific Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MultiSelectDropdown
                        label="Brand"
                        field="edging_tape_brand"
                        options={getDistinctValues("edging_tape_brand", data)}
                        selectedValues={filters.edging_tape_brand}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select brands..."
                      />
                      <MultiSelectDropdown
                        label="Color"
                        field="edging_tape_color"
                        options={getDistinctValues("edging_tape_color", data)}
                        selectedValues={filters.edging_tape_color}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select colors..."
                      />
                      <MultiSelectDropdown
                        label="Finish"
                        field="edging_tape_finish"
                        options={getDistinctValues("edging_tape_finish", data)}
                        selectedValues={filters.edging_tape_finish}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select finishes..."
                      />
                      <MultiSelectDropdown
                        label="Dimensions"
                        field="edging_tape_dimensions"
                        options={getDistinctValues(
                          "edging_tape_dimensions",
                          data
                        )}
                        selectedValues={filters.edging_tape_dimensions}
                        onSelectionChange={(field, values) =>
                          handleFilterChange(field as keyof Filters, values)
                        }
                        placeholder="Select dimensions..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
                <button
                  onClick={clearFilters}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Clear All Filters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilterPopup(false)}
                    className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilterPopup(false)}
                    className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Tally Modal */}
        {showStockTallyModal && (
          <StockTally
            activeTab={activeTab}
            setShowStockTallyModal={setShowStockTallyModal}
            filteredAndSortedData={filteredAndSortedData.map((item) => ({
              ...item,
              item_id:
                (item as { item_id?: string; id: string }).item_id || item.id,
            }))}
          />
        )}
      </div>
    </div>
  );
}
