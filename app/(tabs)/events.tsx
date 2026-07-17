import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { eventService, type EventMapResponse } from "@/services/eventService";
import { UserAvatar } from "@/components/UserAvatar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Campus center (Escuela Colombiana de Ingeniería) used when an event has no coords.
const ECI_CENTER = { latitude: 4.601, longitude: -74.066 };

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

// Dark map theme matching the app's palette.
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
];

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

  // Only events with real coordinates can be plotted on the map.
  const eventsWithCoords = filteredEvents.filter(
    (e) => e.latitude != null && e.longitude != null
  );
  // `find` yields `EventMapResponse | undefined`, so the fallback below is real.
  const mapCenter = filteredEvents.find(
    (e) => e.latitude != null && e.longitude != null
  );
  const initialRegion = {
    latitude: mapCenter?.latitude ?? ECI_CENTER.latitude,
    longitude: mapCenter?.longitude ?? ECI_CENTER.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

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
        {loading ? (
          <View style={[styles.mapCard, styles.mapLoading, { width: MAP_WIDTH }]}>
            <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
          </View>
        ) : (
          <View style={[styles.mapCard, { width: MAP_WIDTH }]}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={initialRegion}
              customMapStyle={darkMapStyle}
            >
              {eventsWithCoords.map((event) => {
                const color = CATEGORY_COLORS[event.category] || "rgba(99, 102, 241, 1)";
                const emoji = CATEGORY_EMOJI[event.category] || "🎉";
                return (
                  <Marker
                    key={event.eventId}
                    coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                    onPress={() =>
                      setSelectedPin(selectedPin === event.eventId ? null : event.eventId)
                    }
                  >
                    <View
                      style={[
                        styles.markerPin,
                        { backgroundColor: color, borderColor: color.replace("1)", "0.35)") },
                      ]}
                    >
                      <Text style={styles.markerEmoji}>{emoji}</Text>
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          </View>
        )}

        {/* Hint text */}
        <Text style={styles.mapHint}>
          {eventsWithCoords.length} evento{eventsWithCoords.length !== 1 ? "s" : ""} en el mapa · toca un marcador para ver el detalle
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
          const event = events.find(e => e.eventId === selectedPin);
          if (!event) return null;
          const color = CATEGORY_COLORS[event.category] || "rgba(99, 102, 241, 1)";
          const emoji = CATEGORY_EMOJI[event.category] || "🎉";
          return (
            <View style={[styles.pinDetailCard, { borderColor: color.replace("1)", "0.35)"), backgroundColor: color.replace("1)", "0.12)") }]}>
              <View style={styles.pinDetailLeft}>
                <Text style={styles.pinDetailEmoji}>{emoji}</Text>
                <View>
                  <Text style={[styles.pinDetailLabel, { color }]}>{event.title}</Text>
                  <Text style={styles.pinDetailSub}>{event.locationName || "Sin ubicación"}</Text>
                </View>
              </View>
              <Pressable 
                style={[styles.pinDetailBtn, { borderColor: color.replace("1)", "0.35)") }]}
                onPress={() => router.push({ pathname: '/event-detail', params: { id: event.eventId } })}
              >
                <Text style={[styles.pinDetailBtnText, { color }]}>Ver</Text>
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
  mapLoading: {
    backgroundColor: "rgba(14, 17, 35, 1)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Custom map marker
  markerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 16,
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
