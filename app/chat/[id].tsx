import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <View style={styles.parcheIconBox}>
            <Text style={styles.parcheIconEmoji}>{id?.toString().substring(0,2).toUpperCase() || "U"}</Text>
          </View>
          <Pressable style={styles.parcheInfo} onPress={() => router.push(`/user/${id}`)}>
            <Text style={styles.parcheTitle}>Usuario {id}</Text>
            <Text style={styles.parcheSubtitle}>En línea</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.actionButton} onPress={() => router.push("/call")}>
              <Ionicons name="call" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="videocam" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.chatRoot}>
        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.messageRow}>
            <View style={styles.messageAvatarBox}>
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>{id?.toString().substring(0,2).toUpperCase() || "U"}</Text>
              </View>
            </View>
            
            <View style={styles.messageContentWrap}>
              <Text style={styles.messageSender}>Usuario {id}</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  ¡Hola! ¿Cómo estás?
                </Text>
              </View>
              <Text style={styles.messageTime}>Ahora</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Chat Input ── */}
        <View style={styles.chatInputContainer}>
          <View style={styles.chatInputWrap}>
            <Pressable style={styles.chatAttachBtn}>
              <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
            <TextInput
              style={styles.chatInput}
              placeholder="Mensaje..."
              placeholderTextColor="rgba(90, 90, 104, 1)"
            />
            <View style={styles.chatInputActions}>
              <Pressable style={styles.chatIconBtn}>
                <Ionicons name="camera-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
              <Pressable style={styles.chatIconBtn}>
                <Ionicons name="mic-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>
          </View>
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
  header: {
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  parcheIconBox: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  parcheIconEmoji: {
    fontSize: 16,
    color: "rgba(129, 140, 248, 1)",
    fontWeight: "700",
  },
  parcheInfo: {
    flex: 1,
    justifyContent: "center",
  },
  parcheTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
  parcheSubtitle: {
    color: "rgba(35, 165, 89, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  chatRoot: {
    flex: 1,
    justifyContent: "space-between",
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  messageAvatarBox: {
    width: 40,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 14,
    fontWeight: "700",
  },
  messageContentWrap: {
    flex: 1,
  },
  messageSender: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    alignSelf: "flex-start",
  },
  messageText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    marginTop: 4,
  },
  chatInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(11, 13, 24, 0.95)",
  },
  chatInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chatAttachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  chatInputActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 8,
  },
  chatIconBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
