import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { STORAGE_ENDPOINTS } from "@/lib/config";
import { Bucket, BucketObject, CreateBucketRequest } from "@/types";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = useCallback(async () => {
    if (!bucketId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: BucketObject[] }>(
        STORAGE_ENDPOINTS.bucketObjects(bucketId)
      );
      setObjects(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch objects");
    } finally {
      setIsLoading(false);
    }
  }, [bucketId]);

  return {
    objects,
    isLoading,
    error,
    fetchObjects,
  };
}
