import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { P_COLORS, hexA } from "../../constants/parques";
import { ParquesPiece } from "./ParquesPiece";
import type { Piece } from "../../hooks/useParquesGame";

interface Props {
  playerIndex: number;
  playerName: string;
  isActive: boolean;
  pieces: Piece[];
  cellSize: number;
  onPiecePress: (piece: Piece) => void;
  isMovable: (piece: Piece) => boolean;
}

// Corner layout metadata
const CORNER_META = [
  { top: 0, left: 0, radiusTR: 0, emoji: "🎮" },
  { top: 0, right: 0, radiusTL: 0, emoji: "🎨" },
  { bottom: 0, left: 0, radiusBR: 0, emoji: "🔬" },
  { bottom: 0, right: 0, radiusBL: 0, emoji: "🎧" },
];

export function ParquesCorner({
  playerIndex,
  playerName,
  isActive,
  pieces,
  cellSize,
  onPiecePress,
  isMovable,
}: Props) {
  const col = P_COLORS[playerIndex];
  const meta = CORNER_META[playerIndex];
  const jailed = pieces.filter((p) => p.player === playerIndex && p.trackPos === -1);
  const cornerSize = cellSize * 8;

  return (
    <View
      style={[
        styles.container,
        {
          width: cornerSize,
          height: cornerSize,
          ...(meta.top !== undefined ? { top: meta.top } : {}),
          ...(meta.bottom !== undefined ? { bottom: meta.bottom } : {}),
          ...(meta.left !== undefined ? { left: meta.left } : {}),
          ...(meta.right !== undefined ? { right: meta.right } : {}),
          borderTopLeftRadius: meta.radiusTL ?? 14,
          borderTopRightRadius: meta.radiusTR ?? 14,
          borderBottomLeftRadius: meta.radiusBL ?? 14,
          borderBottomRightRadius: meta.radiusBR ?? 14,
          backgroundColor: hexA(col, 0.12),
        },
      ]}
    >
      {/* Glow overlay */}
      <View
        style={[
          styles.glow,
          {
            shadowColor: col,
            shadowOpacity: isActive ? 0.4 : 0.18,
          },
        ]}
      />

      {/* Player label */}
      <View style={[styles.label, { backgroundColor: hexA(col, 0.16), borderColor: hexA(col, 0.5) }]}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <Text style={[styles.name, { color: "#fff" }]} numberOfLines={1}>
          {playerName}
        </Text>
      </View>

      {/* Active turn badge */}
      {isActive && (
        <View style={[styles.turnBadge, { backgroundColor: col }]}>
          <View style={styles.turnDot} />
          <Text style={styles.turnText}>TURNO</Text>
        </View>
      )}

      {/* Piece slots (2×2 grid) */}
      <View style={styles.slotsGrid}>
        {[0, 1, 2, 3].map((i) => {
          const piece = jailed[i];
          return (
            <View key={i} style={styles.slotCell}>
              {piece ? (
                <ParquesPiece
                  player={piece.player}
                  size={cornerSize * 0.22}
                  movable={isMovable(piece)}
                  onPress={() => onPiecePress(piece)}
                />
              ) : (
                <View
                  style={[
                    styles.emptySlot,
                    {
                      width: cornerSize * 0.22,
                      height: cornerSize * 0.22,
                      borderRadius: (cornerSize * 0.22) / 2,
                      borderColor: hexA(col, 0.5),
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "hidden",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
  },
  label: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  emoji: { fontSize: 12 },
  name: { fontSize: 11, fontWeight: "700" },
  turnBadge: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  turnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  turnText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  slotsGrid: {
    position: "absolute",
    bottom: "15%",
    left: "15%",
    right: "15%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  slotCell: {
    width: "45%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptySlot: {
    borderWidth: 2,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
});
