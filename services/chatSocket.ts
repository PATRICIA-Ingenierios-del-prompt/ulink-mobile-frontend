/**
 * Comunicación MS — STOMP client for real-time chat and WebRTC voice.
 * Native WebSocket STOMP (the backend endpoint /ws-stomp is registered
 * WITHOUT SockJS). JWT rides as ?access_token= on the WS upgrade.
 */

import 'text-encoding';
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";
import { tokenManager } from "./tokenManager";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  parcheId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  fileUrl?: string | null;
  sentAt: string;
}

export interface VoiceEvent {
  signalType: "JOIN" | "LEAVE";
  senderUserId: string;
  senderUsername: string;
}

export interface VoiceSignalPayload {
  signalType: "OFFER" | "ANSWER" | "ICE_CANDIDATE" | "JOIN" | "LEAVE";
  targetUserId?: string;
  signalData?: string;
  senderUserId?: string;
  senderUsername?: string;
}

export interface ParcheChannelHandlers {
  onMessage?: (msg: ChatMessage) => void;
  onVoiceEvent?: (evt: VoiceEvent) => void;
}

export interface ComunicacionSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onVoiceSignal?: (signal: VoiceSignalPayload) => void;
  onKicked?: (evt: { parcheId: string; reason: string }) => void;
}

// ── Service ───────────────────────────────────────────────────────────────────

const WS_PATH = "/ws-stomp";

function buildWsUrl(token: string): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}${WS_PATH}?access_token=${encodeURIComponent(token)}`;
}

export class ChatSocket {
  private client: Client;
  private channelSubs = new Map<string, StompSubscription[]>();
  private globalSubs: StompSubscription[] = [];

  constructor(private opts: ComunicacionSocketOptions = {}) {
    this.client = new Client({
      // Re-read the token on EVERY (re)connect attempt
      beforeConnect: async () => {
        const token = (await tokenManager.getAccessToken()) ?? "";
        this.client.brokerURL = buildWsUrl(token);
        this.client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        this._subscribeGlobal();
        opts.onConnect?.();
      },
      onWebSocketClose: () => opts.onDisconnect?.(),
    });
  }

  activate(): void {
    this.client.activate();
  }

  get connected(): boolean {
    return this.client.connected;
  }

  async deactivate(): Promise<void> {
    this.channelSubs.forEach((list) => list.forEach((s) => s.unsubscribe()));
    this.channelSubs.clear();
    this.globalSubs.forEach((s) => s.unsubscribe());
    this.globalSubs = [];
    await this.client.deactivate();
  }

  subscribeToParche(
    chatId: string,
    handlers: ParcheChannelHandlers
  ): () => void {
    if (!this.client.connected) return () => {};
    const list: StompSubscription[] = [];

    if (handlers.onMessage) {
      list.push(
        this.client.subscribe(`/topic/chat/${chatId}`, (m: IMessage) => {
          handlers.onMessage?.(JSON.parse(m.body));
        })
      );
    }

    if (handlers.onVoiceEvent) {
      list.push(
        this.client.subscribe(`/topic/voice/${chatId}`, (m: IMessage) => {
          const frame = JSON.parse(m.body) as VoiceEvent | VoiceSignalPayload;
          if (frame.signalType === "JOIN" || frame.signalType === "LEAVE") {
            handlers.onVoiceEvent?.(frame as VoiceEvent);
          }
        })
      );
    }

    this.channelSubs.set(chatId, [
      ...(this.channelSubs.get(chatId) ?? []),
      ...list,
    ]);
    return () => {
      list.forEach((s) => s.unsubscribe());
      this.channelSubs.delete(chatId);
    };
  }

  sendMessage(chatId: string, content: string, type = "TEXT"): void {
    if (!this.client.connected) {
      console.warn("[chatSocket] sendMessage ignored: STOMP not connected");
      return;
    }
    this.client.publish({
      destination: `/app/chat.send/${chatId}`,
      body: JSON.stringify({ content, type }),
    });
  }

  markRead(chatId: string): void {
    this.client.publish({
      destination: `/app/chat.read/${chatId}`,
      body: "{}",
    });
  }

  joinVoice(chatId: string): void {
    if (!this.client.connected) {
      throw new Error(
        "No se pudo unir a la llamada: conexión STOMP no está activa todavía"
      );
    }
    this.client.publish({
      destination: `/app/voice.join/${chatId}`,
      body: "{}",
    });
  }

  leaveVoice(chatId: string): void {
    if (!this.client.connected) {
      console.warn("[chatSocket] leaveVoice ignored: STOMP not connected");
      return;
    }
    this.client.publish({
      destination: `/app/voice.leave/${chatId}`,
      body: "{}",
    });
  }

  sendVoiceSignal(chatId: string, signal: VoiceSignalPayload): void {
    if (!this.client.connected) {
      console.warn(
        "[chatSocket] sendVoiceSignal ignored: STOMP not connected",
        signal.signalType
      );
      return;
    }
    this.client.publish({
      destination: `/app/voice.signal/${chatId}`,
      body: JSON.stringify(signal),
    });
  }

  private _subscribeGlobal(): void {
    this.globalSubs.push(
      this.client.subscribe("/user/queue/voice-signal", (m: IMessage) =>
        this.opts.onVoiceSignal?.(JSON.parse(m.body))
      ),
      this.client.subscribe("/user/queue/kicked", (m: IMessage) =>
        this.opts.onKicked?.(JSON.parse(m.body))
      )
    );
  }
}

// Singleton
let _instance: ChatSocket | null = null;

export function getChatSocket(
  opts?: ComunicacionSocketOptions
): ChatSocket {
  if (!_instance) {
    _instance = new ChatSocket(opts);
  }
  return _instance;
}

export function destroyChatSocket(): void {
  if (_instance) {
    _instance.deactivate();
    _instance = null;
  }
}
