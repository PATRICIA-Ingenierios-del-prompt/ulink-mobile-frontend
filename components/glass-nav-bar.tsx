import React, { useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

import type { ViewStyle, StyleProp } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NavTab {
  key: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: NavTab[] = [
  {
    key: "home",
    route: "/(tabs)/home",
    icon: "compass-outline",
    iconActive: "compass",
  },
  {
    key: "explore",
    route: "/(tabs)/explore",
    icon: "heart-outline",
    iconActive: "heart",
  },
  {
    key: "friends",
    route: "/(tabs)/friends",
    icon: "people-outline",
    iconActive: "people",
  },
  {
    key: "parches",
    route: "/(tabs)/parches",
    icon: "grid-outline",
    iconActive: "grid",
  },
  {
    key: "events",
    route: "/(tabs)/events",
    icon: "calendar-outline",
    iconActive: "calendar",
  },
];

export interface GlassNavBarProps {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>;
  /** Currently active tab key. If not provided, it will be inferred from the current route. */
  activeTab?: string;
}

function NavButton({
  tab,
  isActive,
  index,
}: {
  tab: NavTab;
  isActive: boolean;
  index: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    bgOpacity.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isActive, bgOpacity]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!isActive) {
      // navigate() switches tabs without pushing onto the stack
      router.navigate(tab.route as any);
    }
  }, [isActive, router, tab.route]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const iconName = isActive ? tab.iconActive : tab.icon;
  const iconColor = isActive
    ? "rgba(129, 140, 248, 1)"
    : "rgba(90, 90, 120, 1)";

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.button, animatedButtonStyle]}
    >
      {/* Animated active background */}
      <Animated.View style={[styles.buttonActiveBg, animatedBgStyle]} />
      <Ionicons name={iconName} size={22} color={iconColor} />
    </AnimatedPressable>
  );
}

export function GlassNavBar({ style, activeTab }: GlassNavBarProps) {
  const pathname = usePathname();

  // Infer active tab from route if not explicitly provided
  const currentTab =
    activeTab ??
    TABS.find((t) => {
      // Match by the last segment of the route (e.g. "home", "explore")
      const segment = t.route.split("/").pop();
      return pathname === t.route || pathname.endsWith(`/${segment}`);
    })?.key ??
    "home";

  return (
    <View style={[styles.outerWrap, style]}>
      <View style={styles.root}>
        {TABS.map((tab, index) => (
          <NavButton
            key={tab.key}
            tab={tab}
            isActive={currentTab === tab.key}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 30,
    // Pointer events pass through the transparent area
    pointerEvents: "box-none",
  },
  root: {
    flexDirection: "row",
    width: 320,
    height: 55,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 2,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
    backgroundColor: "rgba(18, 20, 36, 0.72)",
  },
  button: {
    width: 52,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonActiveBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.20)",
  },
});
