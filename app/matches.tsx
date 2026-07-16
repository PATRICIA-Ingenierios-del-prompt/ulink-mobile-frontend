import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface MatchCard extends MatchResponse {
  profile: PerfilResponse | null;
  loading: boolean;
  initials: string;
  gradient: string;
}

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

function gradientForId(id: string): string {
  const pairs: [string, string][] = [
    ["#6C63FF", "#A78BFA"],
    ["#FF6B9D", "#FF4D6A"],
    ["#00C9A7", "#23A559"],
    ["#FFB232", "#F97316"],
    ["#4FACFE", "#00F2FE"],
    ["#F093FB", "#F5576C"],
    ["#43E97B", "#38F9D7"],
    ["#FA709A", "#FEE140"],
  ];
  const idx = hashStringToIndex(id, pairs.length);
  return pairs[idx].join(",");
}

export default function MatchesScreen() {
  const router = useRouter();
  const { userId: myId } = useAuth();
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await matchingService.listarMatches();
        if (!alive) return;
        // Filter out self-match
        const filtered = raw.filter((m) => m.otroUsuarioId !== myId);
        const cards: MatchCard[] = filtered.map((m) => ({
          ...m,
          profile: null,
          loading: true,
          initials: "?",
          gradient: gradientForId(m.otroUsuarioId),
        }));
        setMatches(cards);

        // Hydrate profiles
        for (const card of cards) {
          try {
            const p = await userService.getPerfil(card.otroUsuarioId);
            if (!alive) return;
            setMatches((prev) =>
              prev.map((c) =>
                c.matchId === card.matchId
                  ? {
                      ...c,
                      profile: p,
                      loading: false,
                      initials: computeInitials(p.nombre || "?"),
                    }
                  : c
              )
            );
          } catch {
            if (!alive) return;
            setMatches((prev) =>
              prev.map((c) =>
                c.matchId === card.matchId ? { ...c, loading: false } : c
              )
            );
          }
        }
      } catch {
        // silent
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleChat = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(21,17,48,1)", "rgba(15,12,35,1)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mis Matches</Text>
          <Text style={styles.headerSub}>
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </Text>
        </View>
      </View>

      {loading ? (
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
            const gradient = card.gradient.split(",");
            const accent = ACCENT_COLORS[hashStringToIndex(card.otroUsuarioId, ACCENT_COLORS.length)];

            return (
              <View key={card.matchId} style={styles.matchCard}>
                {/* Avatar / gradient hero */}
                <LinearGradient
                  colors={gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardHero}
                >
                  {card.profile?.foto ? (
                    <Text style={styles.heroInitials}>
                      {card.initials}
                    </Text>
                  ) : (
                    <Text style={styles.heroInitials}>
                      {card.initials}
                    </Text>
                  )}
                  <View style={styles.matchBadge}>
                    <Ionicons name="heart" size={10} color="#fff" />
                  </View>
                </LinearGradient>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.cardCareer} numberOfLines={1}>
                    {career}
                    {semester ? ` · ${semester}° sem` : ""}
                  </Text>

                  {/* Actions */}
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
    </View>
  );
}

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
  chatBtn: {
    // backgroundColor set inline per-card
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
