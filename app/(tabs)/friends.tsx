import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAuth } from "@/hooks/useAuth";
import { matchingService, type MatchResponse } from "@/services/matchingService";
import { userService } from "@/services/userService";

interface Friend {
  userId: string;
  matchId: string;
  name: string;
  initials: string;
  career: string;
  online: boolean;
  accentColor: string;
  bgColor: string;
}

const COLORS = [
  { accent: "rgba(143, 132, 224, 1)", bg: "rgba(143, 132, 224, 0.15)" },
  { accent: "rgba(99, 140, 245, 1)", bg: "rgba(99, 140, 245, 0.15)" },
  { accent: "rgba(255, 107, 157, 1)", bg: "rgba(255, 107, 157, 0.15)" },
  { accent: "rgba(50, 200, 120, 1)", bg: "rgba(50, 200, 120, 0.15)" },
  { accent: "rgba(255, 179, 71, 1)", bg: "rgba(255, 179, 71, 0.15)" },
];

// ─────────────────────────────────────────
// FriendRow — animates in and has all actions
// ─────────────────────────────────────────
function FriendRow({
  friend,
  onChat,
  onCall,
  onVideoCall,
  onToggleOnline,
  onViewProfile,
}: {
  friend: Friend;
  onChat: () => void;
  onCall: () => void;
  onVideoCall: () => void;
  onToggleOnline: () => void;
  onViewProfile: () => void;
}) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(1, { duration: 350 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.friendRow, animStyle]}>
      {/* Online indicator */}
      <View style={styles.onlineIndicatorWrap}>
        <Pressable onPress={onToggleOnline} hitSlop={8}>
          <View
            style={[
              styles.onlineDot,
              friend.online
                ? { backgroundColor: "rgba(35, 195, 100, 1)" }
                : {
                    backgroundColor: "transparent",
                    borderWidth: 1.5,
                    borderColor: "rgba(80, 80, 110, 1)",
                  },
            ]}
          />
        </Pressable>
      </View>

      {/* Avatar */}
      <Pressable onPress={onViewProfile}>
        <View style={[styles.avatar, { borderColor: friend.accentColor.replace("1)", "0.35)"), backgroundColor: friend.bgColor }]}>
          <Text style={[styles.avatarText, { color: friend.accentColor }]}>
            {friend.initials}
          </Text>
        </View>
      </Pressable>

      {/* Info */}
      <Pressable style={styles.friendInfo} onPress={onViewProfile}>
        <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
        <Text style={styles.friendCareer} numberOfLines={1}>
          {friend.career || "ECI"}
        </Text>
      </Pressable>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {/* Chat */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.35)" },
            pressed && { opacity: 0.65, transform: [{ scale: 0.9 }] },
          ]}
          onPress={onChat}
          hitSlop={4}
        >
          <Ionicons name="chatbubble" size={16} color="rgba(129, 140, 248, 1)" />
        </Pressable>

        {/* Call */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: "rgba(50, 195, 100, 0.12)", borderColor: "rgba(50, 195, 100, 0.35)" },
            pressed && { opacity: 0.65, transform: [{ scale: 0.9 }] },
          ]}
          onPress={onCall}
          hitSlop={4}
        >
          <Ionicons name="call" size={16} color="rgba(50, 195, 100, 1)" />
        </Pressable>

        {/* Video call */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: "rgba(99, 140, 245, 0.12)", borderColor: "rgba(99, 140, 245, 0.35)" },
            pressed && { opacity: 0.65, transform: [{ scale: 0.9 }] },
          ]}
          onPress={onVideoCall}
          hitSlop={4}
        >
          <Ionicons name="videocam" size={16} color="rgba(99, 140, 245, 1)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────
export default function FriendsScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");

  // ── Load matches (friends) ──
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const matches: MatchResponse[] = await matchingService.listarMatches();
      const hydrated = await Promise.all(
        matches.map(async (m, i) => {
          const otherId = m.otroUsuarioId;
          try {
            const perfil = await userService.getPerfil(otherId);
            const c = COLORS[i % COLORS.length];
            const nombre = `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() || "Usuario";
            return {
              userId: otherId,
              matchId: m.matchId,
              name: nombre,
              initials:
                (perfil.nombre?.[0] || "U").toUpperCase() +
                (perfil.apellidos?.[0] || "").toUpperCase(),
              career: perfil.carrera || "",
              online: true,
              accentColor: c.accent,
              bgColor: c.bg,
            } as Friend;
          } catch {
            return null;
          }
        })
      );
      setFriends(hydrated.filter((f): f is Friend => f !== null));
    } catch (err) {
      console.log("[FRIENDS] Error loading:", err);
      // Fallback: show demo friends so UI is visible without backend
      setFriends(getDemoFriends());
    } finally {
      setLoading(false);
    }
  }, []);

  const getDemoFriends = (): Friend[] => [
    { userId: "1", matchId: "m1", name: "Valentina Torres", initials: "VT", career: "Ingeniería de Sistemas", online: true, accentColor: COLORS[0].accent, bgColor: COLORS[0].bg },
    { userId: "2", matchId: "m2", name: "Santiago Morales", initials: "SM", career: "Ingeniería Industrial", online: false, accentColor: COLORS[1].accent, bgColor: COLORS[1].bg },
    { userId: "3", matchId: "m3", name: "Lucía Fernández", initials: "LF", career: "Ingeniería Civil", online: true, accentColor: COLORS[2].accent, bgColor: COLORS[2].bg },
    { userId: "4", matchId: "m4", name: "Andrés Castro", initials: "AC", career: "Ingeniería Electrónica", online: true, accentColor: COLORS[3].accent, bgColor: COLORS[3].bg },
    { userId: "5", matchId: "m5", name: "María Rodríguez", initials: "MR", career: "Ingeniería Mecatrónica", online: false, accentColor: COLORS[4].accent, bgColor: COLORS[4].bg },
  ];

  const toggleOnline = useCallback((userId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.userId === userId ? { ...f, online: !f.online } : f))
    );
  }, []);

  const handleChat = useCallback((friend: Friend) => {
    router.push(`/chat/${friend.userId}` as any);
  }, [router]);

  const handleCall = useCallback((friend: Friend) => {
    router.push({
      pathname: "/call",
      params: { userId: friend.userId, name: friend.name, initials: friend.initials },
    } as any);
  }, [router]);

  const handleVideoCall = useCallback((friend: Friend) => {
    router.push({
      pathname: "/video-call",
      params: { userId: friend.userId, name: friend.name, initials: friend.initials },
    } as any);
  }, [router]);

  const handleViewProfile = useCallback((friend: Friend) => {
    router.push(`/user/${friend.userId}` as any);
  }, [router]);

  // ── Filtered list ──
  const filtered = friends.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || f.online;
    return matchesSearch && matchesFilter;
  });

  const onlineCount = friends.filter((f) => f.online).length;

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Amigos</Text>
          <View style={styles.countBadge}>
            <View style={styles.countDot} />
            <Text style={styles.countText}>{onlineCount} en línea</Text>
          </View>
        </View>
        <Pressable style={styles.headerAvatar} onPress={() => router.push("/profile")}>
          <Text style={styles.headerAvatarText}>Tú</Text>
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="rgba(90, 90, 120, 1)" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar amigos..."
          placeholderTextColor="rgba(90, 90, 120, 1)"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="rgba(90, 90, 120, 1)" />
          </Pressable>
        )}
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterPill, filter === "all" && styles.filterPillActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            Todos ({friends.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterPill, filter === "online" && styles.filterPillActive]}
          onPress={() => setFilter("online")}
        >
          <View style={[styles.pillDot, { backgroundColor: "rgba(35, 195, 100, 1)" }]} />
          <Text style={[styles.filterText, filter === "online" && styles.filterTextActive]}>
            En línea ({onlineCount})
          </Text>
        </Pressable>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="rgba(129, 140, 248, 1)" />
          <Text style={styles.loadingText}>Cargando amigos...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={52} color="rgba(99, 102, 241, 0.4)" />
          <Text style={styles.emptyTitle}>
            {friends.length === 0 ? "¡Aún no tienes amigos!" : "Sin resultados"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {friends.length === 0
              ? "Ve a Matching para conectar con otras personas"
              : "Intenta con otro nombre"}
          </Text>
          {friends.length === 0 && (
            <Pressable
              style={styles.goMatchingBtn}
              onPress={() => router.navigate("/(tabs)/explore" as any)}
            >
              <Ionicons name="heart-outline" size={16} color="rgba(255,255,255,1)" style={{ marginRight: 6 }} />
              <Text style={styles.goMatchingText}>Ir a Matching</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "rgba(35, 195, 100, 1)" }]} />
              <Text style={styles.legendText}>Toca el punto verde/gris para cambiar estado</Text>
            </View>
          </View>

          {filtered.map((friend) => (
            <FriendRow
              key={friend.userId}
              friend={friend}
              onChat={() => handleChat(friend)}
              onCall={() => handleCall(friend)}
              onVideoCall={() => handleVideoCall(friend)}
              onToggleOnline={() => toggleOnline(friend.userId)}
              onViewProfile={() => handleViewProfile(friend)}
            />
          ))}

          <View style={{ height: 130 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(35, 195, 100, 1)",
  },
  countText: {
    color: "rgba(35, 195, 100, 1)",
    fontSize: 13,
    fontWeight: "500",
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(99, 102, 241, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(143, 132, 224, 0.4)",
  },
  headerAvatarText: {
    color: "rgba(255,255,255,1)",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Search ──
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  searchInput: {
    flex: 1,
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "400",
    paddingVertical: 0,
  },

  // ── Filter pills ──
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  filterPillActive: {
    borderColor: "rgba(99, 102, 241, 0.45)",
    backgroundColor: "rgba(99, 102, 241, 0.18)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterText: {
    color: "rgba(90, 90, 120, 1)",
    fontSize: 13,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // ── List ──
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  legendRow: {
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    color: "rgba(90, 90, 120, 1)",
    fontSize: 11,
    fontWeight: "400",
  },

  // ── Friend row ──
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  onlineIndicatorWrap: {
    width: 16,
    alignItems: "center",
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  friendInfo: {
    flex: 1,
    justifyContent: "center",
  },
  friendName: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  friendCareer: {
    color: "rgba(143, 132, 224, 0.75)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── States ──
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    color: "rgba(143, 132, 224, 0.75)",
    fontSize: 14,
    marginTop: 16,
  },
  emptyTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 18,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "rgba(90, 90, 120, 1)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  goMatchingBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    backgroundColor: "rgba(99, 102, 241, 0.75)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  goMatchingText: {
    color: "rgba(255,255,255,1)",
    fontSize: 14,
    fontWeight: "600",
  },
});
