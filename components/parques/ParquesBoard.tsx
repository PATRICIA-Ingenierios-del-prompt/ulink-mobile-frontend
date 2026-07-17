import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ParquesPiece, ParquesDice, ParquesCorner } from "./";
import { useParquesGame } from "../../hooks/useParquesGame";
import { useParquesGameOnline } from "../../hooks/useParquesGameOnline";
import {
  TRACK, P_COLORS, SAFES, STARTS, ARROW_DIR, HOME_COLOR,
  inArm, hexA,
} from "../../constants/parques";

const GRID = 19;

interface ParquesBoardProps {
  gameId?: string | null;
  myPlayerId?: string;
  myPlayerName?: string;
}

// Triangle clip-paths as React Native View borders
const TRIANGLE_CLIPS: Record<string, { w: string; h: string; style: object }> = {
  down:  { w: "34%", h: "34%", style: { borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 6, borderTopWidth: 0 } },
  up:    { w: "34%", h: "34%", style: { borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 6 } },
  right: { w: "34%", h: "34%", style: { borderLeftWidth: 0, borderRightWidth: 6, borderBottomWidth: 0, borderTopWidth: 0 } },
  left:  { w: "34%", h: "34%", style: { borderLeftWidth: 6, borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 0 } },
};

export function ParquesBoard({ gameId, myPlayerId, myPlayerName }: ParquesBoardProps) {
  const insets = useSafeAreaInsets();
  const [boardWidth, setBoardWidth] = useState(0);
  const cellSize = boardWidth / GRID;

  // Use online game if gameId + myPlayerId are provided, otherwise local mock
  const onlineGame = useParquesGameOnline(
    gameId ?? null,
    myPlayerId ?? "",
    myPlayerName ?? "Jugador"
  );
  const localGame = useParquesGame();

  const game = gameId && myPlayerId ? onlineGame : localGame;

  // Which player slot is "me" (online rotates by join order; local mock is 0).
  const myIndex = "myIndex" in game ? game.myIndex : 0;

  const {
    pieces, currentPlayer, dice, rolling, hasDiced, isDouble, diceSum,
    winner, log, isMyTurn, playerNames, rollDice, movePiece, skipTurn,
  } = game;

  const resetGame = "resetGame" in game ? game.resetGame : undefined;

  const getBoardPos = useCallback(
    (piece: { player: number; trackPos: number }): [number, number] | null => {
      if (piece.trackPos < 0 || piece.trackPos > 67) return null;
      return TRACK[(piece.trackPos) % 68]; // START_POS baked into piece logic
    },
    []
  );

  const isMovable = useCallback(
    (p: { player: number; trackPos: number }) =>
      p.player === currentPlayer && isMyTurn && hasDiced && winner === null,
    [currentPlayer, isMyTurn, hasDiced, winner]
  );

  // ── Board layout ──

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setBoardWidth(e.nativeEvent.layout.width);
  }, []);

  const boardSide = boardWidth;

  // Render a single path cell
  const renderCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    const arm = inArm(r, c);
    if (!arm) return null;

    let bgColor = "transparent";
    let shadow: object | undefined;
    let child: React.ReactNode = null;

    const isHome =
      (arm === "top" && c === 9) ||
      (arm === "bottom" && c === 9) ||
      (arm === "left" && r === 9) ||
      (arm === "right" && r === 9);

    if (isHome) {
      const col = HOME_COLOR[arm];
      bgColor = hexA(col, 0.25);
      shadow = { shadowColor: col, shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } };
      // Arrow indicator
      if (ARROW_DIR[key]) {
        child = (
          <View style={[styles.arrow, { backgroundColor: "rgba(255,255,255,0.8)" }]}>
            <View style={{
              width: 0, height: 0,
              ...(ARROW_DIR[key] === "down"
                ? { borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "rgba(15,14,26,0.8)" }
                : ARROW_DIR[key] === "up"
                ? { borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "rgba(15,14,26,0.8)" }
                : ARROW_DIR[key] === "right"
                ? { borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "rgba(15,14,26,0.8)" }
                : { borderTopWidth: 4, borderBottomWidth: 4, borderRightWidth: 6, borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: "rgba(15,14,26,0.8)" }),
            }} />
          </View>
        );
      }
    } else if (STARTS[key]) {
      const col = STARTS[key];
      bgColor = hexA(col, 0.85);
      shadow = { shadowColor: col, shadowOpacity: 0.75, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } };
      child = <View style={styles.startDot} />;
    } else if (SAFES.has(key)) {
      bgColor = "rgba(255,255,255,0.12)";
      child = (
        <View style={styles.starContainer}>
          <View style={styles.starShape} />
        </View>
      );
    }

    // Pieces on this cell
    const cellPieces = pieces.filter((p) => {
      const pos = getBoardPos(p);
      return pos && pos[0] === r && pos[1] === c;
    });

    return (
      <View
        key={key}
        style={[
          styles.cell,
          {
            left: (c / GRID) * boardSide,
            top: (r / GRID) * boardSide,
            width: cellSize,
            height: cellSize,
            backgroundColor: bgColor,
          },
          shadow,
        ]}
      >
        {child}
        {cellPieces.length > 0 && (
          <View style={styles.cellPiecesWrap}>
            {cellPieces.slice(0, 4).map((piece) => (
              <ParquesPiece
                key={piece.id}
                player={piece.player}
                size={cellPieces.length > 2 ? cellSize * 0.55 : cellSize * 0.8}
                movable={isMovable(piece)}
                onPress={() => movePiece(piece)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render all path cells
  const pathCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = renderCell(r, c);
        if (cell) cells.push(cell);
      }
    }
    return cells;
  }, [pieces, boardSide, cellSize, currentPlayer, hasDiced, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusText = (() => {
    if (winner !== null) return `${playerNames[winner]} ganó`;
    if (!isMyTurn) return `Turno de ${playerNames[currentPlayer]}`;
    if (hasDiced) return `Toca ficha para mover ${diceSum}`;
    return "Tú — tira los dados";
  })();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Player tabs */}
      <View style={styles.tabsRow}>
        {playerNames.map((name, i) => {
          const done = pieces.filter((p) => p.player === i && p.trackPos === 100).length;
          const active = currentPlayer === i;
          return (
            <View
              key={i}
              style={[
                styles.playerTab,
                active && { backgroundColor: hexA(P_COLORS[i], 0.18), borderColor: P_COLORS[i] },
              ]}
            >
              <View style={[styles.tabDot, { backgroundColor: P_COLORS[i] }]} />
              <Text
                style={[styles.tabName, active && { color: P_COLORS[i], fontWeight: "700" }]}
                numberOfLines={1}
              >
                {name}{i === myIndex ? " (Tú)" : ""}
              </Text>
              {done > 0 && <Text style={[styles.tabDone, { color: P_COLORS[i] }]}>{done}/4</Text>}
            </View>
          );
        })}
      </View>

      {/* Board */}
      <View style={styles.boardContainer} onLayout={onLayout}>
        {boardSide > 0 && (
          <>
            {/* Background */}
            <View style={[styles.boardBg, { width: boardSide, height: boardSide }]} />

            {/* Path cells */}
            {pathCells}

            {/* Corners (each 8 cells wide) */}
            <ParquesCorner
              playerIndex={0} playerName={playerNames[0]} isActive={currentPlayer === 0}
              pieces={pieces} cellSize={cellSize} onPiecePress={movePiece} isMovable={isMovable}
            />
            <ParquesCorner
              playerIndex={1} playerName={playerNames[1]} isActive={currentPlayer === 1}
              pieces={pieces} cellSize={cellSize} onPiecePress={movePiece} isMovable={isMovable}
            />
            <ParquesCorner
              playerIndex={2} playerName={playerNames[2]} isActive={currentPlayer === 2}
              pieces={pieces} cellSize={cellSize} onPiecePress={movePiece} isMovable={isMovable}
            />
            <ParquesCorner
              playerIndex={3} playerName={playerNames[3]} isActive={currentPlayer === 3}
              pieces={pieces} cellSize={cellSize} onPiecePress={movePiece} isMovable={isMovable}
            />

            {/* Center pyramid */}
            <View style={[styles.center, { left: 8 * cellSize, top: 8 * cellSize, width: 3 * cellSize, height: 3 * cellSize }]}>
              <View style={[styles.pyramidTri, styles.pyramidTop, { backgroundColor: hexA(P_COLORS[0], 0.7) }]} />
              <View style={[styles.pyramidTri, styles.pyramidRight, { backgroundColor: hexA(P_COLORS[1], 0.7) }]} />
              <View style={[styles.pyramidTri, styles.pyramidBottom, { backgroundColor: hexA(P_COLORS[3], 0.7) }]} />
              <View style={[styles.pyramidTri, styles.pyramidLeft, { backgroundColor: hexA(P_COLORS[2], 0.7) }]} />
            </View>

            {/* Center medallion */}
            <View style={[styles.medallion, { left: 8 * cellSize + (3 * cellSize) / 2 - cellSize * 0.8, top: 8 * cellSize + (3 * cellSize) / 2 - cellSize * 0.8, width: cellSize * 1.6, height: cellSize * 1.6 }]}>
              <View style={styles.medallionCircle}>
                <Text style={styles.medallionP}>P</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Status */}
      <View style={[styles.statusBar, { backgroundColor: hexA(P_COLORS[currentPlayer], 0.12), borderColor: hexA(P_COLORS[currentPlayer], 0.4) }]}>
        <Text style={[styles.statusText, { color: P_COLORS[currentPlayer] }]}>{statusText}</Text>
      </View>

      {/* Online game controls */}
      {gameId && "createGame" in game && (
        <View style={styles.onlineControls}>
          <Pressable style={styles.onlineBtn} onPress={(game as any).createGame}>
            <Text style={styles.onlineBtnText}>Crear partida</Text>
          </Pressable>
          <Pressable style={styles.onlineBtn} onPress={() => (game as any).addBot("MEDIUM")}>
            <Text style={styles.onlineBtnText}>Agregar bot</Text>
          </Pressable>
          <Pressable style={styles.onlineBtn} onPress={() => (game as any).startGame()}>
            <Text style={styles.onlineBtnText}>Iniciar</Text>
          </Pressable>
        </View>
      )}

      {/* Dice + Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.diceCard}>
          <View style={styles.diceRow}>
            <ParquesDice value={dice[0]} rolling={rolling} colorIndex={currentPlayer} />
            <ParquesDice value={dice[1]} rolling={rolling} colorIndex={currentPlayer} />
          </View>
          {isDouble && hasDiced && (
            <Text style={styles.doubleText}>¡Doble! +1 turno</Text>
          )}
          <Pressable
            style={[
              styles.rollBtn,
              { backgroundColor: isMyTurn && !hasDiced && !winner ? P_COLORS[currentPlayer] : "rgba(255,255,255,0.06)" },
              (rolling || !isMyTurn || hasDiced || winner !== null) && styles.rollBtnDisabled,
            ]}
            onPress={rollDice}
            disabled={rolling || !isMyTurn || hasDiced || winner !== null}
          >
            <Text style={[styles.rollBtnText, { color: isMyTurn && !hasDiced && !winner ? "#fff" : "rgba(255,255,255,0.4)" }]}>
              {rolling ? "Tirando…" : hasDiced && isMyTurn ? "✓ Tirado" : "Tirar dados"}
            </Text>
          </Pressable>
          {isMyTurn && hasDiced && winner === null && (
            <Pressable style={styles.skipBtn} onPress={skipTurn}>
              <Text style={styles.skipBtnText}>Pasar turno →</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.resetBtn} onPress={resetGame ?? (() => {})}>
          <Text style={[styles.resetBtnText, winner !== null && { color: "#0F0E1A" }]}>
            Nueva
          </Text>
        </Pressable>
      </View>

      {/* Log */}
      <View style={styles.logCard}>
        <Text style={styles.logTitle}>Historial</Text>
        {log.map((m, i) => (
          <Text key={i} style={[styles.logEntry, m.includes("Turno") && { color: "#7FE7C4" }, m.includes("GANÓ") && { color: "#FFB347" }]}>
            {m}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11,13,24,1)",
    alignItems: "center",
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  playerTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(90,90,104,0.4)",
  },
  tabDot: { width: 10, height: 10, borderRadius: 5 },
  tabName: { fontSize: 11, color: "rgba(90,90,104,1)" },
  tabDone: { fontSize: 10, fontWeight: "700" },

  boardContainer: {
    width: "92%",
    aspectRatio: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
  },
  boardBg: {
    position: "absolute",
    borderRadius: 14,
    backgroundColor: "rgba(21,18,42,1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  cell: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  cellPiecesWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    padding: 1,
    zIndex: 10,
  },

  startDot: {
    width: "30%",
    height: "30%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  starContainer: {
    width: "26%",
    height: "26%",
    alignItems: "center",
    justifyContent: "center",
  },
  starShape: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  arrow: {
    width: "34%",
    height: "34%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },

  // Center pyramid — 4 triangles via border trick
  center: {
    position: "absolute",
    overflow: "hidden",
  },
  pyramidTri: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  pyramidTop: { top: 0, left: 0, width: "100%", height: "50%", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  pyramidRight: { top: 0, right: 0, width: "50%", height: "100%", borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  pyramidBottom: { bottom: 0, left: 0, width: "100%", height: "50%" },
  pyramidLeft: { top: 0, left: 0, width: "50%", height: "100%" },

  medallion: {
    position: "absolute",
    zIndex: 6,
  },
  medallionCircle: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#6C63FF",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  medallionP: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },

  statusBar: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: "600" },

  controlsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    width: "100%",
  },
  diceCard: {
    flex: 1,
    backgroundColor: "rgba(21,18,42,0.9)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.25)",
    padding: 12,
    alignItems: "center",
  },
  diceRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  doubleText: { fontSize: 10, color: "#FFB347", fontWeight: "700", marginBottom: 6 },
  rollBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 6,
  },
  rollBtnDisabled: { opacity: 0.4 },
  rollBtnText: { fontSize: 13, fontWeight: "600" },
  skipBtn: {
    width: "100%",
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,179,71,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,179,71,0.25)",
    alignItems: "center",
  },
  skipBtnText: { fontSize: 11, color: "#FFB347" },

  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(108,99,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtnText: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.5)" },

  logCard: {
    width: "92%",
    marginTop: 10,
    backgroundColor: "rgba(21,18,42,0.9)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(90,90,104,0.3)",
    padding: 10,
    maxHeight: 120,
  },
  logTitle: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  logEntry: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(108,99,255,0.05)",
    marginBottom: 2,
  },
  onlineControls: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  onlineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(108,99,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    alignItems: "center",
  },
  onlineBtnText: {
    color: "rgba(129,140,248,1)",
    fontSize: 11,
    fontWeight: "600",
  },
});
