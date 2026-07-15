/**
 * BoardGame/Parques MS — STOMP client for real-time Parques game.
 * SockJS endpoint (public, no auth). Accepts native WebSocket upgrades.
 */

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackendPiece {
  pieceId: string;
  position: number;
}

export interface BackendPlayer {
  playerId: string;
  pieces: BackendPiece[];
}

export interface BackendGameState {
  gameId: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  players: BackendPlayer[];
  currentPlayerId: string;
  dice1: number;
  dice2: number;
  message?: string;
  winnerId?: string;
  doubleCount?: number;
  lastAction?: string;
}

export interface ParquesGameConfig {
  playerId: string;
  playerName: string;
}

export interface ParquesMove {
  playerId: string;
  pieceId: string;
  diceSelection: [number, number];
}

// ── WebSocket Service ─────────────────────────────────────────────────────────

const WS_PATH = "/parques-ws";

export interface ParquesSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGameState?: (state: BackendGameState) => void;
  onError?: (error: any) => void;
}

export class ParquesSocket {
  private client: Client;
  private gameSubs: StompSubscription[] = [];
  private errorSubs: StompSubscription[] = [];

  constructor(private opts: ParquesSocketOptions = {}) {
    const wsUrl = API_URL.replace(/^http/, "ws");

    this.client = new Client({
      webSocketFactory: () => new WebSocket(`${wsUrl}${WS_PATH}`) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
      onConnect: () => {
        this._subscribeGlobal();
        opts.onConnect?.();
      },
      onStompError: (frame) => {
        console.error(
          "[ParquesSocket] STOMP error:",
          frame.headers["message"]
        );
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
    this.gameSubs.forEach((s) => s.unsubscribe());
    this.errorSubs.forEach((s) => s.unsubscribe());
    this.gameSubs = [];
    this.errorSubs = [];
    this.client.deactivate();
  }

  subscribeToGame(gameId: string): void {
    // Unsubscribe previous game if any
    this.gameSubs.forEach((s) => s.unsubscribe());
    this.gameSubs = [];

    if (!this.client.connected) return;

    const sub = this.client.subscribe(
      `/exchange/amq.topic/game.${gameId}`,
      (message: IMessage) => {
        if (message.body) {
          const state: BackendGameState = JSON.parse(message.body);
          this.opts.onGameState?.(state);
        }
      }
    );
    this.gameSubs.push(sub);
  }

  createGame(config: ParquesGameConfig): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] createGame ignored: not connected");
      return;
    }
    this.client.publish({
      destination: "/app/game/create",
      body: JSON.stringify(config),
    });
  }

  rollDice(gameId: string, playerId: string): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] rollDice ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/game/${gameId}/roll`,
      body: JSON.stringify({ playerId }),
    });
  }

  movePiece(gameId: string, move: ParquesMove): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] movePiece ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/game/${gameId}/move`,
      body: JSON.stringify(move),
    });
  }

  skipTurn(gameId: string, playerId: string): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] skipTurn ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/game/${gameId}/pass`,
      body: JSON.stringify({ playerId }),
    });
  }

  addBot(gameId: string, difficulty: string): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] addBot ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/game/${gameId}/addBot`,
      body: JSON.stringify({ difficulty }),
    });
  }

  startGame(gameId: string): void {
    if (!this.client.connected) {
      console.warn("[ParquesSocket] startGame ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/game/${gameId}/start`,
      body: "{}",
    });
  }

  private _subscribeGlobal(): void {
    const errorSub = this.client.subscribe(
      "/exchange/amq.topic/errors",
      (message: IMessage) => {
        if (message.body) {
          this.opts.onError?.(JSON.parse(message.body));
        }
      }
    );
    this.errorSubs.push(errorSub);
  }
}
