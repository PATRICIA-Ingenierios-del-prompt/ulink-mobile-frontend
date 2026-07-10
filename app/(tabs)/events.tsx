import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  accentColor: string;
  attendees: number;
  going: boolean;
}

const EVENTS: Event[] = [
  {
    id: "e1",
    title: "Hackathon ECI 2026",
    date: "Sáb 12 Jul",
    time: "8:00 AM",
    location: "Salón Principal",
    category: "Tecnología",
    accentColor: "rgba(99, 102, 241, 1)",
    attendees: 148,
    going: true,
  },
  {
    id: "e2",
    title: "Torneo de Fútbol",
    date: "Dom 13 Jul",
    time: "10:00 AM",
    location: "Cancha Norte",
    category: "Deportes",
    accentColor: "rgba(35, 165, 89, 1)",
    attendees: 64,
    going: false,
  },
  {
    id: "e3",
    title: "Charla: IA en la Ingeniería",
    date: "Mar 15 Jul",
    time: "4:00 PM",
    location: "Auditorio B",
    category: "Académico",
    accentColor: "rgba(240, 178, 50, 1)",
    attendees: 92,
    going: true,
  },
  {
    id: "e4",
    title: "Jam Session Campus",
    date: "Vie 18 Jul",
    time: "6:00 PM",
    location: "Plaza Central",
    category: "Arte",
    accentColor: "rgba(168, 85, 247, 1)",
    attendees: 37,
    going: false,
  },
  {
    id: "e5",
    title: "Feria de Emprendimiento",
    date: "Sáb 19 Jul",
    time: "9:00 AM",
    location: "Lobby Principal",
    category: "Negocios",
    accentColor: "rgba(236, 72, 153, 1)",
    attendees: 210,
    going: false,
  },
];

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const accentFaint = event.accentColor.replace("1)", "0.12)");
  const accentBorder = event.accentColor.replace("1)", "0.28)");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.eventCard,
        { borderColor: accentBorder },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.eventAccentBar, { backgroundColor: event.accentColor }]} />

      {/* Content */}
      <View style={styles.eventContent}>
        {/* Category chip */}
        <View style={[styles.eventCategoryChip, { backgroundColor: accentFaint, borderColor: accentBorder }]}>
          <Text style={[styles.eventCategoryText, { color: event.accentColor }]}>
            {event.category}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>

        {/* Meta row */}
        <View style={styles.eventMeta}>
          <View style={styles.eventMetaItem}>
            <Ionicons name="calendar-outline" size={12} color="rgba(143, 132, 224, 0.7)" />
            <Text style={styles.eventMetaText}>{event.date}</Text>
          </View>
          <View style={styles.eventMetaSep} />
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={12} color="rgba(143, 132, 224, 0.7)" />
            <Text style={styles.eventMetaText}>{event.time}</Text>
          </View>
          <View style={styles.eventMetaSep} />
          <View style={styles.eventMetaItem}>
            <Ionicons name="location-outline" size={12} color="rgba(143, 132, 224, 0.7)" />
            <Text style={styles.eventMetaText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>

        {/* Attendees + Going btn */}
        <View style={styles.eventFooter}>
          <View style={styles.attendeesRow}>
            <Ionicons name="people-outline" size={13} color="rgba(180, 180, 210, 0.5)" />
            <Text style={styles.attendeesText}>{event.attendees} asistentes</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.goingBtn,
              event.going
                ? [styles.goingBtnActive, { backgroundColor: accentFaint, borderColor: accentBorder }]
                : styles.goingBtnInactive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={[
                styles.goingBtnText,
                event.going
                  ? { color: event.accentColor }
                  : styles.goingBtnTextInactive,
              ]}
            >
              {event.going ? "✓ Voy" : "Ir"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top bar: calendar left | divider | avatar right ── */}
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
        <Text style={styles.mainTitle}>Eventos</Text>
      </View>

      {/* ── Events list ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>PRÓXIMOS</Text>
        <View style={styles.eventList}>
          {EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>

        {/* Bottom padding for nav bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

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
    paddingBottom: 12,
  },
  mainTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
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

  // ── Event list ──
  eventList: {
    gap: 12,
  },

  // ── Event card ──
  eventCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.025)",
    overflow: "hidden",
  },
  eventAccentBar: {
    width: 4,
    borderRadius: 2,
    margin: 12,
    marginRight: 0,
    flexShrink: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  eventContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  eventCategoryChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  eventCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  eventTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventMetaText: {
    color: "rgba(180, 180, 210, 0.65)",
    fontSize: 11,
    fontWeight: "400",
  },
  eventMetaSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(143, 132, 224, 0.25)",
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attendeesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  attendeesText: {
    color: "rgba(180, 180, 210, 0.45)",
    fontSize: 11,
    fontWeight: "400",
  },
  goingBtn: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  goingBtnActive: {},
  goingBtnInactive: {
    borderColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  goingBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  goingBtnTextInactive: {
    color: "rgba(180, 180, 210, 0.55)",
  },
});
