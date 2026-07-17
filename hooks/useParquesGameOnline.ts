/**
 * Parqués Online Game Hook — real-time game state over WebSocket/STOMP.
 *
 * Maps the backend `GameResponse` (PATRICIA_Parques_Backend) onto the same
 * shape the local `useParquesGame` hook exposes, so `ParquesBoard` renders both
 * transparently. The board works in absolute backend player order (index 0..3
 * by join order); `myIndex` marks which of those slots is the local player.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ParquesSocket,
  type BackendGameState,
  type DiceSelection,
} from "../services/parquesSocket";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Piece {
  id: number;
  player: number;
  trackPos: number; // -1 = jail, 0–67 = common ring, 68–99 = home stretch (hidden), 100 = finished
}

interface PieceRef {
  backendId: string;
  backendPlayerId: string;
}

interface Control {
  diceRolled: boolean;
  die1Used: boolean;
  die2Used: boolean;
  jailExitAvailable: boolean;
}

export interface OnlineGameState {
  currentPlayer: number;
  dice: [number, number];
  rolling: boolean;
  hasDiced: boolean;
  pieces: Piece[];
  winner: number | null;
  log: string[];
  isMyTurn: boolean;
  playerNames: string[];
  myIndex: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LADDER_START = 63; // relativePosition where the private home stretch begins
const INITIAL_PIECES: Piece[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  player: Math.floor(i / 4),
  trackPos: -1,
}));

const INITIAL_STATE: OnlineGameState = {
  currentPlayer: 0,
  dice: [1, 1],
  rolling: false,
  hasDiced: false,
  pieces: INITIAL_PIECES,
  winner: null,
  log: ["Conectando al juego…"],
  isMyTurn: false,
  playerNames: ["", "", "", ""],
  myIndex: 0,
};

// ── Pure mapping ────────────────────────────────────────────────────────────────

function pieceSuffix(backendId: string): number {
  const n = parseInt(backendId.slice(backendId.lastIndexOf("-") + 1), 10);
  return Number.isNaN(n) ? 0 : n;
}

function relativeToTrackPos(
  inJail: boolean,
  atHome: boolean,
  absolutePosition: number,
  relativePosition: number
): number {
  if (inJail) return -1;
  if (atHome) return 100;
  if (relativePosition < LADDER_START) return absolutePosition; // common ring 0..67
  // Home stretch: not representable on the shared ring — keep >67 & <100 so the
  // board hides it (getBoardPos returns null) without counting it as finished.
  return 68 + (relativePosition - LADDER_START);
}

function mapBackendState(
  backend: BackendGameState,
  myPlayerId: string
): { state: Omit<OnlineGameState, "log">; refs: Map<number, PieceRef>; control: Control } {
  const refs = new Map<number, PieceRef>();
  const pieces: Piece[] = [];

  backend.players.forEach((player, playerIdx) => {
    player.pieces.forEach((bp) => {
      const numericId = playerIdx * 4 + pieceSuffix(bp.id);
      refs.set(numericId, { backendId: bp.id, backendPlayerId: player.id });
      pieces.push({
        id: numericId,
        player: playerIdx,
        trackPos: relativeToTrackPos(
          bp.inJail,
          bp.atHome,
          bp.absolutePosition,
          bp.relativePosition
        ),
      });
    });
  });

  const currentRaw = backend.players.findIndex(
    (p) => p.id === backend.currentPlayerId
  );
  const currentPlayer = currentRaw >= 0 ? currentRaw : 0;
  const myIndex = backend.players.findIndex((p) => p.id === myPlayerId);
  const winnerIdx = backend.winnerId
    ? backend.players.findIndex((p) => p.id === backend.winnerId)
    : -1;

  const playerNames = [0, 1, 2, 3].map(
    (i) => backend.players[i]?.name ?? ""
  );

  return {
    state: {
      currentPlayer,
      dice: [backend.die1, backend.die2],
      rolling: false,
      hasDiced: backend.diceRolled,
      pieces,
      winner: winnerIdx >= 0 ? winnerIdx : null,
      isMyTurn:
        backend.players[currentPlayer]?.id === myPlayerId && myPlayerId !== "",
      playerNames,
      myIndex: myIndex >= 0 ? myIndex : 0,
    },
    refs,
    control: {
      diceRolled: backend.diceRolled,
      die1Used: backend.die1Used,
      die2Used: backend.die2Used,
      jailExitAvailable: backend.jailExitAvailable,
    },
  };
}

function statusLine(state: Omit<OnlineGameState, "log">): string {
  const name = state.playerNames[state.currentPlayer] || "Jugador";
  if (state.winner !== null) {
    return `¡${state.playerNames[state.winner] || "Jugador"} GANÓ!`;
  }
  if (state.hasDiced) {
    return `${name} sacó ${state.dice[0]}+${state.dice[1]}`;
  }
  return `Turno de ${name}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useParquesGameOnline(
  gameId: string | null,
  myPlayerId: string,
  myPlayerName = "Jugador"
) {
  const [gameState, setGameState] = useState<OnlineGameState>(INITIAL_STATE);

  const socketRef = useRef<ParquesSocket | null>(null);
  const refsRef = useRef<Map<number, PieceRef>>(new Map());
  const controlRef = useRef<Control>({
    diceRolled: false,
    die1Used: false,
    die2Used: false,
    jailExitAvailable: false,
  });

  const appendLog = useCallback((line: string) => {
    setGameState((prev) =>
      prev.log[prev.log.length - 1] === line
        ? prev
        : { ...prev, log: [...prev.log.slice(-12), line] }
    );
  }, []);

  useEffect(() => {
    if (!gameId || !myPlayerId) return;

    const socket = new ParquesSocket({
      onConnect: () => {
        socket.subscribeToGame(gameId);
        socket.joinGame(gameId, myPlayerId, myPlayerName);
        appendLog("Conectado — esperando jugadores");
      },
      onDisconnect: () => appendLog("Conexión perdida — reintentando…"),
      onGameState: (backend) => {
        const { state, refs, control } = mapBackendState(backend, myPlayerId);
        refsRef.current = refs;
        controlRef.current = control;
        setGameState((prev) => {
          const line = statusLine(state);
          const log =
            prev.log[prev.log.length - 1] === line
              ? prev.log
              : [...prev.log.slice(-12), line];
          return { ...state, log };
        });
      },
      onError: (err) => appendLog(`Error: ${err.error ?? "servidor"}`),
    });

    socketRef.current = socket;
    socket.activate();

    return () => {
      void socket.deactivate();
      socketRef.current = null;
    };
  }, [gameId, myPlayerId, myPlayerName, appendLog]);

  const rollDice = useCallback(() => {
    if (!gameId) return;
    socketRef.current?.rollDice(gameId, myPlayerId);
  }, [gameId, myPlayerId]);

  const movePiece = useCallback(
    (piece: Piece) => {
      if (!gameId) return;
      const ref = refsRef.current.get(piece.id);
      if (!ref) return;
      const { die1Used, die2Used, jailExitAvailable } = controlRef.current;

      // Jailed piece: leaving jail is a dedicated command and only works on a
      // pair (jailExitAvailable). Ignore taps otherwise so we never send a move
      // the backend will reject.
      if (piece.trackPos === -1) {
        if (jailExitAvailable) {
          socketRef.current?.exitJail(gameId, myPlayerId);
        }
        return;
      }

      // Prefer the sum when both dice are free (matches the single-move UX);
      // otherwise consume whichever die is still available.
      const selection: DiceSelection =
        !die1Used && !die2Used ? 3 : !die1Used ? 1 : 2;

      socketRef.current?.movePiece(gameId, {
        playerId: myPlayerId,
        pieceId: ref.backendId,
        diceSelection: selection,
      });
    },
    [gameId, myPlayerId]
  );

  const skipTurn = useCallback(() => {
    if (!gameId) return;
    socketRef.current?.passTurn(gameId, myPlayerId);
  }, [gameId, myPlayerId]);

  const createGame = useCallback(() => {
    if (!gameId) return;
    socketRef.current?.createGame(gameId, [
      { id: myPlayerId, name: myPlayerName },
    ]);
  }, [gameId, myPlayerId, myPlayerName]);

  const addBot = useCallback(
    (difficulty: string) => {
      if (!gameId) return;
      socketRef.current?.addBot(gameId, difficulty);
    },
    [gameId]
  );

  const startGame = useCallback(() => {
    if (!gameId) return;
    socketRef.current?.startGame(gameId);
  }, [gameId]);

  return useMemo(
    () => ({
      pieces: gameState.pieces,
      currentPlayer: gameState.currentPlayer,
      dice: gameState.dice,
      rolling: gameState.rolling,
      hasDiced: gameState.hasDiced,
      isDouble: gameState.dice[0] === gameState.dice[1],
      diceSum: gameState.dice[0] + gameState.dice[1],
      winner: gameState.winner,
      log: gameState.log,
      isMyTurn: gameState.isMyTurn,
      playerNames: gameState.playerNames,
      myIndex: gameState.myIndex,
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
