import React, { useState } from "react";
import { View, Text, StyleSheet, Image as RNImage, type ImageStyle, type StyleProp } from "react-native";

interface ImageWithFallbackProps {
  source: { uri?: string } | number;
  fallbackInitials?: string;
  fallbackColor?: string;
  fallbackGradient?: [string, string];
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

/**
 * Image component that shows a styled fallback (initials on gradient)
 * when the image fails to load. Matches web frontend's ImageWithFallback.
 */
export function ImageWithFallback({
  source,
  fallbackInitials = "?",
  fallbackColor = "#6C63FF",
  fallbackGradient,
  style,
  resizeMode = "cover",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = hasError || !source || (typeof source === "object" && !source.uri);

  if (showFallback) {
    const colors = fallbackGradient ?? [fallbackColor, fallbackColor];
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: colors[0] },
          style,
        ]}
      >
        <Text style={styles.fallbackText}>
          {fallbackInitials.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <RNImage
      source={source}
      style={[styles.image, style]}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
});
