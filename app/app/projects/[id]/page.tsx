"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "@/components/sidebar";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Edit,
  Trash2,
  User,
  AlertTriangle,
  Plus,
  X,
  Trash,
  PanelsTopLeft,
  ChevronDown,
  SquareArrowOutUpRight,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { CiMenuKebab } from "react-icons/ci";
import { useRouter } from "next/navigation";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import { tabs } from "@/components/constants";
import StageTable from "../components/StageTable";
import MaterialSelection from "../components/MaterialSelection";
import SiteMeasurementsSection from "../components/SiteMeasurement";
import MaterialsToOrder from "../components/MaterialsToOrder";
import FileUploadSection from "../components/FileUploadSection";
import ViewMedia, { ViewFile } from "@/components/ViewMedia";
import AppHeader from "@/components/AppHeader";

// Type definitions
interface Client {
  id: string;
  name: string;
  type?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

interface Employee {
  id: string;
  employee_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

interface Lot {
  id: string;
  lot_id: string;
  name?: string;
  startDate?: string;
  installationDueDate?: string;
  status?: string;
  installer?: Employee;
  [key: string]: unknown;
}

interface Project {
  project_id: string;
  name: string;
  client?: Client;
  lots?: Lot[];
  [key: string]: unknown;
}

interface LotData {
  id: string;
  lot_id: string;
  name?: string;
  startDate?: string;
  installationDueDate?: string;
  status?: string;
  notes?: string;
  installer?: Employee;
  tabs?: Array<{
    id?: string;
    tab: string;
    notes?: string;
    files?: FileData[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface MaintenanceChecklist {
  prepared_by_office: boolean;
  prepared_by_production: boolean;
  delivered_to_site: boolean;
  installed: boolean;
}

interface FileData {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  type?: string;
  size: number;
  maintenance_checklist?: MaintenanceChecklist;
  [key: string]: unknown;
}

interface EditData {
  name?: string;
  startDate?: string;
  installationDueDate?: string;
  notes?: string;
  [key: string]: unknown;
}

interface ProjectEditData {
  name?: string;
  [key: string]: unknown;
}

interface NewLot {
  lotId: string;
  name: string;
  startDate: string;
  installationDueDate: string;
  notes: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<EditData>({});
  const [isProjectEditing, setIsProjectEditing] = useState(false);
  const [projectEditData, setProjectEditData] = useState<ProjectEditData>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showDeleteLotModal, setShowDeleteLotModal] = useState(false);
  const [isDeletingLot, setIsDeletingLot] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSitePhotoSubtab, setActiveSitePhotoSubtab] =
    useState("delivery");
  const [selectedLotData, setSelectedLotData] = useState<LotData | null>(null);

  // Client assignment states
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isAssigningClient, setIsAssigningClient] = useState(false);

  // Lot selector states
  const [isLotDropdownOpen, setIsLotDropdownOpen] = useState(false);
  const lotDropdownRef = useRef<HTMLDivElement>(null);

  // Lot creation states
  const [showAddLotForm, setShowAddLotForm] = useState(false);
  const [newLot, setNewLot] = useState<NewLot>({
    lotId: "",
    name: "",
    startDate: "",
    installationDueDate: "",
    notes: "",
  });
  const [isCreatingLot, setIsCreatingLot] = useState(false);

  // files upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  // Upload progress hook
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
      fileCount: number
    ) => (progressEvent: { loaded: number; total?: number }) => void;
  };

  // ViewMedia modal state (for SiteMeasurementsSection)
  const [viewFileModal, setViewFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ViewFile | null>(null);
  const [pageNumber, setPageNumber] = useState(1); // Used by ViewMedia component

  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

  // Notes auto-save debouncing states
  const [notesSavedIndicators, setNotesSavedIndicators] = useState(false);
  const notesDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Installer assignment states (installer is per-lot)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [installerSearchTerm, setInstallerSearchTerm] = useState("");
  const [showInstallerDropdown, setShowInstallerDropdown] = useState(false);
  const [isAssigningInstaller, setIsAssigningInstaller] = useState(false);

  // Status dropdown state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Maintenance checklist filter states
  const [filterPreparedByOffice, setFilterPreparedByOffice] = useState(false);
  const [filterPreparedByProduction, setFilterPreparedByProduction] =
    useState(false);
  const [filterDeliveredToSite, setFilterDeliveredToSite] = useState(false);
  const [filterInstalled, setFilterInstalled] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(`/api/project/${id}`, {
        withCredentials: true,
      });

      if (response.data.status) {
        const projectData = response.data.data;
        setProject(projectData);

        // CHECK: If we already have a selected lot, try to keep it selected
        if (selectedLot?.id || selectedLot?.lot_id) {
          const stillExists = projectData.lots?.find(
            (l: Lot) =>
              l.id === selectedLot.id || l.lot_id === selectedLot.lot_id
          );
          if (stillExists) {
            setSelectedLot(stillExists);
          } else {
            // Fallback if the current lot was deleted or doesn't exist
            // Get first lot in sorted order
            const sortedLots = [...(projectData.lots || [])].sort(
              (a: Lot, b: Lot) => {
                const getLotNumber = (lotId: string) => {
                  const match = lotId.match(/(\d+)$/);
                  return match ? parseInt(match[1], 10) : 0;
                };
                return getLotNumber(a.lot_id) - getLotNumber(b.lot_id);
              }
            );
            const firstLot = sortedLots.length > 0 ? sortedLots[0] : null;
            setSelectedLot(firstLot);
          }
        } else {
          // Initial load - get first lot in sorted order
          const sortedLots = [...(projectData.lots || [])].sort(
            (a: Lot, b: Lot) => {
              const getLotNumber = (lotId: string) => {
                const match = lotId.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
              };
              return getLotNumber(a.lot_id) - getLotNumber(b.lot_id);
            }
          );
          const firstLot = sortedLots.length > 0 ? sortedLots[0] : null;
          setSelectedLot(firstLot);
        }
      } else {
        setError(response.data.message || "Failed to fetch project data");
      }
    } catch (err) {
      console.error("API Error:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "An error occurred while fetching project data"
        );
      } else {
        setError("An error occurred while fetching project data");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLotData = useCallback(
    async (forceRefresh = false) => {
      // Only prevent fetching if we already have the data for this lot and it's not a force refresh
      if (
        selectedLotData &&
        selectedLotData.id === selectedLot?.id &&
        !forceRefresh
      ) {
        return;
      }

      if (!selectedLot?.id) return;

      try {
        setLoading(true);

        const response = await axios.get(`/api/lot/${selectedLot.id}`, {
          withCredentials: true,
        });

        if (response.data.status) {
          setSelectedLotData(response.data.data ? response.data.data : {});
        } else {
          setError(response.data.message || "Failed to fetch lot data");
        }
      } catch (err) {
        console.error("API Error:", err);
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "An error occurred while fetching lot data"
          );
        } else {
          setError("An error occurred while fetching lot data");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedLot?.id, selectedLotData]
  );

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get("/api/client/allnames", {
        withCredentials: true,
      });

      if (response.data.status) {
        setClients(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch clients");
      }
    } catch (err) {
      console.error("API Error:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            "Failed to fetch clients. Please try again."
        );
      } else {
        toast.error("Failed to fetch clients. Please try again.");
      }
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get("/api/employee/all", {
        withCredentials: true,
      });
      if (response.data.status) {
        setEmployees(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch employees");
      }
    } catch (err) {
      console.error("API Error:", err);
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            "Failed to fetch employees. Please try again."
        );
      } else {
        toast.error("Failed to fetch employees. Please try again.");
      }
    }
  }, []);

  const handleAssignClient = async (clientId: string) => {
    if (!project?.project_id) {
      toast.error("No project selected");
      return;
    }

    try {
      setIsAssigningClient(true);

      const response = await axios.patch(
        `/api/project/${project.project_id}`,
        {
          name: project.name,
          client_id: clientId,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        toast.success("Client assigned successfully");
        setShowClientDropdown(false);
        setClientSearchTerm("");
        // Refresh the project data to get updated client information
        fetchProject();
      } else {
        toast.error(response.data.message || "Failed to assign client");
      }
    } catch (error) {
      console.error("Error assigning client:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to assign client. Please try again."
        );
      } else {
        toast.error("Failed to assign client. Please try again.");
      }
    } finally {
      setIsAssigningClient(false);
    }
  };

  const handleRemoveClient = async () => {
    if (!project?.project_id) {
      toast.error("No project selected");
      return;
    }

    if (!project.client) {
      toast.error("No client assigned to remove");
      return;
    }

    try {
      setIsAssigningClient(true);

      const response = await axios.patch(
        `/api/project/${project.project_id}`,
        {
          name: project.name,
          client_id: null, // Remove client assignment
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        toast.success("Client removed successfully");
        // Refresh the project data to get updated client information
        fetchProject();
      } else {
        toast.error(response.data.message || "Failed to remove client");
      }
    } catch (error) {
      console.error("Error removing client:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to remove client. Please try again."
        );
      } else {
        toast.error("Failed to remove client. Please try again.");
      }
    } finally {
      setIsAssigningClient(false);
    }
  };

  const handleCreateLot = async () => {
    if (!newLot.name.trim()) {
      toast.error("Please enter a lot name");
      return;
    }

    if (!newLot.lotId.trim()) {
      toast.error("Please enter a lot ID");
      return;
    }

    if (!id || typeof id !== "string") {
      toast.error("Invalid project ID");
      return;
    }

    try {
      setIsCreatingLot(true);

      const lotData = {
        lot_id: `${id.toUpperCase()}-${newLot.lotId.trim()}`,
        name: newLot.name.trim(),
        project_id: id.toUpperCase(),
        startDate: newLot.startDate || "",
        installationDueDate: newLot.installationDueDate || "",
        notes: newLot.notes || "",
      };

      const response = await axios.post("/api/lot/create", lotData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.status) {
        toast.success("Lot created successfully");
        setShowAddLotForm(false);
        setNewLot({
          lotId: "",
          name: "",
          startDate: "",
          installationDueDate: "",
          notes: "",
        });
        // Reload the page to refresh project data
        router.refresh();
        fetchProject();
      } else {
        toast.error(response.data.message || "Failed to create lot");
      }
    } catch (error) {
      console.error("Error creating lot:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to create lot. Please try again."
        );
      } else {
        toast.error("Failed to create lot. Please try again.");
      }
    } finally {
      setIsCreatingLot(false);
    }
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchProject();
    }
  }, [id, fetchProject]);

  useEffect(() => {
    if (selectedLot && selectedLot.id) {
      fetchLotData();
    }
  }, [selectedLot?.id, fetchLotData]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (showInstallerDropdown && employees.length === 0) {
      fetchEmployees();
    }
  }, [showInstallerDropdown, employees.length, fetchEmployees]);

  // Reset filters when switching away from maintenance tab
  useEffect(() => {
    if (
      activeTab !== "site_photos" ||
      activeSitePhotoSubtab !== "maintenance"
    ) {
      setFilterPreparedByOffice(false);
      setFilterPreparedByProduction(false);
      setFilterDeliveredToSite(false);
      setFilterInstalled(false);
    }
  }, [activeTab, activeSitePhotoSubtab]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (notesDebounceTimer.current) {
        clearTimeout(notesDebounceTimer.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close "More Actions" dropdown when clicking outside
      if (showDropdown && !target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }

      // Close client dropdown when clicking outside
      if (showClientDropdown && !target.closest(".client-dropdown")) {
        setShowClientDropdown(false);
        setClientSearchTerm("");
      }

      // Close installer dropdown when clicking outside
      if (showInstallerDropdown && !target.closest(".installer-dropdown")) {
        setShowInstallerDropdown(false);
        setInstallerSearchTerm("");
      }

      // Close lot dropdown when clicking outside
      if (
        isLotDropdownOpen &&
        lotDropdownRef.current &&
        !lotDropdownRef.current.contains(target)
      ) {
        setIsLotDropdownOpen(false);
      }

      // Close status dropdown when clicking outside
      if (
        showStatusDropdown &&
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    if (
      showDropdown ||
      showClientDropdown ||
      isLotDropdownOpen ||
      showStatusDropdown ||
      showInstallerDropdown
    ) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [
    showDropdown,
    showClientDropdown,
    isLotDropdownOpen,
    showStatusDropdown,
    showInstallerDropdown,
  ]);

  const handleDeleteLotConfirm = async () => {
    if (!selectedLot?.id) return;
    try {
      setIsDeletingLot(true);
      const response = await axios.delete(`/api/lot/${selectedLot.id}`, {
        withCredentials: true,
      });
      if (response.data.status) {
        toast.success("Lot deleted successfully");
        setShowDeleteLotModal(false);
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to delete lot");
      }
    } catch (error) {
      console.error("Error deleting lot:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete lot. Please try again."
        );
      } else {
        toast.error("Failed to delete lot. Please try again.");
      }
    } finally {
      setIsDeletingLot(false);
    }
  };

  const handleDeleteProjectConfirm = async () => {
    if (!id || typeof id !== "string") return;
    try {
      setIsDeletingProject(true);

      const response = await axios.delete(`/api/project/${id}`, {
        withCredentials: true,
      });

      if (response.data.status) {
        toast.success("Project deleted successfully");
        setShowDeleteProjectModal(false);
        // Navigate back to projects list
        router.push("/app/projects");
      } else {
        toast.error(response.data.message || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete project. Please try again."
        );
      } else {
        toast.error("Failed to delete project. Please try again.");
      }
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleEdit = () => {
    if (selectedLotData) {
      setEditData({
        name: selectedLotData.name || "",
        startDate: selectedLotData.startDate || "",
        installationDueDate: selectedLotData.installationDueDate || "",
        notes: selectedLotData.notes || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsProjectEditing(false);
  };

  const handleProjectSave = async () => {
    if (!id || typeof id !== "string") return;
    try {
      setIsUpdating(true);
      const response = await axios.patch(
        `/api/project/${id}`,
        projectEditData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.status) {
        toast.success("Project updated successfully");
        setIsProjectEditing(false);
        setProjectEditData({});
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update project. Please try again."
        );
      } else {
        toast.error("Failed to update project. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);

      if (selectedLotData?.id) {
        // Update lot information
        const response = await axios.patch(
          `/api/lot/${selectedLotData.id}`,
          editData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.status) {
          toast.success("Lot updated successfully");
          // Refresh the lot data to get updated information
          fetchLotData(true);
        } else {
          toast.error(response.data.message || "Failed to update lot");
          return;
        }
      }

      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error("Error updating lot:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update lot. Please try again."
        );
      } else {
        toast.error("Failed to update lot. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedLotData?.id) return;
    try {
      const response = await axios.patch(
        `/api/lot/${selectedLotData.id}`,
        { status: newStatus },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        toast.success("Lot status updated successfully");
        setSelectedLotData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: newStatus,
          };
        });
        setShowStatusDropdown(false);
        fetchLotData(true);
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update status. Please try again."
        );
      } else {
        toast.error("Failed to update status. Please try again.");
      }
    }
  };

  const handleAssignInstaller = async (
    newInstallerEmployeeId: string | null
  ) => {
    if (!selectedLotData?.id) return;
    try {
      setIsAssigningInstaller(true);

      const response = await axios.patch(
        `/api/lot/${selectedLotData.id}`,
        { installer_id: newInstallerEmployeeId || null },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        toast.success(
          newInstallerEmployeeId ? "Installer assigned" : "Installer unassigned"
        );
        setShowInstallerDropdown(false);
        setInstallerSearchTerm("");
        fetchLotData(true);
      } else {
        toast.error(response.data.message || "Failed to update installer");
      }
    } catch (error) {
      console.error("Error updating installer:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update installer. Please try again."
        );
      } else {
        toast.error("Failed to update installer. Please try again.");
      }
    } finally {
      setIsAssigningInstaller(false);
    }
  };

  // Function to validate date inputs
  const validateDateInput = (
    startDate: string,
    endDate: string,
    fieldChanged: string
  ): boolean => {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (fieldChanged === "startDate" && start > end) {
      toast.error("Start date cannot be set after end date", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
      return false;
    }

    if (fieldChanged === "endDate" && end < start) {
      toast.error("End date cannot be set before start date", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
      return false;
    }

    return true;
  };

  // Lot selector handlers
  const handleLotSelect = (lot: Lot) => {
    setSelectedLot(lot);
    setIsLotDropdownOpen(false);
  };

  const filteredClients = clients.filter(
    (client: Client) =>
      (client.name || "")
        .toLowerCase()
        .includes(clientSearchTerm.toLowerCase()) ||
      (client.id || "")
        .toLowerCase()
        .includes(clientSearchTerm.toLowerCase()) ||
      (client.type || "").toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  // Tab to enum mapping
  const getTabEnum = (tabId: string): string => {
    // Handle site_photos subtabs
    if (tabId === "site_photos") {
      const subtabEnumMap: Record<string, string> = {
        delivery: "DELIVERY_PHOTOS",
        installation: "INSTALLATION_PHOTOS",
        maintenance: "MAINTENANCE_PHOTOS",
      };
      return subtabEnumMap[activeSitePhotoSubtab] || "DELIVERY_PHOTOS";
    }

    const tabEnumMap: Record<string, string> = {
      architecture_drawings: "ARCHITECTURE_DRAWINGS",
      appliances_specifications: "APPLIANCES_SPECIFICATIONS",
      cabinetry_drawings: "CABINETRY_DRAWINGS",
      changes_to_do: "CHANGES_TO_DO",
      site_measurements: "SITE_MEASUREMENTS",
      material_selection: "MATERIAL_SELECTION",
      site_photos: "SITE_PHOTOS",
      finished_site_photos: "FINISHED_SITE_PHOTOS",
    };
    return tabEnumMap[tabId] || "";
  };

  // Get category slug for upload URL
  const getCategorySlug = (category: string): string => {
    const categoryMap: Record<string, string> = {
      ARCHITECTURE_DRAWINGS: "architecture_drawings",
      APPLIANCES_SPECIFICATIONS: "appliances_specifications",
      CABINETRY_DRAWINGS: "cabinetry_drawings",
      CHANGES_TO_DO: "changes_to_do",
      SITE_MEASUREMENTS: "site_measurements",
      SITE_PHOTOS: "site_photos",
      DELIVERY_PHOTOS: "delivery_photos",
      INSTALLATION_PHOTOS: "installation_photos",
      MAINTENANCE_PHOTOS: "maintenance_photos",
      FINISHED_SITE_PHOTOS: "finished_site_photos",
    };
    return categoryMap[category] || category.toLowerCase();
  };

  // Get files for current tab from lot data
  const getCurrentTabFiles = (): FileData[] => {
    if (!selectedLotData?.tabs || !activeTab) {
      return [];
    }

    const tabEnum = getTabEnum(activeTab);
    const currentTab = selectedLotData.tabs.find(
      (tab: { tab: string; files?: FileData[]; [key: string]: unknown }) =>
        tab.tab.toLowerCase() === tabEnum.toLowerCase()
    );

    return (currentTab?.files as FileData[]) || [];
  };

  // Get visible files (after filtering) for mark all functionality
  const getVisibleFiles = (): FileData[] => {
    let existingFiles = getCurrentTabFiles();

    // Filter files by checklist status if in maintenance photos tab
    if (
      activeTab === "site_photos" &&
      activeSitePhotoSubtab === "maintenance"
    ) {
      existingFiles = existingFiles.filter((file: FileData) => {
        const checklist = file.maintenance_checklist;

        // If no filters are selected, show all files
        if (
          !filterPreparedByOffice &&
          !filterPreparedByProduction &&
          !filterDeliveredToSite &&
          !filterInstalled
        ) {
          return true;
        }

        // Check if file matches any selected filter
        let matches = false;

        if (filterPreparedByOffice && checklist?.prepared_by_office) {
          matches = true;
        }
        if (filterPreparedByProduction && checklist?.prepared_by_production) {
          matches = true;
        }
        if (filterDeliveredToSite && checklist?.delivered_to_site) {
          matches = true;
        }
        if (filterInstalled && checklist?.installed) {
          matches = true;
        }

        return matches;
      });
    }

    return existingFiles;
  };

  // Calculate checklist statistics (percentages)
  const getChecklistStatistics = () => {
    if (
      activeTab !== "site_photos" ||
      activeSitePhotoSubtab !== "maintenance"
    ) {
      return {
        preparedByOffice: 0,
        preparedByProduction: 0,
        deliveredToSite: 0,
        installed: 0,
      };
    }

    const allFiles = getCurrentTabFiles();
    const totalFiles = allFiles.length;

    if (totalFiles === 0) {
      return {
        preparedByOffice: 0,
        preparedByProduction: 0,
        deliveredToSite: 0,
        installed: 0,
      };
    }

    let preparedByOfficeCount = 0;
    let preparedByProductionCount = 0;
    let deliveredToSiteCount = 0;
    let installedCount = 0;

    allFiles.forEach((file: FileData) => {
      const checklist = file.maintenance_checklist;
      if (checklist?.prepared_by_office) preparedByOfficeCount++;
      if (checklist?.prepared_by_production) preparedByProductionCount++;
      if (checklist?.delivered_to_site) deliveredToSiteCount++;
      if (checklist?.installed) installedCount++;
    });

    return {
      preparedByOffice: Math.round((preparedByOfficeCount / totalFiles) * 100),
      preparedByProduction: Math.round(
        (preparedByProductionCount / totalFiles) * 100
      ),
      deliveredToSite: Math.round((deliveredToSiteCount / totalFiles) * 100),
      installed: Math.round((installedCount / totalFiles) * 100),
    };
  };

  // Mark all visible files with a specific stage (following hierarchy)
  const handleMarkAll = async (stage: string) => {
    const visibleFiles = getVisibleFiles();

    if (visibleFiles.length === 0) {
      toast.info("No files to mark");
      return;
    }

    // Determine checklist values based on stage (following hierarchy)
    const checklistValues = {
      prepared_by_office: false,
      prepared_by_production: false,
      delivered_to_site: false,
      installed: false,
    };

    if (stage === "preparedByOffice") {
      checklistValues.prepared_by_office = true;
    } else if (stage === "preparedByProduction") {
      checklistValues.prepared_by_office = true;
      checklistValues.prepared_by_production = true;
    } else if (stage === "deliveredToSite") {
      checklistValues.prepared_by_office = true;
      checklistValues.prepared_by_production = true;
      checklistValues.delivered_to_site = true;
    } else if (stage === "installed") {
      checklistValues.prepared_by_office = true;
      checklistValues.prepared_by_production = true;
      checklistValues.delivered_to_site = true;
      checklistValues.installed = true;
    }

    try {
      // Update all visible files
      const updatePromises = visibleFiles.map((file: FileData) =>
        axios.post(
          `/api/maintenance_checklist/upsert`,
          {
            lot_file_id: file.id,
            prepared_by_office: checklistValues.prepared_by_office,
            prepared_by_production: checklistValues.prepared_by_production,
            delivered_to_site: checklistValues.delivered_to_site,
            installed: checklistValues.installed,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      await Promise.all(updatePromises);
      toast.success(
        `Marked all ${visibleFiles.length} file(s) as ${
          stage === "preparedByOffice"
            ? "Prepared by Office"
            : stage === "preparedByProduction"
            ? "Prepared by Production"
            : stage === "deliveredToSite"
            ? "Delivered to Site"
            : "Installed"
        }`
      );

      // Refresh lot data to get updated files
      fetchLotData(true);
    } catch (error) {
      console.error("Error marking all files:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to mark all files. Please try again."
        );
      } else {
        toast.error("Failed to mark all files. Please try again.");
      }
    }
  };

  // Upload files function
  const handleUploadFiles = async (filesToUpload: File[] | null = null) => {
    const files = filesToUpload || uploadedFiles;

    try {
      setIsSavingUpload(true);

      if (!selectedLotData?.lot_id || !id || typeof id !== "string") {
        toast.error("Project or lot information missing");
        return;
      }

      if (!files || files.length === 0) {
        toast.error("No files selected");
        return;
      }

      const tabEnum = getTabEnum(activeTab);
      const categorySlug = getCategorySlug(tabEnum);

      const formData = new FormData();

      files.forEach((file: File) => {
        formData.append("file", file);
      });

      if (uploadNotes) {
        formData.append("notes", uploadNotes);
      }

      const apiUrl = `/api/uploads/lots/${id.toUpperCase()}/${
        selectedLotData.lot_id
      }/${categorySlug}`;

      // Show progress toast
      showProgressToast(files.length);

      const response = await axios.post(apiUrl, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: getUploadProgressHandler(files.length),
      });

      if (response.data.status) {
        // Complete upload and auto-dismiss after 5 seconds
        completeUpload(files.length);

        setUploadedFiles([]);
        setUploadNotes("");
        // Refresh lot data to get updated files
        fetchLotData(true);
      } else {
        // Dismiss progress toast and show error
        dismissProgressToast();
        toast.error(response.data.message || `Failed to upload files`);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      // Dismiss progress toast and show error
      dismissProgressToast();
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to upload files. Please try again."
        );
      } else {
        toast.error("Failed to upload files. Please try again.");
      }
    } finally {
      setIsSavingUpload(false);
    }
  };

  // Handle file selection - upload immediately
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Upload files immediately
    await handleUploadFiles(files);

    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  // Sort files by type: images, videos, PDFs, others
  const sortFilesByType = (files: FileData[]): FileData[] => {
    const images: FileData[] = [];
    const videos: FileData[] = [];
    const pdfs: FileData[] = [];
    const others: FileData[] = [];

    files.forEach((file: FileData) => {
      const mimeType = String(file.mime_type || file.type || "");
      const filename = String(file.filename || file.name || "");

      if (
        mimeType.includes("image") ||
        filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
      ) {
        images.push(file);
      } else if (
        mimeType.includes("video") ||
        filename.match(/\.(mp4|webm|ogg|mov|avi)$/i)
      ) {
        videos.push(file);
      } else if (mimeType.includes("pdf") || filename.endsWith(".pdf")) {
        pdfs.push(file);
      } else {
        others.push(file);
      }
    });

    return [...images, ...videos, ...pdfs, ...others];
  };

  // View existing file from server (for SiteMeasurementsSection)
  const handleViewExistingFile = (file: FileData) => {
    const fileUrl = `/${file.url}`;
    const allFiles = getCurrentTabFiles();
    const sortedFiles = sortFilesByType(allFiles);
    const currentIndex = sortedFiles.findIndex(
      (f: FileData) => f.id === file.id || f.filename === file.filename
    );

    setSelectedFile({
      name: file.filename,
      type: file.mime_type || "",
      size: file.size || 0,
      url: fileUrl,
      isExisting: true,
      id: file.id,
      allFiles: sortedFiles.map((f: FileData) => ({
        id: f.id,
        filename: f.filename,
        name: f.filename,
        url: f.url,
        mime_type: f.mime_type,
        type: f.mime_type,
        size: f.size,
      })),
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
    });
    setViewFileModal(true);
  };

  // Function to open delete confirmation
  const openDeleteFileConfirmation = (file: FileData) => {
    setFileToDelete(file);
    setShowDeleteFileModal(true);
  };

  // Updated delete handler
  const handleDeleteFile = async () => {
    if (
      !fileToDelete ||
      !selectedLotData?.lot_id ||
      !id ||
      typeof id !== "string"
    )
      return;

    try {
      setIsDeletingFile(fileToDelete.id);

      // Calculate tabEnum from activeTab
      const tabEnum = getTabEnum(activeTab);

      const response = await axios.delete(
        `/api/uploads/lots/${id.toUpperCase()}/${
          selectedLotData.lot_id
        }/${getCategorySlug(tabEnum)}/${fileToDelete.filename}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.status) {
        toast.success("File deleted successfully");
        setShowDeleteFileModal(false);
        setFileToDelete(null);
        // Refresh lot data to get updated files
        fetchLotData(true);
      } else {
        toast.error(response.data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete file. Please try again."
        );
      } else {
        toast.error("Failed to delete file. Please try again.");
      }
    } finally {
      setIsDeletingFile(null);
    }
  };

  // Debounced auto-save function for lot notes
  const saveLotNotes = async (notes: string) => {
    if (!selectedLotData?.lot_id || !selectedLotData?.id) return;

    try {
      const response = await axios.patch(
        `/api/lot/${selectedLotData.id}`,
        {
          name: selectedLotData.name,
          startDate:
            selectedLotData.startDate && selectedLotData.startDate.trim() !== ""
              ? selectedLotData.startDate
              : null,
          installationDueDate:
            selectedLotData.installationDueDate &&
            selectedLotData.installationDueDate.trim() !== ""
              ? selectedLotData.installationDueDate
              : null,
          notes: notes,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        // Show saved indicator
        setNotesSavedIndicators(true);
        setTimeout(() => {
          setNotesSavedIndicators(false);
        }, 2000);
      } else {
        toast.error(response.data.message || "Failed to save notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to save notes. Please try again."
        );
      } else {
        toast.error("Failed to save notes. Please try again.");
      }
    }
  };

  // Debounced handler for lot notes changes
  const handleLotNotesChange = (value: string) => {
    // Update local state immediately
    setSelectedLotData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        notes: value,
      };
    });

    // Clear existing timer
    if (notesDebounceTimer.current) {
      clearTimeout(notesDebounceTimer.current);
    }

    // Set new timer (1 second debounce, same as StageTable.jsx)
    notesDebounceTimer.current = setTimeout(() => {
      saveLotNotes(value);
      notesDebounceTimer.current = null;
    }, 1000);
  };

  const handleNotesSave = async (content: string) => {
    if (!selectedLotData?.tabs || !selectedLotData?.lot_id) return;
    try {
      let response;
      const tabEnum = getTabEnum(activeTab);
      // if lot_tab exists, update it, otherwise create it
      const lotTab = selectedLotData.tabs.find(
        (tab: { tab: string; id?: string; [key: string]: unknown }) =>
          tab.tab.toLowerCase() === tabEnum.toLowerCase()
      );
      if (lotTab?.id) {
        response = await axios.patch(
          `/api/lot_tab_notes/${lotTab.id}`,
          { notes: content },
          { withCredentials: true }
        );
      } else {
        response = await axios.post(
          `/api/lot_tab_notes/create`,
          {
            lot_id: selectedLotData.lot_id,
            tab: tabEnum,
            notes: content,
          },
          { withCredentials: true }
        );
      }
      if (response.data.status) {
        // Preserve scroll position before state update
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Update local state instead of refetching to prevent page reload
        // Only update if we need to (new tab created) or if ID changed
        const existingTab = selectedLotData.tabs.find(
          (tab: { tab: string; id?: string; [key: string]: unknown }) =>
            tab.tab.toLowerCase() === tabEnum.toLowerCase()
        );
        const isNewTab = !existingTab;
        const needsIdUpdate =
          existingTab &&
          response.data.data?.id &&
          existingTab.id !== response.data.data.id;

        if (isNewTab || needsIdUpdate) {
          setSelectedLotData((prevData) => {
            if (!prevData || !prevData.tabs) return prevData;

            const updatedTabs = [...prevData.tabs];
            const existingTabIndex = updatedTabs.findIndex(
              (tab: { tab: string; [key: string]: unknown }) =>
                tab.tab.toLowerCase() === tabEnum.toLowerCase()
            );

            if (existingTabIndex >= 0) {
              // Update existing tab (only if ID changed)
              if (needsIdUpdate) {
                updatedTabs[existingTabIndex] = {
                  ...updatedTabs[existingTabIndex],
                  notes: content,
                  id: response.data.data.id,
                };
              } else {
                return prevData; // No change needed
              }
            } else {
              // Add new tab
              updatedTabs.push({
                id: response.data.data?.id,
                lot_id: selectedLotData.lot_id,
                tab: tabEnum,
                notes: content,
              });
            }

            return {
              ...prevData,
              tabs: updatedTabs,
            };
          });

          // Restore scroll position after state update
          // Use both requestAnimationFrame and setTimeout to ensure it works after React re-renders
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.scrollTo(scrollX, scrollY);
            }, 0);
          });
        }
      } else {
        toast.error(response.data.message || "Failed to save notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to save notes");
      } else {
        toast.error("Failed to save notes");
      }
    }
  };

  return (
    <div className="bg-tertiary">
      <AppHeader />
      <div className="flex mt-16 h-[calc(100vh-64px)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading project details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !project ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PanelsTopLeft className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Project not found</p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => router.back()}
                    className="cursor-pointer p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    {isProjectEditing ? (
                      <input
                        type="text"
                        value={projectEditData.name || project.name}
                        onChange={(e) =>
                          setProjectEditData({
                            ...projectEditData,
                            name: e.target.value,
                          })
                        }
                        className="text-2xl font-bold text-slate-600 border border-slate-300 rounded-lg p-2"
                        placeholder="Enter project name"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-slate-600">
                        {project.name}
                      </h1>
                    )}
                    {!isEditing && project.lots && project.lots.length > 0 && (
                      <div className="relative" ref={lotDropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setIsLotDropdownOpen(!isLotDropdownOpen)
                          }
                          className="flex justify-between items-center gap-4 w-full text-sm text-slate-600 px-2 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <span>{selectedLot?.lot_id || "Select lot..."}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isLotDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isLotDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {project.lots && project.lots.length > 0 ? (
                              [...project.lots]
                                .sort((a: Lot, b: Lot) => {
                                  // Extract numbers from lot_id (e.g., "IK002-lot 1" -> 1)
                                  const getLotNumber = (lotId: string) => {
                                    const match = lotId.match(/(\d+)$/);
                                    return match ? parseInt(match[1], 10) : 0;
                                  };
                                  return (
                                    getLotNumber(a.lot_id) -
                                    getLotNumber(b.lot_id)
                                  );
                                })
                                .map((lot: Lot) => (
                                  <button
                                    key={lot.id}
                                    type="button"
                                    onClick={() => handleLotSelect(lot)}
                                    className={`cursor-pointer w-full text-left px-4 py-3 text-sm hover:bg-slate-100 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                      selectedLot?.id === lot.id
                                        ? "bg-slate-50 font-medium"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {lot.lot_id}
                                      </div>
                                      {lot.name && (
                                        <div className="text-xs text-slate-500">
                                          {lot.name}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                No lots available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {isEditing && project.lots && project.lots.length > 0 && (
                      <span className="text-sm bg-slate-200 rounded-lg p-2 text-slate-600">
                        {selectedLot?.lot_id || "Not specified"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEditing && !isProjectEditing ? (
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <CiMenuKebab className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">More Actions</span>
                        </button>

                        {showDropdown && (
                          <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setIsProjectEditing(true);
                                  setShowDropdown(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Project Name
                              </button>
                              <button
                                onClick={() => {
                                  handleEdit();
                                  setShowDropdown(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Lot Details
                              </button>

                              <button
                                onClick={() => {
                                  setShowAddLotForm(true);
                                  setShowDropdown(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                              >
                                <Plus className="w-4 h-4" />
                                Add Lot
                              </button>

                              <button
                                onClick={() => {
                                  setShowDeleteLotModal(true);
                                  setShowDropdown(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash className="w-4 h-4" />
                                Delete Lot:{" "}
                                {selectedLot?.lot_id || "Not specified"}
                              </button>

                              <button
                                onClick={() => {
                                  setShowDeleteProjectModal(true);
                                  setShowDropdown(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Project
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={
                            isProjectEditing ? handleProjectSave : handleSave
                          }
                          disabled={isUpdating}
                          className="cursor-pointer btn-primary flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="cursor-pointer btn-secondary flex items-center gap-2"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Project Tabs Navigation */}
                {project.lots && project.lots.length > 0 && (
                  <div className="mb-6">
                    <div className="border-b border-slate-200">
                      <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`cursor-pointer py-2 border-b-2 font-medium text-sm transition-colors ${
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
                  </div>
                )}

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  {(activeTab === "overview" ||
                    !project.lots ||
                    project.lots.length === 0) && (
                    <div>
                      <h2 className="text-xl font-semibold text-slate-700 mb-4">
                        Project Overview
                      </h2>

                      {project.lots && project.lots.length > 0 ? (
                        selectedLot && selectedLotData ? (
                          <>
                            {/* Overview - quick info cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                              {/* Lot Information */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div>
                                    <h3 className="text-base font-semibold text-slate-900">
                                      Lot Overview
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      Lot ID: {selectedLotData.lot_id || "—"}
                                    </p>
                                  </div>
                                  {!isEditing ? (
                                    <div
                                      className="relative"
                                      ref={statusDropdownRef}
                                    >
                                      <button
                                        onClick={() =>
                                          setShowStatusDropdown(
                                            !showStatusDropdown
                                          )
                                        }
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                          selectedLotData.status === "COMPLETED"
                                            ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                                            : selectedLotData.status ===
                                              "CANCELLED"
                                            ? "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                                            : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                                        }`}
                                      >
                                        <span>
                                          {selectedLotData.status ===
                                          "COMPLETED"
                                            ? "Completed"
                                            : selectedLotData.status ===
                                              "CANCELLED"
                                            ? "Cancelled"
                                            : "Active"}
                                        </span>
                                        <ChevronDown
                                          className={`w-3 h-3 transition-transform ${
                                            showStatusDropdown
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        />
                                      </button>
                                      {showStatusDropdown && (
                                        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden">
                                          <button
                                            onClick={() =>
                                              handleStatusUpdate("ACTIVE")
                                            }
                                            className={`cursor-pointer w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                                              selectedLotData.status ===
                                              "ACTIVE"
                                                ? "bg-blue-50 text-blue-800"
                                                : "text-slate-700"
                                            }`}
                                          >
                                            Active
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleStatusUpdate("COMPLETED")
                                            }
                                            className={`cursor-pointer w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                                              selectedLotData.status ===
                                              "COMPLETED"
                                                ? "bg-green-50 text-green-800"
                                                : "text-slate-700"
                                            }`}
                                          >
                                            Completed
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleStatusUpdate("CANCELLED")
                                            }
                                            className={`cursor-pointer w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                                              selectedLotData.status ===
                                              "CANCELLED"
                                                ? "bg-red-50 text-red-800"
                                                : "text-slate-700"
                                            }`}
                                          >
                                            Cancelled
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span
                                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium border ${
                                        selectedLotData.status === "COMPLETED"
                                          ? "bg-green-50 text-green-800 border-green-200"
                                          : selectedLotData.status ===
                                            "CANCELLED"
                                          ? "bg-red-50 text-red-800 border-red-200"
                                          : "bg-blue-50 text-blue-800 border-blue-200"
                                      }`}
                                    >
                                      {selectedLotData.status === "COMPLETED"
                                        ? "Completed"
                                        : selectedLotData.status === "CANCELLED"
                                        ? "Cancelled"
                                        : "Active"}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <div className="text-xs font-medium text-slate-600">
                                      Client name
                                    </div>
                                    <div className="mt-1">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={
                                            editData.name ||
                                            selectedLotData.name ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              name: e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                                          placeholder="Enter client name"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-900">
                                          {selectedLotData.name ||
                                            "Not specified"}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs font-medium text-slate-600">
                                        Start date
                                      </div>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={
                                            editData.startDate ||
                                            selectedLotData.startDate ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              startDate: e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent mt-1"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-900 mt-1">
                                          {selectedLotData.startDate
                                            ? new Date(
                                                selectedLotData.startDate
                                              ).toLocaleDateString("en-AU", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                              })
                                            : "Not set"}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-slate-600">
                                        Install due
                                      </div>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={
                                            editData.installationDueDate ||
                                            selectedLotData.installationDueDate ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              installationDueDate:
                                                e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent mt-1"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-900 mt-1">
                                          {selectedLotData.installationDueDate
                                            ? new Date(
                                                selectedLotData.installationDueDate
                                              ).toLocaleDateString("en-AU", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                              })
                                            : "Not set"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Client Information (project-level) */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <h3 className="text-base font-semibold text-slate-900">
                                    Client
                                  </h3>
                                </div>

                                {project.client ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <button
                                          onClick={() => {
                                            if (project.client) {
                                              const clientHref = `/app/clients/${project.client.client_id}`;
                                              router.push(clientHref);
                                            }
                                          }}
                                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors truncate"
                                        >
                                          {project.client.name}
                                        </button>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          ID: {project.client.id}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (project.client) {
                                              const clientHref = `/app/clients/${project.client.id}`;
                                              window.open(clientHref, "_blank");
                                            }
                                          }}
                                          className="p-1.5 rounded hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                                          title="Open client in new tab"
                                        >
                                          <SquareArrowOutUpRight className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                        {!isEditing && (
                                          <>
                                            <button
                                              onClick={() => {
                                                fetchClients();
                                                setShowClientDropdown(true);
                                                setClientSearchTerm("");
                                              }}
                                              className="p-1.5 rounded hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
                                              title="Change Client"
                                            >
                                              <Edit className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button
                                              onClick={handleRemoveClient}
                                              disabled={isAssigningClient}
                                              className="p-1.5 rounded hover:bg-red-100 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Remove Client"
                                            >
                                              <X className="w-4 h-4 text-red-600" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs font-medium text-slate-600">
                                          Email
                                        </div>
                                        <p className="text-sm text-slate-900 mt-1 truncate">
                                          {project.client.email || "—"}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-slate-600">
                                          Phone
                                        </div>
                                        <p className="text-sm text-slate-900 mt-1 truncate">
                                          {project.client.phone || "—"}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-xs font-medium text-slate-600">
                                        Type
                                      </div>
                                      <p className="text-sm text-slate-900 mt-1 capitalize">
                                        {project.client.type || "—"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-slate-500">
                                    <p className="text-sm mb-3">
                                      No client assigned
                                    </p>
                                    <button
                                      onClick={() => {
                                        fetchClients();
                                        setShowClientDropdown(true);
                                        setClientSearchTerm("");
                                      }}
                                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-white rounded-md transition-all duration-200 text-sm font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Assign Client
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Installer Information (lot-level) */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <h3 className="text-base font-semibold text-slate-900">
                                    Installer
                                  </h3>
                                </div>

                                {selectedLotData?.installer ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <button
                                          onClick={() => {
                                            if (selectedLotData.installer) {
                                              const installerHref = `/app/employees/${selectedLotData.installer.employee_id}`;
                                              router.push(installerHref);
                                            }
                                          }}
                                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors truncate"
                                        >
                                          {`${
                                            selectedLotData.installer
                                              .first_name || ""
                                          } ${
                                            selectedLotData.installer
                                              .last_name || ""
                                          }`.trim() || "Not specified"}
                                        </button>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          ID:{" "}
                                          {
                                            selectedLotData.installer
                                              .employee_id
                                          }
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedLotData.installer) {
                                              const installerHref = `/app/employees/${selectedLotData.installer.employee_id}`;
                                              window.open(
                                                installerHref,
                                                "_blank"
                                              );
                                            }
                                          }}
                                          className="p-1.5 rounded hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                                          title="Open installer in new tab"
                                        >
                                          <SquareArrowOutUpRight className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                        {!isEditing && (
                                          <>
                                            <button
                                              onClick={() => {
                                                setShowInstallerDropdown(true);
                                                setInstallerSearchTerm("");
                                              }}
                                              className="p-1.5 rounded hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
                                              title="Change Installer"
                                            >
                                              <Edit className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleAssignInstaller(null)
                                              }
                                              disabled={isAssigningInstaller}
                                              className="p-1.5 rounded hover:bg-red-100 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Remove Installer"
                                            >
                                              <X className="w-4 h-4 text-red-600" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs font-medium text-slate-600">
                                          Email
                                        </div>
                                        <p className="text-sm text-slate-900 mt-1 truncate">
                                          {selectedLotData.installer.email ||
                                            "—"}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-slate-600">
                                          Phone
                                        </div>
                                        <p className="text-sm text-slate-900 mt-1 truncate">
                                          {selectedLotData.installer.phone ||
                                            "—"}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-xs font-medium text-slate-600">
                                        Role
                                      </div>
                                      <p className="text-sm text-slate-900 mt-1 capitalize">
                                        {selectedLotData.installer.role || "—"}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-slate-500">
                                    <p className="text-sm mb-3">
                                      No installer assigned
                                    </p>
                                    <button
                                      onClick={() => {
                                        setShowInstallerDropdown(true);
                                        setInstallerSearchTerm("");
                                      }}
                                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-white rounded-md transition-all duration-200 text-sm font-medium"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Assign Installer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <h3 className="text-base font-semibold text-slate-900">
                                  Notes
                                </h3>
                                {notesSavedIndicators && (
                                  <span className="text-xs text-green-600 font-medium">
                                    Saved
                                  </span>
                                )}
                              </div>
                              <textarea
                                value={selectedLotData.notes || ""}
                                onChange={(e) =>
                                  handleLotNotesChange(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 bg-white resize-none text-sm"
                                rows={4}
                                placeholder="Add lot-specific notes (auto-saves)"
                              />
                              <p className="text-xs text-slate-500 mt-2">
                                Notes are saved automatically.
                              </p>
                            </div>

                            {/* Stages Section - Full Width */}
                            <StageTable
                              selectedLotData={selectedLotData}
                              validateDateInput={validateDateInput}
                              updateLotData={setSelectedLotData}
                            />
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
                            <p className="text-slate-600">
                              Loading lot details...
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-12">
                          <div className="mb-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Plus className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                              No Lots Added
                            </h3>
                            <p className="text-slate-600 mb-6">
                              This project doesn&apos;t have any lots yet. Add a
                              lot to get started with project management.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowAddLotForm(true)}
                            className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary/80 hover:bg-primary text-white rounded-md transition-all duration-200 text-base font-medium mx-auto"
                          >
                            <Plus className="w-5 h-5" />
                            Add First Lot
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "architecture_drawings" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Architecture Drawings
                        </h2>
                        <FileUploadSection
                          existingFiles={getCurrentTabFiles()}
                          handleFileSelect={handleFileSelect}
                          isSavingUpload={isSavingUpload}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          activeSitePhotoSubtab={activeSitePhotoSubtab}
                          selectedLotData={selectedLotData}
                          getTabEnum={getTabEnum}
                          handleNotesSave={handleNotesSave}
                        />
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "appliances_specifications" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Appliances and Specifications
                        </h2>
                        <FileUploadSection
                          existingFiles={getCurrentTabFiles()}
                          handleFileSelect={handleFileSelect}
                          isSavingUpload={isSavingUpload}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          activeSitePhotoSubtab={activeSitePhotoSubtab}
                          selectedLotData={selectedLotData}
                          getTabEnum={getTabEnum}
                          handleNotesSave={handleNotesSave}
                        />
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "material_selection" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Material Selection
                        </h2>
                        <MaterialSelection
                          lot_id={selectedLot?.lot_id || ""}
                          project_id={id}
                        />
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "cabinetry_drawings" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Cabinetry Drawings
                        </h2>
                        <FileUploadSection
                          existingFiles={getCurrentTabFiles()}
                          handleFileSelect={handleFileSelect}
                          isSavingUpload={isSavingUpload}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          activeSitePhotoSubtab={activeSitePhotoSubtab}
                          selectedLotData={selectedLotData}
                          getTabEnum={getTabEnum}
                          handleNotesSave={handleNotesSave}
                        />
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "changes_to_do" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Changes to Do
                        </h2>
                        <FileUploadSection
                          existingFiles={getCurrentTabFiles()}
                          handleFileSelect={handleFileSelect}
                          isSavingUpload={isSavingUpload}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          activeSitePhotoSubtab={activeSitePhotoSubtab}
                          selectedLotData={selectedLotData}
                          getTabEnum={getTabEnum}
                          handleNotesSave={handleNotesSave}
                        />
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "site_measurements" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Site Measurements
                        </h2>
                        <SiteMeasurementsSection
                          selectedLotData={selectedLotData}
                          fetchLotData={fetchLotData}
                          handleNotesSave={handleNotesSave}
                          handleViewExistingFile={handleViewExistingFile}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          getCurrentTabFiles={getCurrentTabFiles}
                        />
                      </div>
                    )}
                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "materials_to_order" && (
                      <div>
                        <MaterialsToOrder
                          project={project}
                          selectedLot={selectedLot}
                        />
                      </div>
                    )}
                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "site_photos" && (
                      <div>
                        {/* Subtabs Navigation */}
                        <div className="mb-6">
                          <div className="border-b border-slate-200">
                            <nav className="-mb-px flex space-x-6">
                              <button
                                onClick={() =>
                                  setActiveSitePhotoSubtab("delivery")
                                }
                                className={`cursor-pointer py-2 border-b-2 font-medium text-sm transition-colors ${
                                  activeSitePhotoSubtab === "delivery"
                                    ? "border-secondary text-secondary"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                Delivery Photos
                              </button>
                              <button
                                onClick={() =>
                                  setActiveSitePhotoSubtab("installation")
                                }
                                className={`cursor-pointer py-2 border-b-2 font-medium text-sm transition-colors ${
                                  activeSitePhotoSubtab === "installation"
                                    ? "border-secondary text-secondary"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                Installation Photos
                              </button>
                              <button
                                onClick={() =>
                                  setActiveSitePhotoSubtab("maintenance")
                                }
                                className={`cursor-pointer py-2 border-b-2 font-medium text-sm transition-colors ${
                                  activeSitePhotoSubtab === "maintenance"
                                    ? "border-secondary text-secondary"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                Maintenance Photos
                              </button>
                            </nav>
                          </div>
                        </div>

                        {/* Subtab Content */}
                        <div>
                          {activeSitePhotoSubtab === "delivery" && (
                            <div>
                              <FileUploadSection
                                existingFiles={getCurrentTabFiles()}
                                handleFileSelect={handleFileSelect}
                                isSavingUpload={isSavingUpload}
                                openDeleteFileConfirmation={
                                  openDeleteFileConfirmation
                                }
                                isDeletingFile={isDeletingFile}
                                activeTab={activeTab}
                                activeSitePhotoSubtab={activeSitePhotoSubtab}
                                selectedLotData={selectedLotData}
                                getTabEnum={getTabEnum}
                                handleNotesSave={handleNotesSave}
                              />
                            </div>
                          )}
                          {activeSitePhotoSubtab === "installation" && (
                            <div>
                              <FileUploadSection
                                existingFiles={getCurrentTabFiles()}
                                handleFileSelect={handleFileSelect}
                                isSavingUpload={isSavingUpload}
                                openDeleteFileConfirmation={
                                  openDeleteFileConfirmation
                                }
                                isDeletingFile={isDeletingFile}
                                activeTab={activeTab}
                                activeSitePhotoSubtab={activeSitePhotoSubtab}
                                selectedLotData={selectedLotData}
                                getTabEnum={getTabEnum}
                                handleNotesSave={handleNotesSave}
                              />
                            </div>
                          )}
                          {activeSitePhotoSubtab === "maintenance" && (
                            <div>
                              {/* Checklist Filter Section */}
                              <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                  Filter by Checklist Status
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                  {/* First Column - Filter Checkboxes */}
                                  <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterPreparedByOffice}
                                        onChange={(e) =>
                                          setFilterPreparedByOffice(
                                            e.target.checked
                                          )
                                        }
                                        className="w-4 h-4 text-secondary border-slate-300 rounded focus:ring-2 focus:ring-secondary cursor-pointer"
                                      />
                                      <span className="text-sm text-slate-700">
                                        Prepared by Office
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterPreparedByProduction}
                                        onChange={(e) =>
                                          setFilterPreparedByProduction(
                                            e.target.checked
                                          )
                                        }
                                        className="w-4 h-4 text-secondary border-slate-300 rounded focus:ring-2 focus:ring-secondary cursor-pointer"
                                      />
                                      <span className="text-sm text-slate-700">
                                        Prepared by Production
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterDeliveredToSite}
                                        onChange={(e) =>
                                          setFilterDeliveredToSite(
                                            e.target.checked
                                          )
                                        }
                                        className="w-4 h-4 text-secondary border-slate-300 rounded focus:ring-2 focus:ring-secondary cursor-pointer"
                                      />
                                      <span className="text-sm text-slate-700">
                                        Delivered to Site
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={filterInstalled}
                                        onChange={(e) =>
                                          setFilterInstalled(e.target.checked)
                                        }
                                        className="w-4 h-4 text-secondary border-slate-300 rounded focus:ring-2 focus:ring-secondary cursor-pointer"
                                      />
                                      <span className="text-sm text-slate-700">
                                        Installed
                                      </span>
                                    </label>
                                    {(filterPreparedByOffice ||
                                      filterPreparedByProduction ||
                                      filterDeliveredToSite ||
                                      filterInstalled) && (
                                      <button
                                        onClick={() => {
                                          setFilterPreparedByOffice(false);
                                          setFilterPreparedByProduction(false);
                                          setFilterDeliveredToSite(false);
                                          setFilterInstalled(false);
                                        }}
                                        className="text-sm text-slate-600 hover:text-slate-800 underline cursor-pointer"
                                      >
                                        Clear Filters
                                      </button>
                                    )}
                                  </div>

                                  {/* Second Column - Statistics */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">
                                        Prepared by Office
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">
                                        {
                                          getChecklistStatistics()
                                            .preparedByOffice
                                        }
                                        %
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">
                                        Prepared by Production
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">
                                        {
                                          getChecklistStatistics()
                                            .preparedByProduction
                                        }
                                        %
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">
                                        Delivered to Site
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">
                                        {
                                          getChecklistStatistics()
                                            .deliveredToSite
                                        }
                                        %
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-700">
                                        Installed
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">
                                        {getChecklistStatistics().installed}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Mark All Section */}
                              <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                  Mark All
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      handleMarkAll("preparedByOffice")
                                    }
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-secondary transition-colors cursor-pointer"
                                  >
                                    Mark All - Prepared by Office
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMarkAll("preparedByProduction")
                                    }
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-secondary transition-colors cursor-pointer"
                                  >
                                    Mark All - Prepared by Production
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMarkAll("deliveredToSite")
                                    }
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-secondary transition-colors cursor-pointer"
                                  >
                                    Mark All - Delivered to Site
                                  </button>
                                  <button
                                    onClick={() => handleMarkAll("installed")}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-secondary transition-colors cursor-pointer"
                                  >
                                    Mark All - Installed
                                  </button>
                                </div>
                              </div>
                              <FileUploadSection
                                existingFiles={getCurrentTabFiles()}
                                handleFileSelect={handleFileSelect}
                                isSavingUpload={isSavingUpload}
                                openDeleteFileConfirmation={
                                  openDeleteFileConfirmation
                                }
                                isDeletingFile={isDeletingFile}
                                activeTab={activeTab}
                                activeSitePhotoSubtab={activeSitePhotoSubtab}
                                filterPreparedByOffice={filterPreparedByOffice}
                                filterPreparedByProduction={
                                  filterPreparedByProduction
                                }
                                filterDeliveredToSite={filterDeliveredToSite}
                                filterInstalled={filterInstalled}
                                selectedLotData={selectedLotData}
                                getTabEnum={getTabEnum}
                                handleNotesSave={handleNotesSave}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {project.lots &&
                    project.lots.length > 0 &&
                    activeTab === "finished_site_photos" && (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">
                          Finished Site Photos
                        </h2>
                        <FileUploadSection
                          existingFiles={getCurrentTabFiles()}
                          handleFileSelect={handleFileSelect}
                          isSavingUpload={isSavingUpload}
                          openDeleteFileConfirmation={
                            openDeleteFileConfirmation
                          }
                          isDeletingFile={isDeletingFile}
                          activeTab={activeTab}
                          activeSitePhotoSubtab={activeSitePhotoSubtab}
                          selectedLotData={selectedLotData}
                          getTabEnum={getTabEnum}
                          handleNotesSave={handleNotesSave}
                        />
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Client Assignment Dropdown */}
        {showClientDropdown && (
          <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
            <div className="client-dropdown bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Assign Client
                </h3>
                <button
                  onClick={() => {
                    setShowClientDropdown(false);
                    setClientSearchTerm("");
                  }}
                  className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search clients by name, ID, or type..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredClients.length > 0 ? (
                  <div className="space-y-2">
                    {filteredClients.map((client: Client) => (
                      <button
                        key={client.id}
                        onClick={() => handleAssignClient(client.id)}
                        disabled={isAssigningClient}
                        className="cursor-pointer w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">
                              {client.name}
                            </div>
                            <div className="text-sm text-slate-600">
                              ID: {client.id}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">
                              Type: {client.type}
                            </div>
                          </div>
                          {isAssigningClient && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">No clients found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Installer Assignment Dropdown */}
        {showInstallerDropdown && (
          <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
            <div className="installer-dropdown bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Assign Installer
                </h3>
                <button
                  onClick={() => {
                    setShowInstallerDropdown(false);
                    setInstallerSearchTerm("");
                  }}
                  className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search installers by name, ID, or role..."
                  value={installerSearchTerm}
                  onChange={(e) => setInstallerSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {(() => {
                  const all = Array.isArray(employees) ? employees : [];
                  const installerOnly = all.filter((e: Employee) =>
                    (e?.role || "").toLowerCase().includes("installer")
                  );
                  const source = installerOnly.length > 0 ? installerOnly : all;

                  const q = (installerSearchTerm || "").toLowerCase().trim();
                  const filtered = source.filter((e: Employee) => {
                    if (!q) return true;
                    const name = `${e?.first_name || ""} ${
                      e?.last_name || ""
                    }`.toLowerCase();
                    const role = (e?.role || "").toLowerCase();
                    const empId = (e?.employee_id || "").toLowerCase();
                    return (
                      name.includes(q) || role.includes(q) || empId.includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-500">
                        <User className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm">No installers found</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filtered.map((e: Employee) => {
                        const fullName =
                          `${e?.first_name || ""} ${
                            e?.last_name || ""
                          }`.trim() || "Unnamed";
                        return (
                          <button
                            key={e.id || e.employee_id}
                            onClick={() => handleAssignInstaller(e.employee_id)}
                            disabled={isAssigningInstaller}
                            className="cursor-pointer w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-900">
                                  {fullName}
                                </div>
                                <div className="text-sm text-slate-600">
                                  ID: {e.employee_id}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">
                                  Role: {e.role || "—"}
                                </div>
                              </div>
                              {isAssigningInstaller && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Add Lot Form Modal */}
        {showAddLotForm && (
          <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
            <div className="client-dropdown bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Add New Lot
                </h3>
                <button
                  onClick={() => {
                    setShowAddLotForm(false);
                    setNewLot({
                      lotId: "",
                      name: "",
                      startDate: "",
                      installationDueDate: "",
                      notes: "",
                    });
                  }}
                  className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Lot ID *
                  </label>
                  <input
                    type="text"
                    value={newLot.lotId}
                    onChange={(e) =>
                      setNewLot({ ...newLot, lotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="e.g., 001"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Lot ID will be: {id.toUpperCase()}-{newLot.lotId || "XXX"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={newLot.name}
                    onChange={(e) =>
                      setNewLot({ ...newLot, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newLot.startDate}
                      onChange={(e) =>
                        setNewLot({ ...newLot, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Installation Due Date
                    </label>
                    <input
                      type="date"
                      value={newLot.installationDueDate}
                      onChange={(e) =>
                        setNewLot({
                          ...newLot,
                          installationDueDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newLot.notes}
                    onChange={(e) =>
                      setNewLot({ ...newLot, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="e.g., finish as soon as possible"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateLot}
                  disabled={
                    isCreatingLot || !newLot.name.trim() || !newLot.lotId.trim()
                  }
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-white rounded-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingLot ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Lot
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddLotForm(false);
                    setNewLot({
                      lotId: "",
                      name: "",
                      startDate: "",
                      installationDueDate: "",
                      notes: "",
                    });
                  }}
                  className="cursor-pointer btn-secondary flex items-center gap-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmation
          isOpen={showDeleteLotModal}
          onClose={() => setShowDeleteLotModal(false)}
          onConfirm={handleDeleteLotConfirm}
          deleteWithInput={true}
          heading="Lot"
          message="This will permanently delete the lot and all associated data. This action cannot be undone."
          comparingName={selectedLot ? `${selectedLot.lot_id}` : ""}
          isDeleting={isDeletingLot}
          entityType="lot"
        />

        <DeleteConfirmation
          isOpen={showDeleteProjectModal}
          onClose={() => setShowDeleteProjectModal(false)}
          onConfirm={handleDeleteProjectConfirm}
          deleteWithInput={true}
          heading="Project"
          message="This will permanently delete the project and all associated data. This action cannot be undone."
          comparingName={project ? `${project.name}` : ""}
          isDeleting={isDeletingProject}
          entityType="project"
        />

        {/* Delete File Confirmation Modal */}
        {/* File View Modal (for SiteMeasurementsSection) */}
        {viewFileModal && selectedFile && (
          <ViewMedia
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setViewFileModal={setViewFileModal}
            setPageNumber={setPageNumber}
            allFiles={
              (selectedFile.allFiles as Array<{
                id?: string;
                filename?: string;
                name?: string;
                url?: string;
                mime_type?: string;
                type?: string;
                size?: number;
              }>) || []
            }
            currentIndex={selectedFile.currentIndex || 0}
          />
        )}

        <DeleteConfirmation
          isOpen={showDeleteFileModal}
          onClose={() => {
            setShowDeleteFileModal(false);
            setFileToDelete(null);
          }}
          onConfirm={handleDeleteFile}
          deleteWithInput={false}
          heading="File"
          message="This will permanently delete this file. This action cannot be undone."
          comparingName={fileToDelete ? fileToDelete.filename : ""}
          isDeleting={isDeletingFile === fileToDelete?.id}
          entityType="lot_file"
        />
      </div>
    </div>
  );
}
