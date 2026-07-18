import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { parcheService } from "@/services/parcheService";
import { UserAvatar } from "@/components/UserAvatar";
import type {
  ParcheSummaryResponse,
  ParcheCategory,
  UUID,
} from "@/services/types";
import { useFocusEffect } from "expo-router";

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
  const [searchQuery, setSearchQuery] = useState("");

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
    } catch {
      // Ignore
    } finally {
      setLoadingParches(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchParches();
    }, [fetchParches])
  );

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
        <UserAvatar
          size={42}
          style={styles.topAvatar}
          onPress={() => router.push("/profile")}
        />
      </View>

      {/* ── Page title ── */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Mis Parches</Text>
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
          placeholder="Buscar parche..."
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

      {/* ── Content ── */}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
