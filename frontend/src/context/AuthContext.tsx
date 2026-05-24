"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthUser } from "@/types/auth.types";
import api from "@/lib/api/axios.instance";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthData: (user: AuthUser, token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount - try to restore session via refresh token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.post("/auth/refresh");
        const token = response.data.data.accessToken;

        // Get user profile
        if (typeof window !== "undefined") {
          window.__accessToken = token;
        }
        setAccessToken(token);

        const profileResponse = await api.get("/users/me");
        const userData = profileResponse.data.data;

        setUser({
          userId: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          businessId: userData.businessId,
        });
      } catch {
        // No valid session - stay on login page
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const setAuthData = (userData: AuthUser, token: string) => {
    setUser(userData);
    setAccessToken(token);
    if (typeof window !== "undefined") {
      window.__accessToken = token;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { accessToken: token, user: userData } = response.data.data;

    setAuthData(
      {
        userId: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        businessId: userData.businessId,
      },
      token
    );
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== "undefined") {
        window.__accessToken = undefined;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}