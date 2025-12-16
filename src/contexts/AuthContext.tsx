import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginRequest, RegisterRequest } from "@/types";
import { api, setToken, removeToken, getToken } from "@/lib/api";
import { AUTH_ENDPOINTS } from "@/lib/config";
import { useRouter } from "next/router";

// Response types from backend API
interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

interface ProfileResponse {
  id: string;
  email: string;
  fullname: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const response = await api.get<ProfileResponse>(AUTH_ENDPOINTS.profile);
      // Map backend response to User type
      setUser({
        id: response.id,
        email: response.email,
        name: response.fullname,
        createdAt: response.created_at,
      });
    } catch {
      setUser(null);
      removeToken();
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.login, data, {
      skipAuth: true,
    });
    // Backend returns access_token, not token
    setToken(response.access_token);
    // Fetch user profile after login
    await refreshProfile();
    router.push("/dashboard");
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.register, data, {
      skipAuth: true,
    });
    // Backend returns access_token, not token
    setToken(response.access_token);
    // Fetch user profile after register
    await refreshProfile();
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await api.post(AUTH_ENDPOINTS.logout);
    } catch {
      // Ignore logout errors
    } finally {
      removeToken();
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
