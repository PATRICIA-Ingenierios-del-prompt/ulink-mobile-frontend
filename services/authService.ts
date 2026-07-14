import { apiClient } from "./apiClient";
import { tokenManager } from "./tokenManager";
import type { TokenResponse } from "./types";

export type { TokenResponse };

const MS_CLIENT_ID = "d378f378-5c84-4dc8-8ce6-85bf56b42a45";
const MS_TENANT = "common";
const MS_SCOPE = "openid profile email offline_access";

export const MS_REDIRECT_URI = "ulink://auth/callback";

export function getMicrosoftAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: MS_REDIRECT_URI,
    response_mode: "query",
    scope: MS_SCOPE,
  });
  return `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}

export const authService = {
  async loginMicrosoft(code: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/login/microsoft", {
      code,
      redirectUri: MS_REDIRECT_URI,
    });
    return data;
  },

  async requestOtp(email: string): Promise<void> {
    await apiClient.post("/auth/otp/request", { email });
  },

  async verifyOtp(email: string, code: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/otp/verify", {
      email,
      code,
    });
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = await tokenManager.getRefreshToken();
    await tokenManager.clearTokens();

    if (refreshToken) {
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Swallow — tokens already cleared locally
      }
    }
  },
};
