"use client";

import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, type TokenPair, type User } from "@/lib/api";

const ACCESS_KEY = "sportsclan.access";
const REFRESH_KEY = "sportsclan.refresh";

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse extends TokenPair {
  user: User;
}

interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  initializationError: string;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  signIn: (username: string, password: string) => Promise<void>;
  register: (details: RegisterData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState("");
  const accessToken = useRef<string | null>(null);
  const refreshToken = useRef<string | null>(null);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  const saveTokens = useCallback((tokens: TokenPair) => {
    accessToken.current = tokens.access;
    refreshToken.current = tokens.refresh;
    window.localStorage.setItem(ACCESS_KEY, tokens.access);
    window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
  }, []);

  const clearSession = useCallback(() => {
    accessToken.current = null;
    refreshToken.current = null;
    setUser(null);
    setInitializationError("");
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }, []);

  const refreshAccess = useCallback(() => {
    if (!refreshToken.current) return Promise.resolve(null);
    if (!refreshPromise.current) {
      refreshPromise.current = apiRequest<{ access: string }>("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh: refreshToken.current }),
      })
        .then(({ access }) => {
          accessToken.current = access;
          window.localStorage.setItem(ACCESS_KEY, access);
          return access;
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshPromise.current = null;
        });
    }
    return refreshPromise.current;
  }, [clearSession]);

  const request = useCallback<AuthContextValue["request"]>(
    async <T,>(path: string, options: RequestInit = {}) => {
      try {
        return await apiRequest<T>(path, { ...options, token: accessToken.current });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || path.includes("/auth/token/")) throw error;
        const refreshed = await refreshAccess();
        if (!refreshed) throw error;
        return apiRequest<T>(path, { ...options, token: refreshed });
      }
    },
    [refreshAccess],
  );

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      accessToken.current = window.localStorage.getItem(ACCESS_KEY);
      refreshToken.current = window.localStorage.getItem(REFRESH_KEY);
      try {
        let token = accessToken.current;
        if (!token && refreshToken.current) token = await refreshAccess();
        if (token) {
          try {
            const currentUser = await apiRequest<User>("/auth/me/", { token });
            if (!cancelled) setUser(currentUser);
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 401 || !refreshToken.current) throw error;
            token = await refreshAccess();
            if (token) {
              const currentUser = await apiRequest<User>("/auth/me/", { token });
              if (!cancelled) setUser(currentUser);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setInitializationError(error instanceof Error ? error.message : "Could not restore your account.");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [refreshAccess]);

  const signIn = useCallback(async (username: string, password: string) => {
    const tokens = await apiRequest<TokenPair>("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const currentUser = await apiRequest<User>("/auth/me/", { token: tokens.access });
    saveTokens(tokens);
    setUser(currentUser);
    setInitializationError("");
  }, [saveTokens]);

  const register = useCallback(async (details: RegisterData) => {
    const result = await apiRequest<RegisterResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(details),
    });
    saveTokens(result);
    setUser(result.user);
    setInitializationError("");
  }, [saveTokens]);

  const signOut = useCallback(() => clearSession(), [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isInitializing, initializationError, request, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AppProviders.");
  return context;
}
