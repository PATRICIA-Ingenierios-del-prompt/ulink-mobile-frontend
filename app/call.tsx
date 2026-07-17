import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useWebRTC } from "@/hooks/useWebRTC";
import { getChatSocket, VoiceSignalPayload } from "@/services/chatSocket";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId?: string; name?: string; initials?: string }>();
  const chatId = params.chatId ?? "";
  const calleeName = params.name || "Parche";
  const calleeInitials = params.initials || "📞";

  const [micActive, setMicActive] = useState(true);
  const [speakerActive, setSpeakerActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const {
    isConnecting,
    startCall,
    endCall,
    toggleMic,
    handleIncomingSignal,
    error,
  } = useWebRTC(chatId);

  // Wire up voice signal listener
  useEffect(() => {
    if (!chatId) return;

    const onVoiceSignal = (signal: VoiceSignalPayload) => {
      if (signal.signalType === "OFFER" || signal.signalType === "ANSWER" || signal.signalType === "ICE_CANDIDATE") {
        handleIncomingSignal(signal);
      }
    };

    // We need to recreate the socket singleton with our handler.
    // Since getChatSocket returns the existing singleton, we attach our handler
    // by subscribing to the global voice-signal topic directly.
    const socket = getChatSocket();
    if (!socket.connected) {
      socket.activate();
    }

    // Poll until connected, then we rely on the socket's built-in global subscription.
    // The socket's onVoiceSignal was set at construction time. If it wasn't set with
    // our handler, we need a workaround. The simplest: re-create the socket.
    // But that's destructive. Instead, we subscribe to the STOMP topic directly.
    //
    // Actually, the ChatSocket already subscribes to /user/queue/voice-signal
    // in _subscribeGlobal and dispatches to opts.onVoiceSignal. If the socket
    // was created without that handler (e.g. from parche.tsx), our signals won't
    // reach us.
    //
    // Workaround: we subscribe directly via the underlying STOMP client.
    // But the client is private. So instead, we re-create the socket with our handler.
    // getChatSocket returns the existing instance, so we must destroy and recreate.
    destroyChatSocketSafe();
    const newSocket = getChatSocket({ onVoiceSignal });
    if (!newSocket.connected) {
      newSocket.activate();
    }

    return () => {
      // Don't destroy the socket on unmount — it's a singleton used elsewhere.
      // The handler closure will be GC'd.
    };
  }, [chatId, handleIncomingSignal]);

  // Start call on mount
  useEffect(() => {
    if (!chatId) return;
    startCall(false);
    return () => {
      endCall();
    };
  }, [chatId, startCall, endCall]);

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

  const handleMicToggle = () => {
    const state = toggleMic();
    setMicActive(state);
  };

  const handleSpeakerToggle = () => {
    setSpeakerActive(!speakerActive);
  };

  // Error fallback when WebRTC native module is not available
  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
        </View>
        <View style={styles.container}>
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>📞</Text>
              </View>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.nameText}>{calleeName}</Text>
              <Text style={[styles.statusText, { color: "rgba(248, 113, 113, 1)" }]}>{error}</Text>
            </View>
          </View>
          <Pressable style={styles.endCallButton} onPress={() => router.back()}>
            <Ionicons name="call" size={28} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => { endCall(); router.back(); }}>
          <Ionicons name="chevron-down" size={28} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{calleeInitials}</Text>
            </View>
            <Animated.View style={[styles.connectingRing, pulseStyle]} />
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.nameText}>{calleeName}</Text>
            <Text style={styles.statusText}>
              {isConnecting ? "Llamando..." : formatTimer(callSeconds)}
            </Text>
          </View>
        </View>

        <View style={styles.controlsWrapper}>
          <View style={styles.secondaryControls}>
            <Pressable
              style={styles.controlButtonWrap}
              onPress={handleMicToggle}
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
              onPress={handleSpeakerToggle}
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

          <Pressable style={styles.endCallButton} onPress={() => {
            endCall();
            router.back();
          }}>
            <Ionicons name="call" size={28} color="white" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function destroyChatSocketSafe() {
  try {
    // Import dynamically to avoid circular deps
    const { destroyChatSocket } = require("@/services/chatSocket");
    destroyChatSocket();
  } catch {
    // ignore
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
