import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginRequest, RegisterRequest } from "@/types";
import { api, setToken, removeToken, getToken, setRefreshToken, removeRefreshToken, getRefreshToken } from "@/lib/api";
import { AUTH_ENDPOINTS } from "@/lib/config";
import { useRouter } from "next/router";

// Response types from backend API
interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  status?: number;
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
  loginWithGoogle: (token: string) => Promise<void>;
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
    // Save access_token and refresh_token
    setToken(response.access_token);
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token);
    }
    // Fetch user profile after login
    await refreshProfile();
    router.push("/dashboard");
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.register, data, {
      skipAuth: true,
    });
    // Save access_token and refresh_token
    setToken(response.access_token);
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token);
    }
    // Fetch user profile after register
    await refreshProfile();
    router.push("/dashboard");
  };

  const loginWithGoogle = async (token: string) => {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.googleSSO, { token }, {
      skipAuth: true,
    });
    // Save access_token and refresh_token
    setToken(response.access_token);
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token);
    }
    // Fetch user profile after Google login
    await refreshProfile();
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      const headers: Record<string, string> = {};

      if (refreshToken) {
        headers["X-Refresh-Token"] = refreshToken;
      }

      await api.post(AUTH_ENDPOINTS.logout, undefined, {
        headers,
      });
    } catch {
      // Ignore logout errors
    } finally {
      removeToken();
      removeRefreshToken();
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
        loginWithGoogle,
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
