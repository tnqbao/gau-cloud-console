import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useUploadManager, formatBytes } from "@/contexts/UploadManagerContext";
import { cn } from "@/lib/utils";
import { FileIcon } from "@/components/files/FileIcon";

interface UploadDialogProps {
  bucketId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadStarted?: () => void;
  currentPath?: string;
}

interface FileItem {
  id: string;
  name: string;
  file: File;
  path: string;
  isFolder: boolean;
  children?: FileItem[];
}

// Helper to generate unique filename if conflict
function getUniqueFileName(name: string, existingNames: Set<string>): string {
  if (!existingNames.has(name)) {
    return name;
  }

  const lastDotIndex = name.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < name.length - 1;

  let baseName = name;
  let extension = "";

  if (hasExtension) {
    baseName = name.substring(0, lastDotIndex);
    extension = name.substring(lastDotIndex);
  }

  let counter = 1;
  let newName = `${baseName}(${counter})${extension}`;

  while (existingNames.has(newName)) {
    counter++;
    newName = `${baseName}(${counter})${extension}`;
  }

  return newName;
}

export function UploadDialog({
  bucketId,
  isOpen,
  onClose,
  onUploadStarted,
  currentPath = "",
}: UploadDialogProps) {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { addFiles } = useUploadManager();

  // Process files with folder structure
  const processFiles = useCallback(async (items: DataTransferItemList | FileList) => {
    const newItems: FileItem[] = [];
    const fileNames = new Set<string>(fileItems.map(item => item.name));

    if ('length' in items && items[0] instanceof File) {
      // FileList from input
      const files = Array.from(items as FileList);
      for (const file of files) {
        const uniqueName = getUniqueFileName(file.name, fileNames);
        fileNames.add(uniqueName);

        // Create new File with unique name if needed
        const finalFile = uniqueName === file.name
          ? file
          : new File([file], uniqueName, { type: file.type });

        newItems.push({
          id: `${Date.now()}-${Math.random()}`,
          name: uniqueName,
          file: finalFile,
          path: "",
          isFolder: false,
        });
      }
    } else {
      // DataTransferItemList with folder support
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = (items as DataTransferItemList)[i].webkitGetAsEntry();
        if (item) entries.push(item);
      }

      const readEntry = async (entry: FileSystemEntry, path: string = ""): Promise<FileItem[]> => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          return new Promise((resolve) => {
            fileEntry.file((file) => {
              const uniqueName = getUniqueFileName(file.name, fileNames);
              fileNames.add(uniqueName);

              const finalFile = uniqueName === file.name
                ? file
                : new File([file], uniqueName, { type: file.type });

              resolve([{
                id: `${Date.now()}-${Math.random()}`,
                name: uniqueName,
                file: finalFile,
                path: path,
                isFolder: false,
              }]);
            });
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const dirReader = dirEntry.createReader();
          const children: FileItem[] = [];

          return new Promise((resolve) => {
            const readBatch = () => {
              dirReader.readEntries(async (entries) => {
                if (entries.length === 0) {
                  resolve([{
                    id: `${Date.now()}-${Math.random()}`,
                    name: dirEntry.name,
                    file: new File([], dirEntry.name),
                    path: path,
                    isFolder: true,
                    children,
                  }]);
                } else {
                  for (const entry of entries) {
                    const items = await readEntry(entry, path ? `${path}/${dirEntry.name}` : dirEntry.name);
                    children.push(...items);
                  }
                  readBatch();
                }
              });
            };
            readBatch();
          });
        }
        return [];
      };

      for (const entry of entries) {
        const items = await readEntry(entry);
        newItems.push(...items);
      }
    }

    setFileItems((prev) => [...prev, ...newItems]);
  }, [fileItems]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = ""; // Reset input
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      await processFiles(e.dataTransfer.items);
    }
  };

  const removeItem = (id: string) => {
    setFileItems((prev) => {
      const removeRecursive = (items: FileItem[]): FileItem[] => {
        return items.filter((item) => {
          if (item.id === id) return false;
          if (item.children) {
            item.children = removeRecursive(item.children);
          }
          return true;
        });
      };
      return removeRecursive(prev);
    });
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpload = async () => {
    if (fileItems.length === 0) return;

    // Flatten all files with their paths
    const flattenFiles = (items: FileItem[]): { file: File; path: string }[] => {
      const result: { file: File; path: string }[] = [];
      for (const item of items) {
        if (item.isFolder && item.children) {
          // Recursively process folder children
          result.push(...flattenFiles(item.children));
        } else if (!item.isFolder) {
          // For files, combine currentPath with item.path
          const fullPath = item.path
            ? (currentPath ? `${currentPath}/${item.path}` : item.path)
            : currentPath;
          result.push({ file: item.file, path: fullPath });
        }
      }
      return result;
    };

    const filesToUpload = flattenFiles(fileItems);

    // Group by path and upload
    const pathGroups = filesToUpload.reduce((acc, { file, path }) => {
      if (!acc[path]) acc[path] = [];
      acc[path].push(file);
      return acc;
    }, {} as Record<string, File[]>);

    // Start all uploads (will create placeholders for folders)
    const uploadPromises: Promise<void>[] = [];
    for (const [path, files] of Object.entries(pathGroups)) {
      uploadPromises.push(addFiles(bucketId, files, path));
    }

    // Wait a bit for placeholders to be created, then trigger refresh
    setTimeout(() => {
      onUploadStarted?.();
    }, 200);

    // Clear selection and close dialog
    setFileItems([]);
    setExpandedFolders(new Set());
    onClose();

    // Continue uploads in background
    Promise.all(uploadPromises).catch(() => {
      // Ignore errors, they're handled in upload manager
    });
  };

  const handleClose = () => {
    setFileItems([]);
    setExpandedFolders(new Set());
    onClose();
  };

  const getTotalFileCount = (items: FileItem[]): number => {
    let count = 0;
    for (const item of items) {
      if (item.isFolder && item.children) {
        count += getTotalFileCount(item.children);
      } else if (!item.isFolder) {
        count++;
      }
    }
    return count;
  };

  const totalFiles = getTotalFileCount(fileItems);

  const renderTreeItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);

    if (item.isFolder) {
      const childFileCount = getTotalFileCount(item.children || []);
      return (
        <div key={item.id}>
          <div
            className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md group transition-colors"
            style={{ paddingLeft: `${depth * 20 + 10}px` }}
          >
            <button
              onClick={() => toggleFolder(item.id)}
              className="shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <svg
                className={cn("w-3 h-3 transition-transform text-gray-600 dark:text-gray-400", isExpanded && "rotate-90")}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <svg className="shrink-0 w-5 h-5 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {item.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              {childFileCount} file{childFileCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
              title="Remove"
            >
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {isExpanded && item.children && (
            <div>
              {item.children.map((child) => renderTreeItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md group transition-colors"
        style={{ paddingLeft: `${depth * 20 + 10}px` }}
      >
        <span className="w-5 shrink-0"></span>
        <FileIcon type="file" name={item.name} className="shrink-0 w-5 h-5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(item.file.size)}</p>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
          title="Remove"
        >
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="sm:max-w-3xl">
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg transition-all duration-200",
              isDragging
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-lg"
                : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30"
            )}
          >
            <div className="py-10 px-6">
              {/* Buttons Row */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-w-[140px] h-11 font-medium border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Select Files
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => folderInputRef.current?.click()}
                  className="min-w-[140px] h-11 font-medium border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Select Folder
                </Button>
              </div>

              {/* Drag & Drop Text */}
              <div className="text-center">
                <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                  or drag and drop files or folders here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports files of any size • Multiple files and folders allowed
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory is not in types but works
              webkitdirectory="true"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* File Tree */}
          {fileItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Selected: {totalFiles} file{totalFiles !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Files
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => folderInputRef.current?.click()}
                    className="text-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Folder
                  </Button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded-lg bg-white dark:bg-gray-800/50 p-3 space-y-1">
                {fileItems.map((item) => renderTreeItem(item))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={totalFiles === 0}
            size="lg"
            className="min-w-[120px]"
          >
            {totalFiles > 0 ? `Upload (${totalFiles})` : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

