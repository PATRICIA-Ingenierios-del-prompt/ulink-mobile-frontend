import React, { createContext, useCallback, useEffect, useState } from "react";
import { tokenManager } from "../services/tokenManager";
import type { TokenResponse } from "../services/types";

interface AuthContextValue {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: TokenResponse) => Promise<void>;
  logout: () => Promise<void>;
  setUserName: (name: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  userId: null,
  userEmail: null,
  userName: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setUserName: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenManager.getAccessToken();
        if (token) {
          setAccessToken(token);
          setUserId(tokenManager.getUserIdFromToken(token));
          setUserEmail(tokenManager.getUserEmailFromToken(token));
          setUserName(tokenManager.getUserNameFromToken(token));
        }
      } catch {
        await tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (tokens: TokenResponse) => {
    await tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setUserId(tokenManager.getUserIdFromToken(tokens.accessToken));
    setUserEmail(tokenManager.getUserEmailFromToken(tokens.accessToken));
    setUserName(tokenManager.getUserNameFromToken(tokens.accessToken));
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await tokenManager.getRefreshToken();
    await tokenManager.clearTokens();

    // Try to invalidate server-side, but don't block on failure
    if (refreshToken) {
      try {
        const { apiClient } = await import("../services/apiClient");
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Swallow — tokens already cleared locally
      }
    }

    setAccessToken(null);
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userId,
        userEmail,
        userName,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        logout,
        setUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
