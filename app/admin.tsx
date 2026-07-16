import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin";
import { useReports } from "@/context/ReportsContext";

// ── Mock admin data (matching web frontend) ───────────────────────────────────

const CARRERA_BREAKDOWN: { carrera: string; count: number }[] = [
  { carrera: "Ingeniería de Sistemas", count: 142 },
  { carrera: "Ingeniería Electrónica", count: 68 },
  { carrera: "Ingeniería Mecánica", count: 54 },
  { carrera: "Diseño de Software", count: 47 },
  { carrera: "Matemáticas Aplicadas", count: 31 },
  { carrera: "Física", count: 28 },
  { carrera: "Ingeniería Civil", count: 25 },
  { carrera: "Ingeniería Ambiental", count: 22 },
];

const TOTAL_USERS = CARRERA_BREAKDOWN.reduce((s, c) => s + c.count, 0);
const TOTAL_PARCHES = 356;

const RECENT_SIGNUPS = [
  { name: "Sofía Vélez", carrera: "Ingeniería de Sistemas", date: "Hace 2h" },
  { name: "Mateo Ospina", carrera: "Física", date: "Hace 5h" },
  { name: "Isabella Cardona", carrera: "Ingeniería de Sistemas", date: "Hace 8h" },
  { name: "Diego Ramírez", carrera: "Matemáticas Aplicadas", date: "Hace 12h" },
];

// ── Support messages (mock) ──────────────────────────────────────────────────

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  status: "pendiente" | "resuelto";
}

const MOCK_SUPPORT: SupportMessage[] = [
  {
    id: "s1",
    name: "Carlos Pérez",
    email: "carlos@mail.escuelaing.edu.co",
    message: "No puedo unirme a parches privados, me sale error 403.",
    date: "2026-07-12",
    status: "pendiente",
  },
  {
    id: "s2",
    name: "María López",
    email: "maria@mail.escuelaing.edu.co",
    message: "¿Cómo puedo cambiar mi foto de perfil?",
    date: "2026-07-11",
    status: "resuelto",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

type AdminTab = "resumen" | "reportes" | "soporte";

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userEmail } = useAuth();
  const { reports, resolveReport, pendingCount } = useReports();
  const [activeTab, setActiveTab] = useState<AdminTab>("resumen");
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(MOCK_SUPPORT);

  const isAdmin = isAdminEmail(userEmail);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>Admin</Text>
        </View>
        <View style={styles.restrictedContainer}>
          <Ionicons name="shield-checkmark" size={48} color="rgba(90, 90, 104, 0.4)" />
          <Text style={styles.restrictedTitle}>Acceso restringido</Text>
          <Text style={styles.restrictedText}>
            No tienes permisos de administrador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedReports = [...reports].sort((a, b) => {
    if (a.status === "pendiente" && b.status !== "pendiente") return -1;
    if (a.status !== "pendiente" && b.status === "pendiente") return 1;
    return b.date.localeCompare(a.date);
  });

  const sortedSupport = [...supportMessages].sort((a, b) => {
    if (a.status === "pendiente" && b.status !== "pendiente") return -1;
    if (a.status !== "pendiente" && b.status === "pendiente") return 1;
    return b.date.localeCompare(a.date);
  });

  const pendingSupport = supportMessages.filter((m) => m.status === "pendiente").length;

  const resolveSupport = (id: string) => {
    setSupportMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "resuelto" as const } : m))
    );
  };

  const maxBarCount = Math.max(...CARRERA_BREAKDOWN.map((c) => c.count));

  return (
    <SafeAreaView style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color="rgba(35, 165, 89, 1)" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["resumen", "reportes", "soporte"] as AdminTab[]).map((tab) => {
          const label = tab === "reportes" ? `Reportes (${pendingCount})` : tab === "soporte" ? `Soporte (${pendingSupport})` : "Resumen";
          return (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Resumen Tab ── */}
        {activeTab === "resumen" && (
          <>
            <View style={styles.statsRow}>
              <StatTile icon="people" label="Usuarios" value={TOTAL_USERS} color="rgba(99, 102, 241, 1)" />
              <StatTile icon="grid" label="Parches" value={TOTAL_PARCHES} color="rgba(127, 231, 196, 1)" />
              <StatTile icon="flag" label="Pendientes" value={pendingCount} color="rgba(248, 113, 113, 1)" />
            </View>

            <Text style={styles.sectionTitle}>Usuarios por carrera</Text>
            <View style={styles.chartCard}>
              {CARRERA_BREAKDOWN.map((c) => (
                <View key={c.carrera} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{c.carrera}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(c.count / maxBarCount) * 100}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{c.count}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Registros recientes</Text>
            <View style={styles.card}>
              {RECENT_SIGNUPS.map((u, i) => (
                <View key={i} style={[styles.signupRow, i < RECENT_SIGNUPS.length - 1 && styles.signupRowBorder]}>
                  <View style={styles.signupAvatar}>
                    <Text style={styles.signupAvatarText}>{u.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.signupInfo}>
                    <Text style={styles.signupName}>{u.name}</Text>
                    <Text style={styles.signupCarrera}>{u.carrera}</Text>
                  </View>
                  <Text style={styles.signupDate}>{u.date}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Reportes Tab ── */}
        {activeTab === "reportes" && (
          <>
            {sortedReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color="rgba(35, 165, 89, 0.5)" />
                <Text style={styles.emptyText}>No hay reportes</Text>
              </View>
            ) : (
              sortedReports.map((r) => (
                <View key={r.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportName}>{r.reportedUserName}</Text>
                    <View style={[styles.statusBadge, r.status === "pendiente" ? styles.statusPending : styles.statusResolved]}>
                      <Text style={[styles.statusText, r.status === "pendiente" ? styles.statusTextPending : styles.statusTextResolved]}>
                        {r.status === "pendiente" ? "Pendiente" : "Resuelto"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportMeta}>{r.parcheName} · {r.date}</Text>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{r.category}</Text>
                  </View>
                  <Text style={styles.reportDesc}>{r.description}</Text>
                  {r.status === "pendiente" && (
                    <Pressable style={styles.resolveBtn} onPress={() => resolveReport(r.id)}>
                      <Text style={styles.resolveBtnText}>Marcar como resuelto</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ── Soporte Tab ── */}
        {activeTab === "soporte" && (
          <>
            {sortedSupport.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color="rgba(35, 165, 89, 0.5)" />
                <Text style={styles.emptyText}>No hay mensajes de soporte</Text>
              </View>
            ) : (
              sortedSupport.map((m) => (
                <View key={m.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportName}>{m.name}</Text>
                    <View style={[styles.statusBadge, m.status === "pendiente" ? styles.statusPending : styles.statusResolved]}>
                      <Text style={[styles.statusText, m.status === "pendiente" ? styles.statusTextPending : styles.statusTextResolved]}>
                        {m.status === "pendiente" ? "Pendiente" : "Resuelto"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportMeta}>{m.email} · {m.date}</Text>
                  <Text style={styles.reportDesc}>{m.message}</Text>
                  {m.status === "pendiente" && (
                    <Pressable style={styles.resolveBtn} onPress={() => resolveSupport(m.id)}>
                      <Text style={styles.resolveBtnText}>Marcar como resuelto</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────

function StatTile({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backBtn: {
    width: 32, height: 32, justifyContent: "center", alignItems: "center",
    borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTitle: { flex: 1, color: "rgba(236, 237, 248, 1)", fontSize: 17, fontWeight: "600", marginLeft: 12 },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
    backgroundColor: "rgba(35, 165, 89, 0.12)",
  },
  adminBadgeText: { color: "rgba(35, 165, 89, 1)", fontSize: 11, fontWeight: "600" },

  restrictedContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  restrictedTitle: { color: "rgba(236, 237, 248, 1)", fontSize: 18, fontWeight: "600" },
  restrictedText: { color: "rgba(90, 90, 104, 1)", fontSize: 14 },

  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 6, paddingVertical: 10 },
  tabBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.06)",
  },
  tabBtnActive: { borderColor: "rgba(99, 102, 241, 0.3)", backgroundColor: "rgba(99, 102, 241, 0.15)" },
  tabText: { color: "rgba(90, 90, 104, 1)", fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: "rgba(129, 140, 248, 1)" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statTile: {
    flex: 1, alignItems: "center", padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.03)", gap: 6,
  },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statValue: { color: "rgba(236, 237, 248, 1)", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "rgba(90, 90, 104, 1)", fontSize: 11 },

  sectionTitle: {
    color: "rgba(90, 90, 104, 1)", fontSize: 11, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  chartCard: {
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.03)",
    gap: 8, marginBottom: 24,
  },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 120, color: "rgba(143, 132, 224, 0.8)", fontSize: 11 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255, 255, 255, 0.04)" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: "rgba(99, 102, 241, 0.6)" },
  barCount: { width: 30, color: "rgba(90, 90, 104, 1)", fontSize: 11, textAlign: "right" },

  card: {
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  signupRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  signupRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.04)" },
  signupAvatar: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center", alignItems: "center",
  },
  signupAvatarText: { color: "rgba(129, 140, 248, 1)", fontSize: 13, fontWeight: "600" },
  signupInfo: { flex: 1 },
  signupName: { color: "rgba(236, 237, 248, 1)", fontSize: 13, fontWeight: "500" },
  signupCarrera: { color: "rgba(90, 90, 104, 1)", fontSize: 11 },
  signupDate: { color: "rgba(90, 90, 104, 1)", fontSize: 11 },

  reportCard: {
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginBottom: 10, gap: 8,
  },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportName: { color: "rgba(236, 237, 248, 1)", fontSize: 14, fontWeight: "600" },
  reportMeta: { color: "rgba(90, 90, 104, 1)", fontSize: 11 },
  categoryTag: {
    alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
  },
  categoryTagText: { color: "rgba(248, 113, 113, 1)", fontSize: 11, fontWeight: "500" },
  reportDesc: { color: "rgba(143, 132, 224, 0.8)", fontSize: 13, lineHeight: 18 },

  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
  statusPending: { backgroundColor: "rgba(255, 179, 71, 0.12)" },
  statusResolved: { backgroundColor: "rgba(127, 231, 196, 0.12)" },
  statusText: { fontSize: 11, fontWeight: "500" },
  statusTextPending: { color: "rgba(255, 179, 71, 1)" },
  statusTextResolved: { color: "rgba(127, 231, 196, 1)" },

  resolveBtn: {
    alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(35, 165, 89, 0.3)", backgroundColor: "rgba(35, 165, 89, 0.08)", marginTop: 4,
  },
  resolveBtnText: { color: "rgba(35, 165, 89, 1)", fontSize: 12, fontWeight: "500" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { color: "rgba(90, 90, 104, 1)", fontSize: 14 },
});
