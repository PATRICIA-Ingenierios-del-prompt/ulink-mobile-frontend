import { apiClient } from "./apiClient";

const BASE = "/api/chat";

export interface ChatMessage {
  messageId: string;
  id?: string;
  chatId?: string;
  parcheId?: string;
  senderId: string;
  senderUsername: string;
  senderName?: string;
  content: string;
  sentAt: string;
  timestamp?: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "FILE" | "SYSTEM";
  fileUrl?: string | null;
  duration?: number;
  readBy?: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
  first: boolean;
  last: boolean;
}

export const communicationService = {
  async getMessages(
    chatId: string,
    page = 0,
    size = 50
  ): Promise<Page<ChatMessage>> {
    const { data } = await apiClient.get<Page<ChatMessage>>(
      `${BASE}/${chatId}/messages`,
      { params: { page, size } }
    );
    return data;
  },

  async getMessagesBetween(
    user1: string,
    user2: string,
    page = 0,
    size = 50
  ): Promise<Page<ChatMessage>> {
    const { data } = await apiClient.get<Page<ChatMessage>>(
      `${BASE}/messages/between`,
      { params: { user1, user2, page, size } }
    );
    return data;
  },
};
