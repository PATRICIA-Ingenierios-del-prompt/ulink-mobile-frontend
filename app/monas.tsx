import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MonoCard {
  id: number;
  number: string;
  name: string;
  rarity: "RARO" | "ÉPICO" | "LEGENDARIO";
  accentColor: string;
  locked: boolean;
  imagePlaceholder: string;
}

const DEFAULT_MONOS: MonoCard[] = [
  {
    id: 1,
    number: "01",
    name: "MONO CODER",
    rarity: "RARO",
    accentColor: "rgba(129, 140, 248, 1)",
    locked: true,
    imagePlaceholder: "💻",
  },
  {
    id: 2,
    number: "02",
    name: "MONO DJ",
    rarity: "ÉPICO",
    accentColor: "rgba(6, 182, 212, 1)",
    locked: true,
    imagePlaceholder: "🎧",
  },
  {
    id: 3,
    number: "03",
    name: "MONO CIENTÍFICO",
    rarity: "LEGENDARIO",
    accentColor: "rgba(16, 185, 129, 1)",
    locked: true,
    imagePlaceholder: "🔬",
  },
  {
    id: 4,
    number: "04",
    name: "MONO CULTURA",
    rarity: "RARO",
    accentColor: "rgba(240, 178, 50, 1)",
    locked: true,
    imagePlaceholder: "📚",
  },
  {
    id: 5,
    number: "05",
    name: "MONO DEPORTISTA",
    rarity: "ÉPICO",
    accentColor: "rgba(244, 63, 94, 1)",
    locked: true,
    imagePlaceholder: "⚽",
  },
  {
    id: 6,
    number: "06",
    name: "MONO GAMER",
    rarity: "LEGENDARIO",
    accentColor: "rgba(168, 85, 247, 1)",
    locked: true,
    imagePlaceholder: "🎮",
  },
];

// ─── Mono Card Component ─────────────────────────────────────────────────────

function MonoCardView({ mono }: { mono: MonoCard }) {
  return (
    <Pressable 
      style={[styles.monoCard, { borderColor: mono.accentColor.replace("1)", "0.4)") }]}
      onPress={() => {
        if (!mono.locked) {
          Alert.alert(mono.name, `¡Tienes este mono en tu colección!\nRareza: ${mono.rarity}`);
        } else {
          Alert.alert("Bloqueado", "Abre sobres para intentar conseguir este mono.");
        }
      }}
    >
      {/* Card header: number + brand */}
      <View style={styles.monoCardHeader}>
        <View style={[styles.monoCardNumber, { backgroundColor: mono.accentColor }]}>
          <Text style={styles.monoCardNumberText}>{mono.number}</Text>
        </View>
        <View style={styles.monoCardBrandWrap}>
          <Text style={styles.monoCardBrand}>U·link</Text>
        </View>
      </View>

      {/* Image placeholder */}
      <View style={styles.monoCardImageArea}>
        <Text style={styles.monoCardImagePlaceholder}>{mono.imagePlaceholder}</Text>
      </View>

      {/* Rarity badge */}
      <View style={styles.monoCardRarityRow}>
        <View style={[styles.monoCardRarityIcon, { backgroundColor: mono.accentColor.replace("1)", "0.2)") }]}>
          <Ionicons
            name={mono.rarity === "LEGENDARIO" ? "star" : mono.rarity === "ÉPICO" ? "diamond" : "flame"}
            size={10}
            color={mono.accentColor}
          />
        </View>
        <Text style={[styles.monoCardRarity, { color: mono.accentColor }]}>{mono.rarity}</Text>
      </View>

      {/* Card name */}
      <View style={styles.monoCardNameWrap}>
        <Text style={styles.monoCardName}>{mono.name}</Text>
      </View>

      {/* Locked overlay */}
      {mono.locked && (
        <View style={styles.monoCardLockedOverlay}>
          <View style={styles.monoCardLockIconWrap}>
            <Ionicons name="lock-closed" size={22} color="rgba(255, 255, 255, 0.4)" />
          </View>
          <Text style={styles.monoCardLockedLabel}>Bloqueado</Text>
        </View>
      )}

      {/* Bottom glow line */}
      <View style={[styles.monoCardGlowLine, { backgroundColor: mono.accentColor }]} />
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MonasScreen() {
  const router = useRouter();
  const [monos, setMonos] = useState<MonoCard[]>(DEFAULT_MONOS);

  useEffect(() => {
    loadMonos();
  }, []);

  const loadMonos = async () => {
    try {
      const saved = await SecureStore.getItemAsync("unlocked_monos");
      if (saved) {
        const unlockedIds = JSON.parse(saved) as number[];
        setMonos((prev) =>
          prev.map((m) => (unlockedIds.includes(m.id) ? { ...m, locked: false } : m))
        );
      }
    } catch (err) {
      console.error("Failed to load monos", err);
    }
  };

  const openPack = async () => {
    const lockedMonos = monos.filter((m) => m.locked);
    if (lockedMonos.length === 0) {
      Alert.alert("¡Felicidades!", "Ya tienes todos los monos disponibles.");
      return;
    }

    // Pick a random locked mono
    const randomIndex = Math.floor(Math.random() * lockedMonos.length);
    const newMono = lockedMonos[randomIndex];

    const updatedMonos = monos.map((m) =>
      m.id === newMono.id ? { ...m, locked: false } : m
    );
    setMonos(updatedMonos);

    const unlockedIds = updatedMonos.filter((m) => !m.locked).map((m) => m.id);
    await SecureStore.setItemAsync("unlocked_monos", JSON.stringify(unlockedIds));

    Alert.alert(
      "¡Sobre Abierto!",
      `Has desbloqueado: ${newMono.name} (${newMono.rarity}) ${newMono.imagePlaceholder}`
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Colección</Text>
          <Text style={styles.headerTitle}>Álbum de Monos</Text>
        </View>
        <Pressable 
          style={styles.headerBtn}
          onPress={() => {
            Alert.alert("Opciones", "Selecciona una acción:", [
              { 
                text: "Reiniciar colección", 
                onPress: async () => { 
                  await SecureStore.deleteItemAsync("unlocked_monos"); 
                  setMonos(DEFAULT_MONOS);
                  Alert.alert("Colección reiniciada", "Tu álbum está en cero nuevamente.");
                } 
              },
              { text: "Cancelar", style: "cancel" }
            ]);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── User Card ── */}
        <View style={styles.userCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressStats}>
              <Text style={styles.progressValue}>
                {Math.round((monos.filter((m) => !m.locked).length / monos.length) * 100)}%
              </Text>
              <Text style={styles.progressLabel}>Completado</Text>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: `${(monos.filter((m) => !m.locked).length / monos.length) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* ── Available Section ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>Disponibles</Text>
            <Text style={styles.sectionTitle}>MONOS U·LINK</Text>
          </View>
          <Pressable style={styles.openPackButton} onPress={openPack}>
            <Text style={styles.openPackButtonText}>Abrir Sobre</Text>
          </Pressable>
          <Pressable 
            style={styles.sectionInfoBtn}
            onPress={() => Alert.alert("Información", "Aquí puedes ver tu colección de Monos U-Link. ¡Abre sobres para desbloquear nuevos monos raros, épicos y legendarios!")}
          >
            <Ionicons name="information-circle-outline" size={22} color="rgba(99, 102, 241, 0.6)" />
          </Pressable>
        </View>

        {/* ── Mono Cards Grid ── */}
        <View style={styles.grid}>
          {monos.map((mono) => (
            <View key={mono.id} style={styles.gridItem}>
              <MonoCardView mono={mono} />
            </View>
          ))}
        </View>

        {/* ── Navigation Menu ── */}
        <Text style={styles.navSectionLabel}>Navegación</Text>
        <View style={styles.navMenu}>
          <Pressable
            style={({ pressed }) => [styles.navMenuItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
            onPress={() => Alert.alert("Descubrir", "Pronto podrás encontrar monos escondidos en el mapa de la ECI.")}
          >
            <View style={styles.navMenuIcon}>
              <Ionicons name="compass" size={18} color="rgba(236, 237, 248, 0.7)" />
            </View>
            <Text style={styles.navMenuText}>Descubrir</Text>
          </Pressable>

          <View style={styles.navMenuDivider} />

          <Pressable
            style={({ pressed }) => [styles.navMenuItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
            onPress={() => router.push("/(tabs)/parches")}
          >
            <View style={styles.navMenuIcon}>
              <Ionicons name="people" size={18} color="rgba(236, 237, 248, 0.7)" />
            </View>
            <Text style={styles.navMenuText}>Parches</Text>
            <View style={styles.navMenuBadge}>
              <Text style={styles.navMenuBadgeText}>5</Text>
            </View>
          </Pressable>

          <View style={styles.navMenuDivider} />

          <Pressable
            style={({ pressed }) => [styles.navMenuItem, pressed && { backgroundColor: "rgba(255, 255, 255, 0.04)" }]}
            onPress={() => router.push("/settings")}
          >
            <View style={styles.navMenuIcon}>
              <Ionicons name="settings" size={18} color="rgba(236, 237, 248, 0.7)" />
            </View>
            <Text style={styles.navMenuText}>Ajustes</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerLabel: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: -0.3,
  },

  // ── User Card ──
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    gap: 12,
  },
  userCardLeft: {},
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(99, 102, 241, 0.4)",
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    elevation: 8,
  },
  userAvatarText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  userCardCenter: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    fontWeight: "700",
  },
  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(240, 178, 50, 0.25)",
    backgroundColor: "rgba(240, 178, 50, 0.12)",
    gap: 3,
  },
  collectionBadgeText: {
    color: "rgba(240, 178, 50, 1)",
    fontSize: 9,
    fontWeight: "700",
  },
  userCareer: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 11,
    marginTop: 4,
  },
  userAchievements: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.24)",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  userAchievementsCount: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 16,
    fontWeight: "800",
  },
  userAchievementsLabel: {
    color: "rgba(129, 140, 248, 0.6)",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    color: "rgba(143, 132, 224, 0.55)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginTop: 2,
  },
  sectionInfoBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Mono Cards Grid ──
  monoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  monoCard: {
    width: "47%",
    aspectRatio: 0.7,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  monoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  monoCardNumber: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  monoCardNumberText: {
    color: "rgba(11, 13, 24, 1)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  monoCardBrandWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },
  monoCardBrand: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  monoCardImageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  monoCardImagePlaceholder: {
    fontSize: 48,
    opacity: 0.6,
  },
  monoCardRarityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  monoCardRarityIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  monoCardRarity: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  monoCardNameWrap: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  monoCardName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  monoCardLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 13, 24, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    gap: 8,
  },
  monoCardLockIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  monoCardLockedLabel: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  monoCardGlowLine: {
    height: 2,
    opacity: 0.8,
    marginHorizontal: 1,
    marginBottom: 1,
    borderRadius: 1,
  },

  // ── Navigation Menu ──
  navSectionLabel: {
    color: "rgba(143, 132, 224, 0.55)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 10,
  },
  navMenu: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
  },
  navMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  navMenuIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  navMenuText: {
    flex: 1,
    color: "rgba(236, 237, 248, 0.7)",
    fontSize: 14,
  },
  navMenuBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(240, 178, 50, 1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(240, 178, 50, 0.5)",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 4,
  },
  navMenuBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  navMenuDivider: {
    height: 1,
    marginLeft: 62,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },

  // ── Progress ──
  progressRow: {
    flex: 1,
    gap: 8,
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressValue: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 18,
    fontWeight: "800",
  },
  progressLabel: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  progressBarWrap: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden" as const,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(99, 102, 241, 0.8)",
  },

  // ── Open Pack ──
  openPackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(240, 178, 50, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(240, 178, 50, 0.4)",
  },
  openPackButtonText: {
    color: "rgba(240, 178, 50, 1)",
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  gridItem: {
    width: "47%",
  },
});
