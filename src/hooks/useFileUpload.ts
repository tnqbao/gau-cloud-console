import { useState, useCallback, useRef } from "react";
import { getToken } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { BACKEND_API_URL } from "@/lib/config";

// Upload thresholds and constants
export const UPLOAD_THRESHOLD = 30 * 1024 * 1024; // 30MB - threshold for chunked upload
const DEFAULT_PREFERRED_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB preferred chunk size
const MAX_RETRY_ATTEMPTS = 3;
const POLL_INTERVAL = 3000; // 3 seconds (reduced from 5s for faster feedback)
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max polling

// Get parallel chunk limit based on time of day
// 7h-19h30: 5 chunks in parallel (peak hours)
// Outside peak hours: 2 chunks in parallel (off-peak hours)
function getParallelChunkLimit(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Convert current time to minutes since midnight
  const currentMinutes = hours * 60 + minutes;

  // Peak hours: 7:00 AM (420 minutes) to 7:30 PM (1170 minutes)
  const peakStart = 7 * 60; // 7:00 AM
  const peakEnd = 19 * 60 + 30; // 7:30 PM

  if (currentMinutes >= peakStart && currentMinutes <= peakEnd) {
    return 5; // Peak hours
  }

  return 2; // Off-peak hours
}

// =====================================
// Types
// =====================================

export interface UploadProgress {
  phase: "preparing" | "uploading" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  uploadedChunks?: number;
  totalChunks?: number;
  message: string;
  speed?: number; // bytes per second
}

export interface UploadResult {
  success: boolean;
  object?: UploadedObject;
  cdnUrl?: string;
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

// API Response types
interface DirectUploadResponse {
  message: string;
  object: UploadedObject;
  cdn_url: string;
  duplicated: boolean;
}

interface ChunkedInitResponse {
  upload_id: string;
  chunk_size: number;
  total_chunks: number;
  temp_prefix: string;
  expires_at: string;
}

interface ChunkUploadResponse {
  chunk_index: number;
  uploaded_chunks: number;
  total_chunks: number;
  status: string;
}

interface ChunkedCompleteResponse {
  message: string;
  upload_id: string;
  status: string;
  total_chunks: number;
  file_name: string;
  file_size: number;
  status_url: string;
}

interface ChunkedStatusResponse {
  upload_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: "INIT" | "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  uploaded_chunks: number;
  total_chunks: number;
  upload_progress: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
  message: string;
  is_complete: boolean;
  file_hash?: string;
  object?: UploadedObject;
  error?: string;
}

interface UploadOptions {
  path?: string; // Custom path in bucket
  onProgress?: (progress: UploadProgress) => void;
  abortSignal?: AbortSignal;
}

// =====================================
// Helper Functions
// =====================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =====================================
// Direct Upload (Small Files ≤ 50MB)
// Direct to Backend - bypasses Next.js API proxy
// =====================================

async function directUpload(
  bucketId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { path, onProgress } = options;

  onProgress?.({
    phase: "uploading",
    progress: 0,
    message: `Uploading ${file.name}...`,
  });

  const formData = new FormData();
  formData.append("file", file);
  if (path) {
    formData.append("path", path);
  }

  try {
    const token = getToken();
    const headers: HeadersInit = {
      "X-Device-ID": getDeviceId(),
    };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Use XMLHttpRequest for progress tracking - Direct to Backend
    const result = await new Promise<DirectUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.({
            phase: "uploading",
            progress,
            message: `Uploading ${file.name}... ${progress}%`,
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || error.error || `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      // Direct backend API call to avoid double bandwidth usage
      // Backend uses /objects endpoint for file upload
      const url = `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/objects`;
      xhr.open("POST", url);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value as string);
      });
      xhr.send(formData);

      // Handle abort signal
      if (options.abortSignal) {
        options.abortSignal.addEventListener("abort", () => xhr.abort());
      }
    });

    onProgress?.({
      phase: "completed",
      progress: 100,
      message: "Upload completed successfully!",
    });

    return {
      success: true,
      object: result.object,
      cdnUrl: result.cdn_url,
      duplicated: result.duplicated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    onProgress?.({
      phase: "failed",
      progress: 0,
      message: errorMessage,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =====================================
// Chunked Upload (Large Files > 50MB)
// Direct to Backend - bypasses Next.js API proxy
// =====================================

/**
 * Makes API request directly to backend for chunked upload
 * This bypasses the Next.js API proxy to avoid double bandwidth usage
 * Note: Backend must have proper CORS configuration to allow requests from frontend
 */
async function backendApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "X-Device-ID": getDeviceId(),
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // Direct backend API call
  const url = `${BACKEND_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

async function chunkedUpload(
  bucketId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { path, onProgress, abortSignal } = options;
  const startTime = Date.now();

  try {
    // ===== Step 1: Initialize Upload Session (Direct to Backend) =====
    onProgress?.({
      phase: "preparing",
      progress: 5,
      message: "Preparing file...",
    });

    const initPayload = {
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || "application/octet-stream",
      path: path || "",
      preferred_chunk_size: DEFAULT_PREFERRED_CHUNK_SIZE,
    };

    const initResponse = await backendApiRequest<ChunkedInitResponse>(
      `/api/v1/cloud/buckets/${bucketId}/chunked/init`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initPayload),
      }
    );

    const { upload_id, chunk_size, total_chunks } = initResponse;

    onProgress?.({
      phase: "preparing",
      progress: 8,
      message: "Analyzing file...",
    });

    // ===== Step 2: Upload Chunks in Parallel (Direct to Backend) =====
    let uploadedChunks = 0;
    let totalBytesUploaded = 0;
    const chunkIndices = Array.from({ length: total_chunks }, (_, i) => i);

    // Helper to upload a single chunk directly to backend
    const uploadSingleChunk = async (chunkIndex: number): Promise<{ success: boolean; size: number; error?: string }> => {
      const start = chunkIndex * chunk_size;
      const end = Math.min(start + chunk_size, file.size);
      const chunkBlob = file.slice(start, end);
      const chunkSize = end - start;

      let retries = 0;
      while (retries < MAX_RETRY_ATTEMPTS) {
        try {
          const formData = new FormData();
          formData.append("chunk", chunkBlob, `chunk_${chunkIndex.toString().padStart(5, '0')}.part`);
          await backendApiRequest<ChunkUploadResponse>(
            `/api/v1/cloud/buckets/${bucketId}/chunked/chunk?upload_id=${upload_id}&chunk_index=${chunkIndex}`,
            { method: "POST", body: formData }
          );
          return { success: true, size: chunkSize };
        } catch (error) {
          retries++;
          if (retries >= MAX_RETRY_ATTEMPTS) {
            return { success: false, size: 0, error: error instanceof Error ? error.message : "Chunk upload failed" };
          }
          await sleep(500 * retries); // Faster retry: 500ms, 1s, 1.5s
        }
      }
      return { success: false, size: 0 };
    };

    // Get dynamic parallel chunk limit based on time of day
    const PARALLEL_CHUNK_LIMIT = getParallelChunkLimit();

    // Process chunks in batches of PARALLEL_CHUNK_LIMIT
    for (let i = 0; i < chunkIndices.length; i += PARALLEL_CHUNK_LIMIT) {
      if (abortSignal?.aborted) {
        throw new Error("Upload aborted");
      }

      const batchIndices = chunkIndices.slice(i, i + PARALLEL_CHUNK_LIMIT);

      // Upload all chunks in the batch in parallel
      const results = await Promise.all(batchIndices.map(uploadSingleChunk));

      // Check for failures
      const failedChunk = results.find(r => !r.success);
      if (failedChunk) {
        throw new Error(failedChunk.error || `Failed to upload file part`);
      }

      // Update progress
      uploadedChunks += results.length;
      totalBytesUploaded += results.reduce((sum, r) => sum + r.size, 0);

      const elapsedTime = (Date.now() - startTime) / 1000;
      const speed = elapsedTime > 0 ? totalBytesUploaded / elapsedTime : 0;

      // Calculate progress: 10% for init, 10-85% for upload, 85-100% for processing
      const uploadProgress = 10 + Math.round((uploadedChunks / total_chunks) * 75);

      onProgress?.({
        phase: "uploading",
        progress: uploadProgress,
        uploadedChunks,
        totalChunks: total_chunks,
        message: `Uploading... ${Math.round((totalBytesUploaded / file.size) * 100)}%`,
        speed,
      });
    }

    // ===== Step 3: Complete Upload (Direct to Backend) =====
    onProgress?.({
      phase: "processing",
      progress: 88,
      message: "Finalizing...",
    });

    await backendApiRequest<ChunkedCompleteResponse>(
      `/api/v1/cloud/buckets/${bucketId}/chunked/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_id }),
      }
    );

    onProgress?.({
      phase: "processing",
      progress: 90,
      message: "Processing file...",
    });

    // ===== Step 4: Poll Status Until Complete (Direct to Backend) =====
    let pollAttempts = 0;

    while (pollAttempts < MAX_POLL_ATTEMPTS) {
      if (abortSignal?.aborted) {
        throw new Error("Upload aborted");
      }

      await sleep(POLL_INTERVAL);
      pollAttempts++;

      const statusResponse = await backendApiRequest<ChunkedStatusResponse>(
        `/api/v1/cloud/buckets/${bucketId}/chunked/${upload_id}/status`,
        { method: "GET" }
      );

      // Update progress based on status
      if (statusResponse.status === "PROCESSING") {
        onProgress?.({
          phase: "processing",
          progress: 95,
          message: "Verifying integrity...",
        });
      }

      if (statusResponse.is_complete) {
        if (statusResponse.status === "COMPLETED" && statusResponse.object) {
          onProgress?.({
            phase: "completed",
            progress: 100,
            message: "Upload completed!",
          });

          return {
            success: true,
            object: statusResponse.object,
          };
        } else if (statusResponse.status === "FAILED") {
          throw new Error(statusResponse.error || "Upload processing failed");
        }
      }
    }

    throw new Error("Upload processing timeout. Please check status later.");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    onProgress?.({
      phase: "failed",
      progress: 0,
      message: errorMessage,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =====================================
// Main Upload Function
// =====================================

async function uploadFile(
  bucketId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Determine upload method based on file size
  if (file.size <= UPLOAD_THRESHOLD) {
    return directUpload(bucketId, file, options);
  } else {
    return chunkedUpload(bucketId, file, options);
  }
}

// =====================================
// Hook
// =====================================

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (
      bucketId: string,
      file: File,
      options: Omit<UploadOptions, "onProgress" | "abortSignal"> = {}
    ): Promise<UploadResult> => {
      // Cancel any existing upload
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsUploading(true);
      setProgress(null);
      setResult(null);

      const uploadResult = await uploadFile(bucketId, file, {
        ...options,
        onProgress: setProgress,
        abortSignal: abortControllerRef.current.signal,
      });

      setResult(uploadResult);
      setIsUploading(false);

      return uploadResult;
    },
    []
  );

  const uploadMultiple = useCallback(
    async (
      bucketId: string,
      files: File[],
      options: Omit<UploadOptions, "onProgress" | "abortSignal"> = {}
    ): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({
          phase: "preparing",
          progress: 0,
          message: `Uploading file ${i + 1} of ${files.length}: ${file.name}`,
        });

        const result = await upload(bucketId, file, options);
        results.push(result);

        if (!result.success) {
          // Continue with next file even if one fails
          console.error(`Failed to upload ${file.name}:`, result.error);
        }
      }

      return results;
    },
    [upload]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setProgress({
      phase: "failed",
      progress: 0,
      message: "Upload cancelled",
    });
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
  }, []);

  return {
    upload,
    uploadMultiple,
    abort,
    reset,
    isUploading,
    progress,
    result,
    // Utility exports
    formatBytes,
    UPLOAD_THRESHOLD,
  };
}

// Export individual functions for advanced usage
export { uploadFile, directUpload, chunkedUpload, formatBytes };

