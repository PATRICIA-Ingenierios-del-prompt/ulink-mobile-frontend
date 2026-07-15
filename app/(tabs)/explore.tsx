import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/useTranslation";
import { matchingService, type SugerenciaResponse } from "@/services/matchingService";
import { userService } from "@/services/userService";
import type { PerfilResponse } from "@/services/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  career: string;
  year: string;
  tags: string[];
  compatibility: number;
  initials: string;
  university: string;
  bio: string;
  bgColor1: string;
  bgColor2: string;
  accentColor: string;
  online: boolean;
}

const ACCENT_COLORS = [
  "rgba(143, 132, 224, 1)",
  "rgba(99, 140, 245, 1)",
  "rgba(50, 180, 100, 1)",
  "rgba(255, 107, 157, 1)",
  "rgba(255, 179, 71, 1)",
];

export default function MatchingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const profile = profiles[currentIndex % profiles.length];
  const pan = useRef(new Animated.ValueXY()).current;
  const SWIPE_THRESHOLD = 120;

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async (append = false) => {
    try {
      const sugerencias = await matchingService.obtenerSugerencias(8); // Reduced from 20 to 8 for N+1 queries optimization
      const hydrated = await Promise.all(
        sugerencias.map(async (s, i) => {
          try {
            const perfil = await userService.getPerfil(s.candidatoId);
            return {
              id: s.candidatoId,
              name: `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() || "Usuario",
              age: 0,
              career: perfil.carrera || "",
              year: perfil.semestre ? `${perfil.semestre}° semestre` : "",
              tags: (perfil.intereses || []).slice(0, 3),
              compatibility: Math.round(s.score * 100),
              initials: (perfil.nombre?.[0] || "U").toUpperCase() + (perfil.apellidos?.[0] || "").toUpperCase(),
              university: "ECI",
              bio: "",
              bgColor1: "rgba(55, 40, 120, 1)",
              bgColor2: "rgba(20, 15, 60, 1)",
              accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
              online: true,
            };
          } catch {
            return null;
          }
        })
      );
      
      const newProfiles = hydrated.filter((p): p is MatchProfile => p !== null);
      setProfiles((prev) => {
        if (append) {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...newProfiles.filter((p) => !existingIds.has(p.id))];
        }
        return newProfiles;
      });
    } catch (err) {
      console.log("[MATCHING] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: "left" | "right") => {
    const x = direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(pan, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: "left" | "right") => {
    const decision = direction === "right" ? "LIKE" : "DESCARTE";
    if (profile) {
      matchingService.decidir(profile.id, decision).catch(() => {});
    }
    pan.setValue({ x: 0, y: 0 });
    
    // Prefetch next batch if close to running out
    if (currentIndex + 2 >= profiles.length) {
      loadProfiles(true);
    }
    
    setCurrentIndex((i) => i + 1);
  };

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleAction = (action: "like" | "dislike" | "star") => {
    if (action === "like" || action === "star") {
      forceSwipe("right");
    } else {
      forceSwipe("left");
    }
  };

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const cardStyle = {
    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
  };

  return (
    <SafeAreaView style={styles.root}>

      {/* ── Top bar: heart left | avatar right ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.topHeart} onPress={() => router.push("/bienestar")}>
          <Ionicons name="leaf-outline" size={24} color="rgba(143, 132, 224, 0.75)" />
        </Pressable>

        {/* Center divider line */}
        <View style={styles.topCenter}>
          <View style={styles.topDividerLine} />
        </View>

        {/* User avatar top-right */}
        <Pressable style={styles.topAvatar} onPress={() => router.push("/profile")}>
          <Text style={styles.topAvatarText}>{t("you")}</Text>
        </Pressable>
      </View>

      {/* ── Title section ── */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Matching</Text>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles" size={48} color="rgba(99, 102, 241, 0.5)" />
          <Text style={styles.emptyText}>Buscando personas compatibles...</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && profiles.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="rgba(99, 102, 241, 0.5)" />
          <Text style={styles.emptyText}>No hay sugerencias disponibles</Text>
          <Text style={styles.emptySubtext}>Vuelve más tarde para descubrir personas nuevas</Text>
        </View>
      )}

      {/* ── Swipe card ── */}
      {!loading && profile && (
      <Animated.View style={[styles.cardWrap, cardStyle]} {...panResponder.panHandlers}>
        <View style={styles.card}>

          {/* Full-bleed photo area with gradient background */}
          <LinearGradient
            colors={[profile.bgColor1, profile.bgColor2]}
            style={styles.cardImageArea}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
          >
            {/* Decorative circles */}
            <View style={[styles.decorCircle1, { backgroundColor: profile.accentColor.replace("1)", "0.08)") }]} />
            <View style={[styles.decorCircle2, { backgroundColor: profile.accentColor.replace("1)", "0.05)") }]} />
            <View style={[styles.decorCircle3, { backgroundColor: profile.accentColor.replace("1)", "0.06)") }]} />

            {/* Top chips row */}
            <View style={styles.cardTopChips}>
              <View style={styles.matchChip}>
                <Ionicons name="sparkles" size={14} color="rgba(251, 191, 36, 1)" />
                <Text style={styles.matchChipText}>{profile.compatibility}% {t("match_compatibility")}</Text>
              </View>
              <View style={styles.uniChip}>
                <Text style={styles.uniChipText}>{profile.university}</Text>
              </View>
            </View>

            {/* Big avatar centered */}
            <View style={styles.bigAvatarWrap}>
              <View style={[styles.bigAvatarRing, { borderColor: profile.accentColor.replace("1)", "0.30)") }]}>
                <View style={[styles.bigAvatar, { backgroundColor: profile.accentColor.replace("1)", "0.18)") }]}>
                  <Text style={[styles.bigAvatarText, { color: profile.accentColor }]}>
                    {profile.initials}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(11, 13, 24, 0.9)", "rgba(11, 13, 24, 1)"]}
              style={styles.cardBottomGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {/* Name & age */}
              <View style={styles.cardNameRow}>
                <Text style={styles.cardName}>{profile.name}</Text>
                <Text style={styles.cardAge}>{profile.age}</Text>
              </View>

              {/* Career */}
              <View style={styles.cardCareerRow}>
                <Ionicons name="school-outline" size={13} color={profile.accentColor} style={{ marginRight: 5 }} />
                <Text style={styles.cardCareer}>
                  {profile.career}
                  <Text style={styles.cardCareerDot}> · </Text>
                  <Text style={styles.cardYear}>{profile.year}</Text>
                </Text>
              </View>

              {/* Bio */}
              <Text style={styles.cardBio}>{profile.bio}</Text>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {profile.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* ── Action buttons (below card) ── */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => handleAction("dislike")}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionDislike,
              pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
            ]}
          >
            <Ionicons name="close" size={28} color="rgba(242, 63, 67, 1)" />
          </Pressable>

          <Pressable
            onPress={() => handleAction("star")}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionStar,
              pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
            ]}
          >
            <Ionicons name="star" size={20} color="rgba(240, 178, 50, 1)" />
          </Pressable>

          <Pressable
            onPress={() => handleAction("like")}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionLike,
              pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
            ]}
          >
            <Ionicons name="heart" size={26} color="rgba(255, 255, 255, 1)" />
          </Pressable>
        </View>
      </Animated.View>
      )}

    </SafeAreaView>
  );
}

const CARD_HEIGHT = SCREEN_HEIGHT * 0.60;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topHeart: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  topCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  topDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.20)",
  },
  topDividerDiamond: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  topAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(99, 102, 241, 0.80)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(143, 132, 224, 0.40)",
  },
  topAvatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Title ──
  titleSection: {
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 12,
  },
  mainTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  titleText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subtitleText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 18,
  },

  // ── Card wrapper ──
  cardWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // ── Card ──
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.18)",
    shadowColor: "rgba(99, 102, 241, 0.35)",
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    elevation: 12,
  },
  cardImageArea: {
    flex: 1,
    position: "relative",
  },

  // Decorative background circles
  decorCircle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -80,
  },
  decorCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 40,
    left: -60,
  },
  decorCircle3: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: 120,
    right: -40,
  },

  // Top chips
  cardTopChips: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 13, 24, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(143, 132, 224, 0.25)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  matchChipText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 12,
    fontWeight: "600",
  },
  uniChip: {
    backgroundColor: "rgba(11, 13, 24, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  uniChipText: {
    color: "rgba(220, 220, 240, 1)",
    fontSize: 12,
    fontWeight: "600",
  },

  // Big avatar
  bigAvatarWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  bigAvatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  bigAvatar: {
    width: 122,
    height: 122,
    borderRadius: 61,
    justifyContent: "center",
    alignItems: "center",
  },
  bigAvatarText: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Bottom gradient overlay
  cardBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  cardName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  cardAge: {
    color: "rgba(210, 210, 230, 0.9)",
    fontSize: 20,
    fontWeight: "400",
  },
  cardCareerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardCareer: {
    color: "rgba(200, 200, 220, 0.85)",
    fontSize: 13,
    fontWeight: "500",
  },
  cardCareerDot: {
    color: "rgba(143, 132, 224, 0.6)",
  },
  cardYear: {
    color: "rgba(143, 132, 224, 0.85)",
    fontWeight: "400",
  },
  cardBio: {
    color: "rgba(180, 180, 210, 0.75)",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 8,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  tagText: {
    color: "rgba(220, 220, 240, 1)",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Action buttons ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 18,
  },
  actionBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
  },
  actionDislike: {
    width: 60,
    height: 60,
    borderColor: "rgba(242, 63, 67, 0.30)",
    backgroundColor: "rgba(242, 63, 67, 0.10)",
  },
  actionStar: {
    width: 48,
    height: 48,
    borderColor: "rgba(240, 178, 50, 0.30)",
    backgroundColor: "rgba(240, 178, 50, 0.10)",
  },
  actionLike: {
    width: 60,
    height: 60,
    borderColor: "rgba(99, 102, 241, 0.50)",
    backgroundColor: "rgba(99, 102, 241, 0.75)",
    shadowColor: "rgba(99, 102, 241, 0.55)",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 10,
  },
});
