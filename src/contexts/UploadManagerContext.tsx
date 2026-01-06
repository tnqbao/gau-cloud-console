import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getToken } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { BACKEND_API_URL } from "@/lib/config";

// =====================================
// Types
// =====================================

export interface UploadingFile {
  id: string;
  file: File;
  bucketId: string;
  path: string;
  progress: number;
  phase: "preparing" | "uploading" | "processing" | "completed" | "failed";
  message: string;
  speed?: number;
  abortController: AbortController;
  error?: string;
  // For chunked upload tracking
  uploadedChunks?: number;
  totalChunks?: number;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  object?: UploadedObject;
  error?: string;
  duplicated?: boolean;
}

export interface UploadedObject {
  id: string;
  bucket_id: string;
  content_type: string;
  origin_name: string;
  parent_path: string;
  created_at: string;
  last_modified: string;
  size: number;
  url: string;
  file_hash: string;
}

interface UploadManagerContextType {
  uploadingFiles: UploadingFile[];
  completedFiles: UploadResult[];
  addFiles: (bucketId: string, files: File[], path?: string) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  cancelAllUploads: () => void;
  clearCompleted: () => void;
  getUploadingFilesForBucket: (bucketId: string, path?: string) => UploadingFile[];
}

// =====================================
// Constants
// =====================================

const UPLOAD_THRESHOLD = 30 * 1024 * 1024; // 30MB - Files larger than this use chunked upload
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB preferred chunk size
const MAX_RETRY_ATTEMPTS = 3;
const POLL_INTERVAL = 3000; // 3 seconds between status polls (reduced from 5s)
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max polling
const PARALLEL_CHUNK_LIMIT = 5; // Upload 5 chunks simultaneously (increased from 4)

// =====================================
// Context
// =====================================

const UploadManagerContext = createContext<UploadManagerContextType | null>(null);

export function useUploadManager() {
  const context = useContext(UploadManagerContext);
  if (!context) {
    throw new Error("useUploadManager must be used within UploadManagerProvider");
  }
  return context;
}

// =====================================
// Helper Functions
// =====================================

function generateId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "X-Device-ID": getDeviceId(),
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// =====================================
// Provider Component
// =====================================

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadResult[]>([]);

  const updateFileProgress = useCallback((
    fileId: string,
    updates: Partial<Pick<UploadingFile, "progress" | "phase" | "message" | "speed" | "error" | "uploadedChunks" | "totalChunks">>
  ) => {
    setUploadingFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, ...updates } : f)
    );
  }, []);

  const removeUploadingFile = useCallback((fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const addCompletedFile = useCallback((result: UploadResult) => {
    setCompletedFiles(prev => [...prev, result]);
  }, []);

  // Direct upload for small files
  const directUpload = useCallback(async (uploadFile: UploadingFile): Promise<UploadResult> => {
    const { id, file, bucketId, path, abortController } = uploadFile;
    const startTime = Date.now();

    try {
      updateFileProgress(id, { phase: "uploading", progress: 0, message: "Uploading..." });

      const formData = new FormData();
      formData.append("file", file);
      if (path) formData.append("path", path);

      const token = getToken();
      const headers: HeadersInit = { "X-Device-ID": getDeviceId() };
      if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

      return await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? event.loaded / elapsed : 0;
            updateFileProgress(id, {
              progress,
              message: `Uploading... ${progress}%`,
              speed
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            updateFileProgress(id, { phase: "completed", progress: 100, message: "Completed" });
            resolve({
              success: true,
              fileId: id,
              object: response.object,
              duplicated: response.duplicated,
            });
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        // Direct backend API call - Backend uses /objects endpoint for file upload
        xhr.open("POST", `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/objects`);
        Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value as string));
        xhr.send(formData);

        abortController.signal.addEventListener("abort", () => xhr.abort());
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      updateFileProgress(id, { phase: "failed", progress: 0, message: errorMessage, error: errorMessage });
      return { success: false, fileId: id, error: errorMessage };
    }
  }, [updateFileProgress]);

  // Chunked upload for large files (> 30MB) - uploads directly to backend API
  const chunkedUpload = useCallback(async (uploadFile: UploadingFile): Promise<UploadResult> => {
    const { id, file, bucketId, path, abortController } = uploadFile;
    const startTime = Date.now();
    const token = getToken();

    try {
      // ===== Step 1: Initialize Upload Session (Direct to Backend) =====
      updateFileProgress(id, {
        phase: "preparing",
        progress: 5,
        message: "Preparing file..."
      });

      const initResponse = await apiRequest<{
        upload_id: string;
        chunk_size: number;
        total_chunks: number;
      }>(`${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/chunked/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || "application/octet-stream",
          path: path || "",
          preferred_chunk_size: DEFAULT_CHUNK_SIZE,
        }),
      });

      const { upload_id, chunk_size, total_chunks } = initResponse;

      updateFileProgress(id, {
        progress: 8,
        message: "Analyzing file...",
        uploadedChunks: 0,
        totalChunks: total_chunks
      });

      // ===== Step 2: Upload Chunks DIRECTLY to Backend (bypass Next.js API) =====
      let uploadedChunks = 0;
      let totalBytesUploaded = 0;
      const chunkIndices = Array.from({ length: total_chunks }, (_, i) => i);

      // Helper to upload a single chunk directly to backend
      const uploadSingleChunk = async (chunkIndex: number): Promise<{ success: boolean; size: number }> => {
        const start = chunkIndex * chunk_size;
        const end = Math.min(start + chunk_size, file.size);
        const chunkBlob = file.slice(start, end);
        const chunkSize = end - start;

        let retries = 0;
        while (retries < MAX_RETRY_ATTEMPTS) {
          try {
            const formData = new FormData();
            formData.append("chunk", chunkBlob, `chunk_${chunkIndex.toString().padStart(5, '0')}.part`);

            // Direct call to backend API (bypass Next.js server)
            const response = await fetch(
              `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/chunked/chunk?upload_id=${upload_id}&chunk_index=${chunkIndex}`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "X-Device-ID": getDeviceId(),
                },
                body: formData,
              }
            );

            if (!response.ok) {
              throw new Error(`Chunk upload failed: ${response.status}`);
            }

            return { success: true, size: chunkSize };
          } catch {
            retries++;
            if (retries >= MAX_RETRY_ATTEMPTS) return { success: false, size: 0 };
            await sleep(500 * retries); // Faster retry: 500ms, 1s, 1.5s
          }
        }
        return { success: false, size: 0 };
      };

      // Upload chunks in parallel batches with real-time progress updates
      for (let i = 0; i < chunkIndices.length; i += PARALLEL_CHUNK_LIMIT) {
        if (abortController.signal.aborted) throw new Error("Upload cancelled");

        const batchIndices = chunkIndices.slice(i, i + PARALLEL_CHUNK_LIMIT);

        // Upload batch in parallel with individual progress tracking
        const uploadPromises = batchIndices.map(async (chunkIndex) => {
          const result = await uploadSingleChunk(chunkIndex);

          if (result.success) {
            // Update progress immediately after each chunk completes
            uploadedChunks++;
            totalBytesUploaded += result.size;

            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? totalBytesUploaded / elapsed : 0;
            // Progress: 10% for init, 10-85% for upload chunks
            const progress = 10 + Math.round((uploadedChunks / total_chunks) * 75);

            updateFileProgress(id, {
              phase: "uploading",
              progress,
              message: `Uploading... ${Math.round((totalBytesUploaded / file.size) * 100)}%`,
              speed,
              uploadedChunks,
              totalChunks: total_chunks
            });
          }

          return result;
        });

        const results = await Promise.all(uploadPromises);
        const failed = results.find(r => !r.success);
        if (failed) throw new Error("Failed to upload file part");
      }

      // ===== Step 3: Complete Upload (Direct to Backend) =====
      updateFileProgress(id, {
        phase: "processing",
        progress: 88,
        message: "Finalizing..."
      });

      await apiRequest<{
        status_url: string;
        upload_id: string;
      }>(`${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/chunked/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_id }),
      });

      updateFileProgress(id, {
        progress: 90,
        message: "Processing file..."
      });

      // ===== Step 4: Poll Status Until Complete =====
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (abortController.signal.aborted) throw new Error("Upload cancelled");

        await sleep(POLL_INTERVAL);

        const statusResponse = await apiRequest<{
          is_complete: boolean;
          status: string | number;
          object?: UploadedObject;
          error?: string;
          message?: string;
          file_hash?: string;
        }>(`${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/chunked/${upload_id}/status`, { method: "GET" });

        // Normalize status to string for comparison
        const statusStr = String(statusResponse.status).toUpperCase();

        // Update progress based on status
        if (statusStr === "PROCESSING") {
          updateFileProgress(id, {
            progress: 95,
            message: "Verifying integrity..."
          });
        }

        // Check if upload is complete
        if (statusResponse.is_complete) {
          // Success: has object and no error
          if (statusResponse.object && !statusResponse.error) {
            updateFileProgress(id, {
              phase: "completed",
              progress: 100,
              message: "Completed"
            });
            return { success: true, fileId: id, object: statusResponse.object };
          }
          // Failure: has error or explicit FAILED status
          else if (statusResponse.error || statusStr === "FAILED" || statusStr === "500") {
            throw new Error(statusResponse.error || statusResponse.message || "Processing failed");
          }
          // Fallback: is_complete but no object means failure
          else {
            throw new Error(statusResponse.message || "Upload completed but no file was created");
          }
        }
      }

      throw new Error("Processing timeout");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      updateFileProgress(id, { phase: "failed", progress: 0, message: errorMessage, error: errorMessage });
      return { success: false, fileId: id, error: errorMessage };
    }
  }, [updateFileProgress]);

  // Process upload
  const processUpload = useCallback(async (uploadFile: UploadingFile) => {
    const result = uploadFile.file.size <= UPLOAD_THRESHOLD
      ? await directUpload(uploadFile)
      : await chunkedUpload(uploadFile);

    removeUploadingFile(uploadFile.id);
    addCompletedFile(result);

    return result;
  }, [directUpload, chunkedUpload, removeUploadingFile, addCompletedFile]);

  // Helper to get unique filename if conflict
  const getUniqueFileName = async (bucketId: string, fileName: string, path: string): Promise<string> => {
    try {
      // Fetch existing files in the target path
      // Construct URL properly to avoid 301 redirects
      const pathParam = path ? `?path=${encodeURIComponent(path)}` : '';
      const url = `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/objects${pathParam}`;

      const response = await apiRequest<{
        objects?: Array<{ origin_name: string }>;
      }>(url);

      const existingNames = new Set((response.objects || []).map(obj => obj.origin_name));

      if (!existingNames.has(fileName)) {
        return fileName;
      }

      // File exists, generate unique name
      const lastDotIndex = fileName.lastIndexOf(".");
      const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;

      let baseName = fileName;
      let extension = "";

      if (hasExtension) {
        baseName = fileName.substring(0, lastDotIndex);
        extension = fileName.substring(lastDotIndex);
      }

      let counter = 1;
      let newName = `${baseName}(${counter})${extension}`;

      while (existingNames.has(newName)) {
        counter++;
        newName = `${baseName}(${counter})${extension}`;
      }

      return newName;
    } catch (error) {
      // If error checking, just return original name
      console.warn('Error checking duplicate filename:', error);
      return fileName;
    }
  };

  // Add files to upload queue
  const addFiles = useCallback(async (bucketId: string, files: File[], path: string = "") => {
    // Check for duplicate names and rename if necessary
    const processedFiles: Array<{ originalFile: File; finalFile: File }> = [];

    for (const file of files) {
      const uniqueName = await getUniqueFileName(bucketId, file.name, path);
      const finalFile = uniqueName === file.name
        ? file
        : new File([file], uniqueName, { type: file.type, lastModified: file.lastModified });

      processedFiles.push({ originalFile: file, finalFile });
    }

    const newUploads: UploadingFile[] = processedFiles.map(({ finalFile }) => ({
      id: generateId(),
      file: finalFile,
      bucketId,
      path,
      progress: 0,
      phase: "preparing" as const,
      message: "Waiting...",
      abortController: new AbortController(),
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Start uploads
    newUploads.forEach(upload => {
      processUpload(upload);
    });
  }, [processUpload]);

  // Cancel specific upload
  const cancelUpload = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        file.abortController.abort();
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Cancel all uploads
  const cancelAllUploads = useCallback(() => {
    uploadingFiles.forEach(f => f.abortController.abort());
    setUploadingFiles([]);
  }, [uploadingFiles]);

  // Clear completed
  const clearCompleted = useCallback(() => {
    setCompletedFiles([]);
  }, []);

  // Get uploading files for specific bucket and path
  const getUploadingFilesForBucket = useCallback((bucketId: string, path?: string) => {
    return uploadingFiles.filter(f =>
      f.bucketId === bucketId &&
      (path === undefined || f.path === path)
    );
  }, [uploadingFiles]);

  return (
    <UploadManagerContext.Provider value={{
      uploadingFiles,
      completedFiles,
      addFiles,
      cancelUpload,
      cancelAllUploads,
      clearCompleted,
      getUploadingFilesForBucket,
    }}>
      {children}
    </UploadManagerContext.Provider>
  );
}

export { formatBytes };

