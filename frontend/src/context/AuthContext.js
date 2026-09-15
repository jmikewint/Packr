"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "packr_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, restore a token from localStorage and refresh the user's
  // info via GET /me. A 401 means the token is actually invalid/expired, so
  // clear it - but auth-service being unreachable is a different situation
  // (transient outage), so we keep the token and just leave `user` unset
  // rather than logging the person out because one service hiccupped.
  useEffect(() => {
    // Reading localStorage must happen client-side only (SSR has no
    // localStorage and reading it during render would cause a hydration
    // mismatch), so this synchronous check-and-resolve belongs in an effect.
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }
    setToken(stored);
    authApi
      .me(stored)
      .then((me) => setUser(me))
      .catch((err) => {
        if (err?.status === 401) {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const applySession = useCallback((data) => {
    window.localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (email, password) => {
      const data = await authApi.signup({ email, password });
      applySession(data);
      return data;
    },
    [applySession]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login({ email, password });
      applySession(data);
      return data;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isLoading, isAuthenticated: !!token, signup, login, logout }),
    [token, user, isLoading, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
