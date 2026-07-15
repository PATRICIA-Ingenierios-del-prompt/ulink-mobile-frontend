import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const COLORS_DARK = ["#6C63FF", "#7FE7C4", "#00D9FF", "#A78BFA"];

interface BubbleConfig {
  size: number;
  x: number;
  y: number;
  color: string;
  durationX: number;
  durationY: number;
  delay: number;
  opacity: number;
}

interface WaveConfig {
  y: number;
  color: string;
  width: number;
  opacity: number;
  duration: number;
  delay: number;
  amplitude: number;
}

function generateBubbles(count: number): BubbleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    size: 40 + Math.random() * 100,
    x: Math.random() * SCREEN_W,
    y: Math.random() * SCREEN_H,
    color: COLORS_DARK[i % COLORS_DARK.length],
    durationX: 8000 + Math.random() * 12000,
    durationY: 6000 + Math.random() * 10000,
    delay: Math.random() * 3000,
    opacity: 0.06 + Math.random() * 0.12,
  }));
}

function generateWaves(count: number): WaveConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    y: SCREEN_H * (0.2 + i * 0.2),
    color: COLORS_DARK[i % COLORS_DARK.length],
    width: 1.5 + Math.random() * 1.5,
    opacity: 0.05 + Math.random() * 0.08,
    duration: 12000 + Math.random() * 8000,
    delay: i * 800,
    amplitude: 30 + Math.random() * 40,
  }));
}

function AnimatedBubble({ config }: { config: BubbleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.x * 0.3, {
          duration: config.durationX,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.y * 0.3, {
          duration: config.durationY,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1.08, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(translateX.value, [0, config.x * 0.3], [-20, 20]) },
      { translateY: interpolate(translateY.value, [0, config.y * 0.3], [-15, 15]) },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          opacity: config.opacity,
          left: config.x - config.size / 2,
          top: config.y - config.size / 2,
        },
        style,
      ]}
    />
  );
}

function AnimatedWave({ config }: { config: WaveConfig }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(config.opacity);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.amplitude, {
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translateX.value, [0, config.amplitude], [-config.amplitude, config.amplitude]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.wave,
        {
          width: SCREEN_W * 1.5,
          height: config.width,
          borderRadius: config.width / 2,
          backgroundColor: config.color,
          opacity: config.opacity,
          top: config.y,
          left: -SCREEN_W * 0.25,
        },
        style,
      ]}
    />
  );
}

export function AnimatedBackground() {
  const bubbles = useMemo(() => generateBubbles(14), []);
  const waves = useMemo(() => generateWaves(4), []);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map((b, i) => (
        <AnimatedBubble key={`b${i}`} config={b} />
      ))}
      {waves.map((w, i) => (
        <AnimatedWave key={`w${i}`} config={w} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
  },
  wave: {
    position: "absolute",
  },
});
