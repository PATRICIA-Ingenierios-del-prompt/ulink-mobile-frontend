import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, PanResponder, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";

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
            style={[styles.tabButton, activeTab === "general" && styles.tabButtonActive]}
            onPress={() => setActiveTab("general")}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={14}
              color={activeTab === "general" ? "rgba(129, 140, 248, 1)" : "rgba(90, 90, 104, 1)"}
            />
            <Text style={[styles.tabText, activeTab === "general" && styles.tabTextActive]}>general</Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === "apuntes" && styles.tabButtonActive]}
            onPress={() => setActiveTab("apuntes")}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={activeTab === "apuntes" ? "rgba(129, 140, 248, 1)" : "rgba(90, 90, 104, 1)"}
            />
            <Text style={[styles.tabText, activeTab === "apuntes" && styles.tabTextActive]}>apuntes</Text>
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
      {activeTab === "juegos" ? (
        <GamesView />
      ) : (
        <ChatView activeTab={activeTab} />
      )}
    </SafeAreaView>
  );
}

function ChatView({ activeTab = "anuncios" }: { activeTab?: string }) {
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
            placeholder={`Escribe algo en #${activeTab}…`}
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
  const [activeTool, setActiveTool] = useState<string>("pen");
  const [activeColor, setActiveColor] = useState<string>("rgba(241, 245, 249, 1)");
  const [activeGame, setActiveGame] = useState<"list" | "lienzo" | "parques">("list");

  // Drawing state
  const [paths, setPaths] = useState<Array<{ d: string; color: string; size: number }>>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  const activeColorRef = useRef(activeColor);
  const activeToolRef = useRef(activeTool);

  // Keep refs in sync to avoid PanResponder capturing stale state closures
  activeColorRef.current = activeColor;
  activeToolRef.current = activeTool;

  const currentPathStrRef = useRef("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newPath = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathStrRef.current = newPath;
        setCurrentPath(newPath);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const updated = `${currentPathStrRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathStrRef.current = updated;
        setCurrentPath(updated);
      },
      onPanResponderRelease: () => {
        if (currentPathStrRef.current) {
          const color = activeToolRef.current === "eraser" ? "rgba(15, 20, 40, 1)" : activeColorRef.current;
          const size = activeToolRef.current === "eraser" ? 22 : 4;
          setPaths((prev) => [...prev, { d: currentPathStrRef.current, color, size }]);
          currentPathStrRef.current = "";
          setCurrentPath("");
        }
      },
    })
  ).current;

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath("");
    currentPathStrRef.current = "";
  };

  const COLORS = [
    "rgba(241, 245, 249, 1)",
    "rgba(74, 222, 128, 1)",
    "rgba(244, 114, 182, 1)",
    "rgba(251, 146, 60, 1)",
    "rgba(34, 211, 238, 1)",
    "rgba(148, 163, 184, 1)",
    "rgba(248, 113, 113, 1)",
    "rgba(167, 139, 250, 1)",
  ];

  if (activeGame === "lienzo") {
    return (
      <View style={styles.gameFullView}>
        {/* Toolbar */}
        <View style={styles.lienzoToolbar}>
          <View style={styles.lienzoToolLeft}>
            <Pressable
              style={[styles.lienzoToolBtn, activeTool === "pen" && styles.lienzoToolBtnActive]}
              onPress={() => setActiveTool("pen")}
            >
              <Text style={styles.lienzoToolIcon}>✏️</Text>
            </Pressable>
            <Text style={[styles.lienzoToolLabel, activeTool === "pen" && styles.lienzoToolLabelActive]}>Pluma</Text>
            <Pressable
              style={[styles.lienzoToolBtn, activeTool === "eraser" && styles.lienzoToolBtnActive]}
              onPress={() => setActiveTool("eraser")}
            >
              <Ionicons name="remove-circle-outline" size={16} color={activeTool === "eraser" ? "rgba(129, 140, 248, 1)" : "rgba(255,255,255,0.5)"} />
            </Pressable>
            <Text style={[styles.lienzoToolLabel, activeTool === "eraser" && styles.lienzoToolLabelActive]}>Borrador</Text>
          </View>
          <View style={styles.lienzoToolRight}>
            <Pressable style={styles.lienzoClrBtn} onPress={() => { setActiveGame("list"); clearCanvas(); }}>
              <Text style={styles.lienzoBackText}>Volver</Text>
            </Pressable>
            <Pressable style={styles.lienzoClearBtn} onPress={clearCanvas}>
              <Text style={styles.lienzoClearText}>Limpiar</Text>
            </Pressable>
          </View>
        </View>
        {/* Color palette */}
        <View style={styles.lienzoPalette}>
          {COLORS.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.lienzoPaletteColor,
                { backgroundColor: color },
                activeColor === color && styles.lienzoPaletteColorActive,
              ]}
              onPress={() => setActiveColor(color)}
            />
          ))}
          <View style={styles.lienzoPaletteSep} />
          <View style={[styles.lienzoBrushSize, { backgroundColor: activeColor }]} />
        </View>
        {/* Canvas area */}
        <View style={styles.lienzoCanvas} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((p, idx) => (
              <Path
                key={idx}
                d={p.d}
                stroke={p.color}
                strokeWidth={p.size}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={activeTool === "eraser" ? "rgba(15, 20, 40, 1)" : activeColor}
                strokeWidth={activeTool === "eraser" ? 22 : 4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
          {paths.length === 0 && !currentPath && (
            <Text style={styles.lienzoCanvasHint}>Dibuja aquí con tu parche 🎨</Text>
          )}
        </View>
      </View>
    );
  }

  if (activeGame === "parques") {
    return (
      <View style={styles.gameFullView}>
        <View style={styles.parquesHeader}>
          <Pressable style={styles.parquesBackBtn} onPress={() => setActiveGame("list")}>
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.parquesHeaderTitle}>Parqués</Text>
        </View>
        {/* Parqués board */}
        <View style={styles.parquesBoardFull}>
          {/* 4 corner quadrants */}
          <View style={styles.parquesQuadRow}>
            <View style={[styles.parquesQuad, { backgroundColor: "rgba(59, 91, 219, 0.35)" }]}>
              <Text style={styles.parquesQuadEmoji}>🔵</Text>
              <Text style={styles.parquesQuadLabel}>Azul</Text>
            </View>
            <View style={styles.parquesCenter}>
              <Text style={styles.parquesCenterEmoji}>🎲</Text>
            </View>
            <View style={[styles.parquesQuad, { backgroundColor: "rgba(242, 63, 67, 0.35)" }]}>
              <Text style={styles.parquesQuadEmoji}>🔴</Text>
              <Text style={styles.parquesQuadLabel}>Rojo</Text>
            </View>
          </View>
          <View style={styles.parquesQuadRow}>
            <View style={[styles.parquesQuad, { backgroundColor: "rgba(35, 165, 89, 0.35)" }]}>
              <Text style={styles.parquesQuadEmoji}>🟢</Text>
              <Text style={styles.parquesQuadLabel}>Verde</Text>
            </View>
            <View style={styles.parquesCenterBottom} />
            <View style={[styles.parquesQuad, { backgroundColor: "rgba(240, 178, 50, 0.35)" }]}>
              <Text style={styles.parquesQuadEmoji}>🟡</Text>
              <Text style={styles.parquesQuadLabel}>Amarillo</Text>
            </View>
          </View>
        </View>
        <Text style={styles.parquesComingSoon}>Próximamente — modo multijugador en tiempo real</Text>
      </View>
    );
  }

  // Games list
  return (
    <ScrollView
      style={styles.gamesScroll}
      contentContainerStyle={styles.gamesScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.gamesSectionTitle}>Juegos del parche</Text>

      {/* Lienzo Game Card */}
      <Pressable style={styles.gameCardLienzo} onPress={() => setActiveGame("lienzo")}>
        <View style={styles.gameCardInnerBorderLienzo}>
          <View style={styles.gameIconRow}>
            <View style={styles.gamePaletteIcon}>
              <Text style={{ fontSize: 22 }}>🎨</Text>
            </View>
            <View style={styles.colorDotsWrap}>
              {COLORS.slice(0, 6).map((c) => (
                <View key={c} style={[styles.colorDot, { backgroundColor: c }]} />
              ))}
            </View>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Lienzo</Text>
            <Text style={styles.gameDesc}>Dibuja con tu parche en tiempo real 🎨</Text>
          </View>
          <View style={styles.gamePlayBtn}>
            <Text style={styles.gamePlayBtnText}>Jugar →</Text>
          </View>
        </View>
      </Pressable>

      {/* Parqués Game Card */}
      <Pressable style={styles.gameCardParques} onPress={() => setActiveGame("parques")}>
        <View style={styles.gameCardInnerBorderParques}>
          <View style={styles.gameIconRowParques}>
            <View style={styles.parquesBoardSmall}>
              <View style={styles.parquesRow}>
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(59, 91, 219, 0.5)" }]} />
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(242, 63, 67, 0.5)" }]} />
              </View>
              <View style={styles.parquesRow}>
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(35, 165, 89, 0.5)" }]} />
                <View style={[styles.parquesSquare, { backgroundColor: "rgba(240, 178, 50, 0.5)" }]} />
              </View>
            </View>
          </View>
          <View style={styles.gameInfo}>
            <Text style={[styles.gameTitle, { color: "rgba(251, 191, 36, 1)" }]}>Parqués</Text>
            <Text style={styles.gameDesc}>El clásico colombiano con tu parche 🎲</Text>
          </View>
          <View style={[styles.gamePlayBtn, { borderColor: "rgba(251, 191, 36, 0.4)", backgroundColor: "rgba(251, 191, 36, 0.1)" }]}>
            <Text style={[styles.gamePlayBtnText, { color: "rgba(251, 191, 36, 1)" }]}>Jugar →</Text>
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
  gamePlayBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.4)",
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  gamePlayBtnText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 12,
    fontWeight: "600",
  },
  gamePaletteIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  parquesBoardSmall: {
    width: 66,
    height: 66,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  // Lienzo full view
  gameFullView: {
    flex: 1,
    backgroundColor: "rgba(9, 17, 31, 1)",
  },
  lienzoToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  lienzoToolLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lienzoToolRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lienzoToolBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    justifyContent: "center",
    alignItems: "center",
  },
  lienzoToolBtnActive: {
    borderColor: "rgba(99, 102, 241, 0.5)",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  lienzoToolIcon: {
    fontSize: 14,
  },
  lienzoToolLabel: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    fontWeight: "500",
  },
  lienzoToolLabelActive: {
    color: "rgba(129, 140, 248, 1)",
  },
  lienzoClrBtn: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  lienzoBackText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  lienzoClearBtn: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.4)",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  lienzoClearText: {
    color: "rgba(248, 113, 113, 1)",
    fontSize: 11,
    fontWeight: "500",
  },
  lienzoPalette: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    gap: 6,
  },
  lienzoPaletteColor: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  lienzoPaletteColorActive: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  lienzoPaletteSep: {
    flex: 1,
  },
  lienzoBrushSize: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lienzoCanvas: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 20, 40, 1)",
  },
  lienzoCanvasHint: {
    color: "rgba(255, 255, 255, 0.08)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  // Parqués full view
  parquesHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    gap: 10,
  },
  parquesBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  parquesHeaderTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "700",
  },
  parquesBoardFull: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(14, 17, 35, 1)",
  },
  parquesQuadRow: {
    flexDirection: "row",
  },
  parquesQuad: {
    flex: 1,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  parquesQuadEmoji: {
    fontSize: 32,
  },
  parquesQuadLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  parquesCenter: {
    width: 80,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  parquesCenterBottom: {
    width: 80,
    height: 140,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  parquesCenterEmoji: {
    fontSize: 36,
  },
  parquesComingSoon: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  moreGamesText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },
});
