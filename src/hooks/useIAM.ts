import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IAM_ENDPOINTS } from "@/lib/config";
import { IAMUser, CreateIAMUserRequest, UpdateIAMUserRequest } from "@/types";

// Backend response types
interface IAMUserResponse {
  id: string;
  name: string;
  email: string;
  access_key: string;
  secret_key: string;
  role: string;
  user_id: string;
}

interface IAMUsersListResponse {
  iam_users: IAMUserResponse[];
}

interface CreateIAMUserResponse {
  iam_user: IAMUserResponse;
  message: string;
  status: number;
}

// Map backend response to frontend IAMUser type
function mapIAMUser(user: IAMUserResponse): IAMUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    accessKey: user.access_key,
    secretKey: user.secret_key,
    role: user.role,
    userId: user.user_id,
  };
}

export function useIAM() {
  const [users, setUsers] = useState<IAMUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<IAMUsersListResponse>(IAM_ENDPOINTS.list);
      const mappedUsers = (response.iam_users || []).map(mapIAMUser);
      setUsers(mappedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch IAM users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (data: CreateIAMUserRequest) => {
    const response = await api.post<CreateIAMUserResponse>(IAM_ENDPOINTS.list, data);
    const newUser = mapIAMUser(response.iam_user);
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (id: string, data: UpdateIAMUserRequest) => {
    const response = await api.put<CreateIAMUserResponse>(IAM_ENDPOINTS.byId(id), data);
    const updatedUser = mapIAMUser(response.iam_user);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? updatedUser : u))
    );
    return updatedUser;
  };

  const deleteUser = async (id: string) => {
    await api.delete(IAM_ENDPOINTS.byId(id));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
