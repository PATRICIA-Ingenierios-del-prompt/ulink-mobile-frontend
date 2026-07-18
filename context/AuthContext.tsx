import React, { createContext, useCallback, useEffect, useState } from "react";
import { tokenManager } from "../services/tokenManager";
import { userService } from "../services/userService";
import { cache } from "../services/cache";
import type { TokenResponse } from "../services/types";

interface AuthContextValue {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: TokenResponse) => Promise<void>;
  isJurado: boolean;
  logout: () => Promise<void>;
  /** Call after updating the profile so the top-bar avatar/name refresh immediately. */
  refreshProfile: () => Promise<void>;
  /** Legacy setters kept for back-compat with screens that called them directly. */
  setUserName: (name: string) => void;
  setUserPhoto: (photo: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  userId: null,
  userEmail: null,
  userName: null,
  userPhoto: null,
  isAuthenticated: false,
  isJurado: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  setUserName: () => {},
  setUserPhoto: () => {},
});

/**
 * Fetches nombre + foto from the Users service.
 * Falls back to the JWT name claim when the API is unreachable.
 * Clears any stale cached entry first so we always get the real data.
 */
async function resolveProfile(
  uid: string,
  tokenFallbackName: string | null
): Promise<{ name: string | null; photo: string | null }> {
  // Bust the cache so we don't serve a stale entry that predates the
  // urlFotoPerfil→foto normalisation fix.
  cache.invalidate(`user:perfil:${uid}`);

  try {
    const perfil = await userService.getPerfil(uid);
    console.log("[resolveProfile] perfil:", JSON.stringify(perfil, null, 2));
    const name = [perfil.nombre, perfil.apellidos].filter(Boolean).join(" ").trim() || null;
    const photo = perfil.foto ?? null;
    console.log("[resolveProfile] resolved →", { name, photo });
    return { name: name || tokenFallbackName, photo };
  } catch (err: any) {
    console.log("[resolveProfile] ERROR:", err?.message ?? err);
    return { name: tokenFallbackName, photo: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isJurado, setIsJurado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenManager.getAccessToken();
        if (token) {
          const uid = tokenManager.getUserIdFromToken(token);
          setAccessToken(token);
          const roleR = tokenManager.getRoleFromToken(token);
          setIsJurado(roleR === 'JURADO' || roleR === 'ROLE_JURADO' || roleR === 'jurado');
          setUserId(uid);
          setUserEmail(tokenManager.getUserEmailFromToken(token));

          if (uid) {
            const { name, photo } = await resolveProfile(
              uid,
              tokenManager.getUserNameFromToken(token)
            );
            setUserName(name);
            setUserPhoto(photo);
          } else {
            setUserName(tokenManager.getUserNameFromToken(token));
          }
        }
      } catch {
        await tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (tokens: TokenResponse) => {
    await tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    const uid = tokenManager.getUserIdFromToken(tokens.accessToken);
    const role = tokenManager.getRoleFromToken(tokens.accessToken);
    setIsJurado(role === 'JURADO' || role === 'ROLE_JURADO' || role === 'jurado');
    setAccessToken(tokens.accessToken);
    setUserId(uid);
    setUserEmail(tokenManager.getUserEmailFromToken(tokens.accessToken));

    if (uid) {
      const { name, photo } = await resolveProfile(
        uid,
        tokenManager.getUserNameFromToken(tokens.accessToken)
      );
      setUserName(name);
      setUserPhoto(photo);
    } else {
      setUserName(tokenManager.getUserNameFromToken(tokens.accessToken));
    }
  }, []);

  // ── Refresh profile (call after editing profile/photo) ───────────────────
  const refreshProfile = useCallback(async () => {
    const uid = userId;
    if (!uid) return;
    const token = await tokenManager.getAccessToken();
    const { name, photo } = await resolveProfile(
      uid,
      token ? tokenManager.getUserNameFromToken(token) : null
    );
    if (name) setUserName(name);
    if (photo) setUserPhoto(photo);
  }, [userId]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = await tokenManager.getRefreshToken();
    await tokenManager.clearTokens();

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
    setUserPhoto(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userId,
        userEmail,
        userName,
        userPhoto,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
    isJurado,
        logout,
        refreshProfile,
        setUserName,
        setUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
