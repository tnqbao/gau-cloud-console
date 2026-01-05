import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { STORAGE_ENDPOINTS } from "@/lib/config";
import { Bucket, BucketObject, CreateBucketRequest, BucketObjectsResponse, StorageObject } from "@/types";

// Backend response types
interface BucketResponse {
  id: string;
  name: string;
  region: string;
  created_at: string;
  owner_id: string;
}

interface BucketsListResponse {
  buckets: BucketResponse[];
}

interface CreateBucketResponse {
  bucket: BucketResponse;
  message: string;
  status: number;
}

// Map backend response to frontend Bucket type
function mapBucket(bucket: BucketResponse): Bucket {
  return {
    id: bucket.id,
    name: bucket.name,
    region: bucket.region,
    createdAt: bucket.created_at,
    ownerId: bucket.owner_id,
    access: "private", // Default, API doesn't return this
    size: 0,
    objectCount: 0,
  };
}

// Map StorageObject to BucketObject (frontend format)
function mapStorageObject(obj: StorageObject): BucketObject {
  return {
    id: obj.id,
    name: obj.origin_name,
    path: obj.parent_path,
    type: "file",
    size: obj.size,
    lastModified: obj.last_modified,
    contentType: obj.content_type,
    url: obj.url,
    fileHash: obj.file_hash,
  };
}

// Map folder name to BucketObject
function mapFolder(folderName: string, parentPath: string): BucketObject {
  return {
    id: `folder-${folderName}-${parentPath}`,
    name: folderName,
    path: parentPath ? `${parentPath}/${folderName}` : folderName,
    type: "folder",
  };
}

export function useBuckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuckets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<BucketsListResponse>(STORAGE_ENDPOINTS.buckets);
      const mappedBuckets = (response.buckets || []).map(mapBucket);
      setBuckets(mappedBuckets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch buckets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBucket = async (data: CreateBucketRequest) => {
    const response = await api.post<CreateBucketResponse>(STORAGE_ENDPOINTS.buckets, data);
    const newBucket = mapBucket(response.bucket);
    setBuckets((prev) => [...prev, newBucket]);
    return newBucket;
  };

  const deleteBucket = async (id: string) => {
    await api.delete(STORAGE_ENDPOINTS.bucketById(id));
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBucketAccess = async (id: string, access: "private" | "public") => {
    await api.put(STORAGE_ENDPOINTS.bucketAccess(id), { access });
    setBuckets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, access } : b))
    );
  };

  return {
    buckets,
    isLoading,
    error,
    fetchBuckets,
    createBucket,
    deleteBucket,
    updateBucketAccess,
  };
}

export function useBucketObjects(bucketId: string) {
  const [objects, setObjects] = useState<BucketObject[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [objectCount, setObjectCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = useCallback(async (path?: string) => {
    if (!bucketId) return;
    setIsLoading(true);
    setError(null);

    const targetPath = path ?? currentPath;

    try {
      const response = await api.get<BucketObjectsResponse>(
        STORAGE_ENDPOINTS.bucketObjects(bucketId, targetPath || undefined)
      );

      // Map folders to BucketObject format
      const folderObjects = (response.folders || []).map(f => mapFolder(f, targetPath));

      // Map files to BucketObject format
      const fileObjects = (response.objects || []).map(mapStorageObject);

      // Combine folders first, then files
      setObjects([...folderObjects, ...fileObjects]);
      setFolders(response.folders || []);
      setObjectCount(response.object_count || 0);
      setFolderCount(response.folder_count || 0);
      setCurrentPath(response.path || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch objects");
    } finally {
      setIsLoading(false);
    }
  }, [bucketId, currentPath]);

  const navigateToFolder = useCallback(async (folderPath: string) => {
    setCurrentPath(folderPath);
    await fetchObjects(folderPath);
  }, [fetchObjects]);

  const navigateUp = useCallback(async () => {
    if (!currentPath) return;

    const parts = currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");

    await navigateToFolder(parentPath);
  }, [currentPath, navigateToFolder]);

  const navigateToRoot = useCallback(async () => {
    await navigateToFolder("");
  }, [navigateToFolder]);

  return {
    objects,
    folders,
    currentPath,
    objectCount,
    folderCount,
    isLoading,
    error,
    fetchObjects,
    navigateToFolder,
    navigateUp,
    navigateToRoot,
  };
}
