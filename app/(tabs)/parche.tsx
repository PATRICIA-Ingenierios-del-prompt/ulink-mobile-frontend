import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, PanResponder, Dimensions, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";
import { ParquesBoard } from "../../components/parques/ParquesBoard";
import { parcheService } from "@/services/parcheService";
import { useBoard } from "@/hooks/useBoard";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/components/ReportModal";
import { communicationService } from "@/services/communicationService";
import { getChatSocket, destroyChatSocket } from "@/services/chatSocket";
import type { ParcheResponse, ParcheCategory, UUID } from "@/services/types";
import type { Stroke, Point } from "@/services/boardSocket";
import { formatMessageTime } from "@/lib/formatMessageTime";

type SubTab = "general" | "apuntes" | "juegos";
type PanelView = "miembros" | "ajustes" | null;

const CATEGORY_LABELS: Record<ParcheCategory, string> = {
  SPORT: "Deportes", ENTERTAINMENT: "Entretenimiento", MUSIC: "Música",
  ART: "Arte", TECHNOLOGY: "Tecnología", STUDY: "Académico", VARIETY: "Variado",
};

const CATEGORY_EMOJI: Record<ParcheCategory, string> = {
  SPORT: "⚽", ENTERTAINMENT: "🎮", MUSIC: "🎵",
  ART: "🎨", TECHNOLOGY: "💻", STUDY: "📚", VARIETY: "🎯",
};

export default function ParcheScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { parcheId } = useLocalSearchParams<{ parcheId?: string }>();
  const [activeTab, setActiveTab] = useState<SubTab>("general");
  const [panel, setPanel] = useState<PanelView>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [parche, setParche] = useState<ParcheResponse | null>(null);
  const [loadingParche, setLoadingParche] = useState(!!parcheId);

  useEffect(() => {
    if (!parcheId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await parcheService.get(parcheId as UUID);
        if (!cancelled) setParche(data);
      } catch {
        // keep null — show fallback
      } finally {
        if (!cancelled) setLoadingParche(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parcheId]);

  const parcheTitle = parche?.name ?? "Parche";
  const parcheMembers = parche?.memberCount != null ? `${parche.memberCount} miembros` : "";
  const parcheEmoji = parche?.category ? CATEGORY_EMOJI[parche.category] : "📐";
  // The chat/voice channel id is provisioned separately from the parche id.
  // Always use parche.communication.chatId for REST history + STOMP destinations.
  const chatId = parche?.communication?.chatId ?? null;

  // ── Socket: one instance for this parche screen, activated once ──
  const socketRef = useRef<import("@/services/chatSocket").ChatSocket | null>(null);
  const [rtMessages, setRtMessages] = useState<Array<{
    id: string; sender: string; initials: string; text: string;
    time: string; isMe: boolean; image?: string; fileType?: string; audioDuration?: string;
  }>>([]);

  const { userId } = useAuth();

  useEffect(() => {
    // Create and activate a persistent socket for this screen.
    destroyChatSocket();
    const socket = getChatSocket({ onConnect: () => {} });
    socket.activate();
    socketRef.current = socket;
    return () => {
      destroyChatSocket();
      socketRef.current = null;
    };
  }, []); // runs once on mount

  // ── Subscribe to chat channel whenever chatId becomes available ──
  useEffect(() => {
    if (!chatId || !socketRef.current) return;
    const socket = socketRef.current;

    const doSubscribe = () => {
      return socket.subscribeToParche(chatId, {
        onMessage: (msg) => {
          const senderName = msg.senderId === userId ? "Tú" : (msg.senderUsername || "Usuario");
          const initials = senderName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          setRtMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              sender: senderName,
              initials,
              text: msg.content,
              time: formatMessageTime(msg.sentAt),
              isMe: msg.senderId === userId,
              image: msg.type === "IMAGE" ? (msg.fileUrl ?? undefined) : undefined,
            },
          ]);
        },
      });
    };

    let unsub: () => void = () => {};

    if (socket.connected) {
      unsub = doSubscribe();
    } else {
      // Poll until connected (the socket was just activated; typically <1s).
      const interval = setInterval(() => {
        if (socket.connected) {
          clearInterval(interval);
          unsub = doSubscribe();
        }
      }, 100);
      return () => {
        clearInterval(interval);
        unsub();
      };
    }

    return () => unsub();
  }, [chatId, userId]);

  const sendChatMessage = useCallback((content: string) => {
    if (!chatId || !socketRef.current) return;
    const socket = socketRef.current;

    if (socket.connected) {
      socket.sendMessage(chatId, content, "TEXT");
      return;
    }

    // Socket still connecting — retry for up to 3 s instead of dropping the message
    console.warn("[chat] sendMessage queued: STOMP not yet connected, retrying…");
    const interval = setInterval(() => {
      if (socket.connected) {
        clearInterval(interval);
        socket.sendMessage(chatId, content, "TEXT");
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  }, [chatId]);

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={() => router.navigate("/(tabs)/parches")}>
            <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <View style={styles.parcheIconBox}>
            <Text style={styles.parcheIconEmoji}>{parcheEmoji}</Text>
          </View>
          <View style={styles.parcheInfo}>
            <Text style={styles.parcheTitle} numberOfLines={1}>{parcheTitle}</Text>
            {parcheMembers ? <Text style={styles.parcheSubtitle}>{parcheMembers}</Text> : null}
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setShowMenu((m) => !m)}>
              <Ionicons name="ellipsis-vertical" size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>
        </View>

        {/* ── Tab Row ── */}
        <View style={styles.tabRow}>
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
        <GamesView parcheId={parcheId} />
      ) : (
        <ChatView activeTab={activeTab} chatId={chatId} loadingParche={loadingParche} rtMessages={rtMessages} onSend={sendChatMessage} />
      )}

      {/* ── Dropdown Menu (full-screen backdrop) ── */}
      {showMenu && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={() => setShowMenu(false)} />
          <View style={styles.dropdownMenu}>
            <Pressable
              style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.06)" }]}
              onPress={() => { setShowMenu(false); setPanel("miembros"); }}
            >
              <Ionicons name="people" size={16} color="rgba(143, 132, 224, 0.8)" />
              <Text style={styles.dropdownText}>Miembros</Text>
            </Pressable>
            <View style={styles.dropdownDivider} />
            <Pressable
              style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.06)" }]}
              onPress={() => { setShowMenu(false); setPanel("ajustes"); }}
            >
              <Ionicons name="settings" size={16} color="rgba(143, 132, 224, 0.8)" />
              <Text style={styles.dropdownText}>Ajustes</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Panel Overlay (Miembros / Ajustes) ── */}
      {panel && (
        <View style={styles.panelOverlay}>
          <View style={styles.panelContainer}>
            <View style={[styles.panelHeader, { paddingTop: insets.top + 8 }]}>
              <Pressable style={styles.panelBackBtn} onPress={() => setPanel(null)}>
                <Ionicons name="chevron-back" size={22} color="rgba(255, 255, 255, 0.8)" />
              </Pressable>
              <Text style={styles.panelTitle}>
                {panel === "miembros" ? "Miembros" : "Ajustes del parche"}
              </Text>
              <Pressable style={styles.panelCloseBtn} onPress={() => setPanel(null)}>
                <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>
            {panel === "miembros" ? <MembersView parcheName={parcheTitle} /> : <SettingsView parche={parche} parcheId={parcheId} />}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ChatView({
  activeTab = "general",
  chatId,
  loadingParche,
  rtMessages,
  onSend: sendViaSocket,
}: {
  activeTab?: string;
  chatId?: string | null;
  loadingParche?: boolean;
  rtMessages: Array<{ id: string; sender: string; initials: string; text: string; time: string; isMe: boolean; image?: string; fileType?: string; audioDuration?: string }>;
  onSend: (content: string) => void;
}) {
  const { userId } = useAuth();
  const [text, setText] = useState("");
  // historicalMessages: loaded once from REST when chatId is available.
  // rtMessages: real-time messages streamed from the parent's socket — appended live.
  // We merge them and deduplicate by id so the real-time echo of the sender's own
  // message (which also arrives via /topic/chat/{chatId}) doesn't appear twice.
  const [historicalMessages, setHistoricalMessages] = useState<Array<{
    id: string; sender: string; initials: string; text: string;
    time: string; isMe: boolean; image?: string; fileType?: string; audioDuration?: string;
  }>>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // ── Load message history from the REST API ──
  useEffect(() => {
    if (!chatId) {
      if (!loadingParche) setLoadingMessages(false);
      return;
    }
    setHistoricalMessages([]);
    setLoadingMessages(true);
    let cancelled = false;
    (async () => {
      try {
        const page = await communicationService.getMessages(chatId, 0, 50);
        if (cancelled) return;
        // Backend returns newest-first for page 0; reverse to chronological order.
        const mapped = [...(page.content || [])].reverse().map((m) => {
          const senderName = m.senderUsername || m.senderName || "Usuario";
          const initials = senderName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return {
            id: m.messageId || m.id || Math.random().toString(),
            sender: senderName,
            initials,
            text: m.content,
            time: formatMessageTime(m.sentAt || m.timestamp),
            isMe: m.senderId === userId,
            image: m.type === "IMAGE" ? (m.fileUrl ?? undefined) : undefined,
            audioDuration: m.type === "AUDIO" && m.duration ? formatAudioDuration(m.duration) : undefined,
          };
        });
        setHistoricalMessages(mapped);
      } catch {
        // Failed to load — show empty state
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => { cancelled = true; };
  }, [chatId, userId, loadingParche]);

  // Merge history + real-time, deduplicating by id.
  const historicalIds = useMemo(() => new Set(historicalMessages.map((m) => m.id)), [historicalMessages]);
  const messages = useMemo(
    () => [...historicalMessages, ...rtMessages.filter((m) => !historicalIds.has(m.id))],
    [historicalMessages, rtMessages, historicalIds],
  );

  // Local-only UI messages (not yet wired to backend — kept for future use).
  const [localMessages] = useState<Array<{
    id: string; sender: string; initials: string; text: string;
    time: string; isMe: boolean; image?: string; fileType?: string; audioDuration?: string;
  }>>([]);
  const allMessages = useMemo(() => [...messages, ...localMessages], [messages, localMessages]);

  const formatAudioDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSend = () => {
    if (text.trim().length === 0) return;
    // Send via the parent's socket reference.
    sendViaSocket(text.trim());
    setText("");
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.chatRoot}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {loadingMessages ? (
            <View key="loading" style={styles.chatLoadingWrap}>
              <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
              <Text style={styles.chatLoadingText}>Cargando mensajes…</Text>
            </View>
          ) : allMessages.length === 0 ? (
            <View key="empty" style={styles.chatLoadingWrap}>
              <Ionicons name="chatbubbles-outline" size={36} color="rgba(143, 132, 224, 0.3)" />
              <Text style={styles.chatLoadingText}>Aún no hay mensajes en #{activeTab}</Text>
              <Text style={[styles.chatLoadingText, { fontSize: 12 }]}>¡Sé el primero en escribir!</Text>
            </View>
          ) : (
            allMessages.map((msg) => (
              <View key={msg.id} style={[styles.messageRow, msg.isMe && styles.messageRowMe]}>
                {!msg.isMe && (
                  <View style={styles.messageAvatarBox}>
                    <View style={styles.messageAvatar}>
                      <Text style={styles.messageAvatarText}>{msg.initials}</Text>
                    </View>
                  </View>
                )}
                
                <View style={[styles.messageContentWrap, msg.isMe && styles.messageContentWrapMe]}>
                  <Text style={[styles.messageSender, msg.isMe && styles.messageSenderMe]}>
                    {msg.isMe ? "Tú" : msg.sender}
                  </Text>
                  <View style={[styles.messageBubble, msg.isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                    {msg.image ? (
                      <View style={styles.imageMessageWrap}>
                        <Image source={{ uri: msg.image }} style={styles.messageImage} resizeMode="cover" />
                        {msg.text ? <Text style={[styles.messageText, msg.isMe && styles.messageTextMe, { marginTop: 8 }]}>{msg.text}</Text> : null}
                      </View>
                    ) : msg.fileType ? (
                      <View style={styles.fileMessageWrap}>
                        <Ionicons name="document-text" size={28} color={msg.isMe ? "#fff" : "rgba(129, 140, 248, 1)"} />
                        <View style={styles.fileMessageInfo}>
                          <Text style={[styles.fileMessageName, msg.isMe && styles.fileMessageNameMe]}>{msg.text}</Text>
                          <Text style={styles.fileMessageSize}>1.2 MB • {msg.fileType.toUpperCase()}</Text>
                        </View>
                      </View>
                    ) : msg.audioDuration ? (
                      <View style={styles.audioMessageWrap}>
                        <Ionicons name="play" size={20} color={msg.isMe ? "#fff" : "rgba(129, 140, 248, 1)"} />
                        <View style={styles.audioWaveform}>
                          <View style={[styles.waveformBar, { height: 8 }, msg.isMe && styles.waveformBarMe]} />
                          <View style={[styles.waveformBar, { height: 16 }, msg.isMe && styles.waveformBarMe]} />
                          <View style={[styles.waveformBar, { height: 12 }, msg.isMe && styles.waveformBarMe]} />
                          <View style={[styles.waveformBar, { height: 20 }, msg.isMe && styles.waveformBarMe]} />
                          <View style={[styles.waveformBar, { height: 14 }, msg.isMe && styles.waveformBarMe]} />
                          <View style={[styles.waveformBar, { height: 8 }, msg.isMe && styles.waveformBarMe]} />
                        </View>
                        <Text style={[styles.audioDurationText, msg.isMe && styles.audioDurationTextMe]}>{msg.audioDuration}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.messageText, msg.isMe && styles.messageTextMe]}>
                        {msg.text}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.messageTime, msg.isMe && styles.messageTimeMe]}>{msg.time}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* ── Chat Input ── */}
        <View style={styles.chatInputContainer}>
          <View style={styles.chatInputWrap}>
            <TextInput
              style={styles.chatInput}
              placeholder={`Escribe algo en #${activeTab}…`}
              placeholderTextColor="rgba(90, 90, 104, 1)"
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            {text.trim().length > 0 && (
              <Pressable style={styles.chatSendBtn} onPress={handleSend}>
                <Ionicons name="send" size={18} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function GamesView({ parcheId }: { parcheId?: string }) {
  const { userId } = useAuth();
  const [activeTool, setActiveTool] = useState<string>("pen");
  const [activeColor, setActiveColor] = useState<string>("rgba(241, 245, 249, 1)");
  const [activeGame, setActiveGame] = useState<"list" | "lienzo" | "parques">("list");

  const canvasId = parcheId ?? null;
  const {
    strokes: remoteStrokes,
    isConnected,
    sendStroke,
    clearBoard,
  } = useBoard(activeGame === "lienzo" ? canvasId : null, userId ?? "anonymous");

  // Drawing state
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [localPaths, setLocalPaths] = useState<Array<{ d: string; color: string; size: number }>>([]);

  const activeColorRef = useRef(activeColor);
  const activeToolRef = useRef(activeTool);
  activeColorRef.current = activeColor;
  activeToolRef.current = activeTool;

  const currentPointsRef = useRef<Point[]>([]);

  const pointsToSvgD = (pts: Point[]): string => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt: Point = { x: locationX, y: locationY };
        currentPointsRef.current = [pt];
        setCurrentPoints([pt]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt: Point = { x: locationX, y: locationY };
        currentPointsRef.current = [...currentPointsRef.current, pt];
        setCurrentPoints([...currentPointsRef.current]);
      },
      onPanResponderRelease: () => {
        const pts = currentPointsRef.current;
        if (pts.length > 0) {
          const isEraser = activeToolRef.current === "eraser";
          const color = isEraser ? "rgba(15, 20, 40, 1)" : activeColorRef.current;
          const width = isEraser ? 22 : 4;
          const stroke: Stroke = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            color,
            width,
            points: pts,
          };
          // Optimistic local add as SVG path
          setLocalPaths((prev) => [...prev, { d: pointsToSvgD(pts), color, size: width }]);
          // Send to other users
          sendStroke(stroke);
          currentPointsRef.current = [];
          setCurrentPoints([]);
        }
      },
    })
  ).current;

  const handleClear = () => {
    setLocalPaths([]);
    clearBoard();
  };

  // Convert remote strokes to SVG paths
  const remotePaths = useMemo(
    () =>
      remoteStrokes.map((s) => ({
        d: pointsToSvgD(s.points),
        color: s.color,
        size: s.width,
      })),
    [remoteStrokes]
  );

  const allPaths = useMemo(() => [...remotePaths, ...localPaths], [remotePaths, localPaths]);

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
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? "rgba(35, 165, 89, 1)" : "rgba(248, 113, 113, 1)" }]} />
            <Pressable style={styles.lienzoClrBtn} onPress={() => { setActiveGame("list"); handleClear(); }}>
              <Text style={styles.lienzoBackText}>Volver</Text>
            </Pressable>
            <Pressable style={styles.lienzoClearBtn} onPress={handleClear}>
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
            {allPaths.map((p, idx) => (
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
            {currentPoints.length > 0 && (
              <Path
                d={pointsToSvgD(currentPoints)}
                stroke={activeTool === "eraser" ? "rgba(15, 20, 40, 1)" : activeColor}
                strokeWidth={activeTool === "eraser" ? 22 : 4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          {allPaths.length === 0 && currentPoints.length === 0 && (
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
        <ParquesBoard />
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

// ─── Members View ─────────────────────────────────────────────────────────────

interface ParcheMember {
  id: string;
  name: string;
  initials: string;
  role: "admin" | "moderator" | "member";
  status: "online" | "offline" | "away";
  career: string;
  joinDate: string;
}

const PARCHE_MEMBERS: ParcheMember[] = [
  { id: "1", name: "Valeria Torres", initials: "VT", role: "admin", status: "online", career: "Ingeniería de Sistemas", joinDate: " Ago 2025" },
  { id: "2", name: "Santiago Moreno", initials: "SM", role: "admin", status: "online", career: "Ingeniería de Sistemas", joinDate: " Ago 2025" },
  { id: "3", name: "Camila Ríos", initials: "CR", role: "moderator", status: "online", career: "Diseño de Software", joinDate: " Sep 2025" },
  { id: "4", name: "Andrés Felipe", initials: "AF", role: "member", status: "away", career: "Ingeniería Electrónica", joinDate: " Oct 2025" },
  { id: "5", name: "Laura Gómez", initials: "LG", role: "member", status: "online", career: "Ingeniería de Sistemas", joinDate: " Oct 2025" },
  { id: "6", name: "Diego Ramírez", initials: "DR", role: "member", status: "offline", career: "Matemáticas Aplicadas", joinDate: " Nov 2025" },
  { id: "7", name: "Isabella Cardona", initials: "IC", role: "member", status: "online", career: "Ingeniería de Sistemas", joinDate: " Nov 2025" },
  { id: "8", name: "Mateo Ospina", initials: "MO", role: "member", status: "offline", career: "Física", joinDate: " Ene 2026" },
  { id: "9", name: "Sofía Vélez", initials: "SV", role: "member", status: "online", career: "Ingeniería de Sistemas", joinDate: " Ene 2026" },
  { id: "10", name: "Juan García", initials: "JG", role: "member", status: "online", career: "Ingeniería de Sistemas", joinDate: " Feb 2026" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "rgba(242, 63, 67, 1)",
  moderator: "rgba(240, 178, 50, 1)",
  member: "rgba(143, 132, 224, 0.6)",
};

const STATUS_COLORS: Record<string, string> = {
  online: "rgba(35, 165, 89, 1)",
  away: "rgba(240, 178, 50, 1)",
  offline: "rgba(90, 90, 104, 1)",
};

function MembersView({ parcheName }: { parcheName: string }) {
  const router = useRouter();
  const [reportTarget, setReportTarget] = useState<{ name: string } | null>(null);

  const sorted = [...PARCHE_MEMBERS].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <>
    <ScrollView style={styles.membersScroll} contentContainerStyle={styles.membersContent} showsVerticalScrollIndicator={false}>
      <View style={styles.membersHeader}>
        <Text style={styles.membersCount}>10 miembros</Text>
        <View style={styles.membersSearchWrap}>
          <Ionicons name="search" size={14} color="rgba(90, 90, 104, 1)" />
          <TextInput
            style={styles.membersSearchInput}
            placeholder="Buscar miembro..."
            placeholderTextColor="rgba(90, 90, 104, 1)"
          />
        </View>
      </View>

      {sorted.map((member, idx) => (
        <Pressable
          key={member.id}
          style={({ pressed }) => [
            styles.memberRow,
            idx < sorted.length - 1 && styles.memberRowBorder,
            pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" },
          ]}
          onPress={() => router.push(`/user/${member.id}`)}
          onLongPress={() => setReportTarget({ name: member.name })}
        >
          <View style={styles.memberAvatarWrap}>
            <View style={[styles.memberAvatar, { borderColor: ROLE_COLORS[member.role].replace("1)", "0.3)"), backgroundColor: ROLE_COLORS[member.role].replace("1)", "0.15)") }]}>
              <Text style={[styles.memberAvatarText, { color: ROLE_COLORS[member.role] }]}>{member.initials}</Text>
            </View>
            <View style={[styles.memberStatusDot, { backgroundColor: STATUS_COLORS[member.status] }]} />
          </View>

          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              {member.role !== "member" && (
                <View style={[styles.roleBadge, { borderColor: ROLE_COLORS[member.role].replace("1)", "0.3)"), backgroundColor: ROLE_COLORS[member.role].replace("1)", "0.12)") }]}>
                  <Ionicons
                    name={member.role === "admin" ? "shield-checkmark" : "hammer"}
                    size={9}
                    color={ROLE_COLORS[member.role]}
                  />
                  <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[member.role] }]}>
                    {member.role === "admin" ? "Admin" : "Mod"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.memberCareer}>{member.career}</Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color="rgba(90, 90, 104, 0.4)" />
        </Pressable>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
    <ReportModal
      visible={!!reportTarget}
      onClose={() => setReportTarget(null)}
      reportedUserName={reportTarget?.name ?? ""}
      parcheName={parcheName}
    />
    </>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  color?: string;
  hasArrow?: boolean;
  isToggle?: boolean;
  toggleDefault?: boolean;
  onPress?: () => void;
}

function SettingsItem({ icon, label, value, color = "rgba(236, 237, 248, 1)", hasArrow = true, onPress }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
      onPress={onPress}
    >
      <View style={[styles.settingsItemIcon, { backgroundColor: color.replace("1)", "0.12)") }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {value ? <Text style={styles.settingsItemValue}>{value}</Text> : null}
      </View>
      {hasArrow && <Ionicons name="chevron-forward" size={16} color="rgba(90, 90, 104, 0.4)" />}
    </Pressable>
  );
}

function SettingsView({ parche, parcheId }: { parche?: ParcheResponse | null; parcheId?: string }) {
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [mentionOnly, setMentionOnly] = useState(false);

  return (
    <ScrollView style={styles.settingsScroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
      {/* Server info */}
      <View style={styles.settingsServerCard}>
        <View style={styles.settingsServerIcon}>
          <Text style={{ fontSize: 24 }}>{parche?.category ? CATEGORY_EMOJI[parche.category] : "📐"}</Text>
        </View>
        <View style={styles.settingsServerInfo}>
          <Text style={styles.settingsServerName}>{parche?.name ?? "Parche"}</Text>
          <Text style={styles.settingsServerDesc}>
            {parche ? `${CATEGORY_LABELS[parche.category]} · ${parche.visibility === "PUBLIC" ? "Público" : "Privado"} · ${parche.memberCount}/${parche.maxCapacity}` : ""}
          </Text>
        </View>
      </View>

      {/* Overview */}
      <Text style={styles.settingsSectionLabel}>GENERAL</Text>
      <View style={styles.settingsGroup}>
        <SettingsItem icon="information-circle" label="Descripción del parche" value={parche?.description ?? ""} />
        <SettingsItem icon="people" label="Miembros" value={parche ? `${parche.memberCount} / ${parche.maxCapacity}` : ""} />
        <SettingsItem icon="globe" label="Visibilidad" value={parche?.visibility === "PUBLIC" ? "Público" : "Privado"} />
      </View>

      {/* Notifications */}
      <Text style={styles.settingsSectionLabel}>NOTIFICACIONES</Text>
      <View style={styles.settingsGroup}>
        <Pressable
          style={({ pressed }) => [styles.settingsItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
          onPress={() => setNotifEnabled((n) => !n)}
        >
          <View style={[styles.settingsItemIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
            <Ionicons name="notifications" size={18} color="rgba(99, 102, 241, 1)" />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemLabel}>Notificaciones</Text>
          </View>
          <View style={[styles.toggleTrack, notifEnabled && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbActive]} />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingsItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
          onPress={() => setMentionOnly((m) => !m)}
        >
          <View style={[styles.settingsItemIcon, { backgroundColor: "rgba(240, 178, 50, 0.12)" }]}>
            <Ionicons name="at" size={18} color="rgba(240, 178, 50, 1)" />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemLabel}>Solo menciones</Text>
          </View>
          <View style={[styles.toggleTrack, mentionOnly && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, mentionOnly && styles.toggleThumbActive]} />
          </View>
        </Pressable>

        <SettingsItem icon="volume-high" label="Sonido de notificación" value="Predeterminado" />
      </View>

      {/* Permissions */}
      <Text style={styles.settingsSectionLabel}>PERMISOS</Text>
      <View style={styles.settingsGroup}>
        <SettingsItem icon="megaphone" label="Publicar anuncios" value="Admin & Mod" />
        <SettingsItem icon="chatbubbles" label="Canales de texto" value="Todos" />
        <SettingsItem icon="document-text" label="Subir archivos" value="Todos" />
        <SettingsItem icon="videocam" label="Llamadas de video" value="Todos" />
        <SettingsItem icon="person-add" label="Invitar miembros" value="Admin & Mod" />
      </View>

      {/* Moderation */}
      <Text style={styles.settingsSectionLabel}>MODERACIÓN</Text>
      <View style={styles.settingsGroup}>
        <SettingsItem icon="shield-checkmark" label="Auto-moderación" value="Activa" />
        <SettingsItem icon="ban" label="Palabras bloqueadas" value="3 palabras" />
        <SettingsItem icon="time" label="Slow mode" value="30s" />
        <SettingsItem icon="lock-closed" label="Canal bloqueado" value="Desactivado" />
      </View>

      {/* Danger */}
      <Text style={styles.settingsSectionLabel}>ZONA DE PELIGRO</Text>
      <View style={styles.settingsGroup}>
        <Pressable
          style={({ pressed }) => [styles.settingsItem, pressed && { backgroundColor: "rgba(242, 63, 67, 0.08)" }]}
          onPress={() => {
            if (!parcheId) return;
            Alert.alert("Salir del parche", "¿Estás seguro de que quieres salir?", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Salir",
                style: "destructive",
                onPress: async () => {
                  try {
                    await parcheService.remove(parcheId as UUID);
                    Alert.alert("Listo", "Saliste del parche.");
                    router.navigate("/(tabs)/parches");
                  } catch {
                    Alert.alert("Error", "No se pudo salir del parche.");
                  }
                },
              },
            ]);
          }}
        >
          <View style={[styles.settingsItemIcon, { backgroundColor: "rgba(242, 63, 67, 0.12)" }]}>
            <Ionicons name="exit" size={18} color="rgba(242, 63, 67, 1)" />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={[styles.settingsItemLabel, { color: "rgba(242, 63, 67, 1)" }]}>Salir del parche</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(242, 63, 67, 0.4)" />
        </Pressable>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
    paddingBottom: 60,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
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
  chatSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageContentWrapMe: {
    alignItems: "flex-end",
    flex: 0,
    maxWidth: "85%",
  },
  messageSenderMe: {
    color: "rgba(129, 140, 248, 1)",
    textAlign: "right",
  },
  messageBubbleMe: {
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderTopRightRadius: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignSelf: "flex-end",
  },
  messageBubbleOther: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignSelf: "flex-start",
  },
  messageTextMe: {
    color: "white",
  },
  messageTimeMe: {
    textAlign: "right",
  },

  // Dynamic attachment styling
  imageMessageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    width: 200,
  },
  messageImage: {
    width: 200,
    height: 130,
    borderRadius: 8,
  },
  fileMessageWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  fileMessageInfo: {
    flexDirection: "column",
  },
  fileMessageName: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 13,
    fontWeight: "600",
  },
  fileMessageNameMe: {
    color: "white",
  },
  fileMessageSize: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    marginTop: 2,
  },
  audioMessageWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    minWidth: 160,
  },
  audioWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  waveformBar: {
    width: 3,
    backgroundColor: "rgba(129, 140, 248, 0.4)",
    borderRadius: 1.5,
  },
  waveformBarMe: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  audioDurationText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  audioDurationTextMe: {
    color: "white",
  },

  // Recording Toolbar Styles
  chatCancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(248, 113, 113, 1)",
  },
  recordingText: {
    color: "rgba(248, 113, 113, 1)",
    fontSize: 13,
    fontWeight: "500",
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
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
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

  // ── Members View ──
  membersScroll: {
    flex: 1,
  },
  membersContent: {
    paddingBottom: 100,
  },
  membersHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  membersCount: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  membersSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  membersSearchInput: {
    flex: 1,
    color: "white",
    fontSize: 13,
    padding: 0,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  memberAvatarWrap: {
    position: "relative",
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  memberStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(11, 13, 24, 1)",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 13,
    fontWeight: "600",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  memberCareer: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    marginTop: 2,
  },

  // ── Settings View ──
  settingsScroll: {
    flex: 1,
  },
  settingsContent: {
    paddingBottom: 100,
  },
  settingsServerCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    gap: 14,
  },
  settingsServerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(242, 63, 67, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 63, 67, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsServerInfo: {
    flex: 1,
  },
  settingsServerName: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "700",
  },
  settingsServerDesc: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  settingsSectionLabel: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  settingsGroup: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  settingsItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 13,
    fontWeight: "500",
  },
  settingsItemValue: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    marginTop: 1,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(90, 90, 104, 0.3)",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: "rgba(99, 102, 241, 1)",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },

  // ── Dropdown Menu ──
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  dropdownMenu: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 180,
    backgroundColor: "rgba(22, 24, 40, 0.97)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingVertical: 6,
    zIndex: 100,
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  dropdownText: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  // ── Chat Loading ──
  chatLoadingWrap: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  chatLoadingText: {
    color: "rgba(143, 132, 224, 0.4)",
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Panel Overlay ──
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  panelContainer: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  panelBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  panelTitle: {
    flex: 1,
    color: "rgba(236, 237, 248, 1)",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  panelCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
