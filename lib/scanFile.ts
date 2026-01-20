/**
 * Scans a file for malware/viruses
 * This is a stub implementation - replace with actual virus scanning service
 * @param filePath - The path to the file to scan
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function scanFile(_filePath: string): Promise<{
  clean: boolean;
  viruses?: string[];
}> {
  // Stub implementation - always returns clean
  // TODO: Integrate with actual virus scanning service (ClamAV, etc.)
  // In production, use _filePath to scan the file
  return {
    clean: true,
  };
}
