import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { parcheService } from "@/services/parcheService";
import type {
  ParcheSummaryResponse,
  ParcheCategory,
  UUID,
} from "@/services/types";

// ─── Category helpers ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ParcheCategory, string> = {
  SPORT: "Deportes",
  ENTERTAINMENT: "Entretenimiento",
  MUSIC: "Música",
  ART: "Arte",
  TECHNOLOGY: "Tecnología",
  STUDY: "Académico",
  VARIETY: "Variado",
};

const CATEGORY_COLORS: Record<ParcheCategory, string> = {
  SPORT: "rgba(35, 165, 89, 1)",
  ENTERTAINMENT: "rgba(242, 63, 67, 1)",
  MUSIC: "rgba(168, 85, 247, 1)",
  ART: "rgba(236, 72, 153, 1)",
  TECHNOLOGY: "rgba(99, 102, 241, 1)",
  STUDY: "rgba(240, 178, 50, 1)",
  VARIETY: "rgba(143, 132, 224, 1)",
};

// ─── Data (friends — not API-backed yet) ─────────────────────────────────────

type OnlineStatus = "online" | "offline" | "away";

interface Friend {
  id: string;
  initials: string;
  name: string;
  status: OnlineStatus;
  statusLabel: string;
  avatarColor: string;
}

const FRIENDS: Friend[] = [
  { id: "1", initials: "SA", name: "Santiago A.", status: "online", statusLabel: "En línea", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "2", initials: "VT", name: "Valeria T.", status: "online", statusLabel: "En línea", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "3", initials: "CM", name: "Carlos M.", status: "away", statusLabel: "Hace 18 min", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "4", initials: "FA", name: "Felipe A.", status: "online", statusLabel: "En línea", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "5", initials: "SV", name: "Sofía V.", status: "offline", statusLabel: "Hace 2 h", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "6", initials: "MH", name: "Miguel H.", status: "online", statusLabel: "En línea", avatarColor: "rgba(99, 102, 241, 0.75)" },
  { id: "7", initials: "LP", name: "Laura P.", status: "offline", statusLabel: "Ayer", avatarColor: "rgba(99, 102, 241, 0.75)" },
];

const RECENT_FRIENDS = FRIENDS.slice(0, 5);

// ─── Status indicator ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: OnlineStatus }) {
  const color =
    status === "online"
      ? "rgba(35, 165, 89, 1)"
      : status === "away"
      ? "rgba(240, 178, 50, 1)"
      : "rgba(90, 90, 104, 1)";
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

// ─── Friend row ──────────────────────────────────────────────────────────────

function FriendRow({ friend }: { friend: Friend }) {
  const router = useRouter();
  const labelColor =
    friend.status === "online"
      ? "rgba(35, 165, 89, 1)"
      : "rgba(90, 90, 104, 1)";
  return (
    <View style={styles.friendRow}>
      <Pressable onPress={() => router.push(`/user/${friend.id}`)} style={styles.friendAvatarWrap}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendInitials}>{friend.initials}</Text>
        </View>
        <StatusDot status={friend.status} />
      </Pressable>

      <Pressable style={styles.friendInfo} onPress={() => router.push(`/user/${friend.id}`)}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={[styles.friendStatus, { color: labelColor }]}>
          {friend.statusLabel}
        </Text>
      </Pressable>

      <View style={styles.friendActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionIconBtn,
            styles.actionIconBtnPrimary,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => router.push(`/chat/${friend.id}`)}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="rgba(129, 140, 248, 1)" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionIconBtn,
            styles.actionIconBtnSecondary,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => router.push("/call")}
        >
          <Ionicons name="call" size={16} color="rgba(143, 132, 224, 0.8)" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionIconBtn,
            styles.actionIconBtnSecondary,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
          onPress={() => router.push("/video-call")}
        >
          <Ionicons name="videocam" size={16} color="rgba(143, 132, 224, 0.8)" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Parche card ─────────────────────────────────────────────────────────────

function ParcheCard({
  parche,
  onJoin,
  joining,
}: {
  parche: ParcheSummaryResponse;
  onJoin?: (id: UUID) => void;
  joining?: boolean;
}) {
  const router = useRouter();
  const color = CATEGORY_COLORS[parche.category] ?? "rgba(99, 102, 241, 1)";
  const accentFaint = color.replace("1)", "0.15)");
  const accentBorder = color.replace("1)", "0.30)");
  const initials = parche.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.serverCard,
        { borderColor: accentBorder },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => router.push(`/(tabs)/parche?parcheId=${parche.parcheId}`)}
    >
      <View style={[styles.serverCardBg, { backgroundColor: accentFaint }]} />

      <View style={[styles.serverAvatar, { borderColor: accentBorder, backgroundColor: accentFaint }]}>
        {parche.pictureUrl ? (
          <View style={[styles.serverAvatar, { borderColor: accentBorder, backgroundColor: "transparent" }]}>
            <Text style={[styles.serverInitials, { color }]}>{initials}</Text>
          </View>
        ) : (
          <Text style={[styles.serverInitials, { color }]}>{initials}</Text>
        )}
      </View>

      <View style={styles.serverInfo}>
        <View style={styles.serverNameRow}>
          <Text style={styles.serverName} numberOfLines={1}>
            {parche.name}
          </Text>
          {parche.visibility === "PRIVATE" && (
            <Ionicons name="lock-closed" size={12} color="rgba(143, 132, 224, 0.5)" />
          )}
        </View>
        <Text style={styles.serverCategory}>{CATEGORY_LABELS[parche.category]}</Text>
        <Text style={styles.serverDesc} numberOfLines={1}>
          {parche.description}
        </Text>
        <View style={styles.serverStats}>
          <Text style={styles.serverStatText}>
            {parche.memberCount}/{parche.maxCapacity} miembros
          </Text>
        </View>
      </View>

      {onJoin && parche.visibility === "PUBLIC" && parche.memberCount < parche.maxCapacity ? (
        <Pressable
          style={({ pressed }) => [
            styles.joinBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            onJoin(parche.parcheId);
          }}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="add" size={16} color="white" />
          )}
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="rgba(143, 132, 224, 0.40)" />
      )}
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ParchesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"amigos" | "parches">("amigos");
  const [searchQuery, setSearchQuery] = useState("");
  const tabAnim = useRef(new Animated.Value(0)).current;

  // Parches data
  const [myParches, setMyParches] = useState<ParcheSummaryResponse[]>([]);
  const [publicParches, setPublicParches] = useState<ParcheSummaryResponse[]>([]);
  const [loadingParches, setLoadingParches] = useState(true);
  const [joiningId, setJoiningId] = useState<UUID | null>(null);

  const fetchParches = useCallback(async () => {
    setLoadingParches(true);
    try {
      const [mine, publicP] = await Promise.allSettled([
        parcheService.mine(),
        parcheService.byVisibility("PUBLIC"),
      ]);
      if (mine.status === "fulfilled") setMyParches(mine.value.content);
      if (publicP.status === "fulfilled") setPublicParches(publicP.value.content);
    } finally {
      setLoadingParches(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "parches") {
      fetchParches();
    }
  }, [activeTab, fetchParches]);

  const handleTabSwitch = (tab: "amigos" | "parches") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === "amigos" ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const handleJoin = async (parcheId: UUID) => {
    setJoiningId(parcheId);
    try {
      await parcheService.join(parcheId);
      Alert.alert("Te uniste", "Ahora eres miembro del parche.");
      await fetchParches();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "No se pudo unir al parche.");
    } finally {
      setJoiningId(null);
    }
  };

  const filteredFriends = FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyParches = myParches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      CATEGORY_LABELS[p.category].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicParches = publicParches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      CATEGORY_LABELS[p.category].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.topHeart} onPress={() => router.push("/bienestar")}>
          <Ionicons name="leaf-outline" size={24} color="rgba(143, 132, 224, 0.75)" />
        </Pressable>
        <View style={styles.topCenter}>
          <View style={styles.topDividerLine} />
        </View>
        <Pressable style={styles.topAvatar} onPress={() => router.push("/profile")}>
          <Text style={styles.topAvatarText}>{t("you")}</Text>
        </Pressable>
      </View>

      {/* ── Page title ── */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>
          {activeTab === "amigos" ? "Mis Amigos" : "Mis Parches"}
        </Text>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={16}
          color="rgba(255,255,255,0.35)"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === "amigos" ? "Buscar amigo..." : "Buscar parche..."
          }
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          selectionColor="rgba(129,140,248,1)"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={16}
              color="rgba(255,255,255,0.35)"
            />
          </Pressable>
        )}
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabToggleWrap}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <Pressable
          style={styles.tabToggleBtn}
          onPress={() => handleTabSwitch("amigos")}
        >
          <Text
            style={[
              styles.tabToggleText,
              activeTab === "amigos" && styles.tabToggleTextActive,
            ]}
          >
            Amigos
          </Text>
        </Pressable>
        <Pressable
          style={styles.tabToggleBtn}
          onPress={() => handleTabSwitch("parches")}
        >
          <Text
            style={[
              styles.tabToggleText,
              activeTab === "parches" && styles.tabToggleTextActive,
            ]}
          >
            Parches
          </Text>
        </Pressable>
      </View>

      {/* ── Content ── */}
      {activeTab === "amigos" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>RECIENTES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRow}
          >
            {RECENT_FRIENDS.map((f) => (
              <Pressable key={f.id} style={styles.recentItem}>
                <View style={styles.recentAvatarWrap}>
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentInitials}>{f.initials}</Text>
                  </View>
                  <StatusDot status={f.status} />
                </View>
                <Text style={styles.recentName} numberOfLines={1}>
                  {f.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>TODOS</Text>
          <View style={styles.friendListCard}>
            {filteredFriends.map((friend, index) => (
              <View key={friend.id}>
                {index > 0 && <View style={styles.divider} />}
                <FriendRow friend={friend} />
              </View>
            ))}
            {filteredFriends.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={32} color="rgba(143,132,224,0.3)" />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingParches ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
            </View>
          ) : (
            <>
              {/* My Parches */}
              {filteredMyParches.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>MIS PARCHES</Text>
                  <View style={styles.serverList}>
                    {filteredMyParches.map((p) => (
                      <ParcheCard key={p.parcheId} parche={p} />
                    ))}
                  </View>
                </>
              )}

              {/* Browse Public Parches */}
              <Text style={styles.sectionLabel}>
                {filteredMyParches.length > 0 ? "EXPLORAR" : "PARCHES PÚBLICOS"}
              </Text>
              <View style={styles.serverList}>
                {filteredPublicParches.map((p) => (
                  <ParcheCard
                    key={p.parcheId}
                    parche={p}
                    onJoin={handleJoin}
                    joining={joiningId === p.parcheId}
                  />
                ))}
                {filteredPublicParches.length === 0 && filteredMyParches.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="grid-outline" size={32} color="rgba(143,132,224,0.3)" />
                    <Text style={styles.emptyText}>No hay parches disponibles</Text>
                    <Text style={[styles.emptyText, { fontSize: 12 }]}>
                      Crea uno o únete con un código de invitación
                    </Text>
                  </View>
                )}
              </View>

              {/* Join by invite code */}
              <Pressable
                style={({ pressed }) => [
                  styles.joinCodeBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  Alert.prompt?.(
                    "Unirse con código",
                    "Ingresa el código de invitación",
                    async (code: string) => {
                      if (!code?.trim()) return;
                      try {
                        await parcheService.acceptInvite(code.trim());
                        Alert.alert("Éxito", "Te uniste al parche.");
                        await fetchParches();
                      } catch {
                        Alert.alert("Error", "Código inválido o expirado.");
                      }
                    }
                  ) ?? Alert.alert("Código de invitación", "Pide el código a un administrador del parche.");
                }}
              >
                <Ionicons name="key-outline" size={18} color="rgba(129, 140, 248, 1)" />
                <Text style={styles.joinCodeText}>Unirse con código</Text>
              </Pressable>

              {/* Create parche CTA */}
              <Pressable
                style={({ pressed }) => [
                  styles.createServerBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push("/create-parche" as any)}
              >
                <View style={styles.createServerIcon}>
                  <Ionicons name="add" size={22} color="rgba(129, 140, 248, 1)" />
                </View>
                <View style={styles.createServerText}>
                  <Text style={styles.createServerTitle}>Crear un parche</Text>
                  <Text style={styles.createServerSub}>
                    Crea tu propio servidor para tu grupo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(143, 132, 224, 0.40)" />
              </Pressable>
            </>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
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
    paddingHorizontal: 12,
  },
  topDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.20)",
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

  // ── Page title ──
  titleSection: {
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 8,
  },
  mainTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },

  // ── Search ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "400",
  },

  // ── Tab toggle ──
  tabToggleWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 3,
    position: "relative",
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    top: 3,
    width: "50%",
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(99, 102, 241, 0.22)",
    shadowColor: "rgba(99, 102, 241, 0.35)",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
  },
  tabToggleBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11,
    zIndex: 1,
  },
  tabToggleText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19.5,
  },
  tabToggleTextActive: {
    color: "rgba(255, 255, 255, 1)",
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Section label ──
  sectionLabel: {
    color: "rgba(143, 132, 224, 0.55)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Recent horizontal row ──
  recentRow: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 20,
    paddingLeft: 4,
  },
  recentItem: {
    alignItems: "center",
    gap: 6,
    width: 56,
  },
  recentAvatarWrap: {
    position: "relative",
  },
  recentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(99, 102, 241, 0.20)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.30)",
    shadowColor: "rgba(99, 102, 241, 0.30)",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 4,
  },
  recentInitials: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 17,
    fontWeight: "800",
  },
  recentName: {
    color: "rgba(255, 255, 255, 0.60)",
    fontSize: 10,
    fontWeight: "400",
    textAlign: "center",
  },

  // ── Status dot ──
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    right: 1,
    bottom: 1,
    borderWidth: 2,
    borderColor: "rgba(11, 13, 24, 1)",
  },

  // ── Friend list card ──
  friendListCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },

  // ── Friend row ──
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  friendAvatarWrap: {
    position: "relative",
  },
  friendAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(99, 102, 241, 0.20)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.25)",
    shadowColor: "rgba(99, 102, 241, 0.30)",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 4,
  },
  friendInitials: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
    fontWeight: "800",
  },
  friendInfo: {
    flex: 1,
    flexDirection: "column",
  },
  friendName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  friendStatus: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 15,
  },
  friendActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  actionIconBtnPrimary: {
    borderColor: "rgba(99, 102, 241, 0.27)",
    backgroundColor: "rgba(99, 102, 241, 0.13)",
  },
  actionIconBtnSecondary: {
    borderColor: "rgba(143, 132, 224, 0.27)",
    backgroundColor: "rgba(143, 132, 224, 0.13)",
  },

  // ── Server list ──
  serverList: {
    gap: 10,
    marginBottom: 14,
  },
  serverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  serverCardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  serverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  serverInitials: {
    fontSize: 18,
    fontWeight: "800",
  },
  serverInfo: {
    flex: 1,
  },
  serverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serverName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  serverCategory: {
    color: "rgba(143, 132, 224, 0.60)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  serverDesc: {
    color: "rgba(180, 180, 210, 0.65)",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  serverStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  serverStatText: {
    color: "rgba(180, 180, 210, 0.50)",
    fontSize: 11,
    fontWeight: "400",
  },

  // ── Join button ──
  joinBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // ── Join by code ──
  joinCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143, 132, 224, 0.20)",
    borderStyle: "dashed",
    padding: 14,
    backgroundColor: "rgba(143, 132, 224, 0.05)",
    marginBottom: 10,
  },
  joinCodeText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Create server CTA ──
  createServerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.20)",
    borderStyle: "dashed",
    padding: 14,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    marginBottom: 4,
  },
  createServerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.30)",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  createServerText: {
    flex: 1,
  },
  createServerTitle: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 14,
    fontWeight: "600",
  },
  createServerSub: {
    color: "rgba(180, 180, 210, 0.55)",
    fontSize: 12,
    marginTop: 2,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyText: {
    color: "rgba(143, 132, 224, 0.40)",
    fontSize: 13,
    fontWeight: "500",
  },
});
