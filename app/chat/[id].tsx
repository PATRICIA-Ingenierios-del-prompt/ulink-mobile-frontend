import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { communicationService, type ChatMessage } from "@/services/communicationService";
import { useAuth } from "@/hooks/useAuth";
import { getChatSocket, type ChatMessage as WsChatMessage } from "@/services/chatSocket";

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  image?: string;
  fileType?: string;
  audioDuration?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userId } = useAuth();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const chatId = id as string;

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  // Connect to WebSocket and subscribe to real-time messages
  useEffect(() => {
    if (!chatId || !userId) return;
    const socket = getChatSocket();

    socket.activate();

    const unsub = socket.subscribeToParche(chatId, {
      onMessage: (msg: WsChatMessage) => {
        const mapped: Message = {
          id: msg.id,
          sender: msg.senderId === userId ? "Tú" : (msg.senderUsername || "Usuario"),
          text: msg.content,
          time: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: msg.senderId === userId,
          image: msg.type === "IMAGE" ? (msg.fileUrl ?? undefined) : undefined,
        };
        setMessages((prev) => [...prev, mapped]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
    });

    return () => {
      unsub();
      socket.deactivate();
    };
  }, [chatId, userId]);

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const data = await communicationService.getMessages(chatId, 0, 50);
      const mapped: Message[] = (data.content || []).map((m) => ({
        id: m.id,
        sender: m.senderName || "Usuario",
        text: m.content,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: m.senderId === userId,
        image: m.type === "IMAGE" ? m.fileUrl : undefined,
        audioDuration: m.type === "AUDIO" && m.duration ? formatDuration(m.duration) : undefined,
      }));
      setMessages(mapped);
    } catch (err) {
      console.log("[CHAT] Load error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSend = useCallback(() => {
    if (text.trim().length === 0) return;
    const socket = getChatSocket();
    if (socket.connected) {
      socket.sendMessage(chatId, text.trim());
      setText("");
    } else {
      // Fallback: add locally if WS is down
      const newMsg: Message = {
        id: Math.random().toString(),
        sender: "Tú",
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };
      setMessages((prev) => [...prev, newMsg]);
      setText("");
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [text, chatId]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimer.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = (send: boolean) => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setIsRecording(false);
    if (send && recordingSeconds > 0) {
      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
      };
      const duration = formatTime(recordingSeconds);
      const newMsg: Message = {
        id: Math.random().toString(),
        sender: "Tú",
        text: `Nota de voz (${duration})`,
        audioDuration: duration,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleAttachFile = () => {
    Alert.alert(
      "Compartir archivo",
      "Selecciona un archivo para enviar:",
      [
        {
          text: "📄 Apuntes_Calculo_III.pdf",
          onPress: () => {
            const newMsg: Message = {
              id: Math.random().toString(),
              sender: "Tú",
              text: "Apuntes_Calculo_III.pdf",
              fileType: "pdf",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: true,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        },
        {
          text: "📊 Horario_Clases.png",
          onPress: () => {
            const newMsg: Message = {
              id: Math.random().toString(),
              sender: "Tú",
              text: "Horario_Clases.png",
              fileType: "png",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: true,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        },
        {
          text: "Cancelar",
          style: "cancel"
        }
      ]
    );
  };

  const handleCamera = () => {
    Alert.alert(
      "Compartir foto",
      "Selecciona una opción:",
      [
        {
          text: "📸 Tomar foto",
          onPress: () => {
            const newMsg: Message = {
              id: Math.random().toString(),
              sender: "Tú",
              text: "Foto de la biblioteca",
              image: "https://picsum.photos/id/1018/600/400",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: true,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        },
        {
          text: "🖼️ Elegir de galería",
          onPress: () => {
            const newMsg: Message = {
              id: Math.random().toString(),
              sender: "Tú",
              text: "Meme_parcial.jpg",
              image: "https://picsum.photos/id/1025/600/400",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: true,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        },
        {
          text: "Cancelar",
          style: "cancel"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
            <View style={styles.parcheIconBox}>
              <Text style={styles.parcheIconEmoji}>
                {id?.toString().substring(0, 2).toUpperCase() || "U"}
              </Text>
            </View>
            <Pressable style={styles.parcheInfo} onPress={() => router.push(`/user/${id}`)}>
              <Text style={styles.parcheTitle}>Usuario {id}</Text>
              <Text style={styles.parcheSubtitle}>En línea</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable style={styles.actionButton} onPress={() => router.push("/call")}>
                <Ionicons name="call" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => router.push("/video-call")}>
                <Ionicons name="videocam" size={20} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.chatRoot}>
          {loading ? (
            <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" style={{ flex: 1 }} />
          ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageRow, msg.isMe && styles.messageRowMe]}>
                {!msg.isMe && (
                  <View style={styles.messageAvatarBox}>
                    <View style={styles.messageAvatar}>
                      <Text style={styles.messageAvatarText}>
                        {id?.toString().substring(0, 2).toUpperCase() || "U"}
                      </Text>
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
                  <Pressable style={styles.chatAttachBtn} onPress={handleAttachFile}>
                    <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.6)" />
                  </Pressable>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Mensaje..."
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
  messageRowMe: {
    justifyContent: "flex-end",
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
  messageContentWrapMe: {
    alignItems: "flex-end",
    flex: 0,
    maxWidth: "85%",
  },
  messageSender: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageSenderMe: {
    color: "rgba(129, 140, 248, 1)",
    textAlign: "right",
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderTopRightRadius: 4,
    borderTopLeftRadius: 16,
    alignSelf: "flex-end",
  },
  messageBubbleOther: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    alignSelf: "flex-start",
  },
  messageText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: "white",
  },
  messageTime: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeMe: {
    textAlign: "right",
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
  chatSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 14,
    fontWeight: "600",
  },
  fileMessageNameMe: {
    color: "white",
  },
  fileMessageSize: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
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
});
