import fs from "fs";
import path from "path";
import sharp from "sharp";
import { scanFile } from "./scanFile";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileToDisk(
  targetPath: string,
  file: File
): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.promises.writeFile(targetPath, buffer);
}

/**
 * Converts an image file to WebP format using sharp
 * @param imageBuffer - The image buffer to convert
 * @param mimeType - The MIME type of the original image
 * @returns The converted WebP buffer
 */
export async function convertImageToWebP(
  imageBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  try {
    // Convert to WebP with quality optimization
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 90 })
      .toBuffer();
    return webpBuffer;
  } catch (error) {
    console.error("Error converting image to WebP:", error);
    throw new Error(
      `Failed to convert image to WebP: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Checks if a file is an image based on MIME type
 * @param mimeType - The MIME type to check
 * @returns True if the file is an image
 */
export function isImageFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/") && mimeType !== "image/svg+xml"; // Skip SVG as it's vector
}

export async function getUniqueFilename(
  targetDir: string,
  baseName: string,
  extension: string
): Promise<string> {
  let filename = `${baseName}${extension}`;
  let counter = 1;
  while (await fileExists(path.join(targetDir, filename))) {
    filename = `${baseName}-${counter}${extension}`;
    counter++;
  }
  return filename;
}

export async function deleteFileFromDisk(filePath: string): Promise<boolean> {
  try {
    if (await fileExists(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file from disk:", error);
    return false;
  }
}

export async function getFileMetadata(
  filePath: string,
  file: File | null = null
): Promise<{
  size: number;
  mimeType: string;
  extension: string;
  fileType: string;
  filename: string;
}> {
  const fileStats = await fs.promises.stat(filePath);
  const extension = path.extname(filePath).slice(1); // Remove the dot
  const mimeType = file?.type || "application/octet-stream";

  // Determine file type based on mime type
  let fileType = "other";
  if (mimeType.startsWith("image/")) {
    fileType = "image";
  } else if (mimeType.startsWith("video/")) {
    fileType = "video";
  } else if (mimeType === "application/pdf") {
    fileType = "pdf";
  } else if (mimeType.startsWith("application/")) {
    fileType = "document";
  }

  return {
    size: fileStats.size,
    mimeType,
    extension,
    fileType,
    filename: file?.name || path.basename(filePath),
  };
}

export function getRelativePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).replaceAll("\\", "/");
}

export async function generateUniqueBaseName(prefix = ""): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export interface UploadFileOptions {
  uploadDir?: string;
  subDir?: string;
  filenameStrategy?: "unique" | "id-based" | "original";
  idPrefix?: string;
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface UploadFileResult {
  success: boolean;
  filePath: string;
  relativePath: string;
  filename: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  extension: string;
  fileType: string;
}

export async function uploadFile(
  file: File,
  options: UploadFileOptions = {}
): Promise<UploadFileResult> {
  const {
    uploadDir = "mediauploads",
    subDir = "",
    filenameStrategy = "unique",
    idPrefix = "",
    maxSize = null,
    allowedTypes = null,
    allowedExtensions = null,
  } = options;

  // Validate file
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file provided");
  }

  // Validate file size
  if (maxSize && file.size > maxSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${maxSize} bytes`
    );
  }

  // Validate MIME type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Validate extension
  const fileExtension = path.extname(file.name);
  if (
    allowedExtensions &&
    !allowedExtensions.includes(fileExtension.toLowerCase())
  ) {
    throw new Error(`File extension ${fileExtension} is not allowed`);
  }

  // Build target directory
  const dirParts = [uploadDir];
  if (subDir) dirParts.push(subDir);
  const targetDir = path.join(process.cwd(), ...dirParts);
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Check if file is an image and should be converted to WebP
  const isImage = isImageFile(file.type);
  const finalExtension = isImage ? ".webp" : fileExtension;

  // Generate filename based on strategy
  let baseName: string;
  let targetName: string;
  switch (filenameStrategy) {
    case "id-based":
      baseName = idPrefix || "file";
      targetName = await getUniqueFilename(targetDir, baseName, finalExtension);
      break;
    case "original":
      baseName = path.basename(file.name, fileExtension);
      targetName = await getUniqueFilename(targetDir, baseName, finalExtension);
      break;
    case "unique":
    default:
      baseName = await generateUniqueBaseName(idPrefix);
      targetName = `${baseName}${finalExtension}`;
      break;
  }

  const targetPath = path.join(targetDir, targetName);

  // Convert image to WebP if it's an image, otherwise write as-is
  if (isImage) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const webpBuffer = await convertImageToWebP(buffer, file.type);

      // Write WebP file to disk
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, webpBuffer);
    } catch (error) {
      console.error("Error converting image to WebP:", error);
      // Fallback to original file if conversion fails
      await writeFileToDisk(targetPath, file);
    }
  } else {
    // Write non-image file to disk as-is
    await writeFileToDisk(targetPath, file);
  }

  // Scan file for viruses
  try {
    const scanResult = await scanFile(targetPath);
    if (!scanResult.clean) {
      // File is infected and has been deleted by scanFile
      throw new Error(
        `File contains malware: ${scanResult.viruses?.join(", ") || "unknown threat"}`
      );
    }
  } catch (error) {
    // If scan fails or file is infected, ensure file is deleted
    try {
      if (await fileExists(targetPath)) {
        await deleteFileFromDisk(targetPath);
      }
    } catch (deleteError) {
      console.error("Error deleting infected file:", deleteError);
    }
    // Re-throw the error
    throw error;
  }

  // Get file metadata - update MIME type and extension for converted images
  const metadata = await getFileMetadata(targetPath, file);

  // Update metadata for WebP converted images
  if (isImage) {
    metadata.mimeType = "image/webp";
    metadata.extension = "webp";
    metadata.fileType = "image";
    // Update size from the actual saved file
    const stats = await fs.promises.stat(targetPath);
    metadata.size = stats.size;
  }

  const relativePath = getRelativePath(targetPath);

  return {
    success: true,
    filePath: targetPath,
    relativePath,
    filename: targetName,
    originalFilename: file.name,
    size: metadata.size,
    mimeType: metadata.mimeType,
    extension: metadata.extension,
    fileType: metadata.fileType,
  };
}

export interface UploadMultipleFilesResult {
  successful: UploadFileResult[];
  failed: Array<{ filename: string; error: string }>;
}

export async function uploadMultipleFiles(
  files: File[] | File,
  options: UploadFileOptions = {}
): Promise<UploadMultipleFilesResult> {
  const filesArray = Array.isArray(files) ? files : [files];
  const results: UploadMultipleFilesResult = {
    successful: [],
    failed: [],
  };

  for (const file of filesArray) {
    if (!(file instanceof File)) continue;

    try {
      const result = await uploadFile(file, options);
      results.successful.push(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      results.failed.push({
        filename: file.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

export async function deleteFileByRelativePath(
  relativePath: string
): Promise<boolean> {
  const absolutePath = path.join(process.cwd(), relativePath);
  return await deleteFileFromDisk(absolutePath);
}

export async function validateMultipartRequest(
  request: Request
): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }

  try {
    return await request.formData();
  } catch (error) {
    throw new Error(
      `Failed to parse form data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function getFileFromFormData(
  formData: FormData,
  fieldName: string,
  getAll = false
): File | File[] | null | "" {
  if (getAll) {
    const files = formData.getAll(fieldName);
    return files.filter((file): file is File => file instanceof File);
  }
  const file = formData.get(fieldName);
  // Return the file if it's a File instance
  if (file instanceof File) {
    return file;
  }
  // Return empty string if it's explicitly an empty string (for deletion)
  if (file === "") {
    return "";
  }
  // Return null for null/undefined/not found
  return null;
}
