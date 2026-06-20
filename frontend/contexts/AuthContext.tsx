"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "@/lib/auth";
import { getAccessToken } from "@/lib/tokens";
import type { Profile } from "@/types/api";

interface AuthContextValue {
  user: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await fetchMe();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // react-hooks/set-state-in-effect is a documented false positive here:
    // loadUser is async and only ever calls setState after checking a
    // token / awaiting a network call, never synchronously during render.
    // See https://github.com/facebook/react/issues/34743
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await loginRequest(email, password);
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
