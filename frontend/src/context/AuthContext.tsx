"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Skip session restore on login page
    // Login page does not need to know about existing session
    // Middleware handles redirect if already logged in
    if (typeof window !== "undefined" &&
      window.location.pathname === "/login") {
      setIsLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const response = await api.post("/auth/refresh");
        const token = response.data.data.accessToken;
        window.__accessToken = token;
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
    window.__accessToken = token;
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { accessToken: token, user: userData } = response.data.data;
    const authUser: AuthUser = {
      userId: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      businessId: userData.businessId,
    };
    setUser(authUser);
    setAccessToken(token);
    window.__accessToken = token;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      window.__accessToken = undefined;
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