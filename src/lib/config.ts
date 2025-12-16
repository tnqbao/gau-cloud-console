// API Configuration - Using local API routes to bypass CORS
export const API_BASE_URL = "";

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
  bucketObjects: (id: string) => `/api/storage/buckets/${id}/objects`,
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
