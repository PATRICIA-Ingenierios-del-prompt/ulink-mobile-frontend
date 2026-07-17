/**
 * Parqués MS — STOMP client for the real-time Parqués game.
 *
 * Mirrors the working chat/geo/board sockets: native WebSocket + STOMP, the JWT
 * riding as `?access_token=` on the upgrade (harmless if the backend ignores it),
 * binary frames + NULL fixup for React Native, and subscribe-after-connect with
 * automatic re-subscription on reconnect.
 *
 * Backend contract (PATRICIA_Parques_Backend, ParquesWebSocketController):
 *   SEND      /app/game/create                 -> { gameId, players:[{id,name}] }
 *   SEND      /app/game/{gameId}/join          -> { gameId, playerId, playerName }
 *   SEND      /app/game/{gameId}/start         -> {}
 *   SEND      /app/game/{gameId}/roll          -> { playerId }
 *   SEND      /app/game/{gameId}/move          -> { playerId, pieceId, diceSelection }
 *   SEND      /app/game/{gameId}/pass          -> { playerId }
 *   SEND      /app/game/{gameId}/exitJail      -> { playerId }
 *   SEND      /app/game/{gameId}/addBot        -> { difficulty: EASY|MEDIUM|HARD }
 *   SUBSCRIBE /exchange/amq.topic/game.{gameId} -> GameResponse (full game state)
 *   SUBSCRIBE /exchange/amq.topic/errors        -> { error: string }
 */

import "text-encoding";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";
import { tokenManager } from "./tokenManager";

// ── Backend DTOs (mirror GameResponse.java exactly) ─────────────────────────────

export interface BackendPiece {
  id: string;
  absolutePosition: number;
  relativePosition: number;
  inJail: boolean;
  atHome: boolean;
}

export interface BackendPlayer {
  id: string;
  name: string;
  color: string;
  jailAttemptsRemaining: number;
  consecutivePairs: number;
  pieces: BackendPiece[];
}

export type BackendGameStatus = "WAITING_FOR_PLAYERS" | "IN_PROGRESS" | "FINISHED";

export interface BackendGameState {
  gameId: string;
  currentPlayerId: string;
  die1: number;
  die2: number;
  moveValue: number;
  diceRolled: boolean;
  die1Used: boolean;
  die2Used: boolean;
  jailExitAvailable: boolean;
  state: BackendGameStatus;
  winnerId: string | null;
  players: BackendPlayer[];
}

export interface BackendError {
  error: string;
}

/** A player descriptor for create/join (backend PlayerInfo). */
export interface ParquesPlayerInfo {
  id: string;
  name: string;
}

/**
 * Which die the server should consume for a move:
 *   1 = die1, 2 = die2, 3 = die1 + die2 (sum, only when both dice are free).
 */
export type DiceSelection = 1 | 2 | 3;

export interface ParquesMove {
  playerId: string;
  pieceId: string;
  diceSelection: DiceSelection;
}

// ── Service ─────────────────────────────────────────────────────────────────────

const WS_PATH = "/parques-ws";

function buildWsUrl(token: string): string {
  const base = API_URL.replace(/^http/, "ws");
  return token
    ? `${base}${WS_PATH}?access_token=${encodeURIComponent(token)}`
    : `${base}${WS_PATH}`;
}

export interface ParquesSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGameState?: (state: BackendGameState) => void;
  onError?: (error: BackendError) => void;
}

export class ParquesSocket {
  private client: Client;
  private gameSub: StompSubscription | null = null;
  private errorSub: StompSubscription | null = null;
  private subscribedGameId: string | null = null;

  constructor(private opts: ParquesSocketOptions = {}) {
    this.client = new Client({
      beforeConnect: async () => {
        const token = (await tokenManager.getAccessToken()) ?? "";
        this.client.brokerURL = buildWsUrl(token);
        this.client.connectHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : {};
      },
      // React Native STOMP needs the TextEncoder polyfill (imported above) plus
      // binary frames and NULL-terminator fixup, matching the working sockets.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        this._subscribeErrors();
        // Re-subscribe to the current game after a (re)connect so state keeps
        // flowing across network drops.
        if (this.subscribedGameId) {
          this._subscribeToGame(this.subscribedGameId);
        }
        this.opts.onConnect?.();
      },
      onStompError: (frame) => {
        console.error("[ParquesSocket] STOMP error:", frame.headers["message"]);
      },
      onWebSocketClose: () => this.opts.onDisconnect?.(),
    });
  }

  activate(): void {
    this.client.activate();
  }

  get connected(): boolean {
    return this.client.connected;
  }

  async deactivate(): Promise<void> {
    this._clearSubs();
    this.subscribedGameId = null;
    await this.client.deactivate();
  }

  /** Subscribe to a game's broadcast topic; safe to call before connect. */
  subscribeToGame(gameId: string): void {
    this.subscribedGameId = gameId;
    if (this.client.connected) {
      this._subscribeToGame(gameId);
    }
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  createGame(gameId: string, players: ParquesPlayerInfo[]): void {
    this._publish("/app/game/create", { gameId, players });
  }

  joinGame(gameId: string, playerId: string, playerName: string): void {
    this._publish(`/app/game/${gameId}/join`, { gameId, playerId, playerName });
  }

  startGame(gameId: string): void {
    this._publish(`/app/game/${gameId}/start`, {});
  }

  rollDice(gameId: string, playerId: string): void {
    this._publish(`/app/game/${gameId}/roll`, { playerId });
  }

  movePiece(gameId: string, move: ParquesMove): void {
    this._publish(`/app/game/${gameId}/move`, move);
  }

  passTurn(gameId: string, playerId: string): void {
    this._publish(`/app/game/${gameId}/pass`, { playerId });
  }

  exitJail(gameId: string, playerId: string): void {
    this._publish(`/app/game/${gameId}/exitJail`, { playerId });
  }

  addBot(gameId: string, difficulty: string): void {
    this._publish(`/app/game/${gameId}/addBot`, { difficulty });
  }

  leaveGame(gameId: string): void {
    this._publish(`/app/game/${gameId}/leave`, {});
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private _publish(destination: string, body: unknown): void {
    if (!this.client.connected) {
      console.warn(`[ParquesSocket] publish ignored (not connected): ${destination}`);
      return;
    }
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  private _subscribeToGame(gameId: string): void {
    this.gameSub?.unsubscribe();
    this.gameSub = this.client.subscribe(
      `/exchange/amq.topic/game.${gameId}`,
      (message: IMessage) => {
        if (!message.body) return;
        try {
          this.opts.onGameState?.(JSON.parse(message.body) as BackendGameState);
        } catch (e) {
          console.error("[ParquesSocket] bad game payload:", e);
        }
      }
    );
  }

  private _subscribeErrors(): void {
    this.errorSub?.unsubscribe();
    this.errorSub = this.client.subscribe(
      "/exchange/amq.topic/errors",
      (message: IMessage) => {
        if (!message.body) return;
        try {
          this.opts.onError?.(JSON.parse(message.body) as BackendError);
        } catch (e) {
          console.error("[ParquesSocket] bad error payload:", e);
        }
      }
    );
  }

  private _clearSubs(): void {
    this.gameSub?.unsubscribe();
    this.errorSub?.unsubscribe();
    this.gameSub = null;
    this.errorSub = null;
  }
}
