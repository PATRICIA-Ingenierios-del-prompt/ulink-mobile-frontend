import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { eventService, type EventMapResponse } from "@/services/eventService";
import { UserAvatar } from "@/components/UserAvatar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Data ─────────────────────────────────────────────────────────────────────

type Category = "Todos" | "Académico" | "Social" | "Bienestar" | "Deportivo" | "Cultural";

const CATEGORIES: Category[] = ["Todos", "Académico", "Social", "Bienestar", "Deportivo", "Cultural"];

const CATEGORY_MAP: Record<string, Category> = {
  ACADEMIC: "Académico",
  SOCIAL: "Social",
  WELLNESS: "Bienestar",
  SPORT: "Deportivo",
  CULTURAL: "Cultural",
  MUSIC: "Cultural",
  ENTERTAINMENT: "Social",
  VARIETY: "Social",
  ART: "Cultural",
  STUDY: "Académico",
  SPORTS: "Deportivo",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMIC: "rgba(59, 140, 245, 1)",
  SOCIAL: "rgba(35, 165, 89, 1)",
  WELLNESS: "rgba(129, 140, 248, 1)",
  SPORT: "rgba(240, 178, 50, 1)",
  CULTURAL: "rgba(251, 146, 60, 1)",
  MUSIC: "rgba(255, 107, 157, 1)",
  ENTERTAINMENT: "rgba(91, 200, 255, 1)",
  VARIETY: "rgba(99, 102, 241, 1)",
  ART: "rgba(167, 139, 250, 1)",
  STUDY: "rgba(59, 140, 245, 1)",
  SPORTS: "rgba(240, 178, 50, 1)",
};

const CATEGORY_EMOJI: Record<string, string> = {
  ACADEMIC: "📚",
  SOCIAL: "🎉",
  WELLNESS: "🧘",
  SPORT: "⚽",
  CULTURAL: "🎭",
  MUSIC: "🎵",
  ENTERTAINMENT: "🎮",
  VARIETY: "🍕",
  ART: "🎨",
  STUDY: "📖",
  SPORTS: "🏃",
};

interface MapPin {
  id: string;
  emoji: string;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  top: number;
  left: number;
}

// Campus map "buildings" as abstract rectangles
const BUILDINGS = [
  { top: 40, left: 15, w: 90, h: 50, opacity: 0.07 },
  { top: 40, left: 125, w: 60, h: 35, opacity: 0.06 },
  { top: 40, left: 205, w: 110, h: 45, opacity: 0.08 },
  { top: 110, left: 15, w: 70, h: 60, opacity: 0.06 },
  { top: 110, left: 105, w: 85, h: 55, opacity: 0.07 },
  { top: 110, left: 210, w: 100, h: 40, opacity: 0.05 },
  { top: 190, left: 15, w: 55, h: 50, opacity: 0.07 },
  { top: 190, left: 90, w: 95, h: 65, opacity: 0.06 },
  { top: 190, left: 205, w: 105, h: 55, opacity: 0.08 },
  { top: 270, left: 15, w: 75, h: 60, opacity: 0.06 },
  { top: 270, left: 110, w: 60, h: 45, opacity: 0.07 },
  { top: 270, left: 190, w: 120, h: 50, opacity: 0.05 },
  { top: 350, left: 15, w: 295, h: 35, opacity: 0.05 }, // Paths / roads
  { top: 160, left: 15, w: 295, h: 12, opacity: 0.04 }, // Horizontal road
  { top: 40, left: 100, w: 12, h: 330, opacity: 0.04 }, // Vertical road
  { top: 40, left: 200, w: 10, h: 330, opacity: 0.04 }, // Vertical road 2
];

// ─── Pin component ────────────────────────────────────────────────────────────

function MapPinMarker({ pin, onPress }: { pin: MapPin; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.pinWrap, { top: pin.top, left: pin.left }]}
      onPress={onPress}
    >
      {/* Circle marker */}
      <View style={[styles.pinDot, { backgroundColor: pin.color, shadowColor: pin.color }]} />
      {/* Tail */}
      <View style={[styles.pinTail, { backgroundColor: pin.color }]} />
    </Pressable>
  );
}

function PinLabel({ pin }: { pin: MapPin }) {
  return (
    <View
      style={[
        styles.pinLabel,
        {
          borderColor: pin.borderColor,
          backgroundColor: pin.bgColor,
          top: pin.top - 6,
          left: pin.left + 34,
        },
      ]}
    >
      <Text style={styles.pinLabelEmoji}>{pin.emoji}</Text>
      <Text style={[styles.pinLabelText, { color: pin.color }]} numberOfLines={1}>
        {pin.label}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<Category>("Todos");
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [events, setEvents] = useState<EventMapResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const MAP_WIDTH = SCREEN_WIDTH - 32;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.publicMap({ page: 0, size: 50 });
      setEvents(data.content || []);
    } catch (err) {
      console.log("[EVENTS] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = activeCategory === "Todos"
    ? events
    : events.filter(e => CATEGORY_MAP[e.category] === activeCategory);

  const mapPins: MapPin[] = filteredEvents.slice(0, 5).map((e, i) => {
    const color = CATEGORY_COLORS[e.category] || "rgba(99, 102, 241, 1)";
    const positions = [
      { top: 65, left: 30 },
      { top: 120, left: 170 },
      { top: 185, left: 60 },
      { top: 240, left: 210 },
      { top: 310, left: 100 },
    ];
    return {
      id: e.eventId,
      emoji: CATEGORY_EMOJI[e.category] || "🎉",
      label: e.locationName || e.title,
      color,
      borderColor: color.replace("1)", "0.35)"),
      bgColor: color.replace("1)", "0.12)"),
      ...positions[i],
    };
  });

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top bar: leaf | divider | avatar ── */}
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

      {/* ── Header: title + Crear button ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.mainTitle}>Eventos ECI</Text>
          <Text style={styles.subtitle}>Descubre y únete a lo que pasa en tu campus</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.crearBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add" size={16} color="rgba(255,255,255,1)" />
          <Text style={styles.crearBtnText}>Crear</Text>
        </Pressable>
      </View>

      {/* ── Category filter pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryPill,
              activeCategory === cat ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === cat ? styles.categoryPillTextActive : styles.categoryPillTextInactive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Campus map ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mapCard, { width: MAP_WIDTH }]}>
          {/* Abstract campus grid background */}
          <View style={styles.mapInner}>
            {/* Road lines */}
            <View style={styles.roadH} />
            <View style={styles.roadH2} />
            <View style={styles.roadV} />
            <View style={styles.roadV2} />

            {/* Building blocks */}
            {BUILDINGS.map((b, i) => (
              <View
                key={i}
                style={[
                  styles.building,
                  {
                    top: b.top,
                    left: b.left,
                    width: b.w,
                    height: b.h,
                    backgroundColor: `rgba(255,255,255,${b.opacity})`,
                  },
                ]}
              />
            ))}

            {/* Map pins + labels */}
            {mapPins.map((pin) => (
              <React.Fragment key={pin.id}>
                <MapPinMarker
                  pin={pin}
                  onPress={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)}
                />
                <PinLabel pin={pin} />
              </React.Fragment>
            ))}

            {/* "ECI" watermark */}
            <Text style={styles.mapWatermark}>ECI</Text>
          </View>
        </View>

        {/* Hint text */}
        <Text style={styles.mapHint}>
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} en el mapa · toca un pin para ver el detalle
        </Text>

        {/* Events list */}
        {filteredEvents.length > 0 && (
          <View style={styles.eventsList}>
            <Text style={styles.eventsListTitle}>Próximos eventos</Text>
            {filteredEvents.slice(0, 10).map((event) => {
              const color = CATEGORY_COLORS[event.category] || "rgba(99, 102, 241, 1)";
              const emoji = CATEGORY_EMOJI[event.category] || "🎉";
              return (
                <Pressable
                  key={event.eventId}
                  style={styles.eventCard}
                  onPress={() => router.push({ pathname: '/event-detail', params: { id: event.eventId } })}
                >
                  <View style={[styles.eventEmojiWrap, { backgroundColor: color.replace("1)", "0.15)") }]}>
                    <Text style={styles.eventEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventLocation} numberOfLines={1}>{event.locationName || "Sin ubicación"}</Text>
                  </View>
                  <View style={styles.eventMeta}>
                    <Text style={[styles.eventParticipants, { color }]}>
                      {event.currentParticipants}/{event.maxParticipants}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Selected pin detail card */}
        {selectedPin && (() => {
          const pin = mapPins.find(p => p.id === selectedPin);
          const event = events.find(e => e.eventId === selectedPin);
          if (!pin || !event) return null;
          return (
            <View style={[styles.pinDetailCard, { borderColor: pin.borderColor, backgroundColor: pin.bgColor }]}>
              <View style={styles.pinDetailLeft}>
                <Text style={styles.pinDetailEmoji}>{pin.emoji}</Text>
                <View>
                  <Text style={[styles.pinDetailLabel, { color: pin.color }]}>{event.title}</Text>
                  <Text style={styles.pinDetailSub}>{event.locationName || "Sin ubicación"}</Text>
                </View>
              </View>
              <Pressable 
                style={[styles.pinDetailBtn, { borderColor: pin.borderColor }]}
                onPress={() => router.push({ pathname: '/event-detail', params: { id: event.eventId } })}
              >
                <Text style={[styles.pinDetailBtnText, { color: pin.color }]}>Ver</Text>
              </Pressable>
            </View>
          );
        })()}

        {/* Bottom padding for nav bar */}
        <View style={{ height: 120 }} />
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

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  mainTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 16,
    marginTop: 2,
  },
  crearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 1)",
  },
  crearBtnText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Category pills ──
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: "rgba(99, 102, 241, 1)",
  },
  categoryPillInactive: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  categoryPillTextActive: {
    color: "rgba(255, 255, 255, 1)",
  },
  categoryPillTextInactive: {
    color: "rgba(90, 90, 104, 1)",
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },

  // ── Campus map card ──
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    overflow: "hidden",
    height: 400,
  },
  mapInner: {
    flex: 1,
    backgroundColor: "rgba(14, 17, 35, 1)",
    position: "relative",
  },
  // Roads
  roadH: {
    position: "absolute",
    top: 158,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  roadH2: {
    position: "absolute",
    top: 270,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  roadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 105,
    width: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  roadV2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 205,
    width: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  building: {
    position: "absolute",
    borderRadius: 4,
  },
  // Pin
  pinWrap: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  pinDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pinTail: {
    width: 2,
    height: 6,
  },
  pinLabel: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 3,
    zIndex: 9,
  },
  pinLabelEmoji: {
    fontSize: 10,
  },
  pinLabelText: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 15,
  },
  // Map watermark
  mapWatermark: {
    position: "absolute",
    bottom: 12,
    right: 16,
    fontSize: 32,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.04)",
    letterSpacing: 4,
  },

  // ── Hint ──
  mapHint: {
    color: "rgba(58, 58, 68, 1)",
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
  },

  // ── Pin detail card ──
  pinDetailCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  pinDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pinDetailEmoji: {
    fontSize: 22,
  },
  pinDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  pinDetailSub: {
    fontSize: 11,
    color: "rgba(90, 90, 104, 1)",
    marginTop: 2,
  },
  pinDetailBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 18,
  },
  pinDetailBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Events list ──
  eventsList: {
    marginTop: 20,
  },
  eventsListTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  eventEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  eventEmoji: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  eventLocation: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    marginTop: 2,
  },
  eventMeta: {
    alignItems: "flex-end",
  },
  eventParticipants: {
    fontSize: 12,
    fontWeight: "600",
  },
});
