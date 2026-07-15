/**
 * Board/Lienzo MS — STOMP client for collaborative whiteboard.
 * SockJS endpoint (public, no auth). The server uses SockJS fallback,
 * but also accepts native WebSocket upgrades.
 */

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";

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

// ── REST API ──────────────────────────────────────────────────────────────────

const BOARD_BASE = `${API_URL}/api/boards`;

export const boardApi = {
  async createBoard(customId?: string): Promise<{ boardId: string }> {
    const url = customId ? `${BOARD_BASE}?customId=${customId}` : BOARD_BASE;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to create board: ${res.statusText}`);
    return res.json();
  },

  async getBoard(boardId: string): Promise<BoardResponse> {
    const res = await fetch(`${BOARD_BASE}/${boardId}`);
    if (!res.ok) throw new Error(`Failed to fetch board: ${res.statusText}`);
    return res.json();
  },

  async clearBoard(boardId: string): Promise<void> {
    const res = await fetch(`${BOARD_BASE}/${boardId}/clear`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Failed to clear board: ${res.statusText}`);
  },
};

// ── WebSocket Service ─────────────────────────────────────────────────────────

const WS_PATH = "/ws/board";

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
    const wsUrl = API_URL.replace(/^http/, "ws");

    this.client = new Client({
      // Native WebSocket — SockJS servers accept native WS upgrades
      webSocketFactory: () => new WebSocket(`${wsUrl}${WS_PATH}`) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
      onConnect: () => {
        this._subscribe();
        opts.onConnect?.();
      },
      onStompError: (frame) => {
        console.error("[BoardSocket] STOMP error:", frame.headers["message"]);
      },
      onWebSocketClose: () => opts.onDisconnect?.(),
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
