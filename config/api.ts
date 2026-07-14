import Constants from "expo-constants";

const ENV_API_URL = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export const API_URL: string = ENV_API_URL || "http://localhost:8080";

export const WS_URL: string = API_URL.replace(/^http/, "ws");
