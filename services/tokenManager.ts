import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "patricia_access_token";
const REFRESH_KEY = "patricia_refresh_token";

let cachedAccess: string | null = null;
let cachedRefresh: string | null = null;

export const tokenManager = {
  async getAccessToken(): Promise<string | null> {
    if (cachedAccess) return cachedAccess;
    cachedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
    return cachedAccess;
  },

  async getRefreshToken(): Promise<string | null> {
    if (cachedRefresh) return cachedRefresh;
    cachedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
    return cachedRefresh;
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    cachedAccess = accessToken;
    cachedRefresh = refreshToken;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    cachedAccess = null;
    cachedRefresh = null;
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
      if (name) return name;

      // Derive from ECI institutional email: karol.estupinan-v@mail... → "Karol Estupinan"
      const email: string | undefined = payload.email ?? payload.preferred_username;
      if (email) {
        const local = email.split("@")[0];
        const dot = local.indexOf(".");
        if (dot !== -1) {
          const firstName = local.slice(0, dot);
          const lastName = local.slice(dot + 1).split("-")[0];
          const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
          return cap(firstName) + " " + cap(lastName);
        }
      }

      return null;
    } catch {
      return null;
    }
  },
};
