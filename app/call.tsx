import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function CallScreen() {
  const router = useRouter();
  const [micActive, setMicActive] = useState(false);
  const [speakerActive, setSpeakerActive] = useState(true);

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Bar with Go Back */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
      </View>

      <View style={styles.container}>
        {/* Avatar and Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SV</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.nameText}>Sofía V.</Text>
            <Text style={styles.statusText}>Llamando…</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsWrapper}>
          <View style={styles.secondaryControls}>
            <Pressable
              style={styles.controlButtonWrap}
              onPress={() => setMicActive(!micActive)}
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
              onPress={() => setSpeakerActive(!speakerActive)}
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(99, 102, 241, 0.3)", // Fallback if no image
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(99, 102, 241, 0.3)",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 8,
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
    transform: [{ rotate: "135deg" }], // Rotate phone icon to look like "hang up"
  },
});
