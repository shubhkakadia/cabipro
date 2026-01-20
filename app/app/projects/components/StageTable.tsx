import React, { useState, useEffect, useRef } from "react";
import { stages } from "@/components/constants";
import { X, Trash2, Plus, User, Check } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { TbCalendarDue } from "react-icons/tb";
import { CiWarning } from "react-icons/ci";
import DeleteConfirmation from "@/components/DeleteConfirmation";

// Type definitions
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

interface Stage {
  id: string;
  name: string;
  status: string;
  notes?: string;
  startDate?: string | null;
  endDate?: string | null;
  assigned_to?: Array<string | { employee_id: string; employee?: Employee }>;
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

interface LotData {
  id: string;
  lot_id: string;
  name?: string;
  startDate?: string;
  installationDueDate?: string;
  status?: string;
  notes?: string;
  installer?: Employee;
  stages?: Stage[];
  tabs?: Array<{
    id?: string;
    tab: string;
    notes?: string;
    files?: FileData[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface NewStage {
  name: string;
  status: string;
  notes: string;
  startDate: string;
  endDate: string;
  assigned_to: string[];
}

interface StageTableProps {
  selectedLotData: LotData | null;
  validateDateInput: (
    startDate: string,
    endDate: string,
    fieldChanged: string,
  ) => boolean;
  updateLotData: React.Dispatch<React.SetStateAction<LotData | null>>;
}

export default function StageTable({
  selectedLotData,
  validateDateInput,
  updateLotData,
}: StageTableProps) {
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [showDeleteStageModal, setShowDeleteStageModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);
  const [isDeletingStage, setIsDeletingStage] = useState(false);
  const [newStage, setNewStage] = useState<NewStage>({
    name: "",
    status: "NOT_STARTED",
    notes: "",
    startDate: "",
    endDate: "",
    assigned_to: [],
  });

  // Add these state variables after your existing useState declarations
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [currentStageForAssignment, setCurrentStageForAssignment] = useState<
    string | null
  >(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [notesSavedIndicators, setNotesSavedIndicators] = useState<
    Record<string, boolean>
  >({});
  const notesDebounceTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [localStages, setLocalStages] = useState<Stage[]>([]);

  // Sync local stages with selectedLotData when it changes
  useEffect(() => {
    if (selectedLotData?.stages) {
      setLocalStages([...selectedLotData.stages]);
    }
  }, [selectedLotData?.stages]);

  // Fetch employees on component mount
  const fetchEmployees = React.useCallback(async () => {
    try {
      const response = await axios.get("/api/employee/all", {
        withCredentials: true,
      });

      if (response.data.status) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch employees",
        );
      } else {
        toast.error("Failed to fetch employees");
      }
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter((employee: Employee) => {
    const searchLower = employeeSearchTerm.toLowerCase();
    const fullName = `${employee.first_name || ""} ${
      employee.last_name || ""
    }`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (employee.employee_id || "").toLowerCase().includes(searchLower) ||
      (employee.email || "").toLowerCase().includes(searchLower)
    );
  });

  // Helper function to check if identifier is a predefined stage name
  const isPredefinedStageName = (stageIdentifier: string): boolean => {
    if (typeof stageIdentifier !== "string") return false;
    // Check if it's in the predefined stages array
    return stages.some(
      (stageName: string) =>
        stageName.toLowerCase() === stageIdentifier.toLowerCase(),
    );
  };

  // Helper function to find stage by identifier
  const findStageByIdentifier = (
    stageIdentifier: string,
  ): Stage | undefined => {
    // Check if it's a predefined stage name
    if (isPredefinedStageName(stageIdentifier)) {
      // Check both regular stages and temporary stages
      return localStages.find(
        (stage: Stage) =>
          stage.name.toLowerCase() === stageIdentifier.toLowerCase() ||
          stage.id === `temp_${stageIdentifier}`,
      );
    } else {
      // It's a id (UUID format)
      return localStages.find((stage: Stage) => stage.id === stageIdentifier);
    }
  };

  // Helper function to ensure temporary stage exists in local state
  const ensureTempStageExists = (
    stageIdentifier: string,
  ): Stage | undefined => {
    const existingStage = findStageByIdentifier(stageIdentifier);

    // If stage doesn't exist and it's a predefined stage name, create temporary entry
    if (!existingStage && isPredefinedStageName(stageIdentifier)) {
      const tempStage: Stage = {
        id: `temp_${stageIdentifier}`,
        name: stageIdentifier,
        status: "NOT_STARTED",
        notes: "",
        startDate: null,
        endDate: null,
        assigned_to: [],
      };
      setLocalStages((prev: Stage[]) => {
        // Check if temp stage already exists
        const existing = prev.find(
          (s: Stage) => s.id === `temp_${stageIdentifier}`,
        );
        if (existing) {
          return prev; // Already exists
        }
        return [...prev, tempStage];
      });
      return tempStage;
    }
    return existingStage;
  };

  // Helper function to update stage in local state
  const updateStageInLocalState = (
    stageIdentifier: string,
    updatedData: Partial<Stage>,
  ) => {
    setLocalStages((prev: Stage[]) => {
      return prev.map((stage: Stage) => {
        // Check if it's a predefined stage name
        if (isPredefinedStageName(stageIdentifier)) {
          // Check both regular stages and temporary stages
          if (
            stage.name.toLowerCase() === stageIdentifier.toLowerCase() ||
            stage.id === `temp_${stageIdentifier}`
          ) {
            return { ...stage, ...updatedData };
          }
        } else {
          // It's a id (UUID format)
          if (stage.id === stageIdentifier) {
            return { ...stage, ...updatedData };
          }
        }
        return stage;
      });
    });
  };

  // Helper function to update parent lot data
  const updateParentLotData = (updatedStage: Stage) => {
    if (updateLotData) {
      updateLotData((prev: LotData | null) => {
        if (!prev) return prev;
        const updatedStages =
          prev.stages?.map((stage: Stage) => {
            if (stage.id === updatedStage.id) {
              return updatedStage;
            }
            return stage;
          }) || [];
        return { ...prev, stages: updatedStages };
      });
    }
  };

  // Helper function to normalize assigned_to array to employee IDs
  const normalizeAssignedTo = (
    assignedTo:
      | Array<string | { employee_id: string; employee?: Employee }>
      | undefined,
  ): string[] => {
    if (!assignedTo || assignedTo.length === 0) return [];
    return assignedTo.map((assignment) =>
      typeof assignment === "string" ? assignment : assignment.employee_id,
    );
  };

  // Helper function to prepare stage data for API
  const prepareStageData = (
    stage: Stage,
    additionalData: Partial<Stage> = {},
  ): Partial<Stage> => {
    return {
      name: stage.name || "",
      status: stage.status || "NOT_STARTED",
      notes: stage.notes || "",
      startDate: stage.startDate || null,
      endDate: stage.endDate || null,
      assigned_to: normalizeAssignedTo(stage.assigned_to),
      ...additionalData,
    };
  };

  // Centralized function to create a stage
  const createStage = async (
    stageData: Partial<Stage> & { id: string },
    stageIdentifier: string,
  ): Promise<Stage | null> => {
    try {
      const response = await axios.post("/api/stage/create", stageData, {
        withCredentials: true,
      });

      if (response.data.status && response.data.data) {
        const newStage = response.data.data as Stage;

        // Preserve assigned_to from the stageData we sent (API creates relationships but doesn't return them)
        // The API creates the stage_employee relationships but the response doesn't include them
        const preservedAssignedTo = stageData.assigned_to || [];

        // Format assigned_to to match the expected structure (array of objects with employee_id and employee)
        // Handle both string IDs and object formats
        const formattedAssignedTo: Array<
          string | { employee_id: string; employee?: Employee }
        > =
          Array.isArray(preservedAssignedTo) && preservedAssignedTo.length > 0
            ? preservedAssignedTo.map(
                (
                  item: string | { employee_id: string; employee?: Employee },
                ) => {
                  const empId =
                    typeof item === "string" ? item : item.employee_id;
                  const employee = employees.find(
                    (e: Employee) => e.employee_id === empId,
                  );
                  return employee
                    ? {
                        employee_id: empId,
                        employee: employee,
                      }
                    : { employee_id: empId };
                },
              )
            : newStage.assigned_to || [];

        // Merge assigned_to into the new stage
        const stageWithAssignments: Stage = {
          ...newStage,
          assigned_to: formattedAssignedTo,
        };

        // Replace temporary stage with real one if it exists
        setLocalStages((prev: Stage[]) => {
          const filtered = prev.filter(
            (s: Stage) => s.id !== `temp_${stageIdentifier}`,
          );
          return [...filtered, stageWithAssignments];
        });

        // Update parent lot data
        if (updateLotData) {
          updateLotData((prev: LotData | null) => {
            if (!prev) return prev;
            return {
              ...prev,
              stages: [
                ...(prev.stages?.filter(
                  (s: Stage) => s.id !== `temp_${stageIdentifier}`,
                ) || []),
                stageWithAssignments,
              ],
            };
          });
        }

        return stageWithAssignments;
      } else {
        toast.error(response.data.message || "Failed to create stage");
        return null;
      }
    } catch (error) {
      console.error("Error creating stage:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to create stage. Please try again.",
        );
      } else {
        toast.error("Failed to create stage. Please try again.");
      }
      return null;
    }
  };

  // Centralized function to update a stage
  const updateStage = async (
    stageIdentifier: string,
    stageData: Partial<Stage>,
  ): Promise<Stage | null> => {
    const existingStage = findStageByIdentifier(stageIdentifier);
    if (!existingStage || existingStage.id?.startsWith("temp_")) {
      return null;
    }

    const previousStageState = { ...existingStage };

    try {
      const response = await axios.patch(
        `/api/stage/${existingStage.id}`,
        stageData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status && response.data.data) {
        const updatedStage = response.data.data as Stage;
        updateStageInLocalState(stageIdentifier, updatedStage);
        updateParentLotData(updatedStage);
        return updatedStage;
      } else {
        toast.error(response.data.message || "Failed to update stage");
        // Revert local state
        updateStageInLocalState(stageIdentifier, previousStageState);
        return null;
      }
    } catch (error) {
      console.error("Error updating stage:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update stage. Please try again.",
        );
      } else {
        toast.error("Failed to update stage. Please try again.");
      }
      // Revert local state
      updateStageInLocalState(stageIdentifier, previousStageState);
      return null;
    }
  };

  // Helper function to check if stage exists (not temporary)
  const stageExists = (stageIdentifier: string): boolean => {
    const existingStage = findStageByIdentifier(stageIdentifier);
    return existingStage ? !existingStage.id?.startsWith("temp_") : false;
  };

  // Open employee dropdown for a specific stage
  const handleOpenEmployeeDropdown = (stageIdentifier: string) => {
    // Ensure temporary stage exists if it doesn't exist yet
    ensureTempStageExists(stageIdentifier);
    setCurrentStageForAssignment(stageIdentifier);
    setShowEmployeeDropdown(true);
    setEmployeeSearchTerm("");
  };

  // Handle employee selection and auto-save
  const handleToggleEmployeeAssignment = async (employeeId: string) => {
    if (!currentStageForAssignment) return;

    // Ensure temporary stage exists in local state
    ensureTempStageExists(currentStageForAssignment);
    const existingStage = findStageByIdentifier(currentStageForAssignment);

    // Get current assigned employees
    const currentAssignedIds = normalizeAssignedTo(
      existingStage?.assigned_to || [],
    );

    // Toggle employee assignment
    let updatedAssignedIds: string[];
    if (currentAssignedIds.includes(employeeId)) {
      updatedAssignedIds = currentAssignedIds.filter(
        (id: string) => id !== employeeId,
      );
    } else {
      updatedAssignedIds = [...currentAssignedIds, employeeId];
    }

    // Update local state immediately
    updateStageInLocalState(currentStageForAssignment, {
      assigned_to: updatedAssignedIds,
    });

    // Check if stage exists (not temporary)
    // Use existingStage from before the update to avoid race condition
    if (!stageExists(currentStageForAssignment)) {
      // Stage needs to be created
      if (isPredefinedStageName(currentStageForAssignment) && selectedLotData) {
        const stageData = {
          id: selectedLotData.id,
          lot_id: selectedLotData.lot_id,
          name: currentStageForAssignment,
          status: existingStage?.status || "NOT_STARTED",
          notes: existingStage?.notes || "",
          startDate: existingStage?.startDate || null,
          endDate: existingStage?.endDate || null,
          assigned_to: updatedAssignedIds, // Use updatedAssignedIds directly
        };
        const created = await createStage(stageData, currentStageForAssignment);
        if (!created) {
          // Revert local state on failure
          updateStageInLocalState(currentStageForAssignment, {
            assigned_to: currentAssignedIds,
          });
        }
      }
      return;
    }

    // Existing stage - update via API
    // Use existingStage from before update and updatedAssignedIds directly to avoid race condition
    if (!existingStage) return;
    const stageData = prepareStageData(existingStage, {
      assigned_to: updatedAssignedIds, // Use updatedAssignedIds directly instead of re-reading from state
    });
    const updated = await updateStage(currentStageForAssignment, stageData);
    if (!updated) {
      // Revert local state on failure
      updateStageInLocalState(currentStageForAssignment, {
        assigned_to: currentAssignedIds,
      });
    }
  };

  // Check if employee is assigned
  const isEmployeeAssigned = (employeeId: string): boolean => {
    if (!currentStageForAssignment) return false;
    const existingStage = findStageByIdentifier(currentStageForAssignment);
    if (!existingStage) return false;

    const assignedIds = normalizeAssignedTo(existingStage.assigned_to || []);
    return assignedIds.includes(employeeId);
  };

  // Get employee details by ID
  const getEmployeeById = (employeeId: string): Employee | undefined => {
    return employees.find((emp: Employee) => emp.employee_id === employeeId);
  };

  // Get assigned team members display with proper names
  const getAssignedTeamMembers = (
    assignedTo:
      | Array<string | { employee_id: string; employee?: Employee }>
      | undefined,
  ): string => {
    if (!assignedTo || assignedTo.length === 0) return "Unassigned";

    return assignedTo
      .map((assignment) => {
        // Handle both formats: objects with employee property or direct employee_id strings
        if (typeof assignment === "string") {
          const employee = getEmployeeById(assignment);
          return employee
            ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
            : assignment;
        }
        return `${assignment.employee?.first_name || ""} ${
          assignment.employee?.last_name || ""
        }`.trim();
      })
      .join(", ");
  };

  // Get assigned team members for display
  const getAssignedTeamMembersDisplay = (stageIdentifier: string): string => {
    const existingStage = findStageByIdentifier(stageIdentifier);
    return existingStage
      ? getAssignedTeamMembers(existingStage.assigned_to)
      : "Click to assign";
  };

  const handleAddStage = async () => {
    if (newStage.name.trim() && selectedLotData) {
      const startDate = newStage.startDate || null;
      const endDate = newStage.endDate || null;

      // Validate dates against lot dates before creating
      if (startDate && !validateStageDateAgainstLot(startDate, "startDate")) {
        return;
      }
      if (endDate && !validateStageDateAgainstLot(endDate, "endDate")) {
        return;
      }
      // Validate start date is not after end date
      if (
        startDate &&
        endDate &&
        !validateDateInput(startDate, endDate, "startDate")
      ) {
        return;
      }

      const stageData = {
        id: selectedLotData.id,
        lot_id: selectedLotData.lot_id,
        name: newStage.name.trim(),
        status: newStage.status,
        notes: newStage.notes,
        startDate: startDate || null,
        endDate: endDate || null,
        assigned_to: [],
      };

      const created = await createStage(stageData, newStage.name.trim());
      if (created) {
        toast.success("Stage added successfully");
        setNewStage({
          name: "",
          status: "NOT_STARTED",
          notes: "",
          startDate: "",
          endDate: "",
          assigned_to: [],
        });
        setIsAddingStage(false);
      }
    }
  };

  const handleDeleteStageConfirm = async () => {
    if (!stageToDelete) return;

    try {
      setIsDeletingStage(true);

      const response = await axios.delete(`/api/stage/${stageToDelete}`, {
        withCredentials: true,
      });

      if (response.data.status) {
        toast.success("Stage deleted successfully");
        // Remove from local state
        setLocalStages((prev: Stage[]) =>
          prev.filter((stage: Stage) => stage.id !== stageToDelete),
        );
        // Update parent lot data
        if (updateLotData) {
          updateLotData((prev: LotData | null) => {
            if (!prev) return prev;
            return {
              ...prev,
              stages:
                prev.stages?.filter(
                  (stage: Stage) => stage.id !== stageToDelete,
                ) || [],
            };
          });
        }
        setShowDeleteStageModal(false);
        setStageToDelete(null);
      } else {
        toast.error(response.data.message || "Failed to delete stage");
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete stage. Please try again.",
        );
      } else {
        toast.error("Failed to delete stage. Please try again.");
      }
    } finally {
      setIsDeletingStage(false);
    }
  };

  // Auto-save status change
  const handleStatusChange = async (
    stageIdentifier: string,
    newStatus: string,
  ) => {
    const existingStage = findStageByIdentifier(stageIdentifier);

    // Update local state immediately
    if (existingStage) {
      updateStageInLocalState(stageIdentifier, { status: newStatus });
    }

    // Check if stage exists (not temporary)
    if (!stageExists(stageIdentifier)) {
      // Stage needs to be created (only for predefined stages)
      if (isPredefinedStageName(stageIdentifier) && selectedLotData) {
        const stageData = {
          id: selectedLotData.id,
          lot_id: selectedLotData.lot_id,
          name: stageIdentifier,
          status: newStatus,
          notes: existingStage?.notes || "",
          startDate: existingStage?.startDate || null,
          endDate: existingStage?.endDate || null,
          assigned_to: normalizeAssignedTo(existingStage?.assigned_to || []),
        };
        const created = await createStage(stageData, stageIdentifier);
        if (!created) {
          // Revert local state on failure
          if (existingStage) {
            updateStageInLocalState(stageIdentifier, existingStage);
          }
        }
      }
      return;
    }

    // Existing stage - update via API
    if (!existingStage) return;

    const stageData = prepareStageData(existingStage, { status: newStatus });
    const updated = await updateStage(stageIdentifier, stageData);
    if (!updated) {
      // Revert local state on failure
      updateStageInLocalState(stageIdentifier, existingStage);
    }
  };

  // Debounced notes save function
  const saveNotes = async (stageIdentifier: string, notes: string) => {
    const existingStage = findStageByIdentifier(stageIdentifier);

    // Check if stage exists (not temporary)
    if (!stageExists(stageIdentifier)) {
      // Stage needs to be created (only for predefined stages)
      if (isPredefinedStageName(stageIdentifier) && selectedLotData) {
        const stageData = {
          id: selectedLotData.id,
          lot_id: selectedLotData.lot_id,
          name: stageIdentifier,
          status: existingStage?.status || "NOT_STARTED",
          notes: notes || "",
          startDate: existingStage?.startDate || null,
          endDate: existingStage?.endDate || null,
          assigned_to: normalizeAssignedTo(existingStage?.assigned_to || []),
        };
        const created = await createStage(stageData, stageIdentifier);
        if (created) {
          // Show saved indicator
          setNotesSavedIndicators((prev) => ({
            ...prev,
            [stageIdentifier]: true,
          }));
          setTimeout(() => {
            setNotesSavedIndicators((prev) => {
              const newIndicators = { ...prev };
              delete newIndicators[stageIdentifier];
              return newIndicators;
            });
          }, 2000);
        }
      }
      return;
    }

    if (!existingStage) return;

    // Existing stage - update via API
    const stageData = prepareStageData(existingStage, { notes: notes || "" });
    const updated = await updateStage(stageIdentifier, stageData);
    if (updated) {
      // Show saved indicator
      setNotesSavedIndicators((prev) => ({
        ...prev,
        [stageIdentifier]: true,
      }));
      // Hide indicator after 2 seconds
      setTimeout(() => {
        setNotesSavedIndicators((prev) => {
          const newIndicators = { ...prev };
          delete newIndicators[stageIdentifier];
          return newIndicators;
        });
      }, 2000);
    }
  };

  // Debounced notes handler
  const handleNotesChange = (stageIdentifier: string, value: string) => {
    const existingStage = findStageByIdentifier(stageIdentifier);

    // If stage doesn't exist, create a temporary entry in local state for immediate UI feedback
    if (!existingStage && isPredefinedStageName(stageIdentifier)) {
      // It's a predefined stage name, add temporary entry to local state
      const tempStage: Stage = {
        id: `temp_${stageIdentifier}`, // Temporary ID
        name: stageIdentifier,
        status: "NOT_STARTED",
        notes: value,
        startDate: null,
        endDate: null,
        assigned_to: [],
      };
      setLocalStages((prev: Stage[]) => {
        // Check if temp stage already exists
        const existing = prev.find(
          (s: Stage) => s.id === `temp_${stageIdentifier}`,
        );
        if (existing) {
          return prev.map((s: Stage) =>
            s.id === `temp_${stageIdentifier}` ? { ...s, notes: value } : s,
          );
        }
        return [...prev, tempStage];
      });
    } else if (existingStage) {
      // Update existing stage in local state
      updateStageInLocalState(stageIdentifier, { notes: value });
    } else {
      return; // Invalid stage identifier
    }

    // Clear existing timer
    if (notesDebounceTimers.current[stageIdentifier]) {
      clearTimeout(notesDebounceTimers.current[stageIdentifier]);
    }

    // Set new timer (1 second debounce)
    notesDebounceTimers.current[stageIdentifier] = setTimeout(() => {
      saveNotes(stageIdentifier, value);
      delete notesDebounceTimers.current[stageIdentifier];
    }, 1000);
  };

  // Helper function to validate stage dates against lot dates
  const validateStageDateAgainstLot = (
    dateValue: string,
    field: "startDate" | "endDate",
  ): boolean => {
    if (!dateValue) return true; // Empty dates are allowed

    const stageDate = new Date(dateValue);
    const lotStartDate = selectedLotData?.startDate
      ? new Date(selectedLotData.startDate)
      : null;
    const lotEndDate = selectedLotData?.installationDueDate
      ? new Date(selectedLotData.installationDueDate)
      : null;

    if (field === "startDate") {
      if (lotStartDate && stageDate < lotStartDate) {
        toast.error("Stage start date cannot be before the lot start date", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        return false;
      }
      if (lotEndDate && stageDate > lotEndDate) {
        toast.error("Stage start date cannot be after the lot end date", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        return false;
      }
    }

    if (field === "endDate") {
      if (lotStartDate && stageDate < lotStartDate) {
        toast.error("Stage end date cannot be before the lot start date", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        return false;
      }
      if (lotEndDate && stageDate > lotEndDate) {
        toast.error("Stage end date cannot be after the lot end date", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        return false;
      }
    }

    return true;
  };

  // Auto-save date change
  const handleDateChange = async (
    stageIdentifier: string,
    field: "startDate" | "endDate",
    value: string,
  ) => {
    // Ensure temporary stage exists in local state for immediate UI update
    ensureTempStageExists(stageIdentifier);
    let existingStage = findStageByIdentifier(stageIdentifier);

    // Validate against lot dates first
    if (value && !validateStageDateAgainstLot(value, field)) {
      return; // Don't update if validation fails
    }

    // Validate date inputs before updating
    const currentStartDate =
      field === "startDate" ? value : existingStage?.startDate || "";
    const currentEndDate =
      field === "endDate" ? value : existingStage?.endDate || "";

    if (
      !validateDateInput(
        String(currentStartDate),
        String(currentEndDate),
        field,
      )
    ) {
      return; // Don't update if validation fails
    }

    // Capture previous state before updating
    const previousStageState = existingStage ? { ...existingStage } : null;

    // Update local state immediately
    updateStageInLocalState(stageIdentifier, { [field]: value || null });

    // Re-find stage after update to get latest data
    existingStage = findStageByIdentifier(stageIdentifier);

    // Check if stage exists (not temporary)
    if (!stageExists(stageIdentifier)) {
      // Stage needs to be created via API
      if (isPredefinedStageName(stageIdentifier) && selectedLotData) {
        const stageData = {
          id: selectedLotData.id,
          lot_id: selectedLotData.lot_id,
          name: stageIdentifier,
          status: existingStage?.status || "NOT_STARTED",
          notes: existingStage?.notes || "",
          startDate:
            field === "startDate"
              ? value || null
              : existingStage?.startDate || null,
          endDate:
            field === "endDate"
              ? value || null
              : existingStage?.endDate || null,
          assigned_to: normalizeAssignedTo(existingStage?.assigned_to || []),
        };
        const created = await createStage(stageData, stageIdentifier);
        if (!created) {
          // Revert local state on failure
          if (previousStageState) {
            updateStageInLocalState(stageIdentifier, previousStageState);
          }
        }
      }
      return;
    }

    // Existing stage - update via API
    if (!existingStage) return;

    const stageData = prepareStageData(existingStage, {
      startDate:
        field === "startDate" ? value || null : existingStage.startDate || null,
      endDate:
        field === "endDate" ? value || null : existingStage.endDate || null,
    });
    const updated = await updateStage(stageIdentifier, stageData);
    if (!updated) {
      // Revert local state on failure
      if (previousStageState) {
        updateStageInLocalState(stageIdentifier, previousStageState);
      }
    }
  };

  // Auto-save name change
  const handleNameChange = async (stageIdentifier: string, value: string) => {
    const existingStage = findStageByIdentifier(stageIdentifier);
    if (!existingStage) return;

    // Update local state immediately
    const previousStageState = { ...existingStage };
    updateStageInLocalState(stageIdentifier, { name: value });

    // Check if stage exists (not temporary)
    if (!stageExists(stageIdentifier)) {
      // Name change on non-existent stage not supported
      updateStageInLocalState(stageIdentifier, previousStageState);
      return;
    }

    // Existing stage - update via API
    const stageData = prepareStageData(existingStage, { name: value });
    const updated = await updateStage(stageIdentifier, stageData);
    if (!updated) {
      // Revert local state on failure
      updateStageInLocalState(stageIdentifier, previousStageState);
    }
  };

  // Function to get due date warning icon for stages
  const getDueDateWarningIcon = (
    stage: Stage | { status: string; endDate?: string | null },
  ): React.ReactNode => {
    // Only show warning if stage status is not "DONE" or "NA"
    if (stage.status === "DONE" || stage.status === "NA") return null;

    // Check if stage has an end date
    if (!stage.endDate) return null;

    const today = new Date();
    const dueDate = new Date(stage.endDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // If passed the due date, show red calendar due icon
    if (daysDiff < 0) {
      return (
        <TbCalendarDue
          className="w-4 h-4 text-red-500 mr-1"
          title={`Overdue by ${Math.abs(daysDiff)} day(s)`}
        />
      );
    }

    // If 1 week or less before due date, show yellow warning icon
    if (daysDiff <= 7) {
      return (
        <CiWarning
          className="w-4 h-4 text-yellow-500 mr-1"
          title={`Due in ${daysDiff} day(s)`}
        />
      );
    }

    return null;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "NOT_STARTED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "NA":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to convert UTC date to Adelaide timezone for display
  const formatDateForInput = (
    dateString: string | null | undefined,
  ): string => {
    if (!dateString) return "";

    // Parse the date string (could be UTC or already local)
    const date = new Date(dateString);

    // Convert UTC date to Adelaide timezone for display
    // Use Intl.DateTimeFormat to get the date parts in Adelaide timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Adelaide",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Format returns YYYY-MM-DD directly
    return formatter.format(date);
  };

  const handleDeleteStage = (stageId: string) => {
    setStageToDelete(stageId);
    setShowDeleteStageModal(true);
  };

  return (
    <div>
      {/* Stages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Project Stages</h3>
          <button
            onClick={() => {
              setNewStage({
                name: "",
                status: "NOT_STARTED",
                notes: "",
                startDate: "",
                endDate: "",
                assigned_to: [],
              });
              setIsAddingStage(true);
            }}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Stage
          </button>
        </div>

        {/* Add Stage Form */}
        {isAddingStage && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Stage Name
                </label>
                <input
                  type="text"
                  value={newStage.name}
                  onChange={(e) =>
                    setNewStage({
                      ...newStage,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Enter stage name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={newStage.status}
                  onChange={(e) =>
                    setNewStage({
                      ...newStage,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newStage.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    // Validate against lot dates
                    if (
                      newStartDate &&
                      !validateStageDateAgainstLot(newStartDate, "startDate")
                    ) {
                      return;
                    }
                    // Validate against stage end date
                    if (
                      validateDateInput(
                        newStartDate,
                        newStage.endDate,
                        "startDate",
                      )
                    ) {
                      setNewStage({
                        ...newStage,
                        startDate: newStartDate,
                      });
                    }
                  }}
                  min={
                    selectedLotData?.startDate
                      ? formatDateForInput(selectedLotData.startDate)
                      : undefined
                  }
                  max={
                    selectedLotData?.installationDueDate
                      ? formatDateForInput(selectedLotData.installationDueDate)
                      : undefined
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newStage.endDate}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    // Validate against lot dates
                    if (
                      newEndDate &&
                      !validateStageDateAgainstLot(newEndDate, "endDate")
                    ) {
                      return;
                    }
                    // Validate against stage start date
                    if (
                      validateDateInput(
                        newStage.startDate,
                        newEndDate,
                        "endDate",
                      )
                    ) {
                      setNewStage({
                        ...newStage,
                        endDate: newEndDate,
                      });
                    }
                  }}
                  min={
                    selectedLotData?.startDate
                      ? formatDateForInput(selectedLotData.startDate)
                      : undefined
                  }
                  max={
                    selectedLotData?.installationDueDate
                      ? formatDateForInput(selectedLotData.installationDueDate)
                      : undefined
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Team Member
                </label>
                <input
                  type="text"
                  value=""
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 text-slate-500"
                  placeholder="Coming soon"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAddStage}
                  className="cursor-pointer px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingStage(false);
                    setNewStage({
                      name: "",
                      status: "NOT_STARTED",
                      notes: "",
                      startDate: "",
                      endDate: "",
                      assigned_to: [],
                    });
                  }}
                  className="cursor-pointer px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notes
              </label>
              <textarea
                value={newStage.notes}
                onChange={(e) =>
                  setNewStage({
                    ...newStage,
                    notes: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                placeholder="Add notes for this stage"
                rows={2}
              />
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Stage
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Notes
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Start Date
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  End Date
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Team
                </th>
                <th className="text-left py-3 px-2 font-medium text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* First, show all predefined stages */}
              {stages.map((stageName: string) => {
                // Find existing stage data for this stage name
                const existingStage = localStages.find(
                  (stage: Stage) =>
                    stage.name.toLowerCase() === stageName.toLowerCase(),
                );

                return (
                  <tr
                    key={stageName}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        {getDueDateWarningIcon(
                          existingStage || {
                            status: "NOT_STARTED",
                            endDate: "",
                          },
                        )}
                        <input
                          type="text"
                          value={existingStage?.name || stageName}
                          onChange={(e) =>
                            handleNameChange(stageName, e.target.value)
                          }
                          onBlur={(e) => {
                            if (e.target.value.trim() === "") {
                              e.target.value = existingStage?.name || stageName;
                            }
                          }}
                          className="w-full px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={existingStage?.status || "NOT_STARTED"}
                        onChange={(e) =>
                          handleStatusChange(stageName, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors focus:outline-none ${getStatusColor(
                          existingStage?.status || "NOT_STARTED",
                        )}`}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                        <option value="NA">N/A</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <textarea
                        value={existingStage?.notes || ""}
                        onChange={(e) =>
                          handleNotesChange(stageName, e.target.value)
                        }
                        className="w-full px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent resize-none"
                        rows={1}
                        placeholder="Add notes"
                      />
                      {notesSavedIndicators[stageName] && (
                        <span className="text-xs text-green-600 font-medium block mt-1">
                          Saved!
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={formatDateForInput(existingStage?.startDate)}
                        onChange={(e) =>
                          handleDateChange(
                            stageName,
                            "startDate",
                            e.target.value,
                          )
                        }
                        min={
                          selectedLotData?.startDate
                            ? formatDateForInput(selectedLotData.startDate)
                            : undefined
                        }
                        max={
                          selectedLotData?.installationDueDate
                            ? formatDateForInput(
                                selectedLotData.installationDueDate,
                              )
                            : undefined
                        }
                        className="max-w-35 px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent text-xs"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={formatDateForInput(existingStage?.endDate)}
                        onChange={(e) =>
                          handleDateChange(stageName, "endDate", e.target.value)
                        }
                        min={
                          selectedLotData?.startDate
                            ? formatDateForInput(selectedLotData.startDate)
                            : undefined
                        }
                        max={
                          selectedLotData?.installationDueDate
                            ? formatDateForInput(
                                selectedLotData.installationDueDate,
                              )
                            : undefined
                        }
                        className="max-w-35 px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent text-xs"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleOpenEmployeeDropdown(stageName)}
                        className={`cursor-pointer text-sm hover:text-secondary hover:underline text-left ${
                          (existingStage?.assigned_to?.length || 0) > 0
                            ? "text-secondary font-medium"
                            : "text-slate-600"
                        }`}
                      >
                        {getAssignedTeamMembersDisplay(stageName)}
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      {existingStage && (
                        <button
                          onClick={() => handleDeleteStage(existingStage.id)}
                          className="cursor-pointer text-red-600 hover:text-red-800 transition-colors"
                          title="Delete stage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Then, show manually added stages that are not in the predefined list */}
              {localStages
                ?.filter(
                  (stage: Stage) =>
                    !stages.some(
                      (predefinedStage: string) =>
                        predefinedStage.toLowerCase() ===
                        stage.name.toLowerCase(),
                    ),
                )
                ?.map((stage: Stage) => (
                  <tr key={stage.id} className="border-b border-slate-100 ">
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        {getDueDateWarningIcon(stage)}
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) =>
                            handleNameChange(stage.id, e.target.value)
                          }
                          onBlur={(e) => {
                            if (e.target.value.trim() === "") {
                              e.target.value = stage.name;
                            }
                          }}
                          className="w-full px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={stage.status}
                        onChange={(e) =>
                          handleStatusChange(stage.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors focus:outline-none ${getStatusColor(
                          stage.status,
                        )}`}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                        <option value="NA">N/A</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <textarea
                        value={stage.notes || ""}
                        onChange={(e) =>
                          handleNotesChange(stage.id, e.target.value)
                        }
                        className="w-full px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent resize-none"
                        rows={2}
                        placeholder="Add notes"
                      />
                      {notesSavedIndicators[stage.id] && (
                        <span className="text-xs text-green-600 font-medium block mt-1">
                          Saved!
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={formatDateForInput(stage.startDate)}
                        onChange={(e) =>
                          handleDateChange(
                            stage.id,
                            "startDate",
                            e.target.value,
                          )
                        }
                        min={
                          selectedLotData?.startDate
                            ? formatDateForInput(selectedLotData.startDate)
                            : undefined
                        }
                        max={
                          selectedLotData?.installationDueDate
                            ? formatDateForInput(
                                selectedLotData.installationDueDate,
                              )
                            : undefined
                        }
                        className="max-w-35 px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent text-xs"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={formatDateForInput(stage.endDate)}
                        onChange={(e) =>
                          handleDateChange(stage.id, "endDate", e.target.value)
                        }
                        min={
                          selectedLotData?.startDate
                            ? formatDateForInput(selectedLotData.startDate)
                            : undefined
                        }
                        max={
                          selectedLotData?.installationDueDate
                            ? formatDateForInput(
                                selectedLotData.installationDueDate,
                              )
                            : undefined
                        }
                        className="max-w-35 px-2 py-1 border border-transparent rounded hover:border-slate-300 focus:border-secondary focus:outline-none bg-transparent text-xs"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleOpenEmployeeDropdown(stage.id)}
                        className={`cursor-pointer text-sm hover:text-secondary hover:underline text-left ${
                          (stage.assigned_to?.length || 0) > 0
                            ? "text-secondary font-medium"
                            : "text-slate-600"
                        }`}
                      >
                        {getAssignedTeamMembersDisplay(stage.id)}
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="cursor-pointer text-red-600 hover:text-red-800 transition-colors"
                        title="Delete stage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Employee Assignment Dropdown */}
      {showEmployeeDropdown && (
        <div className="fixed inset-0 backdrop-blur-xs border-2 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Assign Team Members
              </h3>
              <button
                onClick={() => {
                  setShowEmployeeDropdown(false);
                  setEmployeeSearchTerm("");
                }}
                className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search employees by name, ID, or email..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="mb-3 text-xs text-slate-500 px-1">
              Click to select/unselect. Changes are saved automatically.
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredEmployees.length > 0 ? (
                <div className="space-y-2">
                  {filteredEmployees.map((employee: Employee) => {
                    const isAssigned = isEmployeeAssigned(employee.employee_id);
                    return (
                      <button
                        key={employee.employee_id}
                        onClick={() =>
                          handleToggleEmployeeAssignment(employee.employee_id)
                        }
                        className={`cursor-pointer w-full text-left p-3 border rounded-lg transition-colors ${
                          isAssigned
                            ? "border-secondary bg-secondary/5 hover:bg-secondary/10"
                            : "border-slate-200 hover:bg-slate-50 hover:border-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-slate-900">
                                {employee.first_name || ""}{" "}
                                {employee.last_name || ""}
                              </div>
                              {isAssigned && (
                                <Check className="w-4 h-4 text-secondary" />
                              )}
                            </div>
                            <div className="text-sm text-slate-600">
                              ID: {employee.employee_id}
                            </div>
                            {employee.email && (
                              <div className="text-xs text-slate-500">
                                {employee.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">No employees found</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowEmployeeDropdown(false);
                  setEmployeeSearchTerm("");
                }}
                className="cursor-pointer w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Stage Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteStageModal}
        onClose={() => {
          setShowDeleteStageModal(false);
          setStageToDelete(null);
        }}
        onConfirm={handleDeleteStageConfirm}
        deleteWithInput={false}
        heading="Stage"
        message="This will permanently delete the stage. This action cannot be undone."
        isDeleting={isDeletingStage}
        entityType="stage"
      />
    </div>
  );
}
