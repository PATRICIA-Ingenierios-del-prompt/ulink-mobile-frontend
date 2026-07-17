import Constants from "expo-constants";
import { Platform } from "react-native";

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey as
  | string
  | undefined;

/**
 * Android's `react-native-maps` (Google provider) throws a native
 * `IllegalStateException: API key not found` when the build has no Maps key.
 * iOS uses Apple Maps and needs no key. Use this to render a fallback instead
 * of mounting `MapView` on Android builds without a key, so the app never crashes.
 */
export const isMapAvailable: boolean =
  Platform.OS !== "android" || !!GOOGLE_MAPS_API_KEY;
