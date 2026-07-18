/**
 * UserAvatar
 * ----------
 * Shows the logged-in user's real profile photo inside the circular top-bar
 * button. Reads userPhoto and userName directly from AuthContext (no extra
 * network call — the context fetches the profile once at login/mount).
 * Falls back to initials if the photo is unavailable or fails to load.
 *
 * Usage:
 *   <UserAvatar size={42} style={styles.topAvatar} onPress={() => router.push("/profile")} />
 */
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";

interface UserAvatarProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function UserAvatar({ size = 42, style, onPress }: UserAvatarProps) {
  const { userName, userPhoto } = useAuth();
  const [imgError, setImgError] = useState(false);

  const initials = userName
    ? userName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "U";

  const showPhoto = !!userPhoto && !imgError;

  const containerStyle = [
    avatarStyles.container,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  const content = showPhoto ? (
    <Image
      source={{ uri: userPhoto }}
      style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      onError={() => setImgError(true)}
    />
  ) : (
    <Text style={[avatarStyles.initials, { fontSize: size * 0.33 }]}>{initials}</Text>
  );

  if (onPress) {
    return (
      <Pressable style={containerStyle} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const avatarStyles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(99, 102, 241, 0.80)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(143, 132, 224, 0.40)",
    overflow: "hidden",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
