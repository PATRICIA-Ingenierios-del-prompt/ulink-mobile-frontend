import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type VisionMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

interface AccessibilityState {
  visionMode: VisionMode;
  setVisionMode: (m: VisionMode) => void;
  dyslexiaMode: boolean;
  setDyslexiaMode: (v: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityState>({
  visionMode: "normal",
  setVisionMode: () => {},
  dyslexiaMode: false,
  setDyslexiaMode: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [visionMode, setVisionMode] = useState<VisionMode>("normal");
  const [dyslexiaMode, setDyslexiaMode] = useState(false);

  return (
    <AccessibilityContext.Provider
      value={{ visionMode, setVisionMode, dyslexiaMode, setDyslexiaMode }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// ── Color Blindness Matrices (Brettel et al. 1997, Vienot et al. 1999) ──

// Row-major 4x5 matrices: [R', G', B', A', offset] per channel
// These are approximate simulation matrices for color vision deficiencies.
export const VISION_MATRICES: Record<VisionMode, number[]> = {
  normal: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  protanopia: [
    0.56667, 0.43333, 0, 0, 0,
    0.55833, 0.44167, 0, 0, 0,
    0, 0.24167, 0.75833, 0, 0,
    0, 0, 0, 1, 0,
  ],
  deuteranopia: [
    0.625, 0.375, 0, 0, 0,
    0.7, 0.3, 0, 0, 0,
    0, 0.3, 0.7, 0, 0,
    0, 0, 0, 1, 0,
  ],
  tritanopia: [
    0.95, 0.05, 0, 0, 0,
    0, 0.43333, 0.56667, 0, 0,
    0, 0.475, 0.525, 0, 0,
    0, 0, 0, 1, 0,
  ],
};

// Helper: get feColorMatrix values string for SVG
export function getFilterValues(mode: VisionMode): string {
  if (mode === "normal") return "";
  const m = VISION_MATRICES[mode];
  // feColorMatrix type="matrix" values = 20 numbers in row-major order
  return m.join(" ");
}
