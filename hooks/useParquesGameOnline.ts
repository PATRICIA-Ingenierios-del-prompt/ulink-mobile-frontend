/**
 * Parques Online Game Hook — manages real-time game state via WebSocket.
 * Falls back to useParquesGame (local) when no gameId is provided.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ParquesSocket,
  type BackendGameState,
  type BackendPiece,
} from "../services/parquesSocket";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Piece {
  id: number;
  player: number;
  trackPos: number; // -1 = jail, 0–67 = track, 100 = finished
}

export interface OnlineGameState {
  currentPlayer: number;
  dice: [number, number];
  rolling: boolean;
  hasDiced: boolean;
  pieces: Piece[];
  winner: number | null;
  log: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAYER_NAMES = ["Tú", "Felipe", "Sofía", "Andrés"];
const INITIAL_PIECES: Piece[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  player: Math.floor(i / 4),
  trackPos: -1,
}));

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useParquesGameOnline(gameId: string | null, myPlayerId: string) {
  const [gameState, setGameState] = useState<OnlineGameState>({
    currentPlayer: 0,
    dice: [1, 1],
    rolling: false,
    hasDiced: false,
    pieces: INITIAL_PIECES,
    winner: null,
    log: ["Conectando al juego..."],
  });

  const socketRef = useRef<ParquesSocket | null>(null);

  // Map backend state → frontend state
  const mapState = useCallback(
    (backend: BackendGameState): OnlineGameState => {
      // Find the index of my player
      const myIndex = backend.players.findIndex(
        (p) => p.playerId === myPlayerId
      );

      // Map pieces: backend has flat positions, we need track positions
      const pieces: Piece[] = [];
      backend.players.forEach((player, playerIdx) => {
        player.pieces.forEach((bp: BackendPiece) => {
          let trackPos = -1; // jail by default
          if (bp.position > 0) {
            trackPos = bp.position;
          } else if (bp.position === 0) {
            // Position 0 might mean on the track
            trackPos = 0;
          }
          pieces.push({
            id: parseInt(bp.pieceId, 10),
            player: playerIdx,
            trackPos,
          });
        });
      });

      // Map current player
      const currentBackendIdx = backend.players.findIndex(
        (p) => p.playerId === backend.currentPlayerId
      );
      const currentPlayer =
        currentBackendIdx >= 0
          ? (currentBackendIdx - myIndex + 4) % 4
          : 0;

      const winnerIdx = backend.winnerId
        ? backend.players.findIndex((p) => p.playerId === backend.winnerId)
        : -1;

      return {
        currentPlayer,
        dice: [backend.dice1, backend.dice2],
        rolling: false,
        hasDiced: backend.dice1 > 0 || backend.dice2 > 0,
        pieces,
        winner: winnerIdx >= 0 ? (winnerIdx - myIndex + 4) % 4 : null,
        log: backend.message
          ? [backend.message]
          : ["Tu turno — tira los dados"],
      };
    },
    [myPlayerId]
  );

  // Connect and subscribe
  useEffect(() => {
    if (!gameId) return;

    const socket = new ParquesSocket({
      onGameState: (state) => {
        const mapped = mapState(state);
        setGameState(mapped);
      },
      onError: (err) => {
        console.log("[useParquesGameOnline] Error:", err);
        setGameState((prev) => ({
          ...prev,
          log: [...prev.log, `Error: ${err.message || "Error del servidor"}`],
        }));
      },
    });

    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId, mapState]);

  // Subscribe to game after connection
  useEffect(() => {
    if (gameId && socketRef.current?.connected) {
      socketRef.current.subscribeToGame(gameId);
    }
  }, [gameId]);

  const rollDice = useCallback(() => {
    if (!gameId || !socketRef.current) return;
    socketRef.current.rollDice(gameId, myPlayerId);
  }, [gameId, myPlayerId]);

  const movePiece = useCallback(
    (piece: Piece) => {
      if (!gameId || !socketRef.current) return;
      socketRef.current.movePiece(gameId, {
        playerId: myPlayerId,
        pieceId: String(piece.id),
        diceSelection: [gameState.dice[0], gameState.dice[1]],
      });
    },
    [gameId, myPlayerId, gameState.dice]
  );

  const skipTurn = useCallback(() => {
    if (!gameId || !socketRef.current) return;
    socketRef.current.skipTurn(gameId, myPlayerId);
  }, [gameId, myPlayerId]);

  const createGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.createGame({
      playerId: myPlayerId,
      playerName: PLAYER_NAMES[0],
    });
  }, [myPlayerId]);

  const addBot = useCallback(
    (difficulty: string) => {
      if (!gameId || !socketRef.current) return;
      socketRef.current.addBot(gameId, difficulty);
    },
    [gameId]
  );

  const startGame = useCallback(() => {
    if (!gameId || !socketRef.current) return;
    socketRef.current.startGame(gameId);
  }, [gameId]);

  return useMemo(
    () => ({
      ...gameState,
      isMyTurn: gameState.currentPlayer === 0,
      diceSum: gameState.dice[0] + gameState.dice[1],
      isDouble: gameState.dice[0] === gameState.dice[1],
      playerNames: PLAYER_NAMES,
      rollDice,
      movePiece,
      skipTurn,
      createGame,
      addBot,
      startGame,
      connected: socketRef.current?.connected ?? false,
    }),
    [gameState, rollDice, movePiece, skipTurn, createGame, addBot, startGame]
  );
}
