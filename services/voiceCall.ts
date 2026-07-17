/**
 * Voice call manager — port of the WebRTC mesh from the web front
 * (PATRICIA ParchesView): one RTCPeerConnection per remote participant,
 * signaling over the same STOMP socket as the chat.
 *
 * Rule inherited from the web (glare avoidance): the NEWCOMER initiates
 * the OFFER to everyone already in the call (fetched via
 * GET /api/voice/{chatId}/participants). Peers already in the call never
 * offer on receiving a JOIN — they just wait for the newcomer's OFFER.
 *
 * react-native-webrtc is loaded lazily so the app still runs in Expo Go
 * (where the native module is missing); calls then report unavailable
 * instead of crashing at import time.
 */

import { getChatSocket, type VoiceSignalPayload } from "./chatSocket";

// ── Lazy native module ────────────────────────────────────────────────────────

type WebRTCModule = {
  RTCPeerConnection: any;
  RTCSessionDescription: any;
  RTCIceCandidate: any;
  mediaDevices: { getUserMedia(c: any): Promise<any> };
};

let _webrtc: WebRTCModule | null | undefined; // undefined = not tried yet

function getWebRTC(): WebRTCModule | null {
  if (_webrtc !== undefined) return _webrtc;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _webrtc = require("react-native-webrtc") as WebRTCModule;
  } catch {
    _webrtc = null; // Expo Go — native module not available
  }
  return _webrtc;
}

export function isVoiceAvailable(): boolean {
  return getWebRTC() !== null;
}

// ── Manager ───────────────────────────────────────────────────────────────────

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

class VoiceCallManager {
  private peers = new Map<string, any>(); // userId → RTCPeerConnection
  private localStream: any = null;
  private chatId: string | null = null;
  private muted = false;

  get active(): boolean {
    return this.localStream !== null;
  }

  /** Captura el micrófono. Lanza si WebRTC no está disponible o el permiso falla. */
  async start(chatId: string): Promise<void> {
    const webrtc = getWebRTC();
    if (!webrtc) {
      throw new Error(
        "WebRTC no disponible (Expo Go). Usa un development build: npx expo run:android"
      );
    }
    this.chatId = chatId;
    this.localStream = await webrtc.mediaDevices.getUserMedia({ audio: true });
    this.muted = false;
  }

  /** Cierra todos los peers y libera el micrófono. */
  stop(): void {
    this.peers.forEach((pc) => {
      try { pc.close(); } catch {}
    });
    this.peers.clear();
    if (this.localStream) {
      try { this.localStream.getTracks().forEach((t: any) => t.stop()); } catch {}
      this.localStream = null;
    }
    this.chatId = null;
    this.muted = false;
  }

  /** Silencia/activa el micrófono. Devuelve el nuevo estado de "muted". */
  setMuted(muted: boolean): boolean {
    this.muted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t: any) => { t.enabled = !muted; });
    }
    return this.muted;
  }

  /** El recién llegado ofrece a cada participante que ya estaba (regla anti-glare). */
  async offerTo(remoteId: string): Promise<void> {
    if (!this.chatId || !this.localStream) return;
    const webrtc = getWebRTC();
    if (!webrtc) return;
    try {
      const pc = this.createPeer(remoteId);
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      getChatSocket().sendVoiceSignal(this.chatId, {
        signalType: "OFFER",
        targetUserId: remoteId,
        signalData: JSON.stringify(offer),
      });
    } catch (err) {
      console.error(`[voice] initiateOffer a ${remoteId} falló:`, err);
    }
  }

  /** OFFER / ANSWER / ICE_CANDIDATE entrantes por /user/queue/voice-signal. */
  async handleSignal(signal: VoiceSignalPayload, myUserId: string | null): Promise<void> {
    const webrtc = getWebRTC();
    if (!webrtc || !this.chatId || !this.localStream) return;
    if (!signal.senderUserId || signal.senderUserId === myUserId) return;

    try {
      if (signal.signalType === "OFFER") {
        const pc = this.createPeer(signal.senderUserId);
        await pc.setRemoteDescription(
          new webrtc.RTCSessionDescription(JSON.parse(signal.signalData!))
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        getChatSocket().sendVoiceSignal(this.chatId, {
          signalType: "ANSWER",
          targetUserId: signal.senderUserId,
          signalData: JSON.stringify(answer),
        });
      } else if (signal.signalType === "ANSWER") {
        const pc = this.peers.get(signal.senderUserId);
        if (pc) {
          await pc.setRemoteDescription(
            new webrtc.RTCSessionDescription(JSON.parse(signal.signalData!))
          );
        }
      } else if (signal.signalType === "ICE_CANDIDATE") {
        const pc = this.peers.get(signal.senderUserId);
        if (pc) {
          await pc.addIceCandidate(
            new webrtc.RTCIceCandidate(JSON.parse(signal.signalData!))
          );
        }
      }
    } catch (err) {
      console.error(`[voice] handleSignal (${signal.signalType}) falló:`, err);
    }
  }

  /** Cierra la conexión con un participante que salió. */
  closePeer(userId: string): void {
    const pc = this.peers.get(userId);
    if (pc) {
      try { pc.close(); } catch {}
      this.peers.delete(userId);
    }
  }

  // ── privado ────────────────────────────────────────────────────────────────

  private createPeer(remoteId: string): any {
    const webrtc = getWebRTC()!;
    // Igual que el web: si llega una OFFER de alguien con quien ya teníamos
    // peer, el nuevo lo reemplaza — cerramos el anterior para no aplicar ICE
    // al peer equivocado.
    this.closePeer(remoteId);

    const pc = new webrtc.RTCPeerConnection(ICE_SERVERS);
    this.peers.set(remoteId, pc);

    this.localStream.getTracks().forEach((t: any) => pc.addTrack(t, this.localStream));

    // En react-native-webrtc el audio remoto se enruta automáticamente a la
    // salida del dispositivo al recibir el track — no hace falta un <audio>.
    pc.addEventListener("track", () => {
      console.log(`[voice] track remoto recibido de ${remoteId}`);
    });
    pc.addEventListener("iceconnectionstatechange", () => {
      console.log(`[voice] ICE state con ${remoteId}:`, pc.iceConnectionState);
    });
    pc.addEventListener("icecandidate", (evt: any) => {
      if (evt.candidate && this.chatId) {
        getChatSocket().sendVoiceSignal(this.chatId, {
          signalType: "ICE_CANDIDATE",
          targetUserId: remoteId,
          signalData: JSON.stringify(evt.candidate),
        });
      }
    });

    // Respetar el mute vigente si el peer se crea después de silenciar
    if (this.muted) this.setMuted(true);
    return pc;
  }
}

export const voiceCall = new VoiceCallManager();