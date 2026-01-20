"use client";
import { useState } from "react";
import { toast } from "react-toastify";

/**
 * Configuration for Excel export hook
 */
interface UseExcelExportConfig<T = unknown> {
  columnMap: Record<string, (item: T) => unknown>;
  columnWidths?: Record<string, number>;
  defaultWidth?: number;
  filenamePrefix: string;
  sheetName?: string;
  selectedColumns?: string[] | null;
  availableColumns?: string[]; // If provided, normalize selectedColumns (if all selected, pass undefined)
}

/**
 * Options for the exportToExcel function
 */
interface ExportOptions {
  customFilename?: string;
  customSheetName?: string;
  customSelectedColumns?: string[];
}

/**
 * Custom hook for exporting data to Excel
 *
 * @param config - Configuration object
 * @returns Object containing export function and loading state
 */
export const useExcelExport = <T = unknown>({
  columnMap,
  columnWidths = {},
  defaultWidth = 15,
  filenamePrefix,
  sheetName = "Sheet1",
  selectedColumns = null,
  availableColumns,
}: UseExcelExportConfig<T>) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Normalize selectedColumns: if all columns are selected, treat as undefined (export all)
  const normalizedSelectedColumns =
    selectedColumns &&
    availableColumns &&
    selectedColumns.length === availableColumns.length
      ? undefined
      : selectedColumns;

  /**
   * Export data to Excel
   * @param data - Array of data objects to export
   * @param options - Additional options
   */
  const exportToExcel = async (
    data: T[],
    options: ExportOptions = {},
  ): Promise<void> => {
    // Validate data
    if (!data || data.length === 0) {
      toast.warning(
        "No data to export. Please adjust your filters or add data.",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        },
      );
      return;
    }

    // Determine which columns to export
    const columnsToExport =
      options.customSelectedColumns || normalizedSelectedColumns;

    // If selectedColumns is provided and empty, show warning
    if (columnsToExport !== null && columnsToExport?.length === 0) {
      toast.warning("Please select at least one column to export.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    setIsExporting(true);

    try {
      // Dynamic import of xlsx to avoid SSR issues
      const XLSX = await import("xlsx");

      // Prepare data for export
      let exportData;

      if (columnsToExport && columnsToExport.length > 0) {
        // Only include selected columns
        exportData = data.map((item) => {
          const row: Record<string, unknown> = {};
          columnsToExport.forEach((column) => {
            if (columnMap[column]) {
              row[column] = columnMap[column](item);
            }
          });
          return row;
        });
      } else {
        // Include all columns from columnMap
        exportData = data.map((item) => {
          const row: Record<string, unknown> = {};
          Object.keys(columnMap).forEach((column) => {
            row[column] = columnMap[column](item);
          });
          return row;
        });
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnsForWidths = columnsToExport || Object.keys(columnMap);
      const colWidths = columnsForWidths.map((column) => ({
        wch: columnWidths[column] || defaultWidth,
      }));
      ws["!cols"] = colWidths;

      // Add the worksheet to the workbook
      const finalSheetName = options.customSheetName || sheetName;
      XLSX.utils.book_append_sheet(wb, ws, finalSheetName);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename =
        options.customFilename || `${filenamePrefix}_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      // Show success message
      toast.success(
        `Successfully exported ${exportData.length} ${filenamePrefix} to ${filename}`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        },
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data to Excel. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    isExporting,
  } as const;
};
