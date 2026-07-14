import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { DOTS, P_COLORS } from "../../constants/parques";

interface Props {
  value: number;
  rolling: boolean;
  colorIndex: number;
  size?: number;
}

export function ParquesDice({ value, rolling, colorIndex, size = 44 }: Props) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (rolling) {
      rotate.value = 0;
      scale.value = 1;
      rotate.value = withRepeat(
        withTiming(360, { duration: 450 }),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 225 }),
          withTiming(0.9, { duration: 225 })
        ),
        -1,
        false
      );
    } else {
      rotate.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [rolling, rotate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const col = P_COLORS[colorIndex];
  const dots = DOTS[value] || DOTS[1];
  const pipR = 9;

  return (
    <Animated.View
      style={[
        styles.dice,
        {
          width: size,
          height: size,
          borderColor: col,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size * 0.76} height={size * 0.76} viewBox="0 0 100 100">
        {dots.map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={pipR} fill={col} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dice: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 28, 48, 0.95)",
  },
});
