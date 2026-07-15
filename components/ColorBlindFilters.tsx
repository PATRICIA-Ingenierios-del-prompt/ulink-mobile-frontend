import React from "react";
import { Platform, View } from "react-native";
import Svg, { Defs, FeColorMatrix, Filter } from "react-native-svg";
import { useAccessibility, VISION_MATRICES, type VisionMode } from "@/context/AccessibilityContext";

// SVG filter IDs matching the web frontend
const FILTER_IDS: Record<VisionMode, string> = {
  normal: "",
  protanopia: "cb-protanopia",
  deuteranopia: "cb-deuteranopia",
  tritanopia: "cb-tritanopia",
};

/**
 * Hidden SVG filter definitions. Render once at the app root.
 * On web, the filter is applied via CSS filter: url(#cb-*).
 * On native, we wrap children in a View with the SVG filter applied.
 */
export function ColorBlindFilterDefs() {
  return (
    <View style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}>
      <Svg width={0} height={0}>
        <Defs>
          {(["protanopia", "deuteranopia", "tritanopia"] as VisionMode[]).map(
            (mode) => (
              <Filter id={FILTER_IDS[mode]} key={mode}>
                <FeColorMatrix
                  type="matrix"
                  values={VISION_MATRICES[mode].join(" ")}
                />
              </Filter>
            )
          )}
        </Defs>
      </Svg>
    </View>
  );
}

/**
 * Wrapper that applies the active color blindness filter to its children.
 * On web: applies CSS filter property.
 * On native: wraps in a View that receives the SVG filter.
 */
export function ColorBlindFilterWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { visionMode } = useAccessibility();

  if (visionMode === "normal") {
    return <>{children}</>;
  }

  if (Platform.OS === "web") {
    // On web, use CSS filter property (same as the web frontend)
    return (
      <View style={{ filter: `url(#${FILTER_IDS[visionMode]})` } as any}>
        {children}
      </View>
    );
  }

  // On native, we can't apply SVG filters to an entire View tree.
  // Instead, we rely on the accessibility context for components
  // that need color-adjusted values. The SVG filter defs are available
  // for individual SVG elements that want to use them.
  return <>{children}</>;
}
