import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "patricia_access_token";
const REFRESH_KEY = "patricia_refresh_token";

export const tokenManager = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },

  getUserIdFromToken(accessToken: string): string | null {
    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.sub ?? payload.userId ?? payload.id ?? null;
    } catch {
      return null;
    }
  },

  getUserEmailFromToken(accessToken: string): string | null {
    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.email ?? payload.preferred_username ?? null;
    } catch {
      return null;
    }
  },

  getUserNameFromToken(accessToken: string): string | null {
    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const name: string | undefined =
        payload.name ??
        [payload.given_name, payload.family_name].filter(Boolean).join(" ");
      return name || null;
    } catch {
      return null;
    }
  },
};
