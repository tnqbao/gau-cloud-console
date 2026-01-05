// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Bucket types
export interface Bucket {
  id: string;
  name: string;
  region: string;
  access: "private" | "public";
  createdAt: string;
  size: number;
  objectCount: number;
  ownerId: string;
}

// Backend object response
export interface StorageObject {
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

// Objects list response from API
export interface BucketObjectsResponse {
  folder_count: number;
  folders: string[];
  object_count: number;
  objects: StorageObject[];
  path: string;
  status: number;
}

// Frontend object type (for tree view compatibility)
export interface BucketObject {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  lastModified?: string;
  contentType?: string;
  url?: string;
  fileHash?: string;
  children?: BucketObject[];
}

export interface CreateBucketRequest {
  name: string;
  region: string;
  access?: "private" | "public";
}

// IAM types
export interface IAMUser {
  id: string;
  name: string;
  email: string;
  accessKey: string;
  secretKey: string;
  role: string;
  userId: string;
}

export interface CreateIAMUserRequest {
  access_key: string;
  secret_key: string;
  name: string;
  email: string;
}

export interface UpdateIAMUserRequest {
  name?: string;
  email?: string;
  role?: string;
}

// SQS types
export interface Queue {
  id: string;
  name: string;
  messagesAvailable: number;
  messagesInFlight: number;
  createdAt: string;
}

export interface Message {
  id: string;
  body: string;
  receiptHandle: string;
  sentAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
