import { useState, useRef, useCallback, useEffect } from "react";
import { getChatSocket, VoiceSignalPayload } from "@/services/chatSocket";
import { useAuth } from "@/hooks/useAuth";

// Mocking MediaStream type for Expo Go compatibility
export type MediaStream = any;

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(chatId: string) {
  const { userId } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const initWebRTC = useCallback(async (isVideo: boolean) => {
    try {
      // Mock stream for Expo Go
      setLocalStream({ id: 'mock-local' });
      setIsConnecting(false);
      return { id: 'mock-pc' };
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      return null;
    }
  }, [chatId]);

  const startCall = useCallback(async (isVideo: boolean) => {
    const pc = await initWebRTC(isVideo);
    if (!pc) return;

    try {
      // Simulate connection
      setTimeout(() => setRemoteStream({ id: 'mock-remote' }), 2000);
      
      getChatSocket().sendVoiceSignal(chatId, {
        signalType: "OFFER",
        signalData: "mock-offer",
      });
    } catch (err) {
      console.error("Error creating offer", err);
    }
  }, [initWebRTC, chatId]);

  const handleIncomingSignal = useCallback(async (signal: VoiceSignalPayload) => {
    // Mock signal handling
  }, [chatId]);

  const endCall = useCallback(() => {
    setLocalStream(null);
    setRemoteStream(null);
    getChatSocket().leaveVoice(chatId);
  }, [localStream, chatId]);

  const toggleMic = useCallback(() => {
    // Mock toggle mic
    return false;
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    // Mock toggle camera
    return false;
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isConnecting,
    startCall,
    handleIncomingSignal,
    endCall,
    toggleMic,
    toggleCamera,
    initWebRTC,
  };
}
