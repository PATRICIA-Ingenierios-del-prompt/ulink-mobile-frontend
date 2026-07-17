import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { getChatSocket, type VoiceSignalPayload } from "@/services/chatSocket";
import { useAuth } from "@/hooks/useAuth";

// ── Lazy-load native WebRTC modules ──────────────────────────────────────────
// react-native-webrtc requires a development build (not Expo Go).
// We use require() so the import doesn't crash at module-load time.

let WebRTC: {
  RTCPeerConnection: any;
  RTCIceCandidate: any;
  RTCSessionDescription: any;
  mediaDevices: any;
} | null = null;

let _loadError: string | null = null;

function loadWebRTC() {
  if (WebRTC || _loadError) return WebRTC;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rtc = require("react-native-webrtc");
    WebRTC = {
      RTCPeerConnection: rtc.RTCPeerConnection,
      RTCIceCandidate: rtc.RTCIceCandidate,
      RTCSessionDescription: rtc.RTCSessionDescription,
      mediaDevices: rtc.mediaDevices,
    };
    return WebRTC;
  } catch (err: any) {
    _loadError =
      err?.message ??
      "react-native-webrtc no está disponible. Crea un development build para usar llamadas.";
    console.warn("[useWebRTC]", _loadError);
    return null;
  }
}

export function isWebRTCAvailable(): boolean {
  return loadWebRTC() !== null;
}

export function getWebRTCError(): string | null {
  loadWebRTC();
  return _loadError;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(chatId: string) {
  const { userId } = useAuth();
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [remoteStream, setRemoteStream] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<any | null>(null);
  const localStreamRef = useRef<any | null>(null);
  const remoteStreamRef = useRef<any | null>(null);
  const hasCreatedOffer = useRef(false);
  const chatIdRef = useRef(chatId);
  chatIdRef.current = chatId;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      } catch {}
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    hasCreatedOffer.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnecting(true);
  }, []);

  const setupPeerConnection = useCallback(
    (stream: any, _isVideo: boolean) => {
      const rtc = loadWebRTC();
      if (!rtc) return null;

      const pc = new rtc.RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          const remote = event.streams[0];
          remoteStreamRef.current = remote;
          setRemoteStream(remote);
          setIsConnecting(false);
        }
      };

      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          try {
            getChatSocket().sendVoiceSignal(chatIdRef.current, {
              signalType: "ICE_CANDIDATE",
              signalData: JSON.stringify(event.candidate.toJSON()),
            });
          } catch {}
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "failed" || state === "disconnected" || state === "closed") {
          setIsConnecting(true);
        }
      };

      return pc;
    },
    []
  );

  const initWebRTC = useCallback(
    async (isVideo: boolean) => {
      const rtc = loadWebRTC();
      if (!rtc) {
        setError(
          "react-native-webrtc no está disponible. Necesitas un development build para usar llamadas."
        );
        return null;
      }

      try {
        const constraints = {
          audio: true,
          video: isVideo
            ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
        };

        const stream = await rtc.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = setupPeerConnection(stream, isVideo);
        return pc;
      } catch (err: any) {
        console.error("[useWebRTC] init error:", err);
        setError(err?.message ?? "No se pudo acceder a micrófono/cámara");
        return null;
      }
    },
    [setupPeerConnection]
  );

  const createAndSendOffer = useCallback(async (pc: any) => {
    try {
      const rtc = loadWebRTC();
      if (!rtc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      getChatSocket().sendVoiceSignal(chatIdRef.current, {
        signalType: "OFFER",
        signalData: JSON.stringify(pc.localDescription?.toJSON()),
      });
    } catch (err) {
      console.error("[useWebRTC] createOffer error:", err);
    }
  }, []);

  const startCall = useCallback(
    async (isVideo: boolean) => {
      const pc = await initWebRTC(isVideo);
      if (!pc) return;

      try {
        getChatSocket().joinVoice(chatIdRef.current);
      } catch (err) {
        console.warn("[useWebRTC] joinVoice failed:", err);
      }

      if (!hasCreatedOffer.current) {
        hasCreatedOffer.current = true;
        await createAndSendOffer(pc);
      }
    },
    [initWebRTC, createAndSendOffer]
  );

  const handleIncomingSignal = useCallback(
    async (signal: VoiceSignalPayload) => {
      const pc = pcRef.current;
      if (!pc) return;

      const rtc = loadWebRTC();
      if (!rtc) return;

      try {
        switch (signal.signalType) {
          case "OFFER": {
            const remoteDesc = new rtc.RTCSessionDescription(
              JSON.parse(signal.signalData!)
            );
            await pc.setRemoteDescription(remoteDesc);

            if (localStreamRef.current) {
              const senders = pc.getSenders();
              if (senders.length === 0) {
                localStreamRef.current.getTracks().forEach((track: any) => {
                  pc.addTrack(track, localStreamRef.current!);
                });
              }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            getChatSocket().sendVoiceSignal(chatIdRef.current, {
              signalType: "ANSWER",
              signalData: JSON.stringify(pc.localDescription?.toJSON()),
            });
            break;
          }
          case "ANSWER": {
            if (pc.signalingState === "have-local-offer") {
              const remoteDesc = new rtc.RTCSessionDescription(
                JSON.parse(signal.signalData!)
              );
              await pc.setRemoteDescription(remoteDesc);
            }
            break;
          }
          case "ICE_CANDIDATE": {
            if (signal.signalData) {
              const candidate = new rtc.RTCIceCandidate(
                JSON.parse(signal.signalData)
              );
              await pc.addIceCandidate(candidate);
            }
            break;
          }
        }
      } catch (err) {
        console.error("[useWebRTC] signal error:", signal.signalType, err);
      }
    },
    []
  );

  const endCall = useCallback(() => {
    try {
      getChatSocket().leaveVoice(chatIdRef.current);
    } catch {}
    cleanup();
  }, [cleanup]);

  const toggleMic = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }, []);

  const toggleCamera = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    isConnecting,
    error,
    startCall,
    handleIncomingSignal,
    endCall,
    toggleMic,
    toggleCamera,
  };
}
