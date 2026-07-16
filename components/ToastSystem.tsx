import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = "match" | "evento" | "chat" | "reporte" | "logro" | "xp" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

type ToastConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

const typeConfig: Record<ToastType, ToastConfig> = {
  match:   { icon: "heart",          color: "#FF6B9D", bg: "rgba(255,107,157,0.12)" },
  evento:  { icon: "calendar",       color: "#FFB347", bg: "rgba(255,179,71,0.12)" },
  chat:    { icon: "chatbubble",     color: "#6C63FF", bg: "rgba(108,99,255,0.12)" },
  reporte: { icon: "warning",        color: "#FF4D6A", bg: "rgba(255,77,106,0.12)" },
  logro:   { icon: "trophy",         color: "#FFB347", bg: "rgba(255,179,71,0.12)" },
  xp:      { icon: "flash",          color: "#7FE7C4", bg: "rgba(127,231,196,0.12)" },
  info:    { icon: "information-circle", color: "#8B8DB0", bg: "rgba(139,133,176,0.12)" },
};

// ── Global Toast API (pub/sub, no Context needed) ─────────────────────────────

let toastQueue: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notifyListeners() {
  listeners.forEach((l) => l([...toastQueue]));
}

export function addToast(toast: Omit<Toast, "id">) {
  const t: Toast = {
    ...toast,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    duration: toast.duration ?? 4000,
  };
  toastQueue = [...toastQueue, t];
  notifyListeners();
  setTimeout(() => {
    toastQueue = toastQueue.filter((x) => x.id !== t.id);
    notifyListeners();
  }, t.duration);
}

// ── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(60)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const cfg = typeConfig[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 200 }),
    ]).start();

    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 60, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  }, [toast.id]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          opacity,
          transform: [{ translateX }],
          borderColor: `${cfg.color}30`,
        },
      ]}
    >
      <Pressable style={styles.toastPressable} onPress={handleDismiss}>
        <View style={[styles.toastIconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={16} color={cfg.color} />
        </View>
        <View style={styles.toastContent}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </View>
        <Pressable style={styles.toastCloseBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={13} color="rgba(90, 90, 104, 1)" />
        </Pressable>
        <Animated.View
          style={[styles.toastProgressBar, { width: progressWidth, backgroundColor: cfg.color }]}
        />
      </Pressable>
    </Animated.View>
  );
}

// ── Toast Container (renders at root) ─────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    right: 16,
    left: 16,
    alignItems: "flex-end",
    zIndex: 1000,
    gap: 8,
  },
  toastCard: {
    width: Math.min(SCREEN_WIDTH - 32, 360),
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(18, 20, 36, 0.95)",
    overflow: "hidden",
    alignSelf: "flex-end",
  },
  toastPressable: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  toastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toastContent: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    fontWeight: "600",
  },
  toastMessage: {
    color: "rgba(143, 132, 224, 0.8)",
    fontSize: 12,
    lineHeight: 18,
  },
  toastCloseBtn: {
    marginTop: 2,
    padding: 2,
  },
  toastProgressBar: {
    height: 2,
    borderRadius: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});
