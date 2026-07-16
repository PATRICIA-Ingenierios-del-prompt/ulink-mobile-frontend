import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  PanResponder, Dimensions, KeyboardAvoidingView, Platform, Alert,
  Image, ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";
import { ParquesBoard } from "../../components/parques/ParquesBoard";
import { parcheService } from "@/services/parcheService";
import { communicationService, type ChatMessage } from "@/services/communicationService";
import { ChatSocket, type ChatMessage as WsChatMessage } from "@/services/chatSocket";
import { useBoard } from "@/hooks/useBoard";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/components/ReportModal";
import { apiClient } from "@/services/apiClient";
import type { ParcheResponse, ParcheCategory, UUID } from "@/services/types";
import type { Stroke, Point } from "@/services/boardSocket";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

type SubTab = "chat" | "lienzo" | "juegos" | "voz";
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
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>("chat");
  const [panel, setPanel] = useState<PanelView>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [parche, setParche] = useState<ParcheResponse | null>(null);
  const [loadingParche, setLoadingParche] = useState(!!parcheId);
  const [chatId, setChatId] = useState<string | null>(null);

  // ── Chat state lifted here so it survives tab switches ──────────────────────
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const socketRef = useRef<ChatSocket | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const seenIds = useRef(new Set<string>());

  // ── 1. Create socket ONCE when component mounts, exactly like web frontend ──
  useEffect(() => {
    const socket = new ChatSocket({
      onConnect: () => console.log("[chat] STOMP conectado"),
      onDisconnect: () => console.log("[chat] STOMP desconectado"),
    });
    socket.activate();
    socketRef.current = socket;
    return () => {
      unsubRef.current?.();
      socket.deactivate();
      socketRef.current = null;
    };
  }, []);

  // ── 2. Load parche details and resolve chatId ────────────────────────────────
  useEffect(() => {
    if (!parcheId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await parcheService.get(parcheId as UUID);
        if (!cancelled) {
          setParche(data);
          if (data.communication?.chatId) {
            setChatId(data.communication.chatId);
          }
        }
      } catch {
      } finally {
        if (!cancelled) setLoadingParche(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parcheId]);

  // ── 3. When chatId is known: load history + subscribe ───────────────────────
  useEffect(() => {
    if (!chatId || !userId) return;

    unsubRef.current?.();
    unsubRef.current = null;
    setMessages([]);
    seenIds.current.clear();
    setChatLoading(true);

    let alive = true;

    communicationService.getMessages(chatId, 0, 50)
      .then((data) => {
        if (!alive) return;
        const mapped: ChatMessageUI[] = [...(data.content || [])].reverse().map((m: ChatMessage) => {
          seenIds.current.add(m.id);
          return {
            id: m.id,
            sender: m.senderName || "Usuario",
            text: m.content,
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: m.senderId === userId,
            image: m.type === "IMAGE" ? m.fileUrl : undefined,
          };
        });
        setMessages(mapped);
      })
      .catch(() => {})
      .finally(() => { if (alive) setChatLoading(false); });

    const doSubscribe = () => {
      if (!socketRef.current || !alive) return;
      const unsub = socketRef.current.subscribeToParche(chatId, {
        onMessage: (msg: WsChatMessage) => {
          if (!alive) return;
          if (seenIds.current.has(msg.id)) return;
          seenIds.current.add(msg.id);
          const mapped: ChatMessageUI = {
            id: msg.id,
            sender: msg.senderId === userId ? "Tú" : (msg.senderUsername || "Usuario"),
            text: msg.content,
            time: new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: msg.senderId === userId,
            image: msg.type === "IMAGE" ? (msg.fileUrl ?? undefined) : undefined,
          };
          setMessages((prev) => [...prev, mapped]);
        },
      });
      unsubRef.current = unsub;
    };

    if (socketRef.current?.connected) {
      doSubscribe();
    } else {
      const checkId = setInterval(() => {
        if (socketRef.current?.connected) {
          clearInterval(checkId);
          clearTimeout(timeout);
          doSubscribe();
        }
      }, 500);
      const timeout = setTimeout(() => clearInterval(checkId), 30000);
      unsubRef.current = () => {
        clearInterval(checkId);
        clearTimeout(timeout);
      };
    }

    return () => {
      alive = false;
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [chatId, userId]);

  // ── sendMessage — uses the shared socket ────────────────────────────────────
  const sendMessage = useCallback((content: string) => {
    if (!chatId || !content.trim()) return;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.sendMessage(chatId, content.trim());
    } else {
      const tempId = `local-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: tempId,
        sender: "Tú",
        text: content.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMe: true,
      }]);
    }
  }, [chatId]);

  const parcheTitle = parche?.name ?? "Parche";
  const parcheMembers = parche?.memberCount != null ? `${parche.memberCount} miembros` : "";
  const parcheEmoji = parche?.category ? CATEGORY_EMOJI[parche.category] : "📐";
  const isPrivate = parche?.visibility === "PRIVATE";

  const tabs: { id: SubTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "chat", label: "Chat", icon: "chatbubbles-outline" },
    { id: "lienzo", label: "Lienzo", icon: "layers-outline" },
    { id: "juegos", label: "Juegos", icon: "game-controller-outline" },
    ...(isPrivate ? [{ id: "voz" as const, label: "Voz", icon: "volume-high-outline" as const }] : []),
  ];

  if (loadingParche) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
        </View>
      </SafeAreaView>
    );
  }

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
            <View>
              <Pressable style={styles.actionButton} onPress={() => setShowMenu((m) => !m)}>
                <Ionicons name="ellipsis-vertical" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
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
            </View>
          </View>
        </View>

        {/* ── Tab Row ── */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={activeTab === tab.id ? "rgba(129, 140, 248, 1)" : "rgba(90, 90, 104, 1)"}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Content Area ── */}
      {activeTab === "chat" && (
        <ChatView
          chatId={chatId}
          messages={messages}
          loading={chatLoading}
          onSend={sendMessage}
        />
      )}
      {activeTab === "lienzo" && <LienzoView parcheId={parcheId} />}
      {activeTab === "juegos" && <GamesView />}
      {activeTab === "voz" && <VozView />}

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
            {panel === "miembros" ? (
              <MembersView parcheId={parcheId} parcheName={parcheTitle} />
            ) : (
              <SettingsView parche={parche} parcheId={parcheId} />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────

interface ChatMessageUI {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  image?: string;
  fileType?: string;
  audioDuration?: string;
}

interface ChatViewProps {
  chatId: string | null;
  messages: ChatMessageUI[];
  loading: boolean;
  onSend: (content: string) => void;
}

function ChatView({ chatId, messages, loading, onSend }: ChatViewProps) {
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const formatDur = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content || !chatId) return;
    setText("");
    onSend(content);
  }, [text, chatId, onSend]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async (send: boolean) => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setIsRecording(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      if (send && recordingSeconds > 0) {
        const duration = formatDur(recordingSeconds);
        onSend(`🎤 Nota de voz (${duration})`);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const handleCamera = () => {
    Alert.alert("Compartir foto", "Selecciona una opción:", [
      {
        text: "📸 Tomar foto",
        onPress: async () => {
          const res = await ImagePicker.requestCameraPermissionsAsync();
          if (!res.granted) return;
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!result.canceled) onSend(`📷 ${result.assets[0].uri}`);
        },
      },
      {
        text: "🖼️ Elegir de galería",
        onPress: async () => {
          const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!res.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!result.canceled) onSend(`📷 ${result.assets[0].uri}`);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  if (!chatId) {
    return (
      <View style={styles.placeholderView}>
        <Ionicons name="chatbubbles-outline" size={48} color="rgba(90, 90, 104, 0.4)" />
        <Text style={styles.placeholderText}>Chat no disponible</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <View style={styles.chatRoot}>
        {loading ? (
          <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" style={{ flex: 1 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 && (
              <View style={styles.placeholderView}>
                <Text style={[styles.placeholderText, { fontSize: 13 }]}>No hay mensajes aún. ¡Sé el primero en escribir!</Text>
              </View>
            )}
            {messages.map((msg, idx) => (
              <View key={msg.id || `msg-${idx}`} style={[styles.messageRow, msg.isMe && styles.messageRowMe]}>
                {!msg.isMe && (
                  <View style={[styles.messageAvatarBox, { paddingBottom: 16 }]}>
                    <View style={styles.messageAvatar}>
                      <Text style={styles.messageAvatarText}>{msg.sender.charAt(0).toUpperCase()}</Text>
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
                    ) : msg.audioDuration ? (
                      <View style={styles.audioMessageWrap}>
                        <Ionicons name="play" size={20} color={msg.isMe ? "#fff" : "rgba(129, 140, 248, 1)"} />
                        <View style={styles.audioWaveform}>
                          {[8, 16, 12, 20, 14, 8].map((h, i) => (
                            <View key={i} style={[styles.waveformBar, { height: h }, msg.isMe && styles.waveformBarMe]} />
                          ))}
                        </View>
                        <Text style={[styles.audioDurationText, msg.isMe && styles.audioDurationTextMe]}>{msg.audioDuration}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.messageText, msg.isMe && styles.messageTextMe]}>{msg.text}</Text>
                    )}
                  </View>
                  <Text style={[styles.messageTime, msg.isMe && styles.messageTimeMe]}>{msg.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Chat Input ── */}
        <View style={styles.chatInputContainer}>
          <View style={styles.chatInputWrap}>
            {isRecording ? (
              <>
                <Pressable style={styles.chatCancelBtn} onPress={() => stopRecording(false)}>
                  <Ionicons name="trash-outline" size={22} color="rgba(248, 113, 113, 1)" />
                </Pressable>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Grabando audio ({recordingSeconds}s)...</Text>
                </View>
                <Pressable style={[styles.chatSendBtn, { backgroundColor: "rgba(35, 165, 89, 1)" }]} onPress={() => stopRecording(true)}>
                  <Ionicons name="send" size={18} color="white" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.chatAttachBtn} onPress={() => Alert.alert("Subir archivo", "Función próximamente")}>
                  <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.6)" />
                </Pressable>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Escribe un mensaje…"
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  value={text}
                  onChangeText={setText}
                />
                <View style={styles.chatInputActions}>
                  {text.trim().length > 0 ? (
                    <Pressable style={styles.chatSendBtn} onPress={handleSend}>
                      <Ionicons name="send" size={18} color="white" />
                    </Pressable>
                  ) : (
                    <>
                      <Pressable style={styles.chatIconBtn} onPress={handleCamera}>
                        <Ionicons name="camera-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                      </Pressable>
                      <Pressable style={styles.chatIconBtn} onPress={startRecording}>
                        <Ionicons name="mic-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                      </Pressable>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Lienzo Tab ───────────────────────────────────────────────────────────────

const COLORS = [
  "rgba(241, 245, 249, 1)", "rgba(74, 222, 128, 1)", "rgba(244, 114, 182, 1)",
  "rgba(251, 146, 60, 1)", "rgba(34, 211, 238, 1)", "rgba(148, 163, 184, 1)",
  "rgba(248, 113, 113, 1)", "rgba(167, 139, 250, 1)",
];

function LienzoView({ parcheId }: { parcheId?: string }) {
  const { userId } = useAuth();
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const canvasId = parcheId ?? null;
  const { strokes: remoteStrokes, isConnected, sendStroke, clearBoard } = useBoard(
    canvasId, userId ?? "anonymous"
  );
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
            color, width, points: pts,
          };
          setLocalPaths((prev) => [...prev, { d: pointsToSvgD(pts), color, size: width }]);
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

  const remotePaths = useMemo(
    () => remoteStrokes.map((s) => ({ d: pointsToSvgD(s.points), color: s.color, size: s.width })),
    [remoteStrokes]
  );
  const allPaths = useMemo(() => [...remotePaths, ...localPaths], [remotePaths, localPaths]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.lienzoToolbar}>
        <View style={styles.lienzoToolLeft}>
          <Pressable style={[styles.lienzoToolBtn, activeTool === "pen" && styles.lienzoToolBtnActive]} onPress={() => setActiveTool("pen")}>
            <Text style={styles.lienzoToolIcon}>✏️</Text>
          </Pressable>
          <Text style={[styles.lienzoToolLabel, activeTool === "pen" && styles.lienzoToolLabelActive]}>Pluma</Text>
          <Pressable style={[styles.lienzoToolBtn, activeTool === "eraser" && styles.lienzoToolBtnActive]} onPress={() => setActiveTool("eraser")}>
            <Ionicons name="remove-circle-outline" size={16} color={activeTool === "eraser" ? "rgba(129, 140, 248, 1)" : "rgba(255,255,255,0.5)"} />
          </Pressable>
          <Text style={[styles.lienzoToolLabel, activeTool === "eraser" && styles.lienzoToolLabelActive]}>Borrador</Text>
        </View>
        <View style={styles.lienzoToolRight}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? "rgba(35, 165, 89, 1)" : "rgba(248, 113, 113, 1)" }]} />
          <Pressable style={styles.lienzoClearBtn} onPress={handleClear}>
            <Text style={styles.lienzoClearText}>Limpiar</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.lienzoPalette}>
        {COLORS.map((color) => (
          <Pressable
            key={color}
            style={[styles.lienzoPaletteColor, { backgroundColor: color }, activeColor === color && styles.lienzoPaletteColorActive]}
            onPress={() => setActiveColor(color)}
          />
        ))}
        <View style={styles.lienzoPaletteSep} />
        <View style={[styles.lienzoBrushSize, { backgroundColor: activeColor }]} />
      </View>
      <View style={styles.lienzoCanvas} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {allPaths.map((p, idx) => (
            <Path key={idx} d={p.d} stroke={p.color} strokeWidth={p.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

// ── Juegos Tab ───────────────────────────────────────────────────────────────

function GamesView() {
  const [activeGame, setActiveGame] = useState<"list" | "parques">("list");

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

  return (
    <ScrollView style={styles.gamesScroll} contentContainerStyle={styles.gamesScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.gamesSectionTitle}>Juegos del parche</Text>

      <Pressable style={styles.gameCardParques} onPress={() => setActiveGame("parques")}>
        <View style={styles.gameCardInnerBorderParques}>
          <View style={styles.gameIconRowParques}>
            <View style={styles.parquesBoard}>
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

// ── Voz Tab ───────────────────────────────────────────────────────────────────

function VozView() {
  return (
    <View style={styles.placeholderView}>
      <Ionicons name="volume-high-outline" size={48} color="rgba(99, 102, 241, 0.4)" />
      <Text style={[styles.placeholderText, { marginTop: 12, fontSize: 16 }]}>Canales de voz</Text>
      <Text style={[styles.placeholderText, { fontSize: 13, marginTop: 4 }]}>Próximamente</Text>
    </View>
  );
}

// ─── Members View ─────────────────────────────────────────────────────────────

interface MemberProfile {
  id: string;
  name: string;
  email: string;
}

function MembersView({ parcheId, parcheName }: { parcheId?: string; parcheName: string }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!parcheId) return;
    (async () => {
      try {
        const ids = await parcheService.getMembers(parcheId as UUID);
        setMemberIds(ids);
        // Attempt to hydrate profiles
        const profileMap: Record<string, MemberProfile> = {};
        for (const id of ids) {
          try {
            const { data } = await apiClient.get<MemberProfile>(`/api/v1/usuarios/${id}/perfil`);
            profileMap[id] = data;
          } catch {
            profileMap[id] = { id, name: `Usuario ${id.slice(0, 8)}`, email: "" };
          }
        }
        setProfiles(profileMap);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [parcheId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
      </View>
    );
  }

  const sorted = [...memberIds].sort((a) => (a === userId ? -1 : 1));

  return (
    <>
      <ScrollView style={styles.membersScroll} contentContainerStyle={styles.membersContent} showsVerticalScrollIndicator={false}>
        <View style={styles.membersHeader}>
          <Text style={styles.membersCount}>{memberIds.length} miembros</Text>
          <View style={styles.membersSearchWrap}>
            <Ionicons name="search" size={14} color="rgba(90, 90, 104, 1)" />
            <TextInput
              style={styles.membersSearchInput}
              placeholder="Buscar miembro..."
              placeholderTextColor="rgba(90, 90, 104, 1)"
            />
          </View>
        </View>

        {sorted.map((id, idx) => {
          const profile = profiles[id];
          const name = profile?.name || `Usuario ${id.slice(0, 8)}`;
          const initials = name.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
          const isSelf = id === userId;
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [
                styles.memberRow,
                idx < sorted.length - 1 && styles.memberRowBorder,
                pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" },
              ]}
              onPress={() => router.push(`/user/${id}`)}
              onLongPress={() => setReportTarget({ name })}
            >
              <View style={styles.memberAvatarWrap}>
                <View style={[styles.memberAvatar, { borderColor: isSelf ? "rgba(99, 102, 241, 0.3)" : "rgba(124, 106, 245, 0.21)", backgroundColor: isSelf ? "rgba(99, 102, 241, 0.15)" : "rgba(124, 106, 245, 0.13)" }]}>
                  <Text style={[styles.memberAvatarText, { color: isSelf ? "rgba(99, 102, 241, 1)" : "rgba(124, 106, 245, 1)" }]}>
                    {initials}
                  </Text>
                </View>
                <View style={[styles.memberStatusDot, { backgroundColor: isSelf ? "rgba(35, 165, 89, 1)" : "rgba(90, 90, 104, 0.6)" }]} />
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{name}</Text>
                  {isSelf && (
                    <View style={[styles.roleBadge, { borderColor: "rgba(99, 102, 241, 0.3)", backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
                      <Ionicons name="person" size={9} color="rgba(99, 102, 241, 1)" />
                      <Text style={[styles.roleBadgeText, { color: "rgba(99, 102, 241, 1)" }]}>Tú</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberCareer}>{profile?.email || ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(90, 90, 104, 0.4)" />
            </Pressable>
          );
        })}
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
  menuBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 200,
    height: 600,
  },
  dropdownMenu: {
    position: "absolute",
    top: 32,
    right: 0,
    backgroundColor: "rgba(30, 30, 50, 0.97)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 160,
    zIndex: 100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  dropdownText: {
    color: "rgba(236, 237, 248, 0.9)",
    fontSize: 13,
    fontWeight: "500",
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
  moreGamesText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
  gameFullView: {
    flex: 1,
  },
  // Parqués sub-view
  parquesHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  parquesBackBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  parquesHeaderTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Lienzo toolbar
  lienzoToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  lienzoToolLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lienzoToolBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  lienzoToolBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  lienzoToolIcon: {
    fontSize: 16,
  },
  lienzoToolLabel: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    marginRight: 8,
  },
  lienzoToolLabelActive: {
    color: "rgba(129, 140, 248, 1)",
  },
  lienzoToolRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lienzoClrBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  lienzoBackText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  lienzoClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
  },
  lienzoClearText: {
    color: "rgba(248, 113, 113, 1)",
    fontSize: 11,
    fontWeight: "600",
  },
  lienzoPalette: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  lienzoPaletteColor: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  lienzoPaletteColorActive: {
    borderWidth: 2,
    borderColor: "white",
    transform: [{ scale: 1.2 }],
  },
  lienzoPaletteSep: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  lienzoBrushSize: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  lienzoCanvas: {
    flex: 1,
  },
  lienzoCanvasHint: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
    textAlign: "center",
    paddingTop: 60,
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
  // ── Panel Overlay ──
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 13, 24, 1)",
    zIndex: 50,
  },
  panelContainer: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  panelBackBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  panelTitle: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  panelCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Members View ──
  membersScroll: {
    flex: 1,
  },
  membersContent: {
    padding: 16,
  },
  membersHeader: {
    gap: 12,
    marginBottom: 16,
  },
  membersCount: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  membersSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  memberAvatarWrap: {
    position: "relative",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    bottom: 1,
    right: -1,
    borderWidth: 2,
    borderColor: "rgba(11, 13, 24, 1)",
  },
  memberInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  memberCareer: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
  },
  // ── Settings View ──
  settingsScroll: {
    flex: 1,
  },
  settingsContent: {
    padding: 16,
    gap: 20,
  },
  settingsServerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  settingsServerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(242, 63, 67, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(242, 63, 67, 0.21)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsServerInfo: {
    flex: 1,
    gap: 2,
  },
  settingsServerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  settingsServerDesc: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
  },
  settingsSectionLabel: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    marginBottom: -12,
  },
  settingsGroup: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsItemContent: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  settingsItemLabel: {
    color: "rgba(236, 237, 248, 0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  settingsItemValue: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(90, 90, 104, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: "rgba(99, 102, 241, 0.6)",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(220, 220, 230, 1)",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
});
