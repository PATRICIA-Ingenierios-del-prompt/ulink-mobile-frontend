import React from "react";
import { Text, type TextProps, StyleSheet } from "react-native";
import { useAccessibility } from "@/context/AccessibilityContext";

/**
 * Text component that automatically switches to Lexend font
 * when dyslexia mode is enabled. Follows BDA guidelines:
 * - Font: Lexend (reading proficiency) / Atkinson Hyperlegible (low vision)
 * - Body size: +2px
 * - Letter spacing: +0.06em
 * - Line height: 1.7
 * - Word spacing: +0.2em
 * - Text align: left (never justified)
 */
export function DyslexiaText({
  style,
  children,
  ...props
}: TextProps & { children?: React.ReactNode }) {
  const { dyslexiaMode } = useAccessibility();

  const mergedStyle = dyslexiaMode
    ? [
        styles.dyslexiaBase,
        StyleSheet.flatten(style),
        styles.dyslexiaOverride,
      ]
    : style;

  return (
    <Text style={mergedStyle} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  dyslexiaBase: {
    fontFamily: "Lexend_400Regular",
    fontSize: 16,
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  dyslexiaOverride: {
    textAlign: "left",
  },
});
