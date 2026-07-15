import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CallScreen() {
  const router = useRouter();
  const [micActive, setMicActive] = useState(false);
  const [speakerActive, setSpeakerActive] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnecting) return;
    const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnecting]);

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

  const handlePress = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(!value);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
      </View>

      <View style={styles.container}>
        {/* Avatar and Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SV</Text>
            </View>
            <Animated.View style={[styles.connectingRing, pulseStyle]} />
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.nameText}>Sofía V.</Text>
            <Text style={styles.statusText}>
              {isConnecting ? "Llamando..." : formatTimer(callSeconds)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsWrapper}>
          <View style={styles.secondaryControls}>
            <Pressable
              style={styles.controlButtonWrap}
              onPress={() => handlePress(setMicActive, micActive)}
            >
              <View style={[styles.controlButton, micActive && styles.controlButtonActive]}>
                <Ionicons
                  name={micActive ? "mic" : "mic-off-outline"}
                  size={24}
                  color={micActive ? "rgba(99, 102, 241, 1)" : "rgba(255, 255, 255, 0.8)"}
                />
              </View>
              <Text style={styles.controlLabel}>Micrófono</Text>
            </Pressable>

            <Pressable
              style={styles.controlButtonWrap}
              onPress={() => handlePress(setSpeakerActive, speakerActive)}
            >
              <View style={[styles.controlButton, speakerActive && styles.controlButtonActive]}>
                <Ionicons
                  name={speakerActive ? "volume-high" : "volume-medium-outline"}
                  size={24}
                  color={speakerActive ? "rgba(99, 102, 241, 1)" : "rgba(255, 255, 255, 0.8)"}
                />
              </View>
              <Text style={styles.controlLabel}>Altavoz</Text>
            </Pressable>
          </View>

          <Pressable style={styles.endCallButton} onPress={() => router.back()}>
            <Ionicons name="call" size={28} color="white" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 80,
  },
  profileSection: {
    alignItems: "center",
    gap: 20,
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(99, 102, 241, 0.3)",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 8,
  },
  connectingRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  avatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 32,
    fontWeight: "800",
  },
  infoSection: {
    alignItems: "center",
    gap: 4,
  },
  nameText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  controlsWrapper: {
    alignItems: "center",
    gap: 32,
  },
  secondaryControls: {
    flexDirection: "row",
    gap: 24,
  },
  controlButtonWrap: {
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  controlButtonActive: {
    borderColor: "rgba(99, 102, 241, 0.3)",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
  },
  controlLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    fontWeight: "500",
  },
  endCallButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(242, 63, 67, 1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(242, 63, 67, 0.4)",
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    elevation: 8,
    transform: [{ rotate: "135deg" }],
  },
});
