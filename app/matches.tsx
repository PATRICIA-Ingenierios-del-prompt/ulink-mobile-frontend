import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { matchingService, type MatchResponse } from "@/services/matchingService";
import { userService } from "@/services/userService";
import type { PerfilResponse } from "@/services/types";
import { ACCENT_COLORS } from "@/lib/colors";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchCard extends MatchResponse {
  profile: PerfilResponse | null;
  loading: boolean;
  initials: string;
  gradient: string;
}

interface RequestCard {
  userId: string;
  profile: PerfilResponse | null;
  loading: boolean;
  initials: string;
  gradient: string;
  /** Set to 'accept' | 'decline' once the user has decided, for optimistic UI */
  decided?: "accept" | "decline";
}

type TabId = "matches" | "requests";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashStringToIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function computeInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const GRADIENT_PAIRS: [string, string][] = [
  ["#6C63FF", "#A78BFA"],
  ["#FF6B9D", "#FF4D6A"],
  ["#00C9A7", "#23A559"],
  ["#FFB232", "#F97316"],
  ["#4FACFE", "#00F2FE"],
  ["#F093FB", "#F5576C"],
  ["#43E97B", "#38F9D7"],
  ["#FA709A", "#FEE140"],
];

function gradientForId(id: string): string {
  const idx = hashStringToIndex(id, GRADIENT_PAIRS.length);
  return GRADIENT_PAIRS[idx].join(",");
}

// ── Animated Tab Button ───────────────────────────────────────────────────────

function AnimatedTabBtn({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          active ? tabStyles.active : tabStyles.inactive,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={active ? tabStyles.activeText : tabStyles.inactiveText}>
          {label}
          {count != null ? ` (${count})` : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  active: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#6C63FF",
    alignItems: "center",
  },
  inactive: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  activeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  inactiveText: { color: "#90909A", fontSize: 13, fontWeight: "600" },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MatchesScreen() {
  const router = useRouter();
  const { userId: myId } = useAuth();
  const [tab, setTab] = useState<TabId>("matches");

  // ── Matches state ─────────────────────────────────────────────────────────
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const raw = await matchingService.listarMatches();
      const filtered = raw.filter((m) => m.otroUsuarioId !== myId);
      const cards: MatchCard[] = filtered.map((m) => ({
        ...m,
        profile: null,
        loading: true,
        initials: "?",
        gradient: gradientForId(m.otroUsuarioId),
      }));
      setMatches(cards);

      // Hydrate profiles one by one
      for (const card of cards) {
        try {
          const p = await userService.getPerfil(card.otroUsuarioId);
          setMatches((prev) =>
            prev.map((c) =>
              c.matchId === card.matchId
                ? { ...c, profile: p, loading: false, initials: computeInitials(p.nombre || "?") }
                : c
            )
          );
        } catch {
          setMatches((prev) =>
            prev.map((c) => (c.matchId === card.matchId ? { ...c, loading: false } : c))
          );
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingMatches(false);
    }
  }, [myId]);

  // ── Requests state ────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const ids = await matchingService.solicitudesRecibidas();
      // Filter out self
      const filtered = ids.filter((id) => id !== myId);
      const cards: RequestCard[] = filtered.map((id) => ({
        userId: id,
        profile: null,
        loading: true,
        initials: "?",
        gradient: gradientForId(id),
      }));
      setRequests(cards);

      // Hydrate profiles one by one
      for (const card of cards) {
        try {
          const p = await userService.getPerfil(card.userId);
          setRequests((prev) =>
            prev.map((c) =>
              c.userId === card.userId
                ? { ...c, profile: p, loading: false, initials: computeInitials(p.nombre || "?") }
                : c
            )
          );
        } catch {
          setRequests((prev) =>
            prev.map((c) => (c.userId === card.userId ? { ...c, loading: false } : c))
          );
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingRequests(false);
    }
  }, [myId]);

  // Load current tab on mount and tab change
  useEffect(() => {
    if (tab === "matches") loadMatches();
    else loadRequests();
  }, [tab]);

  // ── Decide on a request (accept / decline) ────────────────────────────────
  const decide = async (userId: string, decision: "LIKE" | "DESCARTE") => {
    // Optimistic: mark as decided immediately so UI updates
    setRequests((prev) =>
      prev.map((c) =>
        c.userId === userId
          ? { ...c, decided: decision === "LIKE" ? "accept" : "decline" }
          : c
      )
    );
    try {
      const res = await matchingService.decidir(userId, decision);
      if (res.matchConfirmado && decision === "LIKE") {
        // Remove from requests and refresh matches
        setRequests((prev) => prev.filter((c) => c.userId !== userId));
        loadMatches();
      } else {
        // Remove after a short delay so the user sees the feedback
        setTimeout(() => {
          setRequests((prev) => prev.filter((c) => c.userId !== userId));
        }, 600);
      }
    } catch {
      // Revert optimistic update on error
      setRequests((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, decided: undefined } : c))
      );
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleChat = (userId: string) => router.push(`/chat/${userId}`);
  const handleProfile = (userId: string) => router.push(`/user/${userId}`);

  const pendingRequests = requests.filter((r) => !r.decided);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(21,17,48,1)", "rgba(15,12,35,1)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {tab === "matches" ? "Mis Matches" : "Solicitudes recibidas"}
          </Text>
          <Text style={styles.headerSub}>
            {tab === "matches"
              ? `${matches.length} match${matches.length !== 1 ? "es" : ""}`
              : `${pendingRequests.length} pendiente${pendingRequests.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* ── Tab switcher ── */}
      <View style={styles.tabBar}>
        <AnimatedTabBtn
          label="Matches"
          count={matches.length}
          active={tab === "matches"}
          onPress={() => setTab("matches")}
        />
        <AnimatedTabBtn
          label="Solicitudes"
          count={pendingRequests.length || undefined}
          active={tab === "requests"}
          onPress={() => setTab("requests")}
        />
      </View>

      {/* ── MATCHES TAB ── */}
      {tab === "matches" && (
        <>
          {loadingMatches ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color="#6C63FF" />
              </View>
              <Text style={styles.emptyTitle}>Aún no tienes matches</Text>
              <Text style={styles.emptySub}>
                Desliza a la derecha en Matching para hacer match con alguien.
              </Text>
              <Pressable
                style={styles.exploreBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Ionicons name="compass" size={18} color="#fff" />
                <Text style={styles.exploreBtnText}>Ir a Matching</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            >
              {matches.map((card) => {
                const name = card.profile?.nombre || "Desconocido";
                const career = card.profile?.carrera || "";
                const semester = card.profile?.semestre;
                const gradient = card.gradient.split(",") as [string, string];
                const accent =
                  ACCENT_COLORS[hashStringToIndex(card.otroUsuarioId, ACCENT_COLORS.length)];

                return (
                  <View key={card.matchId} style={styles.matchCard}>
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardHero}
                    >
                      {card.loading ? (
                        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                      ) : (
                        <Text style={styles.heroInitials}>{card.initials}</Text>
                      )}
                      <View style={styles.matchBadge}>
                        <Ionicons name="heart" size={10} color="#fff" />
                      </View>
                    </LinearGradient>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.cardCareer} numberOfLines={1}>
                        {career}
                        {semester ? ` · ${semester}° sem` : ""}
                      </Text>

                      <View style={styles.cardActions}>
                        <Pressable
                          style={[styles.cardBtn, styles.profileBtn]}
                          onPress={() => handleProfile(card.otroUsuarioId)}
                        >
                          <Ionicons name="person-outline" size={14} color={accent} />
                          <Text style={[styles.profileBtnText, { color: accent }]}>
                            Perfil
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.cardBtn, styles.chatBtn, { backgroundColor: accent }]}
                          onPress={() => handleChat(card.otroUsuarioId)}
                        >
                          <Ionicons name="chatbubble" size={14} color="#fff" />
                          <Text style={styles.chatBtnText}>Mensaje</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <>
          {loadingRequests ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#7FE7C4" />
            </View>
          ) : pendingRequests.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: "rgba(127,231,196,0.1)" }]}>
                <Ionicons name="heart-outline" size={32} color="#7FE7C4" />
              </View>
              <Text style={styles.emptyTitle}>Sin solicitudes pendientes</Text>
              <Text style={styles.emptySub}>
                Cuando alguien te dé like, aparecerá aquí para que decidas si hacer match.
              </Text>
              <Pressable
                style={[styles.exploreBtn, { backgroundColor: "#7FE7C4" }]}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Ionicons name="compass" size={18} color="#0F0E1A" />
                <Text style={[styles.exploreBtnText, { color: "#0F0E1A" }]}>
                  Ir a Matching
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.requestList}
              showsVerticalScrollIndicator={false}
            >
              {requests.map((card) => {
                const name = card.profile?.nombre
                  ? `${card.profile.nombre} ${card.profile.apellidos || ""}`.trim()
                  : "Desconocido";
                const career = card.profile?.carrera || "";
                const semester = card.profile?.semestre;
                const bio = card.profile?.bio || "";
                const gradient = card.gradient.split(",") as [string, string];
                const accent =
                  ACCENT_COLORS[hashStringToIndex(card.userId, ACCENT_COLORS.length)];

                const isDecided = !!card.decided;

                return (
                  <View
                    key={card.userId}
                    style={[
                      styles.requestCard,
                      isDecided && { opacity: 0.5 },
                    ]}
                  >
                    {/* Left: avatar */}
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.requestAvatar}
                    >
                      {card.loading ? (
                        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                      ) : (
                        <Text style={styles.requestInitials}>{card.initials}</Text>
                      )}
                    </LinearGradient>

                    {/* Middle: info */}
                    <Pressable
                      style={styles.requestInfo}
                      onPress={() => handleProfile(card.userId)}
                    >
                      <Text style={styles.requestName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.requestCareer} numberOfLines={1}>
                        {career}
                        {semester ? ` · ${semester}° sem` : ""}
                      </Text>
                      {bio ? (
                        <Text style={styles.requestBio} numberOfLines={2}>
                          {bio}
                        </Text>
                      ) : null}
                    </Pressable>

                    {/* Right: accept / decline */}
                    <View style={styles.requestActions}>
                      {card.decided === "accept" ? (
                        <View style={styles.decidedBadge}>
                          <Ionicons name="checkmark" size={18} color="#7FE7C4" />
                        </View>
                      ) : card.decided === "decline" ? (
                        <View style={[styles.decidedBadge, { borderColor: "rgba(255,77,106,0.4)" }]}>
                          <Ionicons name="close" size={18} color="#FF4D6A" />
                        </View>
                      ) : (
                        <>
                          <Pressable
                            style={styles.declineBtn}
                            onPress={() => decide(card.userId, "DESCARTE")}
                          >
                            <Ionicons name="close" size={20} color="#FF4D6A" />
                          </Pressable>
                          <Pressable
                            style={styles.acceptBtn}
                            onPress={() => decide(card.userId, "LIKE")}
                          >
                            <Ionicons name="heart" size={18} color="#fff" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "#90909A",
    marginTop: 2,
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },

  // ── Shared ──
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(108,99,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#90909A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6C63FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Matches grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  matchCard: {
    width: "47%",
    backgroundColor: "rgba(21,17,48,0.8)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardHero: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
  },
  matchBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,77,106,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  cardCareer: {
    fontSize: 11,
    color: "#90909A",
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
  },
  cardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderRadius: 10,
  },
  profileBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  profileBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  chatBtn: {},
  chatBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },

  // ── Requests list ──
  requestList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21,17,48,0.85)",
    borderWidth: 1,
    borderColor: "rgba(127,231,196,0.12)",
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  requestInitials: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
  },
  requestInfo: {
    flex: 1,
    minWidth: 0,
  },
  requestName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  requestCareer: {
    fontSize: 11,
    color: "#90909A",
    marginBottom: 3,
  },
  requestBio: {
    fontSize: 11,
    color: "rgba(143,132,224,0.75)",
    lineHeight: 16,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  declineBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,77,106,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,77,106,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7FE7C4",
    alignItems: "center",
    justifyContent: "center",
  },
  decidedBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(127,231,196,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
