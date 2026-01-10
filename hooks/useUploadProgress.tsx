"use client";
import { useRef } from "react";
import { toast, Id } from "react-toastify";
import { AxiosProgressEvent } from "axios";
import UploadProgressBar from "@/components/UploadProgressBar";

/**
 * Custom hook for handling file uploads with progress tracking
 */
export const useUploadProgress = () => {
  const uploadProgressRef = useRef<number>(0);
  const uploadProgressToastId = useRef<Id | null>(null);

  /**
   * Show progress toast for file upload
   * @param fileCount - Number of files being uploaded
   */
  const showProgressToast = (fileCount: number): void => {
    uploadProgressRef.current = 0;

    uploadProgressToastId.current = toast(
      ({ closeToast, isPaused }) => (
        <UploadProgressBar
          progress={uploadProgressRef.current}
          isPaused={isPaused}
          fileCount={fileCount}
          closeToast={closeToast}
        />
      ),
      {
        position: "top-right",
        autoClose: 5000,
        customProgressBar: true,
      }
    );
  };

  /**
   * Update progress in the toast
   * @param progress - Progress percentage (0-100)
   * @param fileCount - Number of files being uploaded
   */
  const updateProgress = (progress: number, fileCount: number): void => {
    uploadProgressRef.current = progress;
    if (uploadProgressToastId.current) {
      toast.update(uploadProgressToastId.current, {
        render: ({ closeToast, isPaused }) => (
          <UploadProgressBar
            progress={uploadProgressRef.current}
            isPaused={isPaused}
            fileCount={fileCount}
            closeToast={closeToast}
          />
        ),
      });
    }
  };

  /**
   * Complete the upload and auto-dismiss after 5 seconds
   * @param fileCount - Number of files that were uploaded
   */
  const completeUpload = (fileCount: number): void => {
    uploadProgressRef.current = 100;
    if (uploadProgressToastId.current) {
      const toastId = uploadProgressToastId.current;

      toast.update(toastId, {
        render: ({ closeToast, isPaused }) => (
          <UploadProgressBar
            progress={100}
            isPaused={isPaused}
            fileCount={fileCount}
            closeToast={closeToast}
          />
        ),
        autoClose: 5000,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
      });

      // Backup: Also manually dismiss after 5 seconds to ensure it closes
      setTimeout(() => {
        if (uploadProgressToastId.current === toastId) {
          toast.dismiss(uploadProgressToastId.current);
          uploadProgressToastId.current = null;
        }
      }, 5000);
    }
  };

  /**
   * Dismiss the progress toast (e.g., on error)
   */
  const dismissProgressToast = (): void => {
    if (uploadProgressToastId.current) {
      toast.dismiss(uploadProgressToastId.current);
      uploadProgressToastId.current = null;
    }
  };

  /**
   * Get axios onUploadProgress handler
   * @param fileCount - Number of files being uploaded
   * @returns onUploadProgress handler for axios
   */
  const getUploadProgressHandler = (fileCount: number) => {
    return (progressEvent: AxiosProgressEvent): void => {
      if (progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        updateProgress(progress, fileCount);
      }
    };
  };

  return {
    uploadProgressRef,
    uploadProgressToastId,
    showProgressToast,
    updateProgress,
    completeUpload,
    dismissProgressToast,
    getUploadProgressHandler,
  };
};

