import { useEffect, useState, useRef } from "react";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useBucketObjects, useBuckets } from "@/hooks/useStorage";
import { UploadDialog } from "@/components/storage/UploadDialog";
import { useUploadManager, UploadingFile, formatBytes } from "@/contexts/UploadManagerContext";
import { BucketObject } from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { FileIcon } from "@/components/files/FileIcon";
import { STORAGE_ENDPOINTS, BACKEND_API_URL } from "@/lib/config";
import { getToken } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

interface ObjectRowProps {
  object: BucketObject;
  bucketId: string;
  bucketName: string;
  onFolderClick: (path: string) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

function ObjectRow({ object, bucketId, bucketName, onFolderClick, onDelete, isSelected, onSelectChange, onShowToast }: ObjectRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate menu position when opened
  useEffect(() => {
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 200; // Approximate menu height

      // Check if there's enough space below
      const spaceBelow = windowHeight - rect.bottom;

      if (spaceBelow < menuHeight) {
        // Not enough space below, position above
        setMenuPosition({
          top: rect.top - menuHeight,
          right: window.innerWidth - rect.right,
        });
      } else {
        // Enough space below, position normally
        setMenuPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Generate CDN URL for file
  const getCdnUrl = () => {
    if (object.type !== "file") return "";
    // object.path contains parent_path, need to combine with file name
    const fullPath = object.path ? `${object.path}/${object.name}` : object.name;
    return `https://cdn.gauas.online/${bucketName}/${fullPath}`;
  };

  const handleDownload = () => {
    if (object.type !== "file") return;
    setIsMenuOpen(false);

    // Browser-native download using CDN link with download mode
    const cdnUrl = getCdnUrl();
    const downloadUrl = `${cdnUrl}?mode=download`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = object.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareLink = async () => {
    if (object.type !== "file") return;
    setIsMenuOpen(false);

    const cdnUrl = getCdnUrl();
    try {
      await navigator.clipboard.writeText(cdnUrl);
      onShowToast("Link copied to clipboard!", "success");
    } catch {
      onShowToast("Failed to copy link", "error");
    }
  };

  const handleDelete = async () => {
    const itemType = object.type === "folder" ? "folder" : "file";
    if (!confirm(`Are you sure you want to delete this ${itemType} "${object.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setIsMenuOpen(false);

    try {
      if (object.type === "folder") {
        // Delete folder via path endpoint
        await api.delete(STORAGE_ENDPOINTS.deletePath(bucketId, object.path));
      } else {
        // Delete file via object endpoint
        await api.delete(STORAGE_ENDPOINTS.deleteObject(bucketId, object.id));
      }
      onDelete();
    } catch (error) {
      alert(error instanceof Error ? error.message : `Failed to delete ${itemType}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (object.type === "folder") {
      onFolderClick(object.path);
    }
  };

  return (
      <div
          className={cn(
              "flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 hover:bg-muted/50 group relative",
              object.type === "folder" && "cursor-pointer",
              isDeleting && "opacity-50 pointer-events-none"
          )}
      >

        {/* Checkbox */}
        <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectChange(e.target.checked);
            }}
            className="w-4 h-4 shrink-0 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
        />

        <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={handleClick}
        >
          {/* Icon */}
          <FileIcon
              type={object.type}
              name={object.name}
              className="shrink-0 w-5 h-5 sm:w-6 sm:h-6"
          />

          {/* Name */}
          <span
              className={cn(
                  "flex-1 text-xs sm:text-sm truncate",
                  object.type === "folder" && "font-medium text-blue-600 dark:text-blue-400"
              )}
          >
          {object.name}
        </span>

          {/* Size - hidden on mobile */}
          <span className="w-16 sm:w-24 text-right text-xs text-muted-foreground shrink-0 hidden sm:block">
          {object.type === "file" ? formatBytes(object.size) : "—"}
        </span>

          {/* Modified - hidden on mobile and tablet */}
          <span className="w-24 sm:w-32 text-right text-xs text-muted-foreground shrink-0 hidden md:block">
          {object.lastModified
              ? new Date(object.lastModified).toLocaleDateString()
              : "—"}
        </span>
        </div>

        {/* Action Menu */}
        <div className="relative shrink-0">
          <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={cn(
                  "w-8 h-8 flex items-center justify-center rounded transition-all",
                  "opacity-40 sm:opacity-0 hover:opacity-100 group-hover:opacity-100",
                  "hover:bg-muted active:bg-muted",
                  isMenuOpen && "opacity-100 bg-muted"
              )}
              disabled={isDeleting}
              title="Actions"
          >
            <span className="text-foreground font-bold text-lg">⋮</span>
          </button>

          {/* Dropdown Menu - Using fixed positioning */}
          {isMenuOpen && menuPosition && (
              <div
                  ref={menuRef}
                  className="fixed w-48 bg-background border rounded-md shadow-lg z-50"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`,
                  }}
              >
                {object.type === "file" && (
                    <>
                      <button
                          onClick={handleDownload}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download</span>
                      </button>
                      <button
                          onClick={handleShareLink}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span>Share Link</span>
                      </button>
                    </>
                )}
                <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600 dark:text-red-400"
                    disabled={isDeleting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
          )}
        </div>
      </div>
  );
}

interface UploadingRowProps {
  uploadFile: UploadingFile;
  onCancel: () => void;
}

function UploadingRow({ uploadFile, onCancel }: UploadingRowProps) {
  const getProgressColor = () => {
    switch (uploadFile.phase) {
      case "preparing":
        return "bg-gradient-to-r from-yellow-400 to-yellow-500";
      case "uploading":
        return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "processing":
        return "bg-gradient-to-r from-purple-400 to-purple-600";
      case "failed":
        return "bg-gradient-to-r from-red-400 to-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (uploadFile.phase) {
      case "preparing":
        return "Preparing...";
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const canCancel = uploadFile.phase === "preparing" || uploadFile.phase === "uploading";
  const isActive = uploadFile.phase !== "failed" && uploadFile.phase !== "completed";

  return (
      <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted/30 opacity-80">
        {/* Checkbox placeholder for alignment */}
        <span className="w-4 h-4 shrink-0"></span>

        <div className={cn("shrink-0", isActive && "animate-pulse")}>
          <FileIcon type="file" name={uploadFile.file.name} className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          {/* First row: filename and percentage */}
          <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm truncate text-muted-foreground flex-1 min-w-0">
            {uploadFile.file.name}
          </span>
            <span className="text-xs font-medium text-muted-foreground shrink-0">
            {uploadFile.progress}%
          </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1 overflow-hidden">
            <div
                className={cn(
                    "h-2 rounded-full relative",
                    getProgressColor(),
                    "transition-all duration-500 ease-out"
                )}
                style={{ width: `${uploadFile.progress}%` }}
            >
              {isActive && (
                  <div
                      className="absolute inset-0 overflow-hidden rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                        animation: 'shimmer 1.5s infinite',
                      }}
                  />
              )}
            </div>
          </div>

          {/* Second row: status, speed, and file size on one line */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate">
              {uploadFile.message}
            </span>
              {uploadFile.speed && uploadFile.phase === "uploading" && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0">{formatBytes(uploadFile.speed)}/s</span>
                  </>
              )}
            </div>
            <span className="shrink-0">
            {formatBytes(uploadFile.file.size)}
          </span>
          </div>
        </div>

        {canCancel ? (
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="w-8 h-8 shrink-0 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Cancel upload"
            >
              ✕
            </button>
        ) : (
            <span className="w-8 shrink-0"></span>
        )}
      </div>
  );
}

export default function BucketDetailPage() {
  const router = useRouter();
  const { bucketId } = router.query as { bucketId: string };
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublicConfirmOpen, setIsPublicConfirmOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createFolderError, setCreateFolderError] = useState("");
  const [bucketAccess, setBucketAccess] = useState<"private" | "public">("private");
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [hiddenFiles, setHiddenFiles] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const lastCompletedCountRef = useRef(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Get bucket info from list
  const { buckets, fetchBuckets } = useBuckets();
  const bucket = buckets.find(b => b.id === bucketId);
  const bucketName = bucket?.name || "";

  const {
    objects,
    currentPath,
    objectCount,
    folderCount,
    isLoading,
    error,
    fetchObjects,
    navigateToFolder,
    navigateUp,
    navigateToRoot,
    addObject,
    addFolder,
    deleteObject,
    deletePath,
  } = useBucketObjects(bucketId);

  const { getUploadingFilesForBucket, cancelUpload, completedFiles, uploadingFiles: allUploadingFiles } = useUploadManager();

  // Get uploading files for this bucket and current path
  const uploadingFiles = bucketId ? getUploadingFilesForBucket(bucketId, currentPath) : [];

  // Track which folders we've already created for uploads
  const createdFoldersRef = useRef<Set<string>>(new Set());

  // Handle bulk copy URLs
  const handleBulkCopyUrls = async () => {
    if (selectedItems.size === 0) return;

    const selectedObjects = objects.filter(obj => selectedItems.has(obj.id) && obj.type === "file");

    if (selectedObjects.length === 0) {
      setToast({ message: "No files selected", type: "error" });
      return;
    }

    const urls = selectedObjects.map(obj => {
      const fullPath = obj.path ? `${obj.path}/${obj.name}` : obj.name;
      return `https://cdn.gauas.online/${bucketName}/${fullPath}`;
    });

    const urlsText = urls.join("\n");

    try {
      await navigator.clipboard.writeText(urlsText);
      setToast({ message: `Copied ${urls.length} URL(s) to clipboard`, type: "success" });
    } catch {
      setToast({ message: "Failed to copy URLs", type: "error" });
    }
  };

  // Handle bulk download
  const handleBulkDownload = () => {
    if (selectedItems.size === 0) return;

    const selectedObjects = objects.filter(obj => selectedItems.has(obj.id) && obj.type === "file");

    if (selectedObjects.length === 0) {
      setToast({ message: "No files selected", type: "error" });
      return;
    }

    // Download each file with a small delay to avoid browser blocking
    selectedObjects.forEach((obj, index) => {
      setTimeout(() => {
        const fullPath = obj.path ? `${obj.path}/${obj.name}` : obj.name;
        const cdnUrl = `https://cdn.gauas.online/${bucketName}/${fullPath}`;
        const downloadUrl = `${cdnUrl}?mode=download`;

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = obj.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 300); // 300ms delay between each download
    });

    setToast({ message: `Downloading ${selectedObjects.length} file(s)...`, type: "success" });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const itemCount = selectedItems.size;
    if (!confirm(`Are you sure you want to delete ${itemCount} item(s)?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // Separate files and folders
      const selectedObjects = objects.filter(obj => selectedItems.has(obj.id));
      const deletePromises = selectedObjects.map(obj => {
        if (obj.type === "folder") {
          return deletePath(obj.path);
        } else {
          return deleteObject(obj.id);
        }
      });

      // Execute all deletes in parallel
      await Promise.all(deletePromises);

      // Clear selection and refresh
      setSelectedItems(new Set());
      await fetchObjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle select all (need to define after visibleObjects)
  const handleToggleSelectAll = () => {
    const visibleObjs = objects.filter(obj =>
        !(obj.type === "file" && obj.name === "temp.file") && !hiddenFiles.has(obj.id)
    );
    if (selectedItems.size === visibleObjs.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleObjs.map(obj => obj.id)));
    }
  };

  // Clear selection when navigating
  useEffect(() => {
    setSelectedItems(new Set());
  }, [currentPath]);

  // Handle copy bucket ID
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(bucketId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      setToast({
        message: "Bucket ID copied to clipboard!",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to copy ID:", err);
      setToast({
        message: "Failed to copy ID",
        type: "error",
      });
    }
  };

  // Handle open settings and fetch bucket access
  const handleOpenSettings = async () => {
    setIsSettingsOpen(true);
    setAccessError("");
    setIsLoadingAccess(true);

    try {
      const response = await api.get<{ access: "private" | "public"; bucket: string; status: number }>(
          STORAGE_ENDPOINTS.bucketAccess(bucketId)
      );
      setBucketAccess(response.access);
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Failed to fetch bucket access");
      setBucketAccess("private");
    } finally {
      setIsLoadingAccess(false);
    }
  };

  // Handle access toggle with confirmation
  const handleAccessToggle = async (newAccess: "private" | "public") => {
    // If switching to public, show custom confirmation dialog
    if (newAccess === "public") {
      setIsPublicConfirmOpen(true);
      return;
    }

    // Switch to private without confirmation
    await performAccessUpdate(newAccess);
  };

  // Perform the actual access update
  const performAccessUpdate = async (newAccess: "private" | "public") => {
    setIsLoadingAccess(true);
    setAccessError("");
    try {
      await api.put(STORAGE_ENDPOINTS.bucketAccess(bucketId), { access: newAccess });
      setBucketAccess(newAccess);
      setToast({
        message: `Bucket access changed to ${newAccess}`,
        type: "success",
      });
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Failed to update bucket access");
      setToast({
        message: "Failed to update bucket access",
        type: "error",
      });
    } finally {
      setIsLoadingAccess(false);
    }
  };

  // Confirm public access
  const handleConfirmPublic = async () => {
    setIsPublicConfirmOpen(false);
    await performAccessUpdate("public");
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setCreateFolderError("Folder name is required");
      return;
    }

    setIsCreatingFolder(true);
    setCreateFolderError("");

    try {
      // Create a small temp file
      const tempContent = new Blob(["temp"], { type: "text/plain" });
      const tempFile = new File([tempContent], "temp.file", { type: "text/plain" });

      // Construct the path for the temp file
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;

      // Upload the temp file to create the folder
      const formData = new FormData();
      formData.append("file", tempFile);
      formData.append("path", folderPath);

      const token = getToken();
      const headers: HeadersInit = {
        "X-Device-ID": getDeviceId(),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
          `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/objects`,
          {
            method: "POST",
            headers,
            body: formData,
          }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create folder");
      }

      const result = await response.json();

      // Add the temp file ID to hidden files list
      if (result.object?.id) {
        setHiddenFiles(prev => new Set(prev).add(result.object.id));
      }

      // Add folder to UI
      addFolder(newFolderName);

      // Reset and close
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (err) {
      setCreateFolderError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Auto-create folder entries when files are being uploaded to new folders
  useEffect(() => {
    if (!bucketId) return;

    const allFiles = allUploadingFiles.filter(f => f.bucketId === bucketId);

    for (const file of allFiles) {
      if (!file.path) continue;

      // Extract immediate child folder from the path relative to currentPath
      let folderName = "";
      let folderPath = "";

      if (currentPath) {
        if (file.path.startsWith(currentPath + "/")) {
          const relativePath = file.path.substring(currentPath.length + 1);
          const firstSlash = relativePath.indexOf("/");
          if (firstSlash > 0) {
            folderName = relativePath.substring(0, firstSlash);
            folderPath = `${currentPath}/${folderName}`;
          }
        }
      } else {
        const firstSlash = file.path.indexOf("/");
        if (firstSlash > 0) {
          folderName = file.path.substring(0, firstSlash);
          folderPath = folderName;
        }
      }

      if (folderName && !createdFoldersRef.current.has(folderPath)) {
        const folderExists = objects.some(obj => obj.type === "folder" && obj.name === folderName);
        if (!folderExists) {
          addFolder(folderName);
          createdFoldersRef.current.add(folderPath);
        }
      }
    }
  }, [allUploadingFiles, bucketId, currentPath, objects, addFolder]);

  // Fetch buckets list to get bucket name
  useEffect(() => {
    if (bucketId && !bucket) {
      fetchBuckets();
    }
  }, [bucketId, bucket, fetchBuckets]);

  useEffect(() => {
    if (bucketId) {
      fetchObjects();
    }
  }, [bucketId, fetchObjects]);

  // Track completed files and add them when navigating to their folder
  useEffect(() => {
    if (!bucketId) return;

    // When currentPath changes (navigation), check if there are completed files for this path
    const completedFilesForPath = completedFiles.filter(file =>
        file.success &&
        file.object?.bucket_id === bucketId &&
        file.object.parent_path === currentPath
    );

    if (completedFilesForPath.length > 0) {
      completedFilesForPath.forEach(completion => {
        if (completion.object) {
          addObject(completion.object);
        }
      });
    }
  }, [currentPath, bucketId, completedFiles, addObject]);

  // Add new objects when uploads complete - without showing loading
  useEffect(() => {
    const currentCount = completedFiles.length;
    if (currentCount > lastCompletedCountRef.current && bucketId) {
      // Check if any completed file is for this bucket
      const newCompletions = completedFiles.slice(lastCompletedCountRef.current);
      const relevantCompletions = newCompletions.filter(file =>
          file.success && file.object?.bucket_id === bucketId
      );

      if (relevantCompletions.length > 0) {
        // Add each new object to the list without fetching
        // But only if file belongs to current path we're viewing
        relevantCompletions.forEach(completion => {
          if (completion.object) {
            // Check if this file belongs to current view
            const fileParentPath = completion.object.parent_path;

            if (fileParentPath === currentPath) {
              addObject(completion.object);
            }
          }
        });
        lastCompletedCountRef.current = currentCount;
      }
    }
    lastCompletedCountRef.current = currentCount;
  }, [completedFiles, bucketId, currentPath, addObject]);

  const handleUploadStarted = (foldersToCreate: string[]) => {
    // Create folders immediately
    foldersToCreate.forEach(folderName => {
      const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      if (!createdFoldersRef.current.has(folderPath)) {
        const folderExists = objects.some(obj => obj.type === "folder" && obj.name === folderName);
        if (!folderExists) {
          addFolder(folderName);
          createdFoldersRef.current.add(folderPath);
        }
      }
    });
  };

  // Build breadcrumb parts
  const pathParts = currentPath ? currentPath.split("/") : [];
  const displayBucketName = bucketName || bucketId;

  // Filter out hidden files (temp.file)
  const visibleObjects = objects.filter(obj =>
      !(obj.type === "file" && obj.name === "temp.file") && !hiddenFiles.has(obj.id)
  );

  return (
      <AuthGuard>
        <Head>
          <title>{displayBucketName ? `${displayBucketName} - Storage` : "Bucket Detail"} - Gauas Cloud</title>
        </Head>

        <DashboardLayout>
          <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Link href="/dashboard/storage" className="text-muted-foreground hover:text-foreground">
                Storage
              </Link>
              <span className="text-muted-foreground">/</span>
              <button
                  onClick={navigateToRoot}
                  className={cn(
                      "hover:text-foreground",
                      currentPath ? "text-muted-foreground" : "font-medium text-foreground"
                  )}
                  title={bucketId}
              >
                {displayBucketName}
              </button>
              {pathParts.map((part, index) => {
                const pathToHere = pathParts.slice(0, index + 1).join("/");
                const isLast = index === pathParts.length - 1;

                return (
                    <span key={pathToHere} className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <button
                      onClick={() => navigateToFolder(pathToHere)}
                      className={cn(
                          "hover:text-foreground",
                          isLast ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                  >
                    {part}
                  </button>
                </span>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Bucket Objects</h1>
                <p className="text-sm text-muted-foreground">
                  {folderCount} folder(s), {objectCount} file(s)
                  {currentPath && ` in /${currentPath}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItems.size > 0 && (
                    <>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkCopyUrls}
                          className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Copy URLs ({selectedItems.size})</span>
                        <span className="sm:hidden">Copy</span>
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkDownload}
                          className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Download ({selectedItems.size})</span>
                        <span className="sm:hidden">Download</span>
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkDelete}
                          disabled={isDeleting}
                          className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {isDeleting ? "Deleting..." : <><span className="hidden sm:inline">Delete ({selectedItems.size})</span><span className="sm:hidden">Delete</span></>}
                      </Button>
                    </>
                )}
                {currentPath && (
                    <Button variant="outline" size="sm" onClick={navigateUp}>
                      ← Back
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
                  <span className="hidden sm:inline">Upload File</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
                <Button size="sm" onClick={() => setIsCreateFolderOpen(true)}>
                  <span className="hidden sm:inline">Create Folder</span>
                  <span className="sm:hidden">New Folder</span>
                </Button>
                <Link href="/dashboard/document/object-storage" target="_blank" className="hidden md:block">
                  <Button variant="outline" size="sm">
                    API Doc
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleOpenSettings} className="px-2 sm:px-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Button>
              </div>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <Card>
              <CardHeader>
                <CardTitle>
                  Files & Folders
                  {currentPath && <span className="text-muted-foreground font-normal text-sm ml-2">/{currentPath}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <Loading message="Loading objects..." />
                ) : visibleObjects.length === 0 && uploadingFiles.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">
                        {currentPath ? "This folder is empty" : "This bucket is empty"}
                      </p>
                      <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setIsUploadDialogOpen(true)}
                      >
                        Upload your first file
                      </Button>
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-x-auto">
                      <div className="min-w-full">
                        <div className="flex items-center gap-2 border-b bg-muted/50 px-3 sm:px-4 py-2 text-xs font-medium text-muted-foreground">
                          <input
                              type="checkbox"
                              checked={visibleObjects.length > 0 && selectedItems.size === visibleObjects.length}
                              onChange={handleToggleSelectAll}
                              className="w-4 h-4 cursor-pointer"
                              title="Select all"
                          />
                          <span className="flex-1">Name</span>
                          <span className="w-16 sm:w-24 text-right hidden sm:block">Size</span>
                          <span className="w-24 sm:w-32 text-right hidden md:block">Modified</span>
                          <span className="w-8"></span>
                        </div>
                        <div className="divide-y">
                          {/* Uploading files (shown with opacity and progress) */}
                          {uploadingFiles.map((uploadFile) => (
                              <UploadingRow
                                  key={uploadFile.id}
                                  uploadFile={uploadFile}
                                  onCancel={() => cancelUpload(uploadFile.id)}
                              />
                          ))}
                          {/* Existing objects */}
                          {visibleObjects.map((object) => (
                              <ObjectRow
                                  key={object.id}
                                  object={object}
                                  bucketId={bucketId}
                                  bucketName={bucketName}
                                  onFolderClick={navigateToFolder}
                                  onDelete={fetchObjects}
                                  isSelected={selectedItems.has(object.id)}
                                  onSelectChange={(selected) => {
                                    const newSelection = new Set(selectedItems);
                                    if (selected) {
                                      newSelection.add(object.id);
                                    } else {
                                      newSelection.delete(object.id);
                                    }
                                    setSelectedItems(newSelection);
                                  }}
                                  onShowToast={(message, type) => setToast({ message, type })}
                              />
                          ))}
                        </div>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Dialog */}
            <UploadDialog
                bucketId={bucketId}
                isOpen={isUploadDialogOpen}
                onClose={() => setIsUploadDialogOpen(false)}
                onUploadStarted={handleUploadStarted}
                currentPath={currentPath}
            />

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)}>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
              </DialogHeader>
              <DialogContent>
                {createFolderError && (
                    <Alert variant="destructive" className="mb-4">
                      {createFolderError}
                    </Alert>
                )}
                <div className="space-y-2">
                  <label htmlFor="folderName" className="text-sm font-medium">
                    Folder Name
                  </label>
                  <Input
                      id="folderName"
                      placeholder="my-folder"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFolder();
                        }
                      }}
                  />
                </div>
              </DialogContent>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} isLoading={isCreatingFolder}>
                  Create
                </Button>
              </DialogFooter>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
              <DialogHeader>
                <DialogTitle>Bucket Settings</DialogTitle>
              </DialogHeader>
              <DialogContent>
                {accessError && (
                    <Alert variant="destructive" className="mb-4">
                      {accessError}
                    </Alert>
                )}
                <div className="space-y-6">
                  {/* Bucket ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bucket ID</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 text-xs bg-muted rounded border font-mono break-all">
                        {bucketId}
                      </code>
                      <button
                          onClick={handleCopyId}
                          className="shrink-0 px-3 py-2 text-xs bg-background hover:bg-muted border rounded transition-colors"
                          title="Copy ID"
                      >
                        {copiedId ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Bucket Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bucket Name</label>
                    <div className="px-3 py-2 bg-muted rounded border">
                      {bucketName || bucketId}
                    </div>
                  </div>

                  {/* Bucket Access - Toggle Style */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bucket Access</label>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <div className="font-medium">
                          {bucketAccess === "public" ? "Public" : "Private"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bucketAccess === "public"
                              ? "Anyone can access files"
                              : "Only authorized users can access"}
                        </div>
                      </div>
                      <button
                          onClick={() => handleAccessToggle(bucketAccess === "public" ? "private" : "public")}
                          disabled={isLoadingAccess}
                          className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              bucketAccess === "public" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600",
                              isLoadingAccess && "opacity-50 cursor-not-allowed"
                          )}
                      >
                      <span
                          className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              bucketAccess === "public" ? "translate-x-6" : "translate-x-1"
                          )}
                      />
                      </button>
                    </div>
                    {bucketAccess === "public" && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-1">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>This bucket is publicly accessible. Anyone with the link can view files.</span>
                        </div>
                    )}
                  </div>
                </div>
              </DialogContent>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </Dialog>

            {/* Public Access Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isPublicConfirmOpen}
                onClose={() => setIsPublicConfirmOpen(false)}
                onConfirm={handleConfirmPublic}
                title="Make Bucket Public?"
                message={`Are you sure you want to make this bucket PUBLIC?\n\nAnyone with the link will be able to access all files in this bucket without authentication.\n\nThis action can be reversed at any time.`}
                confirmText="Make Public"
                cancelText="Cancel"
                variant="warning"
                isLoading={isLoadingAccess}
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
          </div>
        </DashboardLayout>
      </AuthGuard>
  );
}

