import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { ChevronDown, FileText, FileUp, Trash, File } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import TextEditor from "@/components/TextEditor/TextEditor";
import { useUploadProgress } from "@/hooks/useUploadProgress";

// Type definitions
interface Tab {
  tab: string;
  notes?: string;
  [key: string]: unknown;
}

interface FileData {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
  site_group?: string;
  [key: string]: unknown;
}

interface LotData {
  lot_id: string;
  tabs?: Tab[];
  [key: string]: unknown;
}

interface SiteMeasurementsSectionProps {
  selectedLotData: LotData | null;
  fetchLotData: (refresh?: boolean) => void;
  handleNotesSave: (content: string) => void;
  handleViewExistingFile: (file: FileData) => void;
  openDeleteFileConfirmation: (file: FileData) => void;
  isDeletingFile: string | null;
  activeTab: string;
  getCurrentTabFiles: () => FileData[];
}

interface ExpandedSections {
  images: boolean;
  videos: boolean;
  pdfs: boolean;
  others: boolean;
}

interface UploadFilesParams {
  filesToUpload: File[] | null;
  siteGroup: string;
  groupName: string;
  setIsUploading: (value: boolean) => void;
  setFiles: (files: File[]) => void;
  fallbackFiles: File[];
}

interface SiteMeasurementFileSectionProps {
  title: string;
  files: FileData[];
}

interface FileCategorySectionProps {
  title: string;
  files: FileData[];
  isSmall?: boolean;
  sectionKey: keyof ExpandedSections;
}

interface SiteMeasurementUploadSectionProps {
  title: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export default function SiteMeasurementsSection({
  selectedLotData,
  fetchLotData,
  handleNotesSave,
  handleViewExistingFile,
  openDeleteFileConfirmation,
  isDeletingFile,
  activeTab,
  getCurrentTabFiles,
}: SiteMeasurementsSectionProps) {
  const { id } = useParams<{ id: string }>();
  // const { getToken } = useAuth();
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

  // State for site measurements specific uploads
  const [sitePhotosFiles, setSitePhotosFiles] = useState<File[]>([]);
  const [measurementPhotosFiles, setMeasurementPhotosFiles] = useState<File[]>(
    []
  );
  const [isUploadingSitePhotos, setIsUploadingSitePhotos] = useState(false);
  const [isUploadingMeasurementPhotos, setIsUploadingMeasurementPhotos] =
    useState(false);

  // Get files for site photos and measurement photos
  const getSiteMeasurementFiles = (group: string): FileData[] => {
    const existingFiles = getCurrentTabFiles();
    return existingFiles.filter((file: FileData) => file.site_group === group);
  };

  const sitePhotos = getSiteMeasurementFiles("SITE_PHOTOS");
  const measurementPhotos = getSiteMeasurementFiles("MEASUREMENT_PHOTOS");

  // Handle file selection for site photos - upload immediately
  const handleSitePhotosFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Upload files immediately
    await handleUploadSitePhotos(files);

    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  // Handle file selection for measurement photos - upload immediately
  const handleMeasurementPhotosFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Upload files immediately
    await handleUploadMeasurementPhotos(files);

    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  // Unified upload handler for site measurement files
  const uploadFiles = async ({
    filesToUpload,
    siteGroup,
    groupName,
    setIsUploading,
    setFiles,
    fallbackFiles,
  }: UploadFilesParams) => {
    const files = filesToUpload || fallbackFiles;

    try {
      setIsUploading(true);

      if (!selectedLotData?.lot_id || !id) {
        toast.error("Project or lot information missing");
        return;
      }

      if (!files || files.length === 0) {
        toast.error("No files selected");
        return;
      }

      const formData = new FormData();

      files.forEach((file: File) => {
        formData.append("file", file);
      });

      formData.append("site_group", siteGroup);

      const projectId =
        typeof id === "string" ? id.toUpperCase() : String(id).toUpperCase();
      const apiUrl = `/api/uploads/lots/${projectId}/${selectedLotData.lot_id}/site_measurements`;

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
        setFiles([]);
        fetchLotData(true);
      } else {
        dismissProgressToast();
        toast.error(
          response.data.message || `Failed to upload ${groupName.toLowerCase()}`
        );
      }
    } catch (err) {
      console.error(`Error uploading ${groupName.toLowerCase()}:`, err);
      dismissProgressToast();
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            `Failed to upload ${groupName.toLowerCase()}. Please try again.`
        );
      } else {
        toast.error(
          `Failed to upload ${groupName.toLowerCase()}. Please try again.`
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Upload site photos
  const handleUploadSitePhotos = async (
    filesToUpload: File[] | null = null
  ) => {
    await uploadFiles({
      filesToUpload,
      siteGroup: "SITE_PHOTOS",
      groupName: "Site photos",
      setIsUploading: setIsUploadingSitePhotos,
      setFiles: setSitePhotosFiles,
      fallbackFiles: sitePhotosFiles,
    });
  };

  // Upload measurement photos
  const handleUploadMeasurementPhotos = async (
    filesToUpload: File[] | null = null
  ) => {
    await uploadFiles({
      filesToUpload,
      siteGroup: "MEASUREMENT_PHOTOS",
      groupName: "Measurement photos",
      setIsUploading: setIsUploadingMeasurementPhotos,
      setFiles: setMeasurementPhotosFiles,
      fallbackFiles: measurementPhotosFiles,
    });
  };

  // File Category Section Component for Site Measurements (matching existingFiles UI)
  const SiteMeasurementFileSection = ({
    files,
  }: SiteMeasurementFileSectionProps) => {
    // State for collapsed/expanded sections
    const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
      images: false,
      videos: false,
      pdfs: false,
      others: false,
    });

    const toggleSection = (section: keyof ExpandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    };

    // Categorize files by type (same logic as ExistingFilesSection)
    const categorizeFiles = () => {
      const images: FileData[] = [];
      const videos: FileData[] = [];
      const pdfs: FileData[] = [];
      const others: FileData[] = [];

      files.forEach((file: FileData) => {
        if (file.mime_type.includes("image")) {
          images.push(file);
        } else if (file.mime_type.includes("video")) {
          videos.push(file);
        } else if (file.mime_type.includes("pdf")) {
          pdfs.push(file);
        } else {
          others.push(file);
        }
      });

      return { images, videos, pdfs, others };
    };

    const { images, videos, pdfs, others } = categorizeFiles();

    // File Category Section Component (same as ExistingFilesSection)
    const FileCategorySection = ({
      title,
      files,
      isSmall = false,
      sectionKey,
    }: FileCategorySectionProps) => {
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
              {files.map((file: FileData) => (
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
                    {file.mime_type.includes("image") ? (
                      <Image
                        height={100}
                        width={100}
                        src={`/${file.url}`}
                        alt={file.filename}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : file.mime_type.includes("video") ? (
                      <video
                        src={`/${file.url}`}
                        className="w-full h-full object-cover rounded-lg"
                        muted
                        playsInline
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center rounded-lg ${
                          file.mime_type.includes("pdf")
                            ? "bg-red-50"
                            : "bg-green-50"
                        }`}
                      >
                        {file.mime_type.includes("pdf") ? (
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
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Delete Button */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteFileConfirmation(file);
                      }}
                      disabled={isDeletingFile === file.id}
                      className="p-1.5 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                      title="Delete file"
                    >
                      {isDeletingFile === file.id ? (
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

    if (files.length === 0) return null;

    return (
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
    );
  };

  // Upload Section Component for Site Measurements
  const SiteMeasurementUploadSection = ({
    title,
    onFileSelect,
    isUploading,
  }: SiteMeasurementUploadSectionProps) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>

      {/* File Upload Area */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Select Files {isUploading && "(Uploading...)"}
        </label>
        <div
          className={`border-2 border-dashed border-slate-300 hover:border-secondary rounded-lg transition-all duration-200 bg-slate-50 hover:bg-slate-100 ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.dwg,.jpg,.jpeg,.png,.mp4,.mov"
            onChange={onFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary mx-auto mb-2"></div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Uploading files...
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                  <FileUp className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Click to upload
                </p>
                <p className="text-xs text-slate-500">
                  PDF, DWG, JPG, PNG, MP4, or MOV
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Site Photos */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Site Photos
            </h3>

            {/* Display Existing Site Photos */}
            <div className="mb-4">
              {sitePhotos.length > 0 ? (
                <SiteMeasurementFileSection
                  title="Site Photos"
                  files={sitePhotos}
                />
              ) : (
                <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No site photos uploaded yet</p>
                </div>
              )}
            </div>

            {/* Upload New Site Photos */}
            <SiteMeasurementUploadSection
              title="Upload New Site Photos"
              onFileSelect={handleSitePhotosFileSelect}
              isUploading={isUploadingSitePhotos}
            />
          </div>
        </div>

        {/* Right Column - Measurement Photos */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Measurement Photos
            </h3>

            {/* Display Existing Measurement Photos */}
            <div className="mb-4">
              {measurementPhotos.length > 0 ? (
                <SiteMeasurementFileSection
                  title="Measurement Photos"
                  files={measurementPhotos}
                />
              ) : (
                <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">
                    No measurement photos uploaded yet
                  </p>
                </div>
              )}
            </div>

            {/* Upload New Measurement Photos */}
            <SiteMeasurementUploadSection
              title="Upload New Measurement Photos"
              onFileSelect={handleMeasurementPhotosFileSelect}
              isUploading={isUploadingMeasurementPhotos}
            />
          </div>
        </div>
      </div>

      {/* Common Notes Section */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">
          Common Notes
        </h3>
        <TextEditor
          initialContent={
            selectedLotData?.tabs?.find(
              (tab: Tab) => tab.tab.toLowerCase() === activeTab.toLowerCase()
            )?.notes || ""
          }
          onSave={(content: string) => {
            handleNotesSave(content);
          }}
        />
      </div>
    </div>
  );
}
