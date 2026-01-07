// API Configuration - Using local API routes (server-side proxy) to bypass CORS
export const API_BASE_URL = "";

// Direct backend API URL (for upload only - bypass Next.js API to reduce server load)
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.gauas.online";

// Auth endpoints (server-side proxy)
export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  profile: "/api/auth/profile",
  logout: "/api/auth/logout",
  googleSSO: "/api/auth/google",
} as const;

// Storage endpoints (server-side proxy)
export const STORAGE_ENDPOINTS = {
  buckets: "/api/storage/buckets",
  bucketById: (id: string) => `/api/storage/buckets/${id}`,
  bucketAccess: (id: string) => `/api/storage/buckets/${id}/access`,
  bucketObjects: (id: string, path?: string) => {
    const base = `/api/storage/buckets/${id}/objects`;
    return path ? `${base}?path=${encodeURIComponent(path)}` : base;
  },
  deleteObject: (bucketId: string, objectId: string) => `/api/storage/buckets/${bucketId}/objects/${objectId}`,
  deletePath: (bucketId: string, path: string) => `/api/storage/buckets/${bucketId}/objects/path/${path}`,
  downloadObject: (bucketId: string, objectId: string) => `${BACKEND_API_URL}/api/v1/cloud/buckets/${bucketId}/download/${objectId}`,
} as const;

// IAM endpoints (server-side proxy)
export const IAM_ENDPOINTS = {
  list: "/api/iam",
  byId: (id: string) => `/api/iam/${id}`,
} as const;

// SQS endpoints (server-side proxy) - Coming soon
export const SQS_ENDPOINTS = {
  queues: "/api/sqs/queues",
  queueById: (id: string) => `/api/sqs/queues/${id}`,
  messages: (queueId: string) => `/api/sqs/queues/${queueId}/messages`,
} as const;
