// Expo config loader. Reads the base app.json and injects environment-specific
// values (Google Maps API key, API URL) so secrets are not hard-coded in the repo.
module.exports = function ({ config }) {
  return {
    ...config,
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions || []),
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
      ],
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription:
          "U-LINK necesita acceso a tu ubicación para mostrar tu posición en el mapa de eventos.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "U-LINK necesita acceso a tu ubicación para compartir tu posición en eventos en vivo.",
      },
    },
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL || config.extra?.apiUrl,
    },
  };
};
