import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

type SubTab = "anuncios" | "general" | "apuntes" | "juegos";

export default function ParcheScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>("anuncios");

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <View style={styles.parcheIconBox}>
            <Text style={styles.parcheIconEmoji}>📐</Text>
          </View>
          <View style={styles.parcheInfo}>
            <Text style={styles.parcheTitle}>Cálculo III Survivors</Text>
            <Text style={styles.parcheSubtitle}>24 miembros</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>
        </View>

        {/* ── Tab Row ── */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, activeTab === "anuncios" && styles.tabButtonActive]}
            onPress={() => setActiveTab("anuncios")}
          >
            <Ionicons
              name="megaphone-outline"
              size={14}
              color={activeTab === "anuncios" ? "rgba(129, 140, 248, 1)" : "rgba(90, 90, 104, 1)"}
            />
            <Text style={[styles.tabText, activeTab === "anuncios" && styles.tabTextActive]}>
              anuncios
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab("general")}
          >
            <Ionicons name="chatbubbles-outline" size={14} color="rgba(90, 90, 104, 1)" />
            <Text style={styles.tabText}>general</Text>
          </Pressable>

          <Pressable
            style={styles.tabButton}
            onPress={() => setActiveTab("apuntes")}
          >
            <Ionicons name="document-text-outline" size={14} color="rgba(90, 90, 104, 1)" />
            <Text style={styles.tabText}>apuntes</Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === "juegos" && styles.tabButtonActive]}
            onPress={() => setActiveTab("juegos")}
          >
            <Ionicons
              name="game-controller-outline"
              size={14}
              color={activeTab === "juegos" ? "rgba(129, 140, 248, 1)" : "rgba(90, 90, 104, 1)"}
            />
            <Text style={[styles.tabText, activeTab === "juegos" && styles.tabTextActive]}>
              juegos
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Content Area ── */}
      {activeTab === "anuncios" ? (
        <ChatView />
      ) : activeTab === "juegos" ? (
        <GamesView />
      ) : (
        <View style={styles.placeholderView}>
          <Text style={styles.placeholderText}>Comming soon: {activeTab}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function ChatView() {
  return (
    <View style={styles.chatRoot}>
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messageRow}>
          {/* Avatar Area */}
          <View style={styles.messageAvatarBox}>
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>VT</Text>
            </View>
          </View>
          
          {/* Content Area */}
          <View style={styles.messageContentWrap}>
            <Text style={styles.messageSender}>Valeria T.</Text>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                📌 Parcial esta semana — viernes 8am, aula 301. ¡Suerte a todos!
              </Text>
            </View>
            <Text style={styles.messageTime}>9:00 AM</Text>
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
            placeholder="Escribe algo en #anuncios…"
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
  );
}

function GamesView() {
  return (
    <ScrollView
      style={styles.gamesScroll}
      contentContainerStyle={styles.gamesScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.gamesSectionTitle}>Juegos del parche</Text>

      {/* Lienzo Game Card */}
      <Pressable style={styles.gameCardLienzo}>
        <View style={styles.gameCardInnerBorderLienzo}>
          <View style={styles.gameIconRow}>
            <Ionicons name="color-palette" size={28} color="rgba(129, 140, 248, 1)" />
            <View style={styles.colorDotsWrap}>
              <View style={[styles.colorDot, { backgroundColor: "rgba(241, 245, 249, 1)" }]} />
              <View style={[styles.colorDot, { backgroundColor: "rgba(74, 222, 128, 1)" }]} />
              <View style={[styles.colorDot, { backgroundColor: "rgba(244, 114, 182, 1)" }]} />
              <View style={[styles.colorDot, { backgroundColor: "rgba(251, 146, 60, 1)" }]} />
              <View style={[styles.colorDot, { backgroundColor: "rgba(34, 211, 238, 1)" }]} />
              <View style={[styles.colorDot, { backgroundColor: "rgba(167, 139, 250, 1)" }]} />
            </View>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Lienzo</Text>
            <Text style={styles.gameDesc}>Dibuja con tu parche en tiempo real 🎨</Text>
          </View>
        </View>
      </Pressable>

      {/* Parqués Game Card */}
      <Pressable style={styles.gameCardParques}>
        <View style={styles.gameCardInnerBorderParques}>
          <View style={styles.gameIconRowParques}>
            <View style={styles.parquesBoard}>
              <View style={styles.parquesRow}>
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(59, 91, 219, 0.4)" }]} />
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(242, 63, 67, 0.4)" }]} />
              </View>
              <View style={styles.parquesRow}>
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(35, 165, 89, 0.4)" }]} />
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(240, 178, 50, 0.4)" }]} />
              </View>
            </View>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Parqués</Text>
            <Text style={styles.gameDesc}>El clásico colombiano con tu parche 🎲</Text>
          </View>
        </View>
      </Pressable>

      <Text style={styles.moreGamesText}>Más juegos próximamente...</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  // ── Header ──
  header: {
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(242, 63, 67, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(242, 63, 67, 0.21)",
  },
  parcheIconEmoji: {
    fontSize: 16,
  },
  parcheInfo: {
    flex: 1,
    justifyContent: "center",
  },
  parcheTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  parcheSubtitle: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Tab Row ──
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 4,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  tabText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // ── Placeholders ──
  placeholderView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
  },

  // ── Chat View ──
  chatRoot: {
    flex: 1,
    position: "relative",
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for input and nav bar
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 16,
  },
  messageAvatarBox: {
    paddingBottom: 16,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(124, 106, 245, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(124, 106, 245, 0.21)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    color: "rgba(124, 106, 245, 1)",
    fontSize: 10,
    fontWeight: "700",
  },
  messageContentWrap: {
    flex: 1,
    gap: 2,
  },
  messageSender: {
    color: "rgba(124, 106, 245, 1)",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 4,
  },
  messageBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  messageText: {
    color: "white",
    fontSize: 13,
    lineHeight: 21,
  },
  messageTime: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 9,
    marginLeft: 4,
  },
  chatInputContainer: {
    position: "absolute",
    bottom: 85, // Above GlassNavBar
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  chatInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  chatAttachBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    color: "white",
    fontSize: 13,
    padding: 0,
    height: 20,
  },
  chatInputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatIconBtn: {
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Games View ──
  gamesScroll: {
    flex: 1,
  },
  gamesScrollContent: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  gamesSectionTitle: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    alignSelf: "center",
    marginVertical: 4,
  },
  gameCardLienzo: {
    height: 160,
    borderRadius: 22,
    backgroundColor: "rgba(11, 13, 24, 1)", // fallback
  },
  gameCardInnerBorderLienzo: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
    padding: 16,
    justifyContent: "space-between",
  },
  gameIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  colorDotsWrap: {
    flexDirection: "row",
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gameInfo: {
    gap: 2,
  },
  gameTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.55,
  },
  gameDesc: {
    color: "rgba(163, 179, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  gameCardParques: {
    height: 160,
    borderRadius: 22,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  gameCardInnerBorderParques: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
    padding: 16,
    justifyContent: "space-between",
  },
  gameIconRowParques: {
    flexDirection: "row",
    alignItems: "center",
  },
  parquesBoard: {
    width: 66,
    height: 66,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  parquesRow: {
    flexDirection: "row",
  },
  parquesSquare: {
    width: 32,
    height: 32,
  },
  moreGamesText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },
});
