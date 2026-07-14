import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { P_COLORS, hexA } from "../../constants/parques";

interface Props {
  player: number;
  size: number;
  movable?: boolean;
  onPress?: () => void;
}

export function ParquesPiece({ player, size, movable, onPress }: Props) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (movable) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 0;
    }
  }, [movable, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: movable ? 0.3 + pulse.value * 0.5 : 0.2,
    shadowRadius: movable ? 4 + pulse.value * 6 : 4,
    transform: [{ scale: movable ? 1 + pulse.value * 0.08 : 1 }],
  }));

  const col = P_COLORS[player];

  return (
    <Pressable onPress={movable ? onPress : undefined} disabled={!movable}>
      <Animated.View
        style={[
          styles.piece,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: col,
            shadowColor: col,
            borderColor: "rgba(255,255,255,0.9)",
          },
          animatedStyle,
        ]}
      >
        {/* Inner highlight dot */}
        <Animated.View
          style={[
            styles.highlight,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  piece: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  highlight: {
    position: "absolute",
    top: "18%",
    left: "18%",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
