import React from "react";
import { View, StyleSheet } from "react-native";
import { P_COLORS, hexA } from "../../constants/parques";

interface Props {
  size: number;
}

export function ParquesCenter({ size }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 4 colored quadrants meeting at center */}
      <View style={[styles.quadrant, styles.topLeft, { backgroundColor: hexA(P_COLORS[0], 0.7) }]} />
      <View style={[styles.quadrant, styles.topRight, { backgroundColor: hexA(P_COLORS[1], 0.7) }]} />
      <View style={[styles.quadrant, styles.bottomRight, { backgroundColor: hexA(P_COLORS[3], 0.7) }]} />
      <View style={[styles.quadrant, styles.bottomLeft, { backgroundColor: hexA(P_COLORS[2], 0.7) }]} />

      {/* Center medallion */}
      <View style={styles.medallion}>
        <View style={styles.medallionInner}>
          <View style={styles.pBadge}>
            <View style={styles.pText} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  quadrant: {
    position: "absolute",
    width: "50%",
    height: "50%",
  },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0 },
  bottomRight: { bottom: 0, right: 0 },
  bottomLeft: { bottom: 0, left: 0 },
  medallion: {
    position: "absolute",
    alignSelf: "center",
    top: "25%",
    width: "50%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "#6C63FF",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  medallionInner: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  pBadge: {
    width: "60%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "#8a7bff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
  },
  pText: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
});
