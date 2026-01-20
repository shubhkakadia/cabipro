import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios, { AxiosProgressEvent } from "axios";
import { toast } from "react-toastify";
import {
  Package,
  Trash,
  Download,
  File,
  FileUp,
  FileText,
  ChevronDown,
  Loader2,
  Save,
  Plus,
} from "lucide-react";
import Image from "next/image";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import ViewMedia, { ViewFile } from "@/components/ViewMedia";
import AddItemModal from "../../suppliers/purchaseorder/components/AddItemModal";
import { useUploadProgress } from "../../../../hooks/useUploadProgress";
import { useExcelExport } from "@/hooks/useExcelExport";

// Type definitions
interface MaterialsToOrderProps {
  project: Project | null;
  selectedLot: Lot | null;
}

interface Project {
  project_id: string;
  lots?: Lot[];
  materials_to_order?: MTO[];
  [key: string]: unknown;
}

interface Lot {
  id: string;
  lot_id: string;
  name?: string;
  [key: string]: unknown;
}

interface MTO {
  id: string;
  lots?: Lot[];
  items?: MTOItem[];
  notes?: string;
  media?: MediaFile[];
  [key: string]: unknown;
}

interface MTOItem {
  id: string;
  item_id: string;
  quantity: number;
  notes?: string | null;
  item?: Item;
  [key: string]: unknown;
}

interface Item {
  id: string;
  category?: string;
  description?: string;
  measurement_unit?: string;
  image?: {
    url: string;
    filename?: string;
  };
  sheet?: {
    brand?: string;
    color?: string;
    finish?: string;
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
  [key: string]: unknown;
}

interface CategoryRow {
  item?: Item;
  quantity?: string | number;
  notes?: string;
  mtoItemId?: string;
}

interface CategoryItems {
  sheet: CategoryRow[];
  handle: CategoryRow[];
  hardware: CategoryRow[];
  accessory: CategoryRow[];
  edging_tape: CategoryRow[];
}

interface ExportRow {
  Category: string;
  Brand: string;
  Color: string;
  Type: string;
  Material: string;
  Finish: string;
  Name: string;
  "Sub Category": string;
  Dimensions: string;
  Unit: string;
  Quantity: string | number;
}

interface SearchResults {
  sheet: Item[];
  handle: Item[];
  hardware: Item[];
  accessory: Item[];
  edging_tape: Item[];
}

interface ShowSearchDropdown {
  sheet: Record<number, boolean>;
  handle: Record<number, boolean>;
  hardware: Record<number, boolean>;
  accessory: Record<number, boolean>;
  edging_tape: Record<number, boolean>;
}

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  mime_type?: string;
  file_type?: string;
  extension?: string;
  size?: number;
}

interface ExpandedSections {
  images: boolean;
  videos: boolean;
  pdfs: boolean;
  others: boolean;
}

interface PendingDeleteRow {
  category: string;
  rowIndex: number;
}

interface DataSnapshot {
  categoryItems: Record<
    string,
    { item_id?: string; quantity?: number; notes?: string | null }[]
  >;
  notes: string;
  selectedLots: string[];
}

interface LoadingState {
  isUpdatingFromApi: boolean;
  isInitialized: boolean;
}

export default function MaterialsToOrder({
  project,
  selectedLot,
}: MaterialsToOrderProps) {
  const {
    showProgressToast,
    completeUpload,
    dismissProgressToast,
    getUploadProgressHandler,
  } = useUploadProgress() as {
    showProgressToast: (fileCount: number) => void;
    completeUpload: (fileCount: number) => void;
    dismissProgressToast: () => void;
    getUploadProgressHandler: (
      fileCount: number,
    ) => (progressEvent: AxiosProgressEvent) => void;
  };

  const [categoryItems, setCategoryItems] = useState<CategoryItems>({
    sheet: [{}],
    handle: [{}],
    hardware: [{}],
    accessory: [{}],
    edging_tape: [{}],
  });
  const [searchResults, setSearchResults] = useState<SearchResults>({
    sheet: [],
    handle: [],
    hardware: [],
    accessory: [],
    edging_tape: [],
  });
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [showSearchDropdown, setShowSearchDropdown] =
    useState<ShowSearchDropdown>({
      sheet: {},
      handle: {},
      hardware: {},
      accessory: {},
      edging_tape: {},
    });
  const [itemCache, setItemCache] = useState<Record<string, Item[]>>({});
  const [selectedLots, setSelectedLots] = useState<Lot[]>([]);
  const [materialsToOrderData, setMaterialsToOrderData] = useState<MTO | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [currentMtoId, setCurrentMtoId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDeleteRow, setPendingDeleteRow] =
    useState<PendingDeleteRow | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    images: false,
    videos: false,
    pdfs: false,
    others: false,
  });
  const [viewFileModal, setViewFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ViewFile | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemModalCategory, setAddItemModalCategory] = useState<
    string | null
  >(null);
  const [locallyFreedLotIds, setLocallyFreedLotIds] = useState<string[]>([]);
  const locallyFreedLotIdsSet = useMemo(
    () => new Set(locallyFreedLotIds),
    [locallyFreedLotIds],
  );
  // Snapshot of the last saved/loaded state to compare against for changes
  const dataSnapshotRef = useRef<DataSnapshot>({
    categoryItems: {
      sheet: [{}],
      handle: [{}],
      hardware: [{}],
      accessory: [{}],
      edging_tape: [{}],
    },
    notes: "",
    selectedLots: [],
  });
  // State to track loading and initialization status
  const [, setLoadingState] = useState<LoadingState>({
    isUpdatingFromApi: false,
    isInitialized: false,
  });
  // Track previous materialsToOrderData ID to detect when it changes from API
  const prevMaterialsToOrderDataIdRef = useRef<string | null>(null);

  // Helper function to create a normalized snapshot from current state
  const createSnapshot = (
    categoryItemsData: CategoryItems,
    notesData: string,
    selectedLotsData: Lot[],
  ): DataSnapshot => {
    // Normalize categoryItems - only include items with data, sorted by item_id for comparison
    const normalizedCategoryItems: Record<
      string,
      { id?: string; quantity?: number; notes?: string | null }[]
    > = {};
    Object.keys(categoryItemsData).forEach((category) => {
      normalizedCategoryItems[category] = categoryItemsData[
        category as keyof CategoryItems
      ]
        .filter((row: CategoryRow) => row.item && row.quantity)
        .map((row) => ({
          id: row.item?.id,
          quantity: parseInt(row.quantity as string),
          notes: row.notes || null,
        }))
        .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    });

    // Normalize selectedLots - sort by lot_id for comparison
    const normalizedSelectedLots = (selectedLotsData || [])
      .map((lot) => lot.lot_id)
      .sort();

    return {
      categoryItems: normalizedCategoryItems,
      notes: (notesData || "").trim(),
      selectedLots: normalizedSelectedLots,
    };
  };

  // Helper function to compare two snapshots (currently unused but kept for potential future use)

  // Memoize: Get all lots that have MTOs created (from all MTOs in the project)
  const lotsWithExistingMto = useMemo(() => {
    if (!project?.materials_to_order) return new Set();

    const allLotsWithMto = new Set();
    project.materials_to_order.forEach((mto) => {
      if (mto.lots) {
        mto.lots.forEach((lot) => {
          // If a lot was just freed by a delete, ignore stale project data for it.
          if (!locallyFreedLotIdsSet.has(lot.lot_id)) {
            allLotsWithMto.add(lot.lot_id);
          }
        });
      }
    });

    return allLotsWithMto;
  }, [project?.materials_to_order, locallyFreedLotIdsSet]);

  // Memoize: Compute lots available for selection: only those without existing MTO
  const selectableLots = useMemo(() => {
    const availableLots = (project?.lots || []).filter((lot) => {
      // Allow selection only for lots that do not yet have MTO entries
      return !lotsWithExistingMto.has(lot.lot_id);
    });

    return availableLots.sort((a, b) => {
      const aNum = Number(a?.lot_id);
      const bNum = Number(b?.lot_id);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;

      return String(a?.lot_id ?? "").localeCompare(
        String(b?.lot_id ?? ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });
  }, [project?.lots, lotsWithExistingMto]);

  // Memoize: Check if selected lots have existing MTO
  const selectedLotHasExistingMto = useMemo(() => {
    return (
      selectedLots &&
      selectedLots.length > 0 &&
      selectedLots.some((lot) => lotsWithExistingMto.has(lot.lot_id))
    );
  }, [selectedLots, lotsWithExistingMto]);

  // Memoize: Get all lots that share the same MTO ID as the current MTO
  const lotsWithSameMtoId = useMemo(() => {
    if (!materialsToOrderData || !project?.materials_to_order) return [];

    const currentMtoId = materialsToOrderData.id;
    const mtoWithSameId = project.materials_to_order.find(
      (mto) => mto.id === currentMtoId,
    );

    return mtoWithSameId?.lots || [];
  }, [materialsToOrderData, project?.materials_to_order]);

  const sortedLotsWithSameMtoId = useMemo(() => {
    const lots = [...(lotsWithSameMtoId || [])];

    return lots.sort((a, b) => {
      const aNum = Number(a?.lot_id);
      const bNum = Number(b?.lot_id);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;

      return String(a?.lot_id ?? "").localeCompare(
        String(b?.lot_id ?? ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });
  }, [lotsWithSameMtoId]);

  // Initialize selected lots when project data is loaded or selectedLot changes
  useEffect(() => {
    if (project?.lots && project.lots.length > 0 && selectedLot) {
      setSelectedLots([selectedLot]);
    }
  }, [project, selectedLot]);

  // Ensure notes shown correspond to the currently selected lot(s)
  useEffect(() => {
    if (!materialsToOrderData) {
      setNotes("");
      return;
    }

    // Check if any selected lot has existing MTO
    const selectedLotIds = new Set(
      (selectedLots || []).map((lot) => lot.lot_id),
    );
    const mtoLotIds = new Set(
      (materialsToOrderData.lots || []).map((lot) => lot.lot_id),
    );

    const anySelectedLotHasMto =
      selectedLotIds.size > 0 &&
      Array.from(selectedLotIds).some((lotId) => mtoLotIds.has(lotId));

    if (anySelectedLotHasMto) {
      setNotes(materialsToOrderData.notes || "");
    } else {
      // Clear notes when selected lot(s) have no existing MTO
      setNotes("");
    }
  }, [materialsToOrderData, selectedLots]);

  // Helper to build category items based on MTO data and selected lots
  const buildCategoryItemsFromMto = (
    mtoData: MTO,
    lots: Lot[],
  ): CategoryItems => {
    const allowedLotIds = new Set((lots || []).map((l) => l.lot_id));

    const newCategoryItems = {
      sheet: [{}],
      handle: [{}],
      hardware: [{}],
      accessory: [{}],
      edging_tape: [{}],
    };

    if (mtoData?.items && mtoData.items.length > 0) {
      // Check if any of the MTO's lots match the selected lots
      const mtoLotIds = new Set((mtoData.lots || []).map((lot) => lot.lot_id));
      const hasMatchingLots =
        allowedLotIds.size === 0 ||
        Array.from(allowedLotIds).some((lotId) => mtoLotIds.has(lotId));

      if (hasMatchingLots) {
        mtoData.items?.forEach((mtoItem: MTOItem) => {
          const category = mtoItem.item?.category?.toLowerCase();
          if (
            category &&
            (category === "sheet" ||
              category === "handle" ||
              category === "hardware" ||
              category === "accessory" ||
              category === "edging_tape")
          ) {
            const currentItems = newCategoryItems[category];
            const emptyRowIndex = currentItems.findIndex(
              (row: CategoryRow) => !row.item,
            );

            const itemData = {
              item: mtoItem.item,
              quantity: mtoItem.quantity,
              notes: mtoItem.notes,
              mtoItemId: mtoItem.id,
            };

            if (emptyRowIndex !== -1) {
              newCategoryItems[category][emptyRowIndex] = itemData;
            } else {
              newCategoryItems[category].push(itemData);
            }
          }
        });

        // Always ensure one empty row exists for each category
        Object.keys(newCategoryItems).forEach((category) => {
          if (
            !newCategoryItems[category as keyof CategoryItems].some(
              (row: CategoryRow) => !row.item,
            )
          ) {
            newCategoryItems[category as keyof CategoryItems].push({});
          }
        });
      }
    }

    return newCategoryItems;
  };

  // Fetch existing materials to order when component loads
  useEffect(() => {
    const fetchMaterialsToOrder = async () => {
      if (
        !project?.materials_to_order ||
        project.materials_to_order.length === 0 ||
        !selectedLots ||
        selectedLots.length === 0
      ) {
        // No MTO exists, initialize snapshot with empty state
        setLoadingState({ isUpdatingFromApi: true, isInitialized: false });
        dataSnapshotRef.current = createSnapshot(
          {
            sheet: [{}],
            handle: [{}],
            hardware: [{}],
            accessory: [{}],
            edging_tape: [{}],
          },
          "",
          selectedLots || [],
        );
        // Reset flag after initialization
        setTimeout(() => {
          setLoadingState({ isUpdatingFromApi: false, isInitialized: true });
        }, 100);
        return;
      }

      // Find MTO that contains any of the selected lots
      const selectedLotIds = new Set(selectedLots.map((lot) => lot.lot_id));
      const relevantMto = project.materials_to_order.find(
        (mto) =>
          mto.lots &&
          mto.lots.some(
            (lot) =>
              selectedLotIds.has(lot.lot_id) &&
              !locallyFreedLotIdsSet.has(lot.lot_id),
          ),
      );

      if (!relevantMto) {
        // No MTO found, initialize snapshot with empty state
        setLoadingState({ isUpdatingFromApi: true, isInitialized: false });
        dataSnapshotRef.current = createSnapshot(
          {
            sheet: [{}],
            handle: [{}],
            hardware: [{}],
            accessory: [{}],
            edging_tape: [{}],
          },
          "",
          selectedLots,
        );
        // Reset flag after initialization
        setTimeout(() => {
          setLoadingState({ isUpdatingFromApi: false, isInitialized: true });
        }, 100);
        return;
      }

      try {
        const response = await axios.get(
          `/api/materials_to_order/${relevantMto.id}`,
          {
            withCredentials: true,
          },
        );

        if (response.data.status) {
          const mtoData = response.data.data;
          const loadedCategoryItems = buildCategoryItemsFromMto(
            mtoData,
            selectedLots,
          );

          // Set flag to prevent auto-save during API update
          setLoadingState({ isUpdatingFromApi: true, isInitialized: false });

          // Update snapshot FIRST with loaded data (before state updates)
          dataSnapshotRef.current = createSnapshot(
            loadedCategoryItems,
            mtoData?.notes || "",
            selectedLots,
          );

          // Then update state
          setMaterialsToOrderData(mtoData);
          setNotes(mtoData?.notes || "");
          setCategoryItems(loadedCategoryItems);
          setCurrentMtoId(relevantMto.id); // Store the MTO ID for editing
          setMediaFiles(mtoData?.media || []);

          // Reset flag after a brief delay to allow state updates to complete
          setTimeout(() => {
            setLoadingState({ isUpdatingFromApi: false, isInitialized: true });
          }, 100);
        }
      } catch (err) {
        console.error("Error fetching materials to order:", err);
        if (axios.isAxiosError(err)) {
          toast.error(
            err.response?.data?.message ||
              "Failed to load existing materials to order",
            {
              position: "top-right",
              autoClose: 3000,
            },
          );
        } else {
          toast.error("Failed to load existing materials to order", {
            position: "top-right",
            autoClose: 3000,
          });
        }
        setLoadingState((prev) => ({ ...prev, isInitialized: true }));
      }
    };

    fetchMaterialsToOrder();
  }, [project, selectedLots, locallyFreedLotIdsSet]);

  // Re-filter displayed items when selected lots change or when MTO data loads
  useEffect(() => {
    // Check if materialsToOrderData ID changed (API load) vs just selectedLots changed (user action)
    const currentDataId = materialsToOrderData?.id || null;
    const isDataLoad = prevMaterialsToOrderDataIdRef.current !== currentDataId;
    prevMaterialsToOrderDataIdRef.current = currentDataId;

    if (materialsToOrderData) {
      // Always filter by selected lots, even for existing MTO
      const filteredCategoryItems = buildCategoryItemsFromMto(
        materialsToOrderData,
        selectedLots,
      );

      // Only update snapshot when data is loaded from API (to prevent auto-save)
      // Don't update snapshot when selectedLots changes due to user action
      if (isDataLoad) {
        setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: true }));
        dataSnapshotRef.current = createSnapshot(
          filteredCategoryItems,
          materialsToOrderData?.notes || "",
          selectedLots,
        );
      }

      // Update state
      setCategoryItems(filteredCategoryItems);

      // Reset flag after state updates complete (only if it was set)
      if (isDataLoad) {
        setTimeout(() => {
          setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: false }));
        }, 100);
      }
    }
  }, [materialsToOrderData, selectedLots]);

  // Materials to Order form functions
  const handleLotToggle = (lot: Lot) => {
    setSelectedLots((prev) => {
      const isSelected = prev.some((l) => l.lot_id === lot.lot_id);
      if (isSelected) {
        return prev.filter((l) => l.lot_id !== lot.lot_id);
      } else {
        return [...prev, lot];
      }
    });
  };

  const searchItems = async (
    category: string,
    searchTerm: string,
    rowIndex: number,
  ) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setSearchResults((prev) => ({
        ...prev,
        [category]: [],
      }));
      setShowSearchDropdown((prev) => ({
        ...prev,
        [category as keyof CategoryItems]: {
          ...prev[category as keyof CategoryItems],
          [rowIndex]: false,
        },
      }));
      return;
    }

    try {
      const cacheKey = `${category}_${searchTerm.toLowerCase()}`;

      // Check cache first
      if (itemCache[cacheKey]) {
        setSearchResults((prev) => ({
          ...prev,
          [category]: itemCache[cacheKey],
        }));
        setShowSearchDropdown((prev) => ({
          ...prev,
          [category as keyof CategoryItems]: {
            ...prev[category as keyof CategoryItems],
            [rowIndex]: true,
          },
        }));
        return;
      }

      const response = await axios.get(`/api/item/all/${category}`, {
        withCredentials: true,
      });

      if (response.data.status) {
        const items = response.data.data || [];

        // Filter items based on search term
        const filteredItems = items.filter((item: Item) => {
          const term = searchTerm.toLowerCase();
          return (
            item.description?.toLowerCase().includes(term) ||
            item.sheet?.color?.toLowerCase().includes(term) ||
            item.sheet?.brand?.toLowerCase().includes(term) ||
            item.handle?.color?.toLowerCase().includes(term) ||
            item.handle?.brand?.toLowerCase().includes(term) ||
            item.handle?.type?.toLowerCase().includes(term) ||
            item.hardware?.name?.toLowerCase().includes(term) ||
            item.hardware?.brand?.toLowerCase().includes(term) ||
            item.hardware?.type?.toLowerCase().includes(term) ||
            item.accessory?.name?.toLowerCase().includes(term) ||
            item.edging_tape?.color?.toLowerCase().includes(term) ||
            item.edging_tape?.brand?.toLowerCase().includes(term) ||
            item.edging_tape?.finish?.toLowerCase().includes(term)
          );
        });

        // Update cache
        setItemCache((prev) => ({
          ...prev,
          [cacheKey]: filteredItems,
        }));

        setSearchResults((prev) => ({
          ...prev,
          [category]: filteredItems,
        }));

        setShowSearchDropdown((prev) => ({
          ...prev,
          [category as keyof CategoryItems]: {
            ...prev[category as keyof CategoryItems],
            [rowIndex]: true,
          },
        }));
      }
    } catch (err) {
      console.error("Error searching items:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            "Failed to search items. Please try again.",
          {
            position: "top-right",
            autoClose: 3000,
          },
        );
      }
      setSearchResults((prev) => ({
        ...prev,
        [category]: [],
      }));
    }
  };

  // Helper function to generate search term key
  const getSearchTermKey = (category: string, rowIndex: number): string =>
    `${category}-${rowIndex}`;

  const handleSearchChange = (
    category: string,
    rowIndex: number,
    value: string,
  ) => {
    const key = getSearchTermKey(category, rowIndex);
    setSearchTerms((prev) => ({
      ...prev,
      [key]: value,
    }));
    searchItems(category, value, rowIndex);
  };

  const handleItemSelect = (
    category: keyof CategoryItems,
    rowIndex: number,
    item: Item,
  ) => {
    setCategoryItems((prev) => {
      const updatedItems = [...prev[category]];
      updatedItems[rowIndex] = { item, quantity: 1 };

      // Add empty row if none exists
      if (!updatedItems.some((row) => !row.item)) {
        updatedItems.push({});
      }

      return { ...prev, [category]: updatedItems };
    });

    // Clear the search term for the selected row
    const key = getSearchTermKey(category, rowIndex);
    setSearchTerms((prev) => {
      const updated = { ...prev };
      updated[key] = "";
      return updated;
    });

    setShowSearchDropdown((prev) => ({
      ...prev,
      [category]: { ...prev[category], [rowIndex]: false },
    }));
  };

  const handleQuantityChange = (
    category: keyof CategoryItems,
    rowIndex: number,
    quantity: string,
  ) => {
    setCategoryItems((prev) => ({
      ...prev,
      [category]: prev[category].map((row, idx) =>
        idx === rowIndex
          ? {
              ...row,
              quantity: quantity === "" ? "" : parseInt(quantity) || "",
            }
          : row,
      ),
    }));
  };

  const removeItemRow = (category: keyof CategoryItems, rowIndex: number) => {
    // Check if this is the last item across all categories
    const totalItemsWithData = Object.values(categoryItems).reduce(
      (total, rows) => {
        return (
          total +
          rows.filter((row: CategoryRow) => row.item && row.quantity).length
        );
      },
      0,
    );

    // If this is the last item and we have an existing MTO, show confirmation
    if (totalItemsWithData === 1 && currentMtoId) {
      setPendingDeleteRow({ category, rowIndex });
      setShowDeleteConfirm(true);
      return;
    }

    // Otherwise, proceed with normal deletion
    performItemDeletion(category, rowIndex);
  };

  const performItemDeletion = (
    category: keyof CategoryItems,
    rowIndex: number,
  ) => {
    setCategoryItems((prev) => {
      const updatedItems = prev[category].filter((_, idx) => idx !== rowIndex);

      // Always ensure one empty row exists
      if (!updatedItems.some((row) => !row.item)) {
        updatedItems.push({});
      }

      return {
        ...prev,
        [category]: updatedItems,
      };
    });

    // Remove search term for deleted row and shift subsequent rows
    setSearchTerms((prev) => {
      const updated = { ...prev };
      const deletedKey = getSearchTermKey(category, rowIndex);

      // Remove the deleted row's search term
      delete updated[deletedKey];

      // Shift search terms for rows after the deleted row
      // After deletion, row at index rowIndex+1 becomes rowIndex, etc.
      const currentItemsLength = categoryItems[category].length;
      for (let i = rowIndex + 1; i < currentItemsLength; i++) {
        const oldKey = getSearchTermKey(category, i);
        const newKey = getSearchTermKey(category, i - 1);
        if (updated[oldKey] !== undefined) {
          updated[newKey] = updated[oldKey];
          delete updated[oldKey];
        }
      }

      return updated;
    });

    setShowSearchDropdown((prev) => ({
      ...prev,
      [category]: Object.keys(
        prev[category as keyof ShowSearchDropdown],
      ).reduce(
        (acc: Record<number, boolean>, key: string) => {
          const numKey = parseInt(key);
          if (numKey !== rowIndex && !isNaN(numKey)) {
            acc[numKey] = prev[category as keyof ShowSearchDropdown][numKey];
          }
          return acc;
        },
        {} as Record<number, boolean>,
      ),
    }));
  };

  const hasItems = useMemo(
    () =>
      Object.values(categoryItems).some((rows) =>
        rows.some((row: CategoryRow) => row.item && row.quantity),
      ),
    [categoryItems],
  );

  // Allow saving even when only notes/files changed (no line items yet)
  const hasNotes = useMemo(() => (notes || "").trim().length > 0, [notes]);
  const hasMedia = useMemo(() => (mediaFiles || []).length > 0, [mediaFiles]);
  const canSave = useMemo(() => {
    if (!project?.project_id) return false;
    if (!currentMtoId && (!selectedLots || selectedLots.length === 0))
      return false;
    return hasItems || hasNotes || hasMedia;
  }, [
    project?.project_id,
    currentMtoId,
    selectedLots,
    hasItems,
    hasNotes,
    hasMedia,
  ]);

  const isItemAlreadySelected = useCallback(
    (category: keyof CategoryItems, item: Item): boolean => {
      return categoryItems[category].some((row) => {
        if (!row.item) return false;
        const storedItem = row.item;
        const itemId = storedItem.id || storedItem.item_id;
        const searchItemId = item.id || item.item_id;
        return itemId === searchItemId;
      });
    },
    [categoryItems],
  );

  const getFilteredSearchResults = useCallback(
    (category: keyof CategoryItems): Item[] => {
      return searchResults[category].filter(
        (item: Item) => !isItemAlreadySelected(category, item),
      );
    },
    [searchResults, isItemAlreadySelected],
  );

  // Convert categoryItems to export rows
  const convertCategoryItemsToExportRows = useMemo((): ExportRow[] => {
    const categories = [
      "sheet",
      "handle",
      "hardware",
      "accessory",
      "edging_tape",
    ];
    const categoryNames = {
      sheet: "Sheet",
      handle: "Handle",
      hardware: "Hardware",
      accessory: "Accessory",
      edging_tape: "Edging Tape",
    };

    const rows: ExportRow[] = [];

    categories.forEach((category: string) => {
      const items = categoryItems[category as keyof CategoryItems];
      items.forEach((row: CategoryRow) => {
        if (row.item && row.quantity) {
          const item = row.item;
          const exportRow: ExportRow = {
            Category: categoryNames[category as keyof typeof categoryNames],
            Brand: "",
            Color: "",
            Type: "",
            Material: "",
            Finish: "",
            Name: "",
            "Sub Category": "",
            Dimensions: "",
            Unit: item.measurement_unit || "",
            Quantity: row.quantity || "",
          };

          // Category-specific fields
          if (category === "sheet" && item.sheet) {
            exportRow.Brand = item.sheet.brand || "";
            exportRow.Color = item.sheet.color || "";
            exportRow.Finish = item.sheet.finish || "";
            exportRow.Dimensions = item.sheet.dimensions || "";
          } else if (category === "handle" && item.handle) {
            exportRow.Brand = item.handle.brand || "";
            exportRow.Color = item.handle.color || "";
            exportRow.Type = item.handle.type || "";
            exportRow.Material = item.handle.material || "";
            exportRow.Dimensions = item.handle.dimensions || "";
          } else if (category === "hardware" && item.hardware) {
            exportRow.Brand = item.hardware.brand || "";
            exportRow.Name = item.hardware.name || "";
            exportRow["Sub Category"] = item.hardware.sub_category || "";
            exportRow.Dimensions = item.hardware.dimensions || "";
          } else if (category === "accessory" && item.accessory) {
            exportRow.Name = item.accessory.name || "";
          } else if (category === "edging_tape" && item.edging_tape) {
            exportRow.Brand = item.edging_tape.brand || "";
            exportRow.Color = item.edging_tape.color || "";
            exportRow.Finish = item.edging_tape.finish || "";
            exportRow.Dimensions = item.edging_tape.dimensions || "";
          }

          rows.push(exportRow);
        }
      });
    });

    return rows;
  }, [categoryItems]);

  // Column mapping for Excel export
  const columnMap = useMemo(() => {
    return {
      Category: (row: ExportRow) => row.Category,
      Brand: (row: ExportRow) => row.Brand,
      Color: (row: ExportRow) => row.Color,
      Type: (row: ExportRow) => row.Type,
      Material: (row: ExportRow) => row.Material,
      Finish: (row: ExportRow) => row.Finish,
      Name: (row: ExportRow) => row.Name,
      "Sub Category": (row: ExportRow) => row["Sub Category"],
      Dimensions: (row: ExportRow) => row.Dimensions,
      Unit: (row: ExportRow) => row.Unit,
      Quantity: (row: ExportRow) => row.Quantity,
    };
  }, []);

  // Column widths
  const columnWidths = useMemo(
    () => ({
      Category: 15,
      Brand: 20,
      Color: 15,
      Type: 15,
      Material: 20,
      Finish: 15,
      Name: 25,
      "Sub Category": 18,
      Dimensions: 18,
      Unit: 10,
      Quantity: 12,
    }),
    [],
  );

  // Initialize Excel export hook
  const { exportToExcel, isExporting } = useExcelExport({
    columnMap,
    columnWidths,
    filenamePrefix: "materials_to_order",
    sheetName: "Materials To Order",
  });

  const handleDeleteMaterials = async () => {
    setIsDeleting(true);
    try {
      if (!currentMtoId) {
        toast.error("No materials to order to delete.");
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      // If we have a pending delete row, delete the item first
      if (pendingDeleteRow) {
        performItemDeletion(
          pendingDeleteRow.category as keyof CategoryItems,
          pendingDeleteRow.rowIndex,
        );
      }

      const response = await axios.delete(
        `/api/materials_to_order/${currentMtoId}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.status) {
        toast.success("Materials to order deleted successfully!");
        // Mark lots as "freed" locally so UI doesn't keep showing stale "already created"
        // until the parent `project` prop refreshes.
        const lotsToFree = (
          materialsToOrderData?.lots ||
          lotsWithSameMtoId ||
          []
        )
          .map((lot) => lot.lot_id)
          .filter(Boolean);
        if (lotsToFree.length > 0) {
          setLocallyFreedLotIds((prev) =>
            Array.from(new Set([...(prev || []), ...lotsToFree])),
          );
        }

        // Reset state
        setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: true }));
        const resetSelectedLots = selectedLot ? [selectedLot] : [];
        setCategoryItems({
          sheet: [{}],
          handle: [{}],
          hardware: [{}],
          accessory: [{}],
          edging_tape: [{}],
        });
        setNotes("");
        setMaterialsToOrderData(null);
        setCurrentMtoId(null);
        setSelectedLots(resetSelectedLots);
        setMediaFiles([]);
        setSelectedFiles([]);
        setDeletingMediaId(null);
        // Update snapshot
        dataSnapshotRef.current = createSnapshot(
          {
            sheet: [{}],
            handle: [{}],
            hardware: [{}],
            accessory: [{}],
            edging_tape: [{}],
          },
          "",
          resetSelectedLots,
        );
        setTimeout(() => {
          setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: false }));
        }, 50);
      } else {
        toast.error(
          response.data.message || "Failed to delete materials to order.",
        );
      }
    } catch (err) {
      console.error("Error deleting materials:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete materials to order. Please try again.";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to delete materials to order. Please try again.");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPendingDeleteRow(null);
    }
  };

  // Save function
  const saveMaterials = async (silent = false) => {
    try {
      // Check if there is anything to save (items, notes, or files)
      if (!canSave) {
        return;
      }

      // Check if project has an ID
      if (!project?.project_id) {
        return;
      }

      // Check if we have selected lots (for new MTO)
      if (!currentMtoId && (!selectedLots || selectedLots.length === 0)) {
        return;
      }

      // Validate quantities before saving
      const validationErrors: string[] = [];
      Object.keys(categoryItems).forEach((category) => {
        categoryItems[category as keyof CategoryItems].forEach(
          (row: CategoryRow, rowIndex: number) => {
            if (row.item) {
              // Check for empty quantity
              if (
                row.quantity === "" ||
                row.quantity === null ||
                row.quantity === undefined
              ) {
                validationErrors.push(
                  `Item "${
                    row.item.name || row.item.item_id
                  }" in ${category} (row ${
                    rowIndex + 1
                  }) has an empty quantity. Please enter a quantity.`,
                );
              }
              // Check for zero or negative quantity
              else if (parseInt(row.quantity as string) <= 0) {
                validationErrors.push(
                  `Item "${
                    row.item.name || row.item.item_id
                  }" in ${category} (row ${rowIndex + 1}) has a quantity of ${
                    row.quantity
                  }. Quantity must be greater than 0.`,
                );
              }
            }
          },
        );
      });

      // If there are validation errors, show them and stop saving
      if (validationErrors.length > 0) {
        setSaveStatus("error");
        validationErrors.forEach((error) => {
          toast.warning(error);
        });
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
        return;
      }

      setSaveStatus("saving");

      // Collect all items from all categories
      const items: {
        item_id: string;
        quantity: number;
        notes: string | null;
      }[] = [];
      Object.keys(categoryItems).forEach((category) => {
        categoryItems[category as keyof CategoryItems].forEach(
          (row: CategoryRow) => {
            if (row.item && row.quantity) {
              const quantity = parseInt(row.quantity as string);
              if (quantity > 0) {
                items.push({
                  item_id: row.item.id,
                  quantity: quantity,
                  notes: row.notes || null,
                });
              }
            }
          },
        );
      });

      // Check if we're editing an existing MTO or creating a new one
      if (currentMtoId) {
        // Editing existing MTO - use PATCH
        const requestData = {
          notes: notes || null,
          items: items,
        };

        const response = await axios.patch(
          `/api/materials_to_order/${currentMtoId}`,
          requestData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data.status) {
          if (!silent) {
            toast.success("Materials to order updated successfully!");
          }
          // Update the local state with the updated data
          setMaterialsToOrderData(response.data.data);
          setMediaFiles(response.data.data?.media || []);

          // Update snapshot after successful save
          setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: true }));
          dataSnapshotRef.current = createSnapshot(
            categoryItems,
            notes,
            selectedLots,
          );
          setTimeout(() => {
            setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: false }));
          }, 50);

          setSaveStatus("saved");

          // Reset to idle after 2 seconds
          setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } else {
          setSaveStatus("error");
          if (!silent) {
            toast.error(
              response.data.message || "Failed to update materials to order.",
            );
          }
          setTimeout(() => {
            setSaveStatus("idle");
          }, 3000);
        }
      } else {
        // Creating new MTO - use POST
        const requestData = {
          project_id: project.project_id,
          notes: notes || null,
          lot_ids: selectedLots.map((lot) => lot.lot_id),
          items: items,
        };

        const response = await axios.post(
          "/api/materials_to_order/create",
          requestData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data.status) {
          if (!silent) {
            toast.success("Materials to order created successfully!");
          }
          // Store the new MTO ID for future edits
          setCurrentMtoId(response.data.data.id);
          setMediaFiles(response.data.data?.media || []);

          // Update snapshot after successful save
          setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: true }));
          dataSnapshotRef.current = createSnapshot(
            categoryItems,
            notes,
            selectedLots,
          );
          setTimeout(() => {
            setLoadingState((prev) => ({ ...prev, isUpdatingFromApi: false }));
          }, 50);

          setSaveStatus("saved");

          // Reset to idle after 2 seconds
          setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } else {
          setSaveStatus("error");
          if (!silent) {
            toast.error(
              response.data.message || "Failed to create materials to order.",
            );
          }
          setTimeout(() => {
            setSaveStatus("idle");
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error saving materials:", err);
      setSaveStatus("error");
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to save materials to order. Please try again.";
        if (!silent) {
          toast.error(errorMessage);
        }
      } else {
        if (!silent) {
          toast.error("Failed to save materials to order. Please try again.");
        }
      }
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };

  const handleSaveMaterials = async () => {
    await saveMaterials(false); // Not silent, show toasts
  };

  // Handle file selection - upload immediately
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Upload files immediately
    await handleUploadMedia(files);

    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload media files
  const handleUploadMedia = async (filesToUpload: File[] | null = null) => {
    const files = filesToUpload || selectedFiles;

    if (!files || files.length === 0) {
      toast.warning("Please select files to upload.");
      return;
    }

    setUploadingMedia(true);
    try {
      // If this is a brand new MTO (no ID yet), create a minimal draft MTO first
      // so uploads can be attached without forcing the user to save line items/notes.
      let mtoId = currentMtoId;
      if (!mtoId) {
        if (!project?.project_id) {
          toast.error("Project ID is missing. Cannot upload files.");
          return;
        }
        if (!selectedLots || selectedLots.length === 0) {
          toast.warning(
            "Please select at least one lot before uploading files.",
          );
          return;
        }

        const draftResponse = await axios.post(
          "/api/materials_to_order/create",
          {
            project_id: project.project_id,
            lot_ids: selectedLots.map((lot) => lot.lot_id),
            // Intentionally do NOT include items/notes here:
            // user should still explicitly Save for those changes.
            notes: null,
            items: [],
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!draftResponse.data.status) {
          toast.error(
            draftResponse.data.message ||
              "Failed to create draft materials to order.",
          );
          return;
        }

        mtoId = draftResponse.data.data.id;
        setCurrentMtoId(mtoId);
        setMaterialsToOrderData(draftResponse.data.data);
        setMediaFiles(draftResponse.data.data?.media || []);
      }

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      // Show progress toast
      showProgressToast(files.length);

      const response = await axios.post(
        `/api/uploads/materials-to-order/${mtoId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: getUploadProgressHandler(files.length),
        },
      );

      if (response.data.status) {
        completeUpload(files.length);
        // Refresh media files
        const mtoResponse = await axios.get(
          `/api/materials_to_order/${mtoId}`,
          {
            withCredentials: true,
          },
        );
        if (mtoResponse.data.status) {
          setMediaFiles(mtoResponse.data.data?.media || []);
          setMaterialsToOrderData(mtoResponse.data.data);
        }
        setSelectedFiles([]);
      } else {
        dismissProgressToast();
        toast.error(response.data.message || "Failed to upload files.");
      }
    } catch (err) {
      console.error("Error uploading media:", err);
      dismissProgressToast();
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to upload files. Please try again.";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to upload files. Please try again.");
      }
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete media file
  const handleDeleteMedia = async (mediaId: string) => {
    if (!currentMtoId) {
      toast.error("Cannot delete media. MTO ID is missing.");
      return;
    }

    setDeletingMediaId(mediaId);
    try {
      const response = await axios.delete(
        `/api/uploads/materials-to-order/${currentMtoId}?mediaId=${mediaId}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.status) {
        toast.success("File deleted successfully!");
        // Remove from local state
        setMediaFiles((prev) => prev.filter((media) => media.id !== mediaId));
        // Refresh MTO data
        const mtoResponse = await axios.get(
          `/api/materials_to_order/${currentMtoId}`,
          {
            withCredentials: true,
          },
        );
        if (mtoResponse.data.status) {
          setMaterialsToOrderData(mtoResponse.data.data);
        }
      } else {
        toast.error(response.data.message || "Failed to delete file.");
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete file. Please try again.";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to delete file. Please try again.");
      }
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // View existing file from server
  const handleViewExistingFile = (file: MediaFile) => {
    const fileUrl = `/${file.url}`;
    setSelectedFile({
      name: file.filename,
      type: file.mime_type || "application/octet-stream",
      size: file.size || 0,
      url: fileUrl,
      isExisting: true,
    });
    setViewFileModal(true);
  };

  return (
    <div>
      {/* Title and Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Materials to Order
        </h2>
        <div className="flex gap-3">
          {currentMtoId && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                <Trash className="w-4 h-4" />
                Delete Materials to Order
              </button>
            </>
          )}

          <button
            onClick={() => exportToExcel(convertCategoryItemsToExportRows)}
            disabled={!hasItems || isExporting}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </button>
          <button
            onClick={handleSaveMaterials}
            disabled={saveStatus === "saving" || !canSave}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lot Selection or Existing MTO Info */}
      {project?.lots && project.lots.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
          {!selectedLotHasExistingMto || lotsWithSameMtoId.length === 0 ? (
            // Show lot selection for new MTO
            <>
              <h3 className="text-md font-semibold text-slate-700 mb-3">
                Select Lots
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectableLots.map((lot) => (
                  <label
                    key={lot.id}
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-slate-100 rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLots.some(
                        (l) => l.lot_id === lot.lot_id,
                      )}
                      onChange={() => handleLotToggle(lot)}
                      className="w-4 h-4 text-secondary border-slate-300 rounded focus:ring-secondary"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        {lot.lot_id}
                      </span>
                      {lot.name && (
                        <p className="text-xs text-slate-500">{lot.name}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {selectedLots.length} lot(s) selected
              </p>
            </>
          ) : (
            // Show existing MTO info
            <>
              <h3 className="text-md font-semibold text-slate-700 mb-3">
                Materials List Already Created
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 mb-3">
                  This materials list is already created for the following lots:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sortedLotsWithSameMtoId.map((lot) => (
                    <div
                      key={lot.lot_id}
                      className="flex items-center space-x-2 p-2 bg-white rounded-md border border-slate-200"
                    >
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {lot.lot_id}
                        </span>
                        {lot.name && (
                          <p className="text-xs text-slate-500">{lot.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {sortedLotsWithSameMtoId.length} lot(s) in this materials list
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Category Sections - Non-Collapsible */}
      <div className="space-y-6">
        {/* Sheet Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-700">
                Sheet
              </span>
              {categoryItems.sheet.filter((row) => row.item && row.quantity)
                .length > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-secondary bg-secondary/10 rounded-full">
                  {
                    categoryItems.sheet.filter(
                      (row) => row.item && row.quantity,
                    ).length
                  }
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {categoryItems.sheet.filter((row) => row.item && row.quantity)
              .length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Image
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Brand
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Color
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Finish
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Dimensions
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.sheet.map(
                      (row, rowIndex) =>
                        row.item && (
                          <tr
                            key={rowIndex}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">
                              {row.item.image?.url ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                                  <Image
                                    src={`/${row.item.image.url}`}
                                    alt={row.item.id}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.sheet?.brand || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.sheet?.color || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.sheet?.finish || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.sheet?.dimensions || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.measurement_unit || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantity ?? ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    "sheet",
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => removeItemRow("sheet", rowIndex)}
                                className="cursor-pointer text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Search - Always Visible */}
            <div className="mt-4">
              {categoryItems.sheet.map(
                (row, rowIndex) =>
                  !row.item && (
                    <div key={rowIndex} className="relative">
                      <input
                        type="text"
                        value={
                          searchTerms[getSearchTermKey("sheet", rowIndex)] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange("sheet", rowIndex, e.target.value)
                        }
                        onFocus={() =>
                          searchItems(
                            "sheet",
                            searchTerms[getSearchTermKey("sheet", rowIndex)] ||
                              "",
                            rowIndex,
                          )
                        }
                        placeholder="Search for sheet items..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {showSearchDropdown.sheet?.[rowIndex] && (
                        <div className="absolute z-10 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto w-full">
                          {getFilteredSearchResults("sheet").length > 0 ? (
                            getFilteredSearchResults("sheet").map((item) => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  handleItemSelect("sheet", rowIndex, item)
                                }
                                className="cursor-pointer w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {item.image?.url ? (
                                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                                      <Image
                                        src={`/${item.image.url}`}
                                        alt={item.id}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                      <Package className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-800 mb-1">
                                      {item.sheet?.brand || "N/A"} -{" "}
                                      {item.sheet?.color || "N/A"} -{" "}
                                      {item.sheet?.finish || "N/A"} -{" "}
                                      {item.sheet?.dimensions || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-sm text-slate-600">
                                <div className="mb-2">No results found</div>
                                <div className="text-xs">
                                  Item may have already been added or does not
                                  exist.
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAddItemModalCategory("sheet");
                                  setShowAddItemModal(true);
                                }}
                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Item
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>

        {/* Edging Tape Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-700">
                Edging Tape
              </span>
              {categoryItems.edging_tape.filter(
                (row) => row.item && row.quantity,
              ).length > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-secondary bg-secondary/10 rounded-full">
                  {
                    categoryItems.edging_tape.filter(
                      (row) => row.item && row.quantity,
                    ).length
                  }
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {categoryItems.edging_tape.filter((row) => row.item && row.quantity)
              .length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Image
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Brand
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Color
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Finish
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Dimensions
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.edging_tape.map(
                      (row, rowIndex) =>
                        row.item && (
                          <tr
                            key={rowIndex}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">
                              {row.item.image?.url ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                                  <Image
                                    src={`/${row.item.image.url}`}
                                    alt={row.item.id}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.edging_tape?.brand || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.edging_tape?.color || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.edging_tape?.finish || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.edging_tape?.dimensions || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.measurement_unit || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantity ?? ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    "edging_tape",
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() =>
                                  removeItemRow("edging_tape", rowIndex)
                                }
                                className="cursor-pointer text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Item Input */}
            <div className="space-y-2">
              {categoryItems.edging_tape.map(
                (row, rowIndex) =>
                  !row.item && (
                    <div key={rowIndex} className="relative">
                      <input
                        type="text"
                        value={
                          searchTerms[
                            getSearchTermKey("edging_tape", rowIndex)
                          ] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "edging_tape",
                            rowIndex,
                            e.target.value,
                          )
                        }
                        onFocus={() =>
                          searchItems(
                            "edging_tape",
                            searchTerms[
                              getSearchTermKey("edging_tape", rowIndex)
                            ] || "",
                            rowIndex,
                          )
                        }
                        placeholder="Search for edging tape items..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {showSearchDropdown.edging_tape?.[rowIndex] && (
                        <div className="absolute mt-1 z-10 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto w-full">
                          {getFilteredSearchResults("edging_tape").length >
                          0 ? (
                            getFilteredSearchResults("edging_tape").map(
                              (item) => (
                                <button
                                  key={item.id}
                                  onClick={() =>
                                    handleItemSelect(
                                      "edging_tape",
                                      rowIndex,
                                      item,
                                    )
                                  }
                                  className="cursor-pointer w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {item.image?.url ? (
                                      <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                                        <Image
                                          src={`/${item.image.url}`}
                                          alt={item.id}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-slate-400" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-slate-800 mb-1">
                                        {item.edging_tape?.brand || "N/A"} -{" "}
                                        {item.edging_tape?.color || "N/A"} -{" "}
                                        {item.edging_tape?.finish || "N/A"} -{" "}
                                        {item.edging_tape?.dimensions || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ),
                            )
                          ) : (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-sm text-slate-600">
                                <div className="mb-2">No results found</div>
                                <div className="text-xs">
                                  Item may have already been added or does not
                                  exist.
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAddItemModalCategory("edging_tape");
                                  setShowAddItemModal(true);
                                }}
                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Item
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>

        {/* Handle Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-700">
                Handle
              </span>
              {categoryItems.handle.filter((row) => row.item && row.quantity)
                .length > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-secondary bg-secondary/10 rounded-full">
                  {
                    categoryItems.handle.filter(
                      (row) => row.item && row.quantity,
                    ).length
                  }
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {categoryItems.handle.filter((row) => row.item && row.quantity)
              .length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Image
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Brand
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Color
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Type
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Material
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Dimensions
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.handle.map(
                      (row, rowIndex) =>
                        row.item && (
                          <tr
                            key={rowIndex}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">
                              {row.item.image?.url ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                                  <Image
                                    src={`/${row.item.image.url}`}
                                    alt={row.item.id}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.handle?.brand || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.handle?.color || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.handle?.type || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.handle?.material || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.handle?.dimensions || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.measurement_unit || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantity ?? ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    "handle",
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() =>
                                  removeItemRow("handle", rowIndex)
                                }
                                className="cursor-pointer text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Item Input */}
            <div className="space-y-2">
              {categoryItems.handle.map(
                (row, rowIndex) =>
                  !row.item && (
                    <div key={rowIndex} className="relative">
                      <input
                        type="text"
                        value={
                          searchTerms[getSearchTermKey("handle", rowIndex)] ||
                          ""
                        }
                        onChange={(e) =>
                          handleSearchChange("handle", rowIndex, e.target.value)
                        }
                        onFocus={() =>
                          searchItems(
                            "handle",
                            searchTerms[getSearchTermKey("handle", rowIndex)] ||
                              "",
                            rowIndex,
                          )
                        }
                        placeholder="Search for handle items..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {showSearchDropdown.handle?.[rowIndex] && (
                        <div className="absolute z-10 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto w-full">
                          {getFilteredSearchResults("handle").length > 0 ? (
                            getFilteredSearchResults("handle").map((item) => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  handleItemSelect("handle", rowIndex, item)
                                }
                                className="cursor-pointer w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {item.image?.url ? (
                                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                                      <Image
                                        src={`/${item.image.url}`}
                                        alt={item.id}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                      <Package className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-800 mb-1">
                                      {item.handle?.brand || "N/A"} -{" "}
                                      {item.handle?.color || "N/A"} -{" "}
                                      {item.handle?.type || "N/A"} -{" "}
                                      {item.handle?.dimensions || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-sm text-slate-600">
                                <div className="mb-2">No results found</div>
                                <div className="text-xs">
                                  Item may have already been added or does not
                                  exist.
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAddItemModalCategory("handle");
                                  setShowAddItemModal(true);
                                }}
                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Item
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>

        {/* Hardware Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-700">
                Hardware
              </span>
              {categoryItems.hardware.filter((row) => row.item && row.quantity)
                .length > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-secondary bg-secondary/10 rounded-full">
                  {
                    categoryItems.hardware.filter(
                      (row) => row.item && row.quantity,
                    ).length
                  }
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {categoryItems.hardware.filter((row) => row.item && row.quantity)
              .length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Image
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Brand
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Name
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Sub Category
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Dimensions
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.hardware.map(
                      (row, rowIndex) =>
                        row.item && (
                          <tr
                            key={rowIndex}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">
                              {row.item.image?.url ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                                  <Image
                                    src={`/${row.item.image.url}`}
                                    alt={row.item.id}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.hardware?.brand || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.hardware?.name || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.hardware?.sub_category || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.hardware?.dimensions || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.measurement_unit || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantity ?? ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    "hardware",
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() =>
                                  removeItemRow("hardware", rowIndex)
                                }
                                className="cursor-pointer text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Item Input */}
            <div className="space-y-2">
              {categoryItems.hardware.map(
                (row, rowIndex) =>
                  !row.item && (
                    <div key={rowIndex} className="relative">
                      <input
                        type="text"
                        value={
                          searchTerms[getSearchTermKey("hardware", rowIndex)] ||
                          ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "hardware",
                            rowIndex,
                            e.target.value,
                          )
                        }
                        onFocus={() =>
                          searchItems(
                            "hardware",
                            searchTerms[
                              getSearchTermKey("hardware", rowIndex)
                            ] || "",
                            rowIndex,
                          )
                        }
                        placeholder="Search for hardware items..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {showSearchDropdown.hardware?.[rowIndex] && (
                        <div className="absolute mt-1 z-10 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto w-full">
                          {getFilteredSearchResults("hardware").length > 0 ? (
                            getFilteredSearchResults("hardware").map((item) => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  handleItemSelect("hardware", rowIndex, item)
                                }
                                className="cursor-pointer w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {item.image?.url ? (
                                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                                      <Image
                                        src={`/${item.image.url}`}
                                        alt={item.id}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                      <Package className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-800 mb-1">
                                      {item.hardware?.brand || "N/A"} -{" "}
                                      {item.hardware?.name || "N/A"} -{" "}
                                      {item.hardware?.sub_category || "N/A"} -{" "}
                                      {item.hardware?.dimensions || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-sm text-slate-600">
                                <div className="mb-2">No results found</div>
                                <div className="text-xs">
                                  Item may have already been added or does not
                                  exist.
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAddItemModalCategory("hardware");
                                  setShowAddItemModal(true);
                                }}
                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Item
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>

        {/* Accessory Section */}
        <div className="border border-slate-200 rounded-lg bg-white">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-700">
                Accessory
              </span>
              {categoryItems.accessory.filter((row) => row.item && row.quantity)
                .length > 0 && (
                <span className="px-2 py-1 text-xs font-medium text-secondary bg-secondary/10 rounded-full">
                  {
                    categoryItems.accessory.filter(
                      (row) => row.item && row.quantity,
                    ).length
                  }
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {categoryItems.accessory.filter((row) => row.item && row.quantity)
              .length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Image
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Name
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.accessory.map(
                      (row, rowIndex) =>
                        row.item && (
                          <tr
                            key={rowIndex}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">
                              {row.item.image?.url ? (
                                <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-100">
                                  <Image
                                    src={`/${row.item.image.url}`}
                                    alt={row.item.id}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.accessory?.name || "-"}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              {row.item.measurement_unit || "-"}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantity ?? ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    "accessory",
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() =>
                                  removeItemRow("accessory", rowIndex)
                                }
                                className="cursor-pointer text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Item Input */}
            <div className="space-y-2">
              {categoryItems.accessory.map(
                (row, rowIndex) =>
                  !row.item && (
                    <div key={rowIndex} className="relative">
                      <input
                        type="text"
                        value={
                          searchTerms[
                            getSearchTermKey("accessory", rowIndex)
                          ] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "accessory",
                            rowIndex,
                            e.target.value,
                          )
                        }
                        onFocus={() =>
                          searchItems(
                            "accessory",
                            searchTerms[
                              getSearchTermKey("accessory", rowIndex)
                            ] || "",
                            rowIndex,
                          )
                        }
                        placeholder="Search for accessory items..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {showSearchDropdown.accessory?.[rowIndex] && (
                        <div className="absolute mt-1 z-10 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto w-full">
                          {getFilteredSearchResults("accessory").length > 0 ? (
                            getFilteredSearchResults("accessory").map(
                              (item) => (
                                <button
                                  key={item.id}
                                  onClick={() =>
                                    handleItemSelect(
                                      "accessory",
                                      rowIndex,
                                      item,
                                    )
                                  }
                                  className="cursor-pointer w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {item.image?.url ? (
                                      <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-slate-100">
                                        <Image
                                          src={`/${item.image.url}`}
                                          alt={item.id}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-slate-400" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-slate-800 mb-1">
                                        {item.accessory?.name || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ),
                            )
                          ) : (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-sm text-slate-600">
                                <div className="mb-2">No results found</div>
                                <div className="text-xs">
                                  Item may have already been added or does not
                                  exist.
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAddItemModalCategory("accessory");
                                  setShowAddItemModal(true);
                                }}
                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Item
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && addItemModalCategory && (
        <AddItemModal
          setShowModal={setShowAddItemModal}
          supplierId="" // Materials to Order doesn't require a supplier
          onItemAdded={() => {
            // Clear cache and refresh search for the category after item is added
            const cacheKeys = Object.keys(itemCache).filter((key) =>
              key.startsWith(addItemModalCategory),
            );
            const updatedCache = { ...itemCache };
            cacheKeys.forEach((key) => {
              delete updatedCache[key];
            });
            setItemCache(updatedCache);

            // Refresh search results for the category
            if (addItemModalCategory) {
              // Clear search results to force a fresh fetch
              setSearchResults((prev) => ({
                ...prev,
                [addItemModalCategory]: [],
              }));

              // If there's an active search term, trigger a new search
              const activeSearchKeys = Object.keys(searchTerms).filter((key) =>
                key.startsWith(addItemModalCategory),
              );
              if (activeSearchKeys.length > 0) {
                activeSearchKeys.forEach((key) => {
                  const [category, rowIndex] = key.split("-");
                  const searchTerm = searchTerms[key];
                  if (searchTerm) {
                    searchItems(category, searchTerm, parseInt(rowIndex));
                  }
                });
              }
            }
          }}
        />
      )}

      {/* Media Upload Section */}
      <div className="mt-6">
        {/* Display Existing Files First */}
        {(() => {
          // Categorize files by type
          const categorizeFiles = () => {
            const images: MediaFile[] = [];
            const videos: MediaFile[] = [];
            const pdfs: MediaFile[] = [];
            const others: MediaFile[] = [];

            mediaFiles.forEach((file: MediaFile) => {
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

            return {
              images: images as MediaFile[],
              videos: videos as MediaFile[],
              pdfs: pdfs as MediaFile[],
              others: others as MediaFile[],
            };
          };

          const { images, videos, pdfs, others } = categorizeFiles();

          const toggleSection = (section: keyof ExpandedSections) => {
            setExpandedSections((prev) => ({
              ...prev,
              [section]: !prev[section],
            }));
          };

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
                    {files.map((file) => (
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
                              alt={file.filename}
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

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes related to this materials to order..."
          rows={4}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteRow(null);
        }}
        onConfirm={handleDeleteMaterials}
        deleteWithInput={true}
        heading="Materials to Order"
        comparingName={project?.project_id || ""}
        isDeleting={isDeleting}
        entityType="materials_to_order"
        message={
          <div>
            {pendingDeleteRow ? (
              <>
                <p className="mb-2">
                  This is the last item in the materials list. Removing it will
                  delete the entire materials to order list which is linked with
                  the following lots:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {materialsToOrderData?.lots?.map((lot) => (
                    <li key={lot.lot_id} className="text-sm">
                      {lot.lot_id} {lot.name && `- ${lot.name}`}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Please type the project number to confirm deletion.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  This materials to order list will be deleted and it&apos;s
                  linked with the following lots:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {materialsToOrderData?.lots?.map((lot) => (
                    <li key={lot.lot_id} className="text-sm">
                      {lot.lot_id} {lot.name && `- ${lot.name}`}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Please type the project number to confirm deletion.
                </p>
              </>
            )}
          </div>
        }
      />

      {/* File View Modal */}
      {viewFileModal && selectedFile && (
        <ViewMedia
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          setViewFileModal={setViewFileModal}
        />
      )}
    </div>
  );
}
