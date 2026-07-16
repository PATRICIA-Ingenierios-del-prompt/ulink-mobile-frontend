/**
 * Board/Lienzo MS — STOMP client for collaborative whiteboard.
 * WebSocket endpoint authenticated via ?access_token= query param.
 * The Gateway validates JWT before proxying to Board MS.
 */

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";
import { apiClient } from "./apiClient";
import { tokenManager } from "./tokenManager";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
  createdAt?: string;
}

export interface CursorMessage {
  userId: string;
  x: number;
  y: number;
}

export interface BoardResponse {
  boardId: string;
  strokes: Stroke[];
}

// ── REST API (authenticated via apiClient) ────────────────────────────────────

const BOARD_BASE = "/api/boards";

export const boardApi = {
  async createBoard(customId?: string): Promise<{ boardId: string }> {
    const url = customId ? `${BOARD_BASE}?customId=${encodeURIComponent(customId)}` : BOARD_BASE;
    const { data } = await apiClient.post(url);
    return data;
  },

  async getBoard(boardId: string): Promise<BoardResponse> {
    const { data } = await apiClient.get(`${BOARD_BASE}/${boardId}`);
    return data;
  },

  async clearBoard(boardId: string): Promise<void> {
    await apiClient.post(`${BOARD_BASE}/${boardId}/clear`);
  },
};

// ── WebSocket Service ─────────────────────────────────────────────────────────

const WS_PATH = "/ws/board";

function buildWsUrl(token: string): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}${WS_PATH}?access_token=${encodeURIComponent(token)}`;
}

export interface BoardSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStroke?: (stroke: Stroke) => void;
  onClear?: () => void;
  onCursor?: (cursor: CursorMessage) => void;
}

export class BoardSocket {
  private client: Client;
  private subs: StompSubscription[] = [];
  private boardId: string;

  constructor(boardId: string, private opts: BoardSocketOptions = {}) {
    this.boardId = boardId;

    this.client = new Client({
      beforeConnect: async () => {
        const token = (await tokenManager.getAccessToken()) ?? "";
        this.client.brokerURL = buildWsUrl(token);
        this.client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      brokerURL: buildWsUrl(""),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        this._subscribe();
        opts.onConnect?.();
      },
      onStompError: (frame) => {
        console.error("[BoardSocket] STOMP error:", frame.headers["message"]);
      },
      onWebSocketClose: () => opts.onDisconnect?.(),
      onWebSocketError: (event) => {
        console.error("[BoardSocket] WebSocket error:", event);
      },
    });
  }

  connect(): void {
    this.client.activate();
  }

  get connected(): boolean {
    return this.client.connected;
  }

  disconnect(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.client.deactivate();
  }

  sendStroke(stroke: Stroke): void {
    if (this.client.connected) {
      this.client.publish({
        destination: `/app/board/${this.boardId}/stroke`,
        body: JSON.stringify(stroke),
      });
    }
  }

  sendCursor(cursor: CursorMessage): void {
    if (this.client.connected) {
      this.client.publish({
        destination: `/app/board/${this.boardId}/cursor`,
        body: JSON.stringify(cursor),
      });
    }
  }

  private _subscribe(): void {
    this.subs.push(
      this.client.subscribe(
        `/exchange/amq.topic/board.${this.boardId}`,
        (message: IMessage) => {
          if (message.body) {
            this.opts.onStroke?.(JSON.parse(message.body));
          }
        }
      ),
      this.client.subscribe(
        `/exchange/amq.topic/board.${this.boardId}.clear`,
        () => {
          this.opts.onClear?.();
        }
      ),
      this.client.subscribe(
        `/exchange/amq.topic/board.${this.boardId}.cursor`,
        (message: IMessage) => {
          if (message.body) {
            this.opts.onCursor?.(JSON.parse(message.body));
          }
        }
      )
    );
  }
}
