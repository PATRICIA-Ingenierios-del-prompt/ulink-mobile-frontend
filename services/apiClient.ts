import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/api";
import { tokenManager } from "./tokenManager";
import type { TokenResponse } from "./types";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? "";
  const isAuthRoute = url.startsWith("/auth/");

  if (!isAuthRoute) {
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token?: string) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url: string = original?.url ?? "";

    // Only retry on 401, not on auth endpoints, and only once
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      url.startsWith("/auth/")
    ) {
      return Promise.reject(error);
    }

    if (original) {
      original._retry = true;
    }

    if (isRefreshing) {
      // Queue while refresh is in-flight
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (original) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(original!);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post<TokenResponse>(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      await tokenManager.setTokens(data.accessToken, data.refreshToken);
      flushQueue(null, data.accessToken);

      if (original) {
        original.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClient(original!);
    } catch (refreshError) {
      flushQueue(refreshError);
      await tokenManager.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
