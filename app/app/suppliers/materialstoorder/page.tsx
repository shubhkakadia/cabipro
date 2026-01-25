"use client";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import Sidebar from "@/components/sidebar";
import PaginationFooter from "@/components/PaginationFooter";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Calendar,
  FileText,
  Package,
  ChevronDown,
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sheet,
  Plus,
  FileUp,
  Trash,
  Trash2,
  X,
  File,
  AlertTriangle,
  Check,
} from "lucide-react";
import Image from "next/image";
import PurchaseOrder from "../components/PurchaseOrderForm";
import ViewMedia, { ViewFile } from "@/components/ViewMedia";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import CreateMaterialsToOrderModal from "./components/CreateMaterialsToOrderModal";
import AppHeader from "@/components/AppHeader";
import { useExcelExport } from "@/hooks/useExcelExport";
import SearchBar from "@/components/SearchBar";

// Type definitions
interface MediaFile {
  id: string;
  filename?: string;
  url: string;
  mime_type?: string;
  file_type?: string;
  extension?: string;
  size?: number;
}

interface ReservedItemStock {
  id: string;
  item_id: string;
  quantity: number;
  used_quantity?: number;
  mto_id: string;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Individual item in the cumulative list
interface CumulativeItem {
  item_id: string;
  category?: string;
  description?: string;
  measurement_unit?: string;
  image?: {
    url?: string;
  };
  sheet?: {
    brand?: string;
    color?: string;
    finish?: string;
    face?: string;
    dimensions?: string;
  };
  handle?: {
    brand?: string;
    color?: string;
    type?: string;
    material?: string;
    dimensions?: string;
  };
  hardware?: {
    brand?: string;
    name?: string;
    type?: string;
    sub_category?: string;
    dimensions?: string;
  };
  accessory?: {
    name?: string;
  };
  edging_tape?: {
    brand?: string;
    color?: string;
    finish?: string;
    dimensions?: string;
  };
  stock_on_hand: number;
  cumulative_quantity: number;
  mto_sources: Array<{
    mto_id: string;
    mto_item_id: string;
    project_name?: string;
    quantity: number;
  }>;
}

// Supplier with its cumulative items
interface CumulativeSupplier {
  supplier_id: string;
  supplier_name: string;
  items: CumulativeItem[];
}

interface MTOItem {
  id: string;
  item_id?: string;
  quantity: number;
  quantity_ordered?: number;
  quantity_ordered_po?: number;
  quantity_received?: number;
  reserve_item_stock?: ReservedItemStock[];
  ordered_by?: {
    email?: string;
    employee?: {
      first_name?: string;
      last_name?: string;
    };
  };
  item?: {
    id?: string;
    item_id?: string;
    category?: string;
    description?: string;
    quantity?: number;
    measurement_unit?: string;
    image?: {
      url: string;
      filename?: string;
    };
    supplier?: {
      supplier_id?: string;
      name?: string;
    };
    supplier_id?: string;
    sheet?: {
      brand?: string;
      color?: string;
      finish?: string;
      face?: string;
      dimensions?: string;
    };
    handle?: {
      brand?: string;
      color?: string;
      type?: string;
      material?: string;
      dimensions?: string;
    };
    hardware?: {
      brand?: string;
      name?: string;
      type?: string;
      sub_category?: string;
      dimensions?: string;
    };
    accessory?: {
      name?: string;
    };
    edging_tape?: {
      brand?: string;
      color?: string;
      finish?: string;
      dimensions?: string;
    };
  };
  ordered_items?: Array<{
    quantity?: number;
  }>;
}

interface Lot {
  id?: string;
  lot_id?: string;
  name?: string;
}

interface MTO {
  id: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: {
    employee?: {
      first_name?: string;
      last_name?: string;
    };
  };
  project?: {
    name?: string;
  };
  lots?: Lot[];
  items?: MTOItem[];
  media?: MediaFile[];
  __itemsCount?: number;
  __itemsRemaining?: number;
}

interface ExpandedSections {
  images: boolean;
  videos: boolean;
  pdfs: boolean;
  others: boolean;
}

interface Supplier {
  name: string;
  supplier_id: string;
}

interface ExportRow {
  Project: string;
  Lot: string;
  Items: number;
  "Items Remaining": number;
  Status: string;
  "Supplier Name": string;
  "Image URL": string;
  Category: string;
  "Sheet Color": string;
  "Sheet Finish": string;
  "Sheet Face": string;
  "Sheet Dimensions": string;
  "Handle Color": string;
  "Handle Type": string;
  "Handle Dimensions": string;
  "Handle Material": string;
  "Hardware Name": string;
  "Hardware Type": string;
  "Hardware Dimensions": string;
  "Hardware Sub Category": string;
  "Accessory Name": string;
  Quantity: number | string;
  "Quantity Ordered": number | string;
  "Created At": string;
  "Created By": string;
  Notes: string;
}

export default function MaterialsToOrderPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mtos, setMtos] = useState<MTO[]>([]);
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "cumulative"
  >("active");
  const [showCreatePurchaseOrderModal, setShowCreatePurchaseOrderModal] =
    useState(false);
  const [showCreateMTOModal, setShowCreateMTOModal] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] =
    useState<Supplier | null>(null);
  const [mtosForSelectedSupplier, setMtosForSelectedSupplier] = useState<MTO[]>(
    [],
  );
  const [preSelectedMtoId, setPreSelectedMtoId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("project");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  // Define all available columns for export
  const availableColumns: string[] = [
    "Project",
    "Lot",
    "Items",
    "Items Remaining",
    "Status",
    "Supplier Name",
    "Image URL",
    "Category",
    "Sheet Color",
    "Sheet Finish",
    "Sheet Face",
    "Sheet Dimensions",
    "Handle Color",
    "Handle Type",
    "Handle Dimensions",
    "Handle Material",
    "Hardware Name",
    "Hardware Type",
    "Hardware Dimensions",
    "Hardware Sub Category",
    "Accessory Name",
    "Quantity",
    "Quantity Ordered",
    "Created At",
    "Created By",
    "Notes",
  ];
  // Initialize selected columns with all columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    ...availableColumns,
  ]);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  // Media popup state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMtoForMedia, setSelectedMtoForMedia] = useState<MTO | null>(
    null,
  );
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [showDeleteMediaModal, setShowDeleteMediaModal] = useState(false);
  const [pendingDeleteMediaId, setPendingDeleteMediaId] = useState<
    string | null
  >(null);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    images: false,
    videos: false,
    pdfs: false,
    others: false,
  });
  const [viewFileModal, setViewFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ViewFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quantityOrderedDraftById, setQuantityOrderedDraftById] = useState<
    Record<string, string>
  >({});
  const [isSavingQuantityOrderedById, setIsSavingQuantityOrderedById] =
    useState<Record<string, boolean>>({});
  const quantityOrderedTimersRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );
  // Delete MTO state
  const [showDeleteMTOModal, setShowDeleteMTOModal] = useState(false);
  const [mtoPendingDelete, setMtoPendingDelete] = useState<MTO | null>(null);
  const [deletingMTOId, setDeletingMTOId] = useState<string | null>(null);
  // Stock reservation state
  const [reservedItemsMap, setReservedItemsMap] = useState<
    Record<string, ReservedItemStock>
  >({});
  const [reservingItemId, setReservingItemId] = useState<string | null>(null);
  // Cumulative materials state
  const [cumulativeData, setCumulativeData] = useState<CumulativeSupplier[]>(
    [],
  );
  const [loadingCumulative, setLoadingCumulative] = useState(false);
  // Pending changes tracking
  const [pendingChangesById, setPendingChangesById] = useState<
    Record<string, boolean>
  >({});
  const [originalQuantityOrderedById, setOriginalQuantityOrderedById] =
    useState<Record<string, string>>({});

  const fetchMTOs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/materials_to_order/all", {
        withCredentials: true,
      });
      if (response.data.status) {
        // Ensure data is always an array
        const data = response.data.data || [];
        setMtos(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError(response.data.message || "Failed to fetch materials to order");
      }
    } catch (err) {
      console.error("Error fetching MTOs:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to fetch materials to order",
        );
      } else {
        setError("Failed to fetch materials to order");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMTOs();
  }, [fetchMTOs]);

  // Fetch cumulative data when cumulative tab is active
  useEffect(() => {
    if (activeTab === "cumulative") {
      fetchCumulativeData();
    }
  }, [activeTab]);

  const processReservationsFromMTOs = useCallback(() => {
    try {
      // Build reservations map from the data already included in MTOs
      const reservationsMap: Record<string, ReservedItemStock> = {};
      const mtosArray = Array.isArray(mtos) ? mtos : [];

      mtosArray.forEach((mto) => {
        (mto?.items || []).forEach((item) => {
          // Check if this item has reservation data
          if (item.reserve_item_stock && item.reserve_item_stock.length > 0) {
            // Use the first reservation (should only be one per MTO item)
            const reservation = item.reserve_item_stock[0];
            reservationsMap[item.id] = reservation;
          }
        });
      });

      setReservedItemsMap(reservationsMap);
    } catch (err) {
      console.error("Error processing reservations:", err);
    }
  }, [mtos]);

  // Process reservations from MTO data (already included in the response)
  useEffect(() => {
    if (mtos && mtos.length > 0) {
      processReservationsFromMTOs();
    }
  }, [mtos, processReservationsFromMTOs]);

  const handleReserveStock = async (mtoItem: MTOItem) => {
    setReservingItemId(mtoItem.id);
    try {
      const response = await axios.post(
        "/api/reserve_item_stock/create",
        {
          item_id: mtoItem.item?.id,
          quantity: mtoItem.quantity,
          mto_id: mtoItem.id,
        },
        { withCredentials: true },
      );

      if (response.data.status) {
        toast.success("Stock reserved successfully");
        // Update local state
        setReservedItemsMap((prev) => ({
          ...prev,
          [mtoItem.id]: response.data.data,
        }));
        // Update the item quantity in mtos state to reflect the reduced stock
        // AND add the reservation data to the item's reserve_item_stock array
        setMtos((prev) =>
          (prev || []).map((mto) => ({
            ...mto,
            items: (mto.items || []).map((it) =>
              it.id === mtoItem.id
                ? {
                    ...it,
                    reserve_item_stock: [response.data.data],
                    item: {
                      ...it.item!,
                      quantity: Math.max(
                        0,
                        Number(it.item?.quantity || 0) - mtoItem.quantity,
                      ),
                    },
                  }
                : it.item?.item_id === mtoItem.item?.item_id
                  ? {
                      ...it,
                      item: {
                        ...it.item!,
                        quantity: Math.max(
                          0,
                          Number(it.item?.quantity || 0) - mtoItem.quantity,
                        ),
                      },
                    }
                  : it,
            ),
          })),
        );
      } else {
        toast.error(response.data.message || "Failed to reserve stock");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to reserve stock");
      } else {
        toast.error("Failed to reserve stock");
      }
    } finally {
      setReservingItemId(null);
    }
  };

  const handleDeleteReservation = async (
    reservationId: string,
    mtoItemId: string,
  ) => {
    setReservingItemId(mtoItemId);
    try {
      const response = await axios.delete(
        `/api/reserve_item_stock/${reservationId}`,
        { withCredentials: true },
      );

      if (response.data.status) {
        toast.success("Stock reservation deleted successfully");

        // Get the reservation quantity before deleting from state
        const reservation = reservedItemsMap[mtoItemId];
        const reservedQuantity = reservation?.quantity || 0;

        // Update local state
        setReservedItemsMap((prev) => {
          const updated = { ...prev };
          delete updated[mtoItemId];
          return updated;
        });

        // Update the item quantity in mtos state to add back the reserved stock
        // AND remove the reservation data from the item's reserve_item_stock array
        if (reservedQuantity > 0) {
          setMtos((prev) =>
            (prev || []).map((mto) => ({
              ...mto,
              items: (mto.items || []).map((it) =>
                it.id === mtoItemId
                  ? {
                      ...it,
                      reserve_item_stock: [],
                      item: {
                        ...it.item!,
                        quantity:
                          Number(it.item?.quantity || 0) + reservedQuantity,
                      },
                    }
                  : it,
              ),
            })),
          );
        }
      } else {
        toast.error(response.data.message || "Failed to delete reservation");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Failed to delete reservation",
        );
      } else {
        toast.error("Failed to delete reservation");
      }
    } finally {
      setReservingItemId(null);
    }
  };

  // Fetch cumulative materials data from API
  const fetchCumulativeData = async () => {
    try {
      setLoadingCumulative(true);
      const response = await axios.get("/api/materials_to_order/cumulative", {
        withCredentials: true,
      });

      if (response.data.status) {
        setCumulativeData(response.data.data || []);
      } else {
        toast.error("Failed to fetch cumulative data");
        setCumulativeData([]);
      }
    } catch (err) {
      console.error("Error fetching cumulative data:", err);
      toast.error("Failed to fetch cumulative materials");
      setCumulativeData([]);
    } finally {
      setLoadingCumulative(false);
    }
  };

  // Initialize draft values for the editable Qty Ordered inputs (don't clobber what user is typing)
  useEffect(() => {
    const mtosArray = Array.isArray(mtos) ? mtos : [];
    const newDraft: Record<string, string> = {};
    const newOriginal: Record<string, string> = {};

    mtosArray.forEach((mto: MTO) => {
      (mto?.items || []).forEach((it: MTOItem) => {
        if (it?.id) {
          // If quantity_ordered_po > 0, use that value instead of quantity_ordered
          const qtyOrdered =
            it.quantity_ordered_po && Number(it.quantity_ordered_po) > 0
              ? it.quantity_ordered_po
              : (it.quantity_ordered ?? 0);
          const originalValue = String(qtyOrdered);
          newDraft[it.id] = originalValue;
          newOriginal[it.id] = originalValue;
        }
      });
    });

    setQuantityOrderedDraftById((prev) => {
      const next = { ...prev };
      Object.keys(newDraft).forEach((id) => {
        if (next[id] === undefined) {
          next[id] = newDraft[id];
        }
      });
      return next;
    });

    setOriginalQuantityOrderedById((prev) => {
      const next = { ...prev };
      Object.keys(newOriginal).forEach((id) => {
        if (next[id] === undefined) {
          next[id] = newOriginal[id];
        }
      });
      return next;
    });
  }, [mtos]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = quantityOrderedTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const saveQuantityOrdered = async (mtoItemId: string, rawValue: string) => {
    const parsed =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? 0
        : Math.max(0, parseInt(rawValue, 10) || 0);

    setIsSavingQuantityOrderedById((prev) => ({ ...prev, [mtoItemId]: true }));
    try {
      const response = await axios.patch(
        `/api/materials_to_order_item/${mtoItemId}`,
        { quantity_ordered: parsed },
        { withCredentials: true },
      );
      if (!response?.data?.status) {
        throw new Error(
          response?.data?.message || "Failed to update quantity ordered",
        );
      }

      const saved = response?.data?.data?.quantity_ordered ?? parsed;
      const orderedBy = response?.data?.data?.ordered_by;

      setQuantityOrderedDraftById((prev) => ({
        ...prev,
        [mtoItemId]: String(saved),
      }));

      // Update local state with the saved quantity and ordered_by info
      setMtos((prev) =>
        (prev || []).map((mto) => ({
          ...mto,
          items: (mto.items || []).map((it) =>
            it.id === mtoItemId
              ? {
                  ...it,
                  quantity_ordered: saved,
                  ordered_by: orderedBy,
                }
              : it,
          ),
        })),
      );

      // Update original value to the saved value
      setOriginalQuantityOrderedById((prev) => ({
        ...prev,
        [mtoItemId]: String(saved),
      }));

      // Clear pending changes after successful save
      setPendingChangesById((prev) => {
        const next = { ...prev };
        delete next[mtoItemId];
        return next;
      });
    } catch (err) {
      console.error("Failed to update quantity_ordered:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || err.message || "Failed to save",
        );
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setIsSavingQuantityOrderedById((prev) => ({
        ...prev,
        [mtoItemId]: false,
      }));
    }
  };

  const handleQuantityOrderedChange = (
    mtoItemId: string,
    nextValue: string,
  ) => {
    setQuantityOrderedDraftById((prev) => ({
      ...prev,
      [mtoItemId]: nextValue,
    }));

    // Check if the value has changed from the original
    setOriginalQuantityOrderedById((prevOrig) => {
      const originalValue = prevOrig[mtoItemId];
      if (nextValue !== originalValue) {
        setPendingChangesById((prev) => ({ ...prev, [mtoItemId]: true }));
      } else {
        setPendingChangesById((prev) => {
          const next = { ...prev };
          delete next[mtoItemId];
          return next;
        });
      }
      return prevOrig;
    });
  };

  const handleCancelQuantityOrdered = (mtoItemId: string) => {
    // Get original value from state, or find it from mtos if not in state
    let originalValue = originalQuantityOrderedById[mtoItemId];
    if (!originalValue) {
      // Fallback: find the item in mtos to get the current quantity_ordered
      const mtosArray = Array.isArray(mtos) ? mtos : [];
      for (const mto of mtosArray) {
        const foundItem = (mto?.items || []).find((it) => it.id === mtoItemId);
        if (foundItem) {
          originalValue = String(foundItem.quantity_ordered ?? 0);
          break;
        }
      }
    }
    if (originalValue !== undefined) {
      setQuantityOrderedDraftById((prev) => ({
        ...prev,
        [mtoItemId]: originalValue,
      }));
    }
    setPendingChangesById((prev) => {
      const next = { ...prev };
      delete next[mtoItemId];
      return next;
    });
  };

  const handleSaveQuantityOrdered = async (mtoItemId: string) => {
    const value = quantityOrderedDraftById[mtoItemId];
    await saveQuantityOrdered(mtoItemId, value);
  };

  const openCreatePOForSupplier = (
    supplierName: string,
    supplierId: string,
    mtoId: string | null = null,
  ) => {
    // Build materialsToOrder list filtered to only include items from the selected supplier
    // and exclude items that have stock reserved
    const filteredMTOs = (mtos || [])
      .map((mto: MTO) => {
        const supplierItems = (mto.items || []).filter(
          (it: MTOItem) =>
            (it.item?.supplier?.supplier_id || it.item?.supplier_id || null) ===
              supplierId && !reservedItemsMap[it.id], // Exclude items with reserved stock
        );
        return { ...mto, items: supplierItems };
      })
      .filter((mto: MTO) => (mto.items || []).length > 0);

    setMtosForSelectedSupplier(filteredMTOs);
    setSelectedSupplierForPO({ name: supplierName, supplier_id: supplierId });
    setPreSelectedMtoId(mtoId);
    setShowCreatePurchaseOrderModal(true);
  };

  const filteredAndSortedMTOs = useMemo(() => {
    // Ensure mtos is always an array
    const mtosArray = Array.isArray(mtos) ? mtos : [];

    // Tab filter
    let list = mtosArray.filter((mto: MTO) =>
      activeTab === "active"
        ? mto.status === "DRAFT" || mto.status === "PARTIALLY_ORDERED"
        : mto.status === "FULLY_ORDERED" || mto.status === "CLOSED",
    );

    // Search filter (project name, lot name, status)
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((mto: MTO) => {
        const proj = (mto.project?.name || "").toLowerCase();
        const lots = (mto.lots || [])
          .map((l: Lot) => (l.name || "").toLowerCase())
          .join(" ");
        const status = (mto.status || "").toLowerCase();
        return proj.includes(q) || lots.includes(q) || status.includes(q);
      });
    }

    // Precompute counts
    const withCounts = list.map((mto: MTO) => {
      const itemsCount = mto.items?.length || 0;
      const itemsRemainingCount =
        mto.items?.filter(
          (it: MTOItem) => (it.quantity_ordered_po || 0) < (it.quantity || 0),
        ).length || 0;
      return {
        ...mto,
        __itemsCount: itemsCount,
        __itemsRemaining: itemsRemainingCount,
      };
    });

    // Sort
    withCounts.sort((a: MTO, b: MTO) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case "project":
          aVal = (a.project?.name || "").toLowerCase();
          bVal = (b.project?.name || "").toLowerCase();
          break;
        case "status":
          aVal = (a.status || "").toLowerCase();
          bVal = (b.status || "").toLowerCase();
          break;
        case "items":
          aVal = a.__itemsCount || 0;
          bVal = b.__itemsCount || 0;
          break;
        case "remaining":
          aVal = a.__itemsRemaining || 0;
          bVal = b.__itemsRemaining || 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    return withCounts;
  }, [mtos, activeTab, search, sortField, sortOrder]);

  // Pagination
  const totalItems = filteredAndSortedMTOs.length;
  const startIndex = itemsPerPage === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 0 ? totalItems : startIndex + itemsPerPage;
  const paginatedMTOs = filteredAndSortedMTOs.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string): React.ReactNode => {
    if (sortField !== field)
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    if (sortOrder === "asc")
      return <ArrowUp className="h-4 w-4 text-primary" />;
    if (sortOrder === "desc")
      return <ArrowDown className="h-4 w-4 text-primary" />;
    return null;
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleReset = () => {
    setSearch("");
    setSortField("project");
    setSortOrder("asc");
    setCurrentPage(1);
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
          ? prev.filter((c) => c !== column)
          : [...prev, column],
      );
    }
  };

  // Flatten MTOs to export rows
  const flattenedExportData = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return filteredAndSortedMTOs.flatMap((mto: MTO) => {
      const projectName = mto.project?.name || "";
      const lotsJoined = (mto.lots || []).map((l: Lot) => l.name).join(", ");
      const itemsCount = mto.__itemsCount || mto.items?.length || 0;
      const itemsRemaining =
        mto.__itemsRemaining ||
        mto.items?.filter(
          (it: MTOItem) => (it.quantity_ordered_po || 0) < (it.quantity || 0),
        ).length ||
        0;
      const createdAtStr = mto.createdAt
        ? new Date(mto.createdAt).toLocaleString()
        : "";
      const createdByName = mto.createdBy?.employee
        ? `${mto.createdBy.employee.first_name || ""} ${
            mto.createdBy.employee.last_name || ""
          }`.trim()
        : "";
      const notes = mto.notes || "";

      const rows = (mto.items || []).map((it: MTOItem) => {
        const item = it.item || {};
        const supplierName = item.supplier?.name || "";
        const imageUrl = item.image?.url ? `${origin}/${item.image.url}` : "";
        const category = item.category || "";
        const sheetColor = item.sheet?.color || "";
        const sheetFinish = item.sheet?.finish || "";
        const sheetFace = item.sheet?.face || "";
        const sheetDimensions = item.sheet?.dimensions || "";
        const handleColor = item.handle?.color || "";
        const handleType = item.handle?.type || "";
        const handleDimensions = item.handle?.dimensions || "";
        const handleMaterial = item.handle?.material || "";
        const hwName = item.hardware?.name || "";
        const hwType = item.hardware?.type || "";
        const hwDimensions = item.hardware?.dimensions || "";
        const hwSubCategory = item.hardware?.sub_category || "";
        const accName = item.accessory?.name || "";

        const actualQuantityOrdered = (it.ordered_items || []).reduce(
          (sum: number, poItem: { quantity?: number }) =>
            sum + (poItem.quantity || 0),
          0,
        );

        return {
          Project: projectName,
          Lot: lotsJoined,
          Items: itemsCount,
          "Items Remaining": itemsRemaining,
          Status: mto.status || "",
          "Supplier Name": supplierName,
          "Image URL": imageUrl,
          Category: category,
          "Sheet Color": sheetColor,
          "Sheet Finish": sheetFinish,
          "Sheet Face": sheetFace,
          "Sheet Dimensions": sheetDimensions,
          "Handle Color": handleColor,
          "Handle Type": handleType,
          "Handle Dimensions": handleDimensions,
          "Handle Material": handleMaterial,
          "Hardware Name": hwName,
          "Hardware Type": hwType,
          "Hardware Dimensions": hwDimensions,
          "Hardware Sub Category": hwSubCategory,
          "Accessory Name": accName,
          Quantity: it.quantity ?? "",
          "Quantity Ordered": actualQuantityOrdered || "",
          "Created At": createdAtStr,
          "Created By": createdByName,
          Notes: notes,
        } as ExportRow;
      });

      // If no items, still output one row for the MTO with blanks for item columns
      if (rows.length === 0) {
        rows.push({
          Project: projectName,
          Lot: lotsJoined,
          Items: itemsCount,
          "Items Remaining": itemsRemaining,
          Status: mto.status || "",
          "Supplier Name": "",
          "Image URL": "",
          Category: "",
          "Sheet Color": "",
          "Sheet Finish": "",
          "Sheet Face": "",
          "Sheet Dimensions": "",
          "Handle Color": "",
          "Handle Type": "",
          "Handle Dimensions": "",
          "Handle Material": "",
          "Hardware Name": "",
          "Hardware Type": "",
          "Hardware Dimensions": "",
          "Hardware Sub Category": "",
          "Accessory Name": "",
          Quantity: "",
          "Quantity Ordered": "",
          "Created At": createdAtStr,
          "Created By": createdByName,
          Notes: notes,
        } as ExportRow);
      }

      return rows;
    });
  }, [filteredAndSortedMTOs]);

  // Column mapping for Excel export
  const columnMap = useMemo(() => {
    return {
      Project: (row: ExportRow) => row.Project,
      Lot: (row: ExportRow) => row.Lot,
      Items: (row: ExportRow) => row.Items,
      "Items Remaining": (row: ExportRow) => row["Items Remaining"],
      Status: (row: ExportRow) => row.Status,
      "Supplier Name": (row: ExportRow) => row["Supplier Name"],
      "Image URL": (row: ExportRow) => row["Image URL"],
      Category: (row: ExportRow) => row.Category,
      "Sheet Color": (row: ExportRow) => row["Sheet Color"],
      "Sheet Finish": (row: ExportRow) => row["Sheet Finish"],
      "Sheet Face": (row: ExportRow) => row["Sheet Face"],
      "Sheet Dimensions": (row: ExportRow) => row["Sheet Dimensions"],
      "Handle Color": (row: ExportRow) => row["Handle Color"],
      "Handle Type": (row: ExportRow) => row["Handle Type"],
      "Handle Dimensions": (row: ExportRow) => row["Handle Dimensions"],
      "Handle Material": (row: ExportRow) => row["Handle Material"],
      "Hardware Name": (row: ExportRow) => row["Hardware Name"],
      "Hardware Type": (row: ExportRow) => row["Hardware Type"],
      "Hardware Dimensions": (row: ExportRow) => row["Hardware Dimensions"],
      "Hardware Sub Category": (row: ExportRow) => row["Hardware Sub Category"],
      "Accessory Name": (row: ExportRow) => row["Accessory Name"],
      Quantity: (row: ExportRow) => row.Quantity,
      "Quantity Ordered": (row: ExportRow) => row["Quantity Ordered"],
      "Created At": (row: ExportRow) => row["Created At"],
      "Created By": (row: ExportRow) => row["Created By"],
      Notes: (row: ExportRow) => row.Notes,
    };
  }, []);

  // Column width map
  const columnWidths = useMemo(
    () => ({
      Project: 22,
      Lot: 24,
      Items: 8,
      "Items Remaining": 12,
      Status: 14,
      "Supplier Name": 22,
      "Image URL": 28,
      Category: 12,
      "Sheet Color": 14,
      "Sheet Finish": 14,
      "Sheet Face": 12,
      "Sheet Dimensions": 18,
      "Handle Color": 14,
      "Handle Type": 14,
      "Handle Dimensions": 18,
      "Handle Material": 16,
      "Hardware Name": 18,
      "Hardware Type": 16,
      "Hardware Dimensions": 18,
      "Hardware Sub Category": 20,
      "Accessory Name": 18,
      Quantity: 10,
      "Quantity Ordered": 16,
      "Created At": 20,
      "Created By": 22,
      Notes: 30,
    }),
    [],
  );

  // Initialize Excel export hook
  const { exportToExcel, isExporting } = useExcelExport<ExportRow>({
    columnMap,
    columnWidths,
    filenamePrefix: "materials_to_order",
    sheetName: "MaterialsToOrder",
    selectedColumns,
    availableColumns,
  });

  const handleOpenMediaModal = (mto: MTO) => {
    setSelectedMtoForMedia(mto);
    setMediaFiles(mto.media || []);
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    setSelectedMtoForMedia(null);
    setMediaFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await handleUploadMedia(files);
  };

  const handleUploadMedia = async (filesToUpload: File[] | null = null) => {
    if (!selectedMtoForMedia) return;

    const files =
      filesToUpload || Array.from(fileInputRef.current?.files || []);
    if (files.length === 0) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      files.forEach((file: File) => {
        formData.append("files", file);
      });

      const response = await axios.post(
        `/api/uploads/materials-to-order/${selectedMtoForMedia.id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.status) {
        toast.success(response.data.message || "Files uploaded successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh media files
        const updatedMedia = [...mediaFiles, ...(response.data.data || [])];
        setMediaFiles(updatedMedia);
        // Refresh MTO list
        fetchMTOs();
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(response.data.message || "Failed to upload files", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error uploading media:", err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to upload files", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error("Failed to upload files", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    setPendingDeleteMediaId(mediaId);
    setShowDeleteMediaModal(true);
  };

  const handleDeleteMediaConfirm = async () => {
    if (!selectedMtoForMedia || !pendingDeleteMediaId) return;

    setDeletingMediaId(pendingDeleteMediaId);
    try {
      const response = await axios.delete(
        `/api/uploads/materials-to-order/${selectedMtoForMedia.id}?mediaId=${pendingDeleteMediaId}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.status) {
        toast.success("File deleted successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        // Remove from local state
        setMediaFiles((prev) =>
          prev.filter((f: MediaFile) => f.id !== pendingDeleteMediaId),
        );
        // Refresh MTO list
        fetchMTOs();
        setShowDeleteMediaModal(false);
        setPendingDeleteMediaId(null);
      } else {
        toast.error(response.data.message || "Failed to delete file", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete file", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error("Failed to delete file", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setDeletingMediaId(null);
    }
  };

  const handleDeleteMediaCancel = () => {
    setShowDeleteMediaModal(false);
    setPendingDeleteMediaId(null);
  };

  const handleMTODelete = (mtoId: string) => {
    const mto = mtos.find((m: MTO) => m.id === mtoId);
    if (mto) {
      setMtoPendingDelete(mto);
      setShowDeleteMTOModal(true);
    }
  };

  const handleMTODeleteConfirm = async () => {
    if (!mtoPendingDelete) return;

    setDeletingMTOId(mtoPendingDelete.id);
    try {
      const response = await axios.delete(
        `/api/materials_to_order/${mtoPendingDelete.id}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.status) {
        toast.success("Materials to order deleted successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh the MTO list
        fetchMTOs();
        setShowDeleteMTOModal(false);
        setMtoPendingDelete(null);
        // Close accordion if it was open
        if (openAccordionId === mtoPendingDelete.id) {
          setOpenAccordionId(null);
        }
      } else {
        toast.error(
          response.data.message || "Failed to delete materials to order",
          {
            position: "top-right",
            autoClose: 3000,
          },
        );
      }
    } catch (err) {
      console.error("Error deleting MTO:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message || "Failed to delete materials to order",
          {
            position: "top-right",
            autoClose: 3000,
          },
        );
      } else {
        toast.error("Failed to delete materials to order", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setDeletingMTOId(null);
    }
  };

  const handleMTODeleteCancel = () => {
    setShowDeleteMTOModal(false);
    setMtoPendingDelete(null);
  };

  const handleViewExistingFile = (file: MediaFile) => {
    setSelectedFile({
      name: file.filename || "File",
      url: `/${file.url}`,
      type:
        file.mime_type ||
        (file.extension ? `application/${file.extension}` : "application/pdf"),
      size: file.size || 0,
      isExisting: true,
    });
    setViewFileModal(true);
  };

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
                    Loading materials to order details...
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
                      Materials to Order
                    </h1>
                    <div className="flex items-center gap-2">
                      <SearchBar />
                      <button
                        onClick={() => setShowCreateMTOModal(true)}
                        className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-primary/80 hover:bg-primary text-white rounded-lg transition-all duration-200 text-xs font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Materials to Order</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                    {/* Fixed Header Section */}
                    <div className="p-4 shrink-0 border-b border-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 flex-1 max-w-sm relative">
                          <Search className="h-4 w-4 absolute left-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by project, lot or status"
                            className="w-full text-slate-800 p-2 pl-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm font-normal"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>

                        {/* Reset, Sort, Export */}
                        <div className="flex items-center gap-2">
                          {(search !== "" ||
                            sortField !== "project" ||
                            sortOrder !== "asc") && (
                            <button
                              onClick={handleReset}
                              className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>Reset</span>
                            </button>
                          )}

                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-all duration-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium">
                                <ArrowUpDown className="h-4 w-4" />
                                <span>Sort by</span>
                              </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Content
                              className="w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1"
                              sideOffset={4}
                            >
                              {[
                                { key: "project", label: "Project" },
                                { key: "status", label: "Status" },
                                { key: "items", label: "Items" },
                                {
                                  key: "remaining",
                                  label: "Items Remaining",
                                },
                              ].map((opt) => (
                                <DropdownMenu.Item
                                  key={opt.key}
                                  className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between outline-none"
                                  onSelect={() => handleSort(opt.key)}
                                >
                                  {opt.label} {getSortIcon(opt.key)}
                                </DropdownMenu.Item>
                              ))}
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>

                          <div className="relative dropdown-container flex items-center">
                            <button
                              onClick={() => exportToExcel(flattenedExportData)}
                              disabled={
                                isExporting ||
                                filteredAndSortedMTOs.length === 0 ||
                                selectedColumns.length === 0
                              }
                              className={`flex items-center gap-2 transition-all duration-200 text-slate-700 border border-slate-300 border-r-0 px-3 py-2 rounded-l-lg text-sm font-medium ${
                                isExporting ||
                                filteredAndSortedMTOs.length === 0 ||
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
                                filteredAndSortedMTOs.length === 0
                              }
                              className={`flex items-center transition-all duration-200 text-slate-700 border border-slate-300 px-2 py-2 rounded-r-lg text-sm font-medium ${
                                isExporting ||
                                filteredAndSortedMTOs.length === 0
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
                                          column,
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

                    {/* Tabs Section */}
                    <div className="px-4 shrink-0 border-b border-slate-200">
                      <nav className="flex space-x-6">
                        <button
                          onClick={() => setActiveTab("cumulative")}
                          className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "cumulative"
                              ? "border-primary text-primary"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Cumulative List
                        </button>
                        <button
                          onClick={() => setActiveTab("active")}
                          className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "active"
                              ? "border-primary text-primary"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setActiveTab("completed")}
                          className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "completed"
                              ? "border-primary text-primary"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Completed
                        </button>
                      </nav>
                    </div>

                    {/* Scrollable Content Section */}
                    <div className="flex-1 overflow-auto">
                      {activeTab === "cumulative" && (
                        <div className="p-6">
                          {loadingCumulative ? (
                            <div className="flex items-center justify-center h-64">
                              <div className="text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-sm text-slate-600">
                                  Loading cumulative data...
                                </p>
                              </div>
                            </div>
                          ) : cumulativeData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                              <Package className="w-16 h-16 text-slate-300 mb-4" />
                              <p className="text-slate-600 text-lg font-medium mb-2">
                                No materials to order
                              </p>
                              <p className="text-slate-500 text-sm">
                                Create a new materials to order to get started
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {cumulativeData.map((supplier) => (
                                <div
                                  key={supplier.supplier_id}
                                  className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
                                >
                                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <div>
                                      <h3 className="text-sm font-semibold text-slate-800">
                                        {supplier.supplier_name}
                                      </h3>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        {supplier.items.length} unique item(s)
                                      </p>
                                    </div>
                                    {supplier.supplier_id !== "unassigned" && (
                                      <button
                                        onClick={() => {
                                          openCreatePOForSupplier(
                                            supplier.supplier_name,
                                            supplier.supplier_id,
                                          );
                                        }}
                                        className="cursor-pointer px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                                      >
                                        Create Purchase Order
                                      </button>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Image
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Details
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock On Hand
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cumulative Qty
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            MTO Sources
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-slate-200">
                                        {supplier.items.map((item) => (
                                          <tr
                                            key={item.item_id}
                                            className="hover:bg-slate-50"
                                          >
                                            <td className="px-3 py-2 whitespace-nowrap">
                                              <div className="flex items-center">
                                                {item.image?.url ? (
                                                  <Image
                                                    loading="lazy"
                                                    src={`/${item.image.url}`}
                                                    alt={
                                                      item.category || "Item"
                                                    }
                                                    className="w-10 h-10 object-cover rounded border border-slate-200"
                                                    width={40}
                                                    height={40}
                                                  />
                                                ) : (
                                                  <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                {item.category}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-xs text-slate-600 space-y-1">
                                                {item.sheet && (
                                                  <>
                                                    <div>
                                                      <span className="font-medium">
                                                        Brand:
                                                      </span>{" "}
                                                      {item.sheet.brand || "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Color:
                                                      </span>{" "}
                                                      {item.sheet.color}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Finish:
                                                      </span>{" "}
                                                      {item.sheet.finish}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Face:
                                                      </span>{" "}
                                                      {item.sheet.face || "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Dimensions:
                                                      </span>{" "}
                                                      {item.sheet.dimensions}
                                                    </div>
                                                  </>
                                                )}
                                                {item.handle && (
                                                  <>
                                                    <div>
                                                      <span className="font-medium">
                                                        Brand:
                                                      </span>{" "}
                                                      {item.handle.brand || "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Color:
                                                      </span>{" "}
                                                      {item.handle.color}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Type:
                                                      </span>{" "}
                                                      {item.handle.type}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Dimensions:
                                                      </span>{" "}
                                                      {item.handle.dimensions}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Material:
                                                      </span>{" "}
                                                      {item.handle.material ||
                                                        "-"}
                                                    </div>
                                                  </>
                                                )}
                                                {item.hardware && (
                                                  <>
                                                    <div>
                                                      <span className="font-medium">
                                                        Brand:
                                                      </span>{" "}
                                                      {item.hardware.brand ||
                                                        "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Name:
                                                      </span>{" "}
                                                      {item.hardware.name}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Type:
                                                      </span>{" "}
                                                      {item.hardware.type}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Dimensions:
                                                      </span>{" "}
                                                      {item.hardware.dimensions}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Sub Category:
                                                      </span>{" "}
                                                      {
                                                        item.hardware
                                                          .sub_category
                                                      }
                                                    </div>
                                                  </>
                                                )}
                                                {item.accessory && (
                                                  <div>
                                                    <span className="font-medium">
                                                      Name:
                                                    </span>{" "}
                                                    {item.accessory.name}
                                                  </div>
                                                )}
                                                {item.edging_tape && (
                                                  <>
                                                    <div>
                                                      <span className="font-medium">
                                                        Brand:
                                                      </span>{" "}
                                                      {item.edging_tape.brand ||
                                                        "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Color:
                                                      </span>{" "}
                                                      {item.edging_tape.color ||
                                                        "-"}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Finish:
                                                      </span>{" "}
                                                      {item.edging_tape
                                                        .finish || "-"}
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                              <div className="text-xs">
                                                <div
                                                  className={`font-medium ${
                                                    item.stock_on_hand <= 0
                                                      ? "text-red-600"
                                                      : item.stock_on_hand < 10
                                                        ? "text-yellow-600"
                                                        : "text-green-600"
                                                  }`}
                                                >
                                                  {item.stock_on_hand}{" "}
                                                  {item.measurement_unit}
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                              <div className="text-sm font-semibold text-primary">
                                                {item.cumulative_quantity}{" "}
                                                {item.measurement_unit}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-xs text-slate-600 space-y-1">
                                                {item.mto_sources.map(
                                                  (source, idx) => (
                                                    <div key={idx}>
                                                      <span className="font-medium">
                                                        {source.project_name ||
                                                          "Manually Added MTO"}{" "}
                                                        :
                                                      </span>{" "}
                                                      {source.quantity}{" "}
                                                      {item.measurement_unit}
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {(activeTab === "active" ||
                        activeTab === "completed") && (
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("project")}
                              >
                                <div className="flex items-center gap-2">
                                  Project / Lots
                                  {getSortIcon("project")}
                                </div>
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("items")}
                              >
                                <div className="flex items-center gap-2">
                                  Items
                                  {getSortIcon("items")}
                                </div>
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("remaining")}
                              >
                                <div className="flex items-center gap-2">
                                  Items Remaining
                                  {getSortIcon("remaining")}
                                </div>
                              </th>
                              <th
                                className="px-4 py-2 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                                onClick={() => handleSort("status")}
                              >
                                <div className="flex items-center gap-2">
                                  Status
                                  {getSortIcon("status")}
                                </div>
                              </th>
                              <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedMTOs.length === 0 ? (
                              <tr>
                                <td
                                  className="px-4 py-10 text-sm text-slate-500 text-center"
                                  colSpan={5}
                                >
                                  No materials to order found
                                </td>
                              </tr>
                            ) : (
                              paginatedMTOs.map((mto) => {
                                return (
                                  <React.Fragment key={mto.id}>
                                    <tr
                                      onClick={() => {
                                        if (openAccordionId === mto.id) {
                                          setOpenAccordionId(null);
                                        } else {
                                          setOpenAccordionId(mto.id);
                                        }
                                      }}
                                      className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                                    >
                                      <td className="px-4 py-3">
                                        <div className="flex flex-row items-center gap-3">
                                          <span className="text-sm font-semibold text-gray-800 truncate">
                                            {mto.project?.name || "Project"}
                                          </span>
                                          <div className="flex flex-wrap gap-1 mt-1 md:mt-0">
                                            {mto.lots?.map((lot) => (
                                              <span
                                                key={lot.lot_id || lot.id}
                                                className="text-[10px] px-2 py-1 bg-purple-100 text-purple-800 rounded"
                                              >
                                                {lot.name}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {mto.__itemsCount ??
                                          (mto.items?.length || 0)}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-700">
                                        {mto.__itemsRemaining ??
                                          (mto.items?.filter(
                                            (it) =>
                                              (it.quantity_ordered_po || 0) <
                                              (it.quantity || 0),
                                          ).length ||
                                            0)}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-1 text-xs font-medium rounded ${
                                            mto.status === "DRAFT"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : mto.status ===
                                                  "PARTIALLY_ORDERED"
                                                ? "bg-blue-100 text-blue-800"
                                                : mto.status === "FULLY_ORDERED"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {mto.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <ChevronDown
                                          className={`w-4 h-4 text-slate-500 inline-block transition-transform duration-200 ${
                                            openAccordionId === mto.id
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        />
                                      </td>
                                    </tr>

                                    {/* Accordion content */}
                                    {openAccordionId === mto.id && (
                                      <tr>
                                        <td
                                          colSpan={5}
                                          className="px-4 pb-4 border-t border-slate-200 bg-slate-50"
                                        >
                                          <div
                                            id={`mto-${mto.id}`}
                                            className="mt-2"
                                          >
                                            <div className="mb-2 p-2 bg-slate-50 rounded-lg">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                                  <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                      <span className="font-medium">
                                                        Created:
                                                      </span>{" "}
                                                      {mto.createdAt
                                                        ? new Date(
                                                            mto.createdAt,
                                                          ).toLocaleString()
                                                        : "No date"}
                                                    </span>
                                                  </div>
                                                  {mto.notes && (
                                                    <div className="flex items-center gap-1.5">
                                                      <FileText className="w-4 h-4" />
                                                      <span>
                                                        <span className="font-medium">
                                                          Notes:
                                                        </span>{" "}
                                                        {mto.notes}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex items-center gap-1.5">
                                                    <FileText className="w-4 h-4" />
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenMediaModal(
                                                          mto,
                                                        );
                                                      }}
                                                      className="cursor-pointer text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                                    >
                                                      <span>Media Files:</span>
                                                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                        {
                                                          (mto.media || [])
                                                            .length
                                                        }
                                                      </span>
                                                    </button>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMTODelete(mto.id);
                                                  }}
                                                  disabled={
                                                    deletingMTOId === mto.id
                                                  }
                                                  className={`cursor-pointer px-2 py-1 border border-red-300 rounded-lg hover:bg-red-50 text-xs text-red-700 flex items-center gap-1.5 ${
                                                    deletingMTOId === mto.id
                                                      ? "opacity-50 cursor-not-allowed"
                                                      : ""
                                                  }`}
                                                >
                                                  {deletingMTOId === mto.id ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                                                      <span>Deleting...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Trash2 className="w-3 h-3" />
                                                      <span>Delete MTO</span>
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>

                                            {/* Items grouped by supplier */}
                                            {!!(
                                              mto.items && mto.items.length
                                            ) && (
                                              <div className="space-y-2">
                                                {(() => {
                                                  // Group items by supplier name (Unassigned last)
                                                  const groups = new Map();
                                                  mto.items.forEach((it) => {
                                                    const supplierName =
                                                      it.item?.supplier?.name ||
                                                      "Unassigned";
                                                    if (
                                                      !groups.has(supplierName)
                                                    )
                                                      groups.set(
                                                        supplierName,
                                                        [],
                                                      );
                                                    groups
                                                      .get(supplierName)
                                                      .push(it);
                                                  });
                                                  const orderedGroupNames =
                                                    Array.from(
                                                      groups.keys(),
                                                    ).sort((a, b) => {
                                                      if (
                                                        a === "Unassigned" &&
                                                        b !== "Unassigned"
                                                      )
                                                        return 1;
                                                      if (
                                                        b === "Unassigned" &&
                                                        a !== "Unassigned"
                                                      )
                                                        return -1;
                                                      return a.localeCompare(b);
                                                    });
                                                  return orderedGroupNames.map(
                                                    (name) => {
                                                      // Check if all items in this group have been fully ordered
                                                      const groupItems =
                                                        groups.get(name) || [];

                                                      // Show button only if there are items to order (not reserved and not fully ordered)
                                                      const hasItemsToOrder =
                                                        groupItems.some(
                                                          (it: MTOItem) =>
                                                            !reservedItemsMap[
                                                              it.id
                                                            ] &&
                                                            Number(
                                                              it.quantity_ordered_po ||
                                                                0,
                                                            ) <
                                                              Number(
                                                                it.quantity ||
                                                                  0,
                                                              ),
                                                        );

                                                      return (
                                                        <div key={name}>
                                                          <div className="flex items-center justify-between mb-2">
                                                            <div className="text-xs font-semibold text-slate-700">
                                                              {name}
                                                            </div>
                                                            {activeTab ===
                                                              "active" &&
                                                              name !==
                                                                "Unassigned" &&
                                                              hasItemsToOrder && (
                                                                <button
                                                                  type="button"
                                                                  onClick={() => {
                                                                    const firstItem =
                                                                      groups.get(
                                                                        name,
                                                                      )?.[0];
                                                                    const supplierId =
                                                                      firstItem
                                                                        ?.item
                                                                        ?.supplier
                                                                        ?.supplier_id ||
                                                                      firstItem
                                                                        ?.item
                                                                        ?.supplier_id ||
                                                                      null;
                                                                    if (
                                                                      !supplierId
                                                                    )
                                                                      return;
                                                                    openCreatePOForSupplier(
                                                                      name,
                                                                      supplierId,
                                                                      mto.id,
                                                                    );
                                                                  }}
                                                                  className="cursor-pointer px-2 py-1 text-xs border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                                                                >
                                                                  <Plus className="inline w-3 h-3 mr-1" />{" "}
                                                                  Create
                                                                  Purchase Order
                                                                </button>
                                                              )}
                                                          </div>
                                                          <div className="overflow-x-auto">
                                                            <table className="w-full border border-slate-200 rounded-lg table-fixed">
                                                              <colgroup>
                                                                <col className="w-40" />
                                                                <col className="w-30" />
                                                                <col className="w-60" />
                                                                <col className="w-32" />
                                                                <col className="w-40" />
                                                                <col className="w-60" />
                                                                <col className="w-40" />
                                                              </colgroup>
                                                              <thead className="bg-slate-50">
                                                                <tr>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Image
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Category
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Details
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    In Stock
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Quantity
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Qty Ordered
                                                                  </th>
                                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Status
                                                                  </th>
                                                                </tr>
                                                              </thead>
                                                              <tbody className="bg-white divide-y divide-slate-200">
                                                                {groups
                                                                  .get(name)
                                                                  .map(
                                                                    (
                                                                      item: MTOItem,
                                                                    ) => {
                                                                      const stockOnHand =
                                                                        Number(
                                                                          item
                                                                            .item
                                                                            ?.quantity ??
                                                                            0,
                                                                        );
                                                                      const measurementUnit =
                                                                        item
                                                                          .item
                                                                          ?.measurement_unit ||
                                                                        "";

                                                                      // Check if this item has a reservation
                                                                      const reservation =
                                                                        reservedItemsMap[
                                                                          item
                                                                            .id
                                                                        ];
                                                                      const isReserved =
                                                                        !!reservation;

                                                                      // Check if item has been ordered via PO
                                                                      const isOrdered =
                                                                        Number(
                                                                          item.quantity_ordered_po ||
                                                                            0,
                                                                        ) > 0;

                                                                      return (
                                                                        <tr
                                                                          key={
                                                                            item.id
                                                                          }
                                                                          className={`${
                                                                            isReserved ||
                                                                            isOrdered
                                                                              ? "bg-slate-200 opacity-60"
                                                                              : "hover:bg-slate-50"
                                                                          }`}
                                                                        >
                                                                          <td className="px-3 py-2 whitespace-nowrap">
                                                                            <div className="flex items-center">
                                                                              {item
                                                                                .item
                                                                                ?.image
                                                                                ?.url ? (
                                                                                <Image
                                                                                  loading="lazy"
                                                                                  src={`/${item.item.image.url}`}
                                                                                  alt={
                                                                                    item
                                                                                      .item
                                                                                      ?.category
                                                                                      ? `${item.item.category} item image`
                                                                                      : item.item_id
                                                                                        ? `Item ${item.item_id} image`
                                                                                        : "Item image"
                                                                                  }
                                                                                  className="w-10 h-10 object-cover rounded border border-slate-200"
                                                                                  width={
                                                                                    40
                                                                                  }
                                                                                  height={
                                                                                    40
                                                                                  }
                                                                                />
                                                                              ) : (
                                                                                <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                                                                                  <Package className="w-5 h-5 text-slate-400" />
                                                                                </div>
                                                                              )}
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-3 py-2 whitespace-nowrap">
                                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                                              {
                                                                                item
                                                                                  .item
                                                                                  ?.category
                                                                              }
                                                                            </span>
                                                                          </td>
                                                                          <td className="px-3 py-2">
                                                                            <div className="text-xs text-gray-600 space-y-1">
                                                                              {item
                                                                                .item
                                                                                ?.sheet && (
                                                                                <>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Brand:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .sheet
                                                                                      .brand ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Color:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .sheet
                                                                                        .color
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Finish:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .sheet
                                                                                        .finish
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Face:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .sheet
                                                                                      .face ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Dimensions:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .sheet
                                                                                        .dimensions
                                                                                    }
                                                                                  </div>
                                                                                </>
                                                                              )}
                                                                              {item
                                                                                .item
                                                                                ?.handle && (
                                                                                <>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Brand:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .handle
                                                                                      .brand ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Color:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .handle
                                                                                        .color
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Type:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .handle
                                                                                        .type
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Dimensions:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .handle
                                                                                        .dimensions
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Material:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .handle
                                                                                      .material ||
                                                                                      "-"}
                                                                                  </div>
                                                                                </>
                                                                              )}
                                                                              {item
                                                                                .item
                                                                                ?.hardware && (
                                                                                <>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Brand:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .hardware
                                                                                      .brand ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Name:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .hardware
                                                                                        .name
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Type:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .hardware
                                                                                        .type
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Dimensions:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .hardware
                                                                                        .dimensions
                                                                                    }
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Sub
                                                                                      Category:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .hardware
                                                                                        .sub_category
                                                                                    }
                                                                                  </div>
                                                                                </>
                                                                              )}
                                                                              {item
                                                                                .item
                                                                                ?.accessory && (
                                                                                <>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Name:
                                                                                    </span>{" "}
                                                                                    {
                                                                                      item
                                                                                        .item
                                                                                        .accessory
                                                                                        .name
                                                                                    }
                                                                                  </div>
                                                                                </>
                                                                              )}
                                                                              {item
                                                                                .item
                                                                                ?.edging_tape && (
                                                                                <>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Brand:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .edging_tape
                                                                                      .brand ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Color:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .edging_tape
                                                                                      .color ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Finish:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .edging_tape
                                                                                      .finish ||
                                                                                      "-"}
                                                                                  </div>
                                                                                  <div>
                                                                                    <span className="font-medium">
                                                                                      Dimensions:
                                                                                    </span>{" "}
                                                                                    {item
                                                                                      .item
                                                                                      .edging_tape
                                                                                      .dimensions ||
                                                                                      "-"}
                                                                                  </div>
                                                                                </>
                                                                              )}
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-3 py-2 whitespace-nowrap">
                                                                            <div className="text-xs">
                                                                              <div className="font-semibold text-green-600">
                                                                                {
                                                                                  stockOnHand
                                                                                }{" "}
                                                                                {
                                                                                  measurementUnit
                                                                                }
                                                                              </div>
                                                                              <div className="text-[11px] text-slate-500">
                                                                                in
                                                                                stock
                                                                              </div>
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-3 py-2 whitespace-nowrap">
                                                                            <div className="text-xs text-gray-600">
                                                                              <div className="flex items-center gap-1.5 mb-1">
                                                                                <Package className="w-4 h-4 text-gray-500" />
                                                                                <span>
                                                                                  <span className="font-medium">
                                                                                    Qty:
                                                                                  </span>{" "}
                                                                                  {
                                                                                    item.quantity
                                                                                  }{" "}
                                                                                  {
                                                                                    item
                                                                                      .item
                                                                                      ?.measurement_unit
                                                                                  }
                                                                                </span>
                                                                              </div>
                                                                              {(() => {
                                                                                const actualQuantityOrdered =
                                                                                  (
                                                                                    item.ordered_items ||
                                                                                    []
                                                                                  ).reduce(
                                                                                    (
                                                                                      sum,
                                                                                      poItem,
                                                                                    ) =>
                                                                                      sum +
                                                                                      (poItem.quantity ||
                                                                                        0),
                                                                                    0,
                                                                                  );
                                                                                return (
                                                                                  actualQuantityOrdered >
                                                                                    0 && (
                                                                                    <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                                                                                      <span>
                                                                                        Ordered:{" "}
                                                                                        {
                                                                                          actualQuantityOrdered
                                                                                        }
                                                                                      </span>
                                                                                    </div>
                                                                                  )
                                                                                );
                                                                              })()}
                                                                              {item.quantity_received
                                                                                ? item.quantity_received
                                                                                : 0 >
                                                                                    0 && (
                                                                                    <div className="flex items-center gap-1.5 text-green-600 text-xs">
                                                                                      <span>
                                                                                        Received:{" "}
                                                                                        {
                                                                                          item.quantity_received
                                                                                        }
                                                                                      </span>
                                                                                    </div>
                                                                                  )}
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-3 py-2 whitespace-nowrap">
                                                                            <div className="flex flex-col gap-1">
                                                                              <div className="flex items-center gap-1">
                                                                                <input
                                                                                  type="number"
                                                                                  min="0"
                                                                                  value={
                                                                                    quantityOrderedDraftById[
                                                                                      item
                                                                                        .id
                                                                                    ] ??
                                                                                    String(
                                                                                      // If quantity_ordered_po > 0, use that value instead of quantity_ordered
                                                                                      item.quantity_ordered_po &&
                                                                                        Number(
                                                                                          item.quantity_ordered_po,
                                                                                        )
                                                                                        ? item.quantity_ordered_po
                                                                                        : (item.quantity_ordered ??
                                                                                            0),
                                                                                    )
                                                                                  }
                                                                                  onChange={(
                                                                                    e,
                                                                                  ) =>
                                                                                    handleQuantityOrderedChange(
                                                                                      item.id,
                                                                                      e
                                                                                        .target
                                                                                        .value,
                                                                                    )
                                                                                  }
                                                                                  disabled={
                                                                                    !!isSavingQuantityOrderedById[
                                                                                      item
                                                                                        .id
                                                                                    ] ||
                                                                                    Number(
                                                                                      item.quantity_ordered_po ||
                                                                                        0,
                                                                                    ) >
                                                                                      0 ||
                                                                                    isReserved
                                                                                  }
                                                                                  className="w-24 text-xs text-slate-800 px-2 py-1 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none disabled:opacity-60"
                                                                                />
                                                                                {pendingChangesById[
                                                                                  item
                                                                                    .id
                                                                                ] && (
                                                                                  <div className="flex items-center gap-1">
                                                                                    <button
                                                                                      onClick={() =>
                                                                                        handleSaveQuantityOrdered(
                                                                                          item.id,
                                                                                        )
                                                                                      }
                                                                                      disabled={
                                                                                        !!isSavingQuantityOrderedById[
                                                                                          item
                                                                                            .id
                                                                                        ]
                                                                                      }
                                                                                      className="cursor-pointer p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                      title="Save"
                                                                                    >
                                                                                      <Check className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                      onClick={() =>
                                                                                        handleCancelQuantityOrdered(
                                                                                          item.id,
                                                                                        )
                                                                                      }
                                                                                      disabled={
                                                                                        !!isSavingQuantityOrderedById[
                                                                                          item
                                                                                            .id
                                                                                        ]
                                                                                      }
                                                                                      className="cursor-pointer p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                      title="Cancel"
                                                                                    >
                                                                                      <X className="w-4 h-4" />
                                                                                    </button>
                                                                                  </div>
                                                                                )}
                                                                              </div>
                                                                              {item
                                                                                .ordered_by
                                                                                ?.email &&
                                                                                !pendingChangesById[
                                                                                  item
                                                                                    .id
                                                                                ] && (
                                                                                  <div className="text-[12px] text-slate-500">
                                                                                    Ordered
                                                                                    by:{" "}
                                                                                    {
                                                                                      item
                                                                                        .ordered_by
                                                                                        .email
                                                                                    }
                                                                                  </div>
                                                                                )}
                                                                            </div>
                                                                          </td>
                                                                          <td className="px-3 py-2">
                                                                            <div className="flex flex-col gap-2">
                                                                              {Number(
                                                                                item.quantity_ordered_po ||
                                                                                  0,
                                                                              ) >
                                                                                0 && (
                                                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                                                  Ordered
                                                                                </span>
                                                                              )}
                                                                              {item.quantity_received
                                                                                ? item.quantity_received
                                                                                : 0 >
                                                                                    0 && (
                                                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                                                                      Received
                                                                                    </span>
                                                                                  )}
                                                                              {Number(
                                                                                item.quantity_ordered_po ||
                                                                                  0,
                                                                              ) ===
                                                                                0 &&
                                                                                item.quantity_received ===
                                                                                  0 && (
                                                                                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                                                                    Pending
                                                                                  </span>
                                                                                )}
                                                                              {/* Reserve Stock Button */}
                                                                              {!isOrdered &&
                                                                                (stockOnHand >
                                                                                  0 ||
                                                                                  isReserved) && (
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                      !isReserved
                                                                                        ? handleReserveStock(
                                                                                            item,
                                                                                          )
                                                                                        : handleDeleteReservation(
                                                                                            reservation.id,
                                                                                            item.id,
                                                                                          )
                                                                                    }
                                                                                    disabled={
                                                                                      reservingItemId ===
                                                                                      item.id
                                                                                    }
                                                                                    className={`cursor-pointer px-2 py-1 text-xs border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                                      !isReserved
                                                                                        ? "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                                                                                        : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                                                                    }`}
                                                                                  >
                                                                                    {reservingItemId ===
                                                                                    item.id
                                                                                      ? !isReserved
                                                                                        ? "Reserving..."
                                                                                        : "Deleting..."
                                                                                      : !isReserved
                                                                                        ? "Reserve Stock"
                                                                                        : "Unreserve"}
                                                                                  </button>
                                                                                )}
                                                                            </div>
                                                                          </td>
                                                                        </tr>
                                                                      );
                                                                    },
                                                                  )}
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                        </div>
                                                      );
                                                    },
                                                  );
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Fixed Pagination Footer */}
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
        </div>
      </div>
      {showCreatePurchaseOrderModal && selectedSupplierForPO && (
        <PurchaseOrder
          materialsToOrder={mtosForSelectedSupplier}
          supplier={selectedSupplierForPO}
          setShowCreatePurchaseOrderModal={setShowCreatePurchaseOrderModal}
          fetchMaterialsToOrder={fetchMTOs}
          selectedMtoId={preSelectedMtoId}
        />
      )}

      {/* Media Files Modal */}
      {showMediaModal && selectedMtoForMedia && (
        <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col relative z-50">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Media Files - {selectedMtoForMedia.project?.name || "Project"}
              </h2>
              <button
                onClick={handleCloseMediaModal}
                className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Display Existing Files First */}
              {(() => {
                // Categorize files by type
                const categorizeFiles = () => {
                  const images: MediaFile[] = [];
                  const videos: MediaFile[] = [];
                  const pdfs: MediaFile[] = [];
                  const others: MediaFile[] = [];

                  mediaFiles.forEach((file) => {
                    if (
                      file.mime_type?.includes("image") ||
                      file.file_type === "image"
                    ) {
                      images.push(file);
                    } else if (
                      file.mime_type?.includes("video") ||
                      file.file_type === "video"
                    ) {
                      videos.push(file);
                    } else if (
                      file.mime_type?.includes("pdf") ||
                      file.file_type === "pdf" ||
                      file.extension === "pdf"
                    ) {
                      pdfs.push(file);
                    } else {
                      others.push(file);
                    }
                  });

                  return { images, videos, pdfs, others };
                };

                const { images, videos, pdfs, others } = categorizeFiles();

                // File Category Section Component
                const FileCategorySection = ({
                  title,
                  files,
                  isSmall = false,
                  sectionKey,
                }: {
                  title: string;
                  files: MediaFile[];
                  isSmall?: boolean;
                  sectionKey: keyof ExpandedSections;
                }) => {
                  if (files.length === 0) return null;

                  const isExpanded = expandedSections[sectionKey];

                  return (
                    <div className="mb-4">
                      {/* Category Header with Toggle */}
                      <button
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900 transition-colors"
                      >
                        <span>
                          {title} ({files.length})
                        </span>
                        <div
                          className={`transform transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      {/* Collapsible Content */}
                      {isExpanded && (
                        <div className="flex flex-wrap gap-3">
                          {files.map((file: MediaFile) => (
                            <div
                              key={file.id}
                              onClick={() => handleViewExistingFile(file)}
                              title="Click to view file"
                              className={`cursor-pointer relative bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all group ${
                                isSmall ? "w-32" : "w-40"
                              }`}
                            >
                              {/* File Preview */}
                              <div
                                className={`w-full ${
                                  isSmall ? "aspect-4/3" : "aspect-square"
                                } rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-slate-50`}
                              >
                                {file.mime_type?.includes("image") ||
                                file.file_type === "image" ? (
                                  <Image
                                    height={100}
                                    width={100}
                                    src={`/${file.url}`}
                                    alt={file.filename || "Media file image"}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : file.mime_type?.includes("video") ||
                                  file.file_type === "video" ? (
                                  <video
                                    src={`/${file.url}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center rounded-lg ${
                                      file.mime_type?.includes("pdf") ||
                                      file.file_type === "pdf" ||
                                      file.extension === "pdf"
                                        ? "bg-red-50"
                                        : "bg-green-50"
                                    }`}
                                  >
                                    {file.mime_type?.includes("pdf") ||
                                    file.file_type === "pdf" ||
                                    file.extension === "pdf" ? (
                                      <FileText
                                        className={`${
                                          isSmall ? "w-6 h-6" : "w-8 h-8"
                                        } text-red-600`}
                                      />
                                    ) : (
                                      <File
                                        className={`${
                                          isSmall ? "w-6 h-6" : "w-8 h-8"
                                        } text-green-600`}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* File Info */}
                              <div className="space-y-1">
                                <p
                                  className="text-xs font-medium text-slate-700 truncate"
                                  title={file.filename}
                                >
                                  {file.filename}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatFileSize(file.size || 0)}
                                </p>
                              </div>

                              {/* Delete Button */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(file.id);
                                  }}
                                  disabled={deletingMediaId === file.id}
                                  className="p-1.5 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                                  title="Delete file"
                                >
                                  {deletingMediaId === file.id ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                  ) : (
                                    <Trash className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Uploaded Files
                    </h3>

                    {mediaFiles.length > 0 ? (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        {/* Images Section */}
                        <FileCategorySection
                          title="Images"
                          files={images}
                          isSmall={false}
                          sectionKey="images"
                        />

                        {/* Videos Section */}
                        <FileCategorySection
                          title="Videos"
                          files={videos}
                          isSmall={false}
                          sectionKey="videos"
                        />

                        {/* PDFs Section - Smaller cards */}
                        <FileCategorySection
                          title="PDFs"
                          files={pdfs}
                          isSmall={true}
                          sectionKey="pdfs"
                        />

                        {/* Other Files Section - Smaller cards */}
                        <FileCategorySection
                          title="Other Files"
                          files={others}
                          isSmall={true}
                          sectionKey="others"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 text-center">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Upload New Files Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Upload New Files
                </h3>

                {/* File Upload Area */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Select Files {uploadingMedia && "(Uploading...)"}
                  </label>
                  <div
                    className={`border-2 border-dashed border-slate-300 hover:border-secondary rounded-lg transition-all duration-200 bg-slate-50 hover:bg-slate-100 ${
                      uploadingMedia ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.jpg,.jpeg,.png,.mp4,.mov,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={uploadingMedia}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      {uploadingMedia ? (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-3"></div>
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            Uploading files...
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                            <FileUp className="w-6 h-6 text-secondary" />
                          </div>
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">
                            PDF, DWG, JPG, PNG, MP4, MOV, DOC, or DOCX
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File View Modal */}
      {viewFileModal && selectedFile && (
        <ViewMedia
          selectedFile={selectedFile}
          setSelectedFile={(file: ViewFile | null) => setSelectedFile(file)}
          setViewFileModal={setViewFileModal}
        />
      )}

      {/* Delete Media Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteMediaModal}
        onClose={handleDeleteMediaCancel}
        onConfirm={handleDeleteMediaConfirm}
        deleteWithInput={false}
        heading="Media File"
        message="This will permanently delete the media file. This action cannot be undone."
        isDeleting={deletingMediaId !== null}
        entityType="media"
      />

      {/* Delete Materials to Order Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteMTOModal}
        onClose={handleMTODeleteCancel}
        onConfirm={handleMTODeleteConfirm}
        deleteWithInput={true}
        heading="Materials to Order"
        message="This will permanently delete the materials to order and all associated items. This action cannot be undone."
        comparingName={
          mtoPendingDelete?.project?.name || mtoPendingDelete?.id || ""
        }
        isDeleting={deletingMTOId !== null}
        entityType="materials_to_order"
      />

      {/* Create Materials to Order Modal */}
      {showCreateMTOModal && (
        <CreateMaterialsToOrderModal
          setShowModal={setShowCreateMTOModal}
          onSuccess={() => {
            fetchMTOs();
            setShowCreateMTOModal(false);
          }}
        />
      )}
    </div>
  );
}
