import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { CameraView } from "expo-camera";
import { useWebRTC } from "@/hooks/useWebRTC";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Control Button ───────────────────────────────────────────────────────────

interface ControlBtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  label: string;
  variant?: "default" | "danger";
  size?: number;
}

function ControlButton({
  icon,
  iconActive,
  active,
  onPress,
  label,
  variant = "default",
  size = 58,
}: ControlBtnProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const bgColor =
    variant === "danger"
      ? "rgba(242, 63, 67, 1)"
      : active
        ? "rgba(99, 102, 241, 0.2)"
        : "rgba(255, 255, 255, 0.1)";

  const borderColor =
    variant === "danger"
      ? "rgba(242, 63, 67, 0.6)"
      : active
        ? "rgba(99, 102, 241, 0.4)"
        : "rgba(255, 255, 255, 0.12)";

  const iconColor =
    variant === "danger"
      ? "white"
      : active
        ? "rgba(165, 180, 252, 1)"
        : "rgba(255, 255, 255, 0.85)";

  const shadow =
    variant === "danger"
      ? {
          shadowColor: "rgba(242, 63, 67, 0.5)",
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 6 } as { width: number; height: number },
          shadowOpacity: 1,
          elevation: 10,
        }
      : {};

  const iconName = active && iconActive ? iconActive : icon;

  return (
    <View style={styles.controlWrap}>
      <AnimatedPressable
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            borderWidth: 1.5,
            borderColor,
            justifyContent: "center",
            alignItems: "center",
            ...shadow,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons name={iconName} size={size === 58 ? 24 : 28} color={iconColor} />
      </AnimatedPressable>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VideoCallScreen() {
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { userId, name, initials } = useLocalSearchParams();
  const calleeId = userId as string;

  const {
    localStream,
    remoteStream,
    isConnecting,
    startCall,
    endCall,
    toggleMic,
    toggleCamera,
  } = useWebRTC(calleeId);

  useEffect(() => {
    // Automatically start the call when screen mounts
    startCall(true);
    return () => {
      endCall();
    };
  }, [startCall, endCall]);

  useEffect(() => {
    if (isConnecting) return;
    const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnecting]);

  useEffect(() => {
    // isConnecting is handled by useWebRTC now
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 6000);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  const pulseOpacity = useSharedValue(0.4);
  useEffect(() => {
    if (isConnecting) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isConnecting]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const controlsY = useSharedValue(0);
  useEffect(() => {
    controlsY.value = withSpring(showControls ? 0 : 120, {
      damping: 20,
      stiffness: 200,
    });
  }, [showControls]);
  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlsY.value }],
    opacity: interpolate(controlsY.value, [0, 120], [1, 0]),
  }));

  const headerY = useSharedValue(-60);
  useEffect(() => {
    headerY.value = withSpring(showControls ? 0 : -60, {
      damping: 20,
      stiffness: 200,
    });
  }, [showControls]);
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: interpolate(headerY.value, [-60, 0], [0, 1]),
  }));

  return (
    <View style={styles.root}>
      {/* Remote Video placeholder */}
      <View style={styles.remoteVideo}>
        <View style={styles.remoteGradientLayer1} />
        <View style={styles.remoteGradientLayer2} />
        {remoteStream ? (
          <View style={styles.remoteVideoPlaceholder}>
            <View style={styles.remoteAvatar}>
              <Text style={styles.remoteAvatarText}>{initials || "U"}</Text>
            </View>
            <Text style={{color: "white", marginTop: 10}}>Conectado</Text>
          </View>
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <View style={styles.remoteAvatar}>
              <Text style={styles.remoteAvatarText}>{initials || "U"}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Header Overlay */}
      <Animated.View style={[styles.headerOverlay, headerAnimatedStyle]}>
        <SafeAreaView style={{ flex: 0 }} edges={["top"]}>
          <View style={styles.headerContent}>
            <Pressable style={styles.minimizeBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.7)" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.callerName}>{name || "Usuario"}</Text>
              <View style={styles.statusRow}>
                {isConnecting ? (
                  <>
                    <Animated.View style={[styles.connectingDot, pulseStyle]} />
                    <Text style={styles.statusText}>Conectando...</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.connectedDot} />
                    <Text style={styles.statusText}>{formatTimer(callSeconds)}</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.minimizeBtn}>
              <Ionicons name="videocam-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Tap zone */}
      <Pressable
        style={styles.tapZone}
        onPress={() => {
          setShowControls((s) => !s);
          resetControlsTimer();
        }}
      />

      {/* Local Preview */}
      <Animated.View style={[styles.localPreview, { opacity: interpolate(controlsY.value, [0, 120], [1, 0.3]) }]}>
        <View style={styles.localPreviewInner}>
          {isCameraOn ? (
            localStream ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={isFrontCamera ? "front" : "back"}
              />
            ) : (
              <View style={styles.localVideoActive}>
                <Text style={styles.localPreviewText}>TÚ</Text>
              </View>
            )
          ) : (
            <View style={styles.localVideoOff}>
              <Ionicons name="videocam-off" size={18} color="rgba(255, 255, 255, 0.4)" />
            </View>
          )}
        </View>
        <View style={styles.localPreviewBorder} />
      </Animated.View>

      {/* Connecting Overlay */}
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <View style={styles.connectingCard}>
            <View style={styles.connectingAvatarWrap}>
              <View style={styles.connectingAvatar}>
                <Text style={styles.connectingAvatarText}>SV</Text>
              </View>
              <Animated.View style={[styles.connectingRing, pulseStyle]} />
            </View>
            <Text style={styles.connectingName}>{name || "Usuario"}</Text>
            <Text style={styles.connectingSub}>Llamada de video...</Text>
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <Animated.View style={[styles.controlsContainer, controlsAnimatedStyle]}>
        <SafeAreaView style={{ flex: 0 }} edges={["bottom"]}>
          <View style={styles.controlsBg}>
            <View style={styles.controlsRow}>
              <ControlButton
                icon={isMuted ? "mic-off" : "mic"}
                active={!isMuted}
                onPress={() => {
                  const state = toggleMic();
                  setIsMuted(!state);
                }}
                label={isMuted ? "Mic off" : "Mic"}
              />
              <ControlButton
                icon={isSpeakerOn ? "volume-high" : "volume-medium"}
                active={isSpeakerOn}
                onPress={() => setIsSpeakerOn((s) => !s)}
                label="Altavoz"
              />
              <ControlButton
                icon="call"
                variant="danger"
                active={false}
                onPress={() => {
                  endCall();
                  router.back();
                }}
                label="Finalizar"
                size={68}
              />
              <ControlButton
                icon={isFrontCamera ? "camera-reverse" : "camera"}
                active={!isFrontCamera}
                onPress={() => setIsFrontCamera((f) => !f)}
                label="Cámara"
              />
              <ControlButton
                icon={isCameraOn ? "videocam" : "videocam-off"}
                active={isCameraOn}
                onPress={() => {
                  const state = toggleCamera();
                  setIsCameraOn(state);
                }}
                label="Video"
              />
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteGradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 12, 40, 1)",
  },
  remoteGradientLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 20, 55, 0.95)",
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  remoteAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(99, 102, 241, 0.4)",
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    elevation: 12,
  },
  remoteAvatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },

  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  headerCenter: {
    alignItems: "center",
  },
  callerName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  connectingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(240, 178, 50, 1)",
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(35, 165, 89, 1)",
  },
  minimizeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  tapZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  localPreview: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 110,
    height: 150,
    borderRadius: 18,
    zIndex: 20,
    overflow: "hidden",
  },
  localPreviewInner: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  localPreviewBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  localVideoActive: {
    flex: 1,
    backgroundColor: "rgba(40, 35, 75, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  localVideoOff: {
    flex: 1,
    backgroundColor: "rgba(30, 28, 45, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  localPreviewText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "700",
  },

  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  connectingCard: {
    alignItems: "center",
    gap: 16,
  },
  connectingAvatarWrap: {
    position: "relative",
    width: 100,
    height: 100,
  },
  connectingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  connectingAvatarText: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
  },
  connectingRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(99, 102, 241, 0.6)",
  },
  connectingName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  connectingSub: {
    color: "rgba(143, 132, 224, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },

  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsBg: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 16,
  },
  controlWrap: {
    alignItems: "center",
    gap: 6,
  },
  controlLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontWeight: "500",
  },
});
