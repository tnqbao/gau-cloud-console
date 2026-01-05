import { useEffect, useState, useRef } from "react";
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

interface ObjectRowProps {
  object: BucketObject;
  bucketId: string;
  onFolderClick: (path: string) => void;
  onDelete: () => void;
}

function ObjectRow({ object, bucketId, onFolderClick, onDelete }: ObjectRowProps) {
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

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download file:", object.name);
    setIsMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${object.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setIsMenuOpen(false);

    try {
      await api.delete(`/api/storage/buckets/${bucketId}/objects/${object.id}`);
      onDelete();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete file");
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

      {/* Action Menu - Only show for files */}
      {object.type === "file" && (
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
            <div className="absolute right-0 top-full mt-1 w-40 bg-background border rounded-md shadow-lg z-10">
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <span>Download</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600 dark:text-red-400"
                disabled={isDeleting}
              >
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty space if folder */}
      {object.type === "folder" && <span className="w-8 shrink-0"></span>}
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

  // Can only cancel during preparing or uploading phases
  const canCancel = uploadFile.phase === "preparing" || uploadFile.phase === "uploading";
  const isActive = uploadFile.phase !== "failed" && uploadFile.phase !== "completed";

  return (
    <div className="flex items-center gap-2 rounded-md px-4 py-2 bg-muted/30 opacity-80">
      {/* Icon with animation */}
      <div className={cn("shrink-0", isActive && "animate-pulse")}>
        <FileIcon type="file" name={uploadFile.file.name} className="w-6 h-6" />
      </div>

      {/* Name and progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm truncate text-muted-foreground">
            {uploadFile.file.name}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {uploadFile.progress}%
          </span>
        </div>
        {/* Progress bar with smooth animation */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
          <div
            className={cn(
              "h-2 rounded-full relative",
              getProgressColor(),
              "transition-all duration-500 ease-out"
            )}
            style={{ width: `${uploadFile.progress}%` }}
          >
            {/* Shimmer effect - moving highlight from left to right */}
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

      {/* Size */}
      <span className="w-24 text-right text-xs text-muted-foreground">
        {formatBytes(uploadFile.file.size)}
      </span>

      {/* Status */}
      <span className="w-32 text-right text-xs text-muted-foreground">
        {getStatusText()}
      </span>

      {/* Cancel button */}
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
  } = useBucketObjects(bucketId);

  const { getUploadingFilesForBucket, cancelUpload, completedFiles } = useUploadManager();

  // Get uploading files for this bucket and path
  const uploadingFiles = bucketId ? getUploadingFilesForBucket(bucketId, currentPath) : [];

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

  // Refresh objects when uploads complete
  useEffect(() => {
    if (completedFiles.length > 0) {
      fetchObjects();
    }
  }, [completedFiles.length, fetchObjects]);

  const handleUploadStarted = () => {
    // Dialog will close, uploads continue in background
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
              {currentPath && (
                <Button variant="outline" onClick={navigateUp}>
                  ← Back
                </Button>
              )}
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
                    <span className="w-6"></span>
                    <span className="flex-1">Name</span>
                    <span className="w-24 text-right">Size</span>
                    <span className="w-32 text-right">Modified</span>
                    <span className="w-8"></span>
                  </div>
                  <div className="divide-y">
                    {/* Uploading files first (shown with opacity and progress) */}
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
                        onFolderClick={navigateToFolder}
                        onDelete={fetchObjects}
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

