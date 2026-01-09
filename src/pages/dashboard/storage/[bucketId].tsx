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
import { useBucketObjects, useBuckets } from "@/hooks/useStorage";
import { UploadDialog } from "@/components/storage/UploadDialog";
import { useUploadManager, UploadingFile, formatBytes } from "@/contexts/UploadManagerContext";
import { BucketObject } from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { FileIcon } from "@/components/files/FileIcon";
import { STORAGE_ENDPOINTS } from "@/lib/config";

interface ObjectRowProps {
  object: BucketObject;
  bucketId: string;
  bucketName: string;
  onFolderClick: (path: string) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
}

function ObjectRow({ object, bucketId, bucketName, onFolderClick, onDelete, isSelected, onSelectChange }: ObjectRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

    // Browser-native download using CDN link
    const cdnUrl = getCdnUrl();
    const a = document.createElement("a");
    a.href = cdnUrl;
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
      // Show a brief success indicator (you could replace this with a toast notification)
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link to clipboard");
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
        "flex items-center gap-2 rounded-md px-4 py-2 hover:bg-muted/50 group relative",
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
          className="shrink-0 w-6 h-6"
        />

        {/* Name */}
        <span
          className={cn(
            "flex-1 text-sm truncate",
            object.type === "folder" && "font-medium text-blue-600 dark:text-blue-400"
          )}
        >
          {object.name}
        </span>

        {/* Size */}
        <span className="w-24 text-right text-xs text-muted-foreground shrink-0">
          {object.type === "file" ? formatBytes(object.size) : "—"}
        </span>

        {/* Modified */}
        <span className="w-32 text-right text-xs text-muted-foreground shrink-0">
          {object.lastModified
            ? new Date(object.lastModified).toLocaleDateString()
            : "—"}
        </span>
      </div>

      {/* Action Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isDeleting}
        >
          <span className="text-muted-foreground">⋮</span>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-10">
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
        <div className="flex items-center gap-2">
          <span className="text-sm truncate text-muted-foreground">
            {uploadFile.file.name}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {uploadFile.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {uploadFile.message}
          </span>
          {uploadFile.speed && uploadFile.phase === "uploading" && (
            <span className="text-xs text-muted-foreground">
              • {formatBytes(uploadFile.speed)}/s
            </span>
          )}
        </div>
      </div>

      <span className="w-24 text-right text-xs text-muted-foreground">
        {formatBytes(uploadFile.file.size)}
      </span>

      <span className="w-32 text-right text-xs text-muted-foreground">
        {getStatusText()}
      </span>

      {canCancel ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
          title="Cancel upload"
        >
          ✕
        </button>
      ) : (
        <span className="w-8"></span>
      )}
    </div>
  );
}

export default function BucketDetailPage() {
  const router = useRouter();
  const { bucketId } = router.query as { bucketId: string };
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
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

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedItems.size === objects.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(objects.map(obj => obj.id)));
    }
  };

  // Clear selection when navigating
  useEffect(() => {
    setSelectedItems(new Set());
  }, [currentPath]);

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

  return (
    <AuthGuard>
      <Head>
        <title>{displayBucketName ? `${displayBucketName} - Storage` : "Bucket Detail"} - Home Cloud</title>
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bucket Objects</h1>
              <p className="text-muted-foreground">
                {folderCount} folder(s), {objectCount} file(s)
                {currentPath && ` in /${currentPath}`}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {isDeleting ? "Deleting..." : `Delete Selected (${selectedItems.size})`}
                </Button>
              )}
              {currentPath && (
                <Button variant="outline" onClick={navigateUp}>
                  ← Back
                </Button>
              )}
              <Link href="/dashboard/document/object-storage" target="_blank">
                <Button variant="outline">
                  API Document
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                Upload File
              </Button>
              <Button>Create Folder</Button>
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
              ) : objects.length === 0 && uploadingFiles.length === 0 ? (
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
                <div className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={objects.length > 0 && selectedItems.size === objects.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                      title="Select all"
                    />
                    <span className="flex-1">Name</span>
                    <span className="w-24 text-right">Size</span>
                    <span className="w-32 text-right">Modified</span>
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
                    {objects.map((object) => (
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
                      />
                    ))}
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
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

