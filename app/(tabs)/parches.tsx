import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";

// ─── Data ────────────────────────────────────────────────────────────────────

type OnlineStatus = "online" | "offline" | "away";

interface Friend {
  id: string;
  initials: string;
  name: string;
  status: OnlineStatus;
  statusLabel: string;
  avatarColor: string;
}

interface Server {
  id: string;
  initials: string;
  name: string;
  category: string;
  members: number;
  online: number;
  unread?: number;
  accentColor: string;
  description: string;
}

const FRIENDS: Friend[] = [
  {
    id: "1",
    initials: "SA",
    name: "Santiago A.",
    status: "online",
    statusLabel: "En línea",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "2",
    initials: "VT",
    name: "Valeria T.",
    status: "online",
    statusLabel: "En línea",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "3",
    initials: "CM",
    name: "Carlos M.",
    status: "away",
    statusLabel: "Hace 18 min",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "4",
    initials: "FA",
    name: "Felipe A.",
    status: "online",
    statusLabel: "En línea",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "5",
    initials: "SV",
    name: "Sofía V.",
    status: "offline",
    statusLabel: "Hace 2 h",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "6",
    initials: "MH",
    name: "Miguel H.",
    status: "online",
    statusLabel: "En línea",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
  {
    id: "7",
    initials: "LP",
    name: "Laura P.",
    status: "offline",
    statusLabel: "Ayer",
    avatarColor: "rgba(99, 102, 241, 0.75)",
  },
];

const RECENT_FRIENDS = FRIENDS.slice(0, 5);

const SERVERS: Server[] = [
  {
    id: "s1",
    initials: "DS",
    name: "Dev Squad ECI",
    category: "Tecnología",
    members: 248,
    online: 34,
    unread: 12,
    accentColor: "rgba(99, 102, 241, 1)",
    description: "Código, bugs y café para todos los devs de ECI",
  },
  {
    id: "s2",
    initials: "FC",
    name: "Fútbol Campus",
    category: "Deportes",
    members: 183,
    online: 21,
    unread: 3,
    accentColor: "rgba(35, 165, 89, 1)",
    description: "Canchas, partidos y torneos universitarios",
  },
  {
    id: "s3",
    initials: "MT",
    name: "Math Talks",
    category: "Académico",
    members: 97,
    online: 8,
    accentColor: "rgba(240, 178, 50, 1)",
    description: "Cálculo, álgebra y todo lo que duele resolver",
  },
  {
    id: "s4",
    initials: "GG",
    name: "Gaming Guild",
    category: "Entretenimiento",
    members: 412,
    online: 87,
    unread: 24,
    accentColor: "rgba(242, 63, 67, 1)",
    description: "LoL, Valorant, CS2 y más para los gamers de la U",
  },
  {
    id: "s5",
    initials: "MU",
    name: "Música ULink",
    category: "Arte",
    members: 156,
    online: 19,
    accentColor: "rgba(168, 85, 247, 1)",
    description: "Bandas, conciertos y jam sessions en el campus",
  },
  {
    id: "s6",
    initials: "EC",
    name: "Emprendedores CO",
    category: "Negocios",
    members: 321,
    online: 45,
    unread: 7,
    accentColor: "rgba(236, 72, 153, 1)",
    description: "Startups, ideas y networking universitario",
  },
];

// ─── Status indicator ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: OnlineStatus }) {
  const color =
    status === "online"
      ? "rgba(35, 165, 89, 1)"
      : status === "away"
      ? "rgba(240, 178, 50, 1)"
      : "rgba(90, 90, 104, 1)";
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

// ─── Friend row ───────────────────────────────────────────────────────────────

function FriendRow({ friend }: { friend: Friend }) {
  const labelColor =
    friend.status === "online"
      ? "rgba(35, 165, 89, 1)"
      : "rgba(90, 90, 104, 1)";
  return (
    <View style={styles.friendRow}>
      {/* Avatar */}
      <View style={styles.friendAvatarWrap}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendInitials}>{friend.initials}</Text>
        </View>
        <StatusDot status={friend.status} />
      </View>

      {/* Name & status */}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={[styles.friendStatus, { color: labelColor }]}>
          {friend.statusLabel}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.friendActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionIconBtn,
            styles.actionIconBtnPrimary,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="rgba(129, 140, 248, 1)" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionIconBtn,
            styles.actionIconBtnSecondary,
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
          ]}
        >
          <Ionicons name="call" size={16} color="rgba(143, 132, 224, 0.8)" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Server card ──────────────────────────────────────────────────────────────

function ServerCard({ server }: { server: Server }) {
  const accentFaint = server.accentColor.replace("1)", "0.15)");
  const accentBorder = server.accentColor.replace("1)", "0.30)");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.serverCard,
        { borderColor: accentBorder },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Background tint */}
      <View style={[styles.serverCardBg, { backgroundColor: accentFaint }]} />

      {/* Left: avatar */}
      <View style={[styles.serverAvatar, { borderColor: accentBorder, backgroundColor: accentFaint }]}>
        <Text style={[styles.serverInitials, { color: server.accentColor }]}>
          {server.initials}
        </Text>
      </View>

      {/* Middle: info */}
      <View style={styles.serverInfo}>
        <View style={styles.serverNameRow}>
          <Text style={styles.serverName} numberOfLines={1}>
            {server.name}
          </Text>
          {server.unread ? (
            <View style={[styles.unreadBadge, { backgroundColor: server.accentColor }]}>
              <Text style={styles.unreadText}>{server.unread}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.serverCategory}>{server.category}</Text>
        <Text style={styles.serverDesc} numberOfLines={1}>
          {server.description}
        </Text>
        <View style={styles.serverStats}>
          <View style={styles.serverStatItem}>
            <View style={[styles.serverStatDot, { backgroundColor: "rgba(35, 165, 89, 1)" }]} />
            <Text style={styles.serverStatText}>{server.online} en línea</Text>
          </View>
          <Text style={styles.serverStatSep}>·</Text>
          <Text style={styles.serverStatText}>{server.members} miembros</Text>
        </View>
      </View>

      {/* Right: chevron */}
      <Ionicons name="chevron-forward" size={18} color="rgba(143, 132, 224, 0.40)" />
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ParchesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"amigos" | "parches">("amigos");
  const [searchQuery, setSearchQuery] = useState("");
  const tabAnim = useRef(new Animated.Value(0)).current;

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

  const filteredFriends = FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServers = SERVERS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top bar: heart left | divider | avatar right ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.topHeart}>
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
        {/* Animated sliding indicator */}
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
          {/* Recent section */}
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

          {/* All friends */}
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
                <Ionicons
                  name="person-outline"
                  size={32}
                  color="rgba(143,132,224,0.3)"
                />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            )}
          </View>

          {/* Bottom padding for nav bar */}
          <View style={{ height: 110 }} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Discover section */}
          <Text style={styles.sectionLabel}>MIS PARCHES</Text>
          <View style={styles.serverList}>
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
            {filteredServers.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="grid-outline"
                  size={32}
                  color="rgba(143,132,224,0.3)"
                />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            )}
          </View>

          {/* Create server CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.createServerBtn,
              pressed && { opacity: 0.8 },
            ]}
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
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(143, 132, 224, 0.40)"
            />
          </Pressable>

          {/* Bottom padding for nav bar */}
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
    gap: 8,
  },
  serverName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 11,
    fontWeight: "700",
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
  serverStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serverStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serverStatText: {
    color: "rgba(180, 180, 210, 0.50)",
    fontSize: 11,
    fontWeight: "400",
  },
  serverStatSep: {
    color: "rgba(180, 180, 210, 0.30)",
    fontSize: 11,
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
