"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { User } from "@/lib/auth";
import { fetchMe, loginApi } from "@/lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: () => {},
});

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1] ?? null
  );
}

function setTokenCookie(token: string) {
  document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

function removeTokenCookie() {
  document.cookie = "access_token=; path=/; max-age=0";
}

async function initializeAuth(): Promise<AuthState> {
  const stored = getStoredToken();
  if (!stored) {
    return { user: null, token: null, loading: false };
  }
  try {
    const me = await fetchMe(stored);
    return { user: me, token: stored, loading: false };
  } catch {
    removeTokenCookie();
    return { user: null, token: null, loading: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initializeAuth().then(setState);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setTokenCookie(res.access_token);
    const me = await fetchMe(res.access_token);
    setState({ user: me, token: res.access_token, loading: false });
  }, []);

  const logout = useCallback(() => {
    removeTokenCookie();
    setState({ user: null, token: null, loading: false });
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback(() => {
    const token = getStoredToken();
    if (!token) return;
    fetchMe(token)
      .then((me) => setState((prev) => ({ ...prev, user: me })))
      .catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
