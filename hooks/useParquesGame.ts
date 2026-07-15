import { useState, useCallback, useRef, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Piece {
  id: number;       // 0–15
  player: number;   // 0–3
  trackPos: number; // -1 = jail, 0–67 = track, 100 = finished
}

export interface GameState {
  currentPlayer: number; // 0–3
  dice: [number, number];
  rolling: boolean;
  hasDiced: boolean;
  pieces: Piece[];
  winner: number | null;
  log: string[];
}

const INITIAL_PIECES: Piece[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  player: Math.floor(i / 4),
  trackPos: -1,
}));

const PLAYER_NAMES = ["Tú", "Felipe", "Sofía", "Andrés"];

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useParquesGame() {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [hasDiced, setHasDiced] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [winner, setWinner] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>(["Turno de Tú — tira los dados"]);

  const consecutiveTurns = useRef(0);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-12), msg]);
  }, []);

  const rollDice = useCallback(() => {
    if (rolling || hasDiced || winner !== null) return;
    setRolling(true);
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      setRolling(false);
      setHasDiced(true);
      const isDouble = d1 === d2;
      const name = PLAYER_NAMES[currentPlayer];
      addLog(`${name} sacó ${d1}+${d2}=${d1 + d2}${isDouble ? " ¡Doble!" : ""}`);
    }, 650);
  }, [rolling, hasDiced, winner, currentPlayer, addLog]);

  const movePiece = useCallback(
    (piece: Piece) => {
      if (!hasDiced || winner !== null || piece.player !== currentPlayer) return;
      const sum = dice[0] + dice[1];
      const isDouble = dice[0] === dice[1];

      setPieces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== piece.id) return p;
          // Jail: need double to exit
          if (p.trackPos === -1) {
            if (isDouble) {
              return { ...p, trackPos: 0 };
            }
            return p;
          }
          // Finished
          if (p.trackPos === 100) return p;
          // Move forward
          const next = p.trackPos + sum;
          if (next >= 68) {
            return { ...p, trackPos: 100 };
          }
          return { ...p, trackPos: next };
        });

        // Check win
        const playerPieces = updated.filter((p) => p.player === currentPlayer);
        if (playerPieces.every((p) => p.trackPos === 100)) {
          setWinner(currentPlayer);
          addLog(`¡${PLAYER_NAMES[currentPlayer]} GANÓ!`);
        }

        return updated;
      });

      // Advance turn
      setHasDiced(false);
      if (isDouble) {
        consecutiveTurns.current += 1;
        if (consecutiveTurns.current >= 3) {
          consecutiveTurns.current = 0;
          addLog(`¡3 dobles seguidos! ${PLAYER_NAMES[currentPlayer]} pierde turno`);
          setCurrentPlayer((c) => (c + 1) % 4);
        } else {
          addLog(`¡Doble! ${PLAYER_NAMES[currentPlayer]} tira de nuevo`);
        }
      } else {
        consecutiveTurns.current = 0;
        const next = (currentPlayer + 1) % 4;
        setCurrentPlayer(next);
        addLog(`Turno de ${PLAYER_NAMES[next]} — tira los dados`);
      }
    },
    [hasDiced, dice, currentPlayer, winner, addLog]
  );

  const skipTurn = useCallback(() => {
    if (!hasDiced) return;
    setHasDiced(false);
    consecutiveTurns.current = 0;
    const next = (currentPlayer + 1) % 4;
    setCurrentPlayer(next);
    addLog(`Turno de ${PLAYER_NAMES[next]} — tira los dados`);
  }, [hasDiced, currentPlayer, addLog]);

  const resetGame = useCallback(() => {
    setCurrentPlayer(0);
    setDice([1, 1]);
    setRolling(false);
    setHasDiced(false);
    setPieces(INITIAL_PIECES);
    setWinner(null);
    setLog(["Turno de Tú — tira los dados"]);
    consecutiveTurns.current = 0;
  }, []);

  const isMyTurn = currentPlayer === 0;
  const diceSum = dice[0] + dice[1];
  const isDouble = dice[0] === dice[1];

  return useMemo(
    () => ({
      pieces,
      currentPlayer,
      dice,
      rolling,
      hasDiced,
      isDouble,
      diceSum,
      winner,
      log,
      isMyTurn,
      playerNames: PLAYER_NAMES,
      rollDice,
      movePiece,
      skipTurn,
      resetGame,
    }),
    [pieces, currentPlayer, dice, rolling, hasDiced, isDouble, diceSum, winner, log, isMyTurn, rollDice, movePiece, skipTurn, resetGame]
  );
}
