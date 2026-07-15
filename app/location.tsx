import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { addToast } from "@/components/ToastSystem";
import { eventService, type EventMapResponse } from "@/services/eventService";
import { locationService, type LiveParticipant } from "@/services/locationService";
import { GeoSocket, type GeoBroadcastMessage } from "@/services/geoSocket";

const ECI_CENTER = { latitude: 4.601, longitude: -74.066 };

const CATEGORY_COLORS: Record<string, string> = {
  SPORT: "#23A559",
  ENTERTAINMENT: "#FF6B9D",
  MUSIC: "#6C63FF",
  ART: "#F0B232",
  TECHNOLOGY: "#00C9A7",
  STUDY: "#A78BFA",
  VARIETY: "#F97316",
};
const CATEGORY_EMOJIS: Record<string, string> = {
  SPORT: "⚽",
  ENTERTAINMENT: "🎬",
  MUSIC: "🎵",
  ART: "🎨",
  TECHNOLOGY: "💻",
  STUDY: "📚",
  VARIETY: "🎉",
};

const REPORT_TYPES = [
  { value: "MEDICAL_EMERGENCY", label: "Emergencia médica", icon: "medkit" },
  { value: "ACCIDENT", label: "Accidente", icon: "car" },
  { value: "AGGRESSION", label: "Agresión", icon: "alert-circle" },
  { value: "HARASSMENT", label: "Acoso", icon: "warning" },
  { value: "THEFT", label: "Robo", icon: "lock-closed" },
  { value: "LOST_PERSON", label: "Persona perdida", icon: "person" },
  { value: "BAD_BEHAVIOUR", label: "Mal comportamiento", icon: "thumbs-down" },
  { value: "OTHER", label: "Otro", icon: "ellipsis-horizontal" },
] as const;

interface EventCard extends EventMapResponse {
  started: boolean | null;
  center: { latitude: number; longitude: number } | null;
  loading: boolean;
}

export default function LocationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId: myId } = useAuth();
  const [enrolled, setEnrolled] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{
    eventId: string;
    name: string;
    center: { latitude: number; longitude: number } | null;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    eventService
      .myJoinedEvents()
      .then((page) => {
        if (!alive) return;
        const events = page.content ?? page ?? [];
        setEnrolled(
          events.map((e) => ({
            ...e,
            started: null,
            center:
              e.latitude != null && e.longitude != null
                ? { latitude: e.latitude, longitude: e.longitude }
                : null,
            loading: true,
          }))
        );
        // Fetch detail for each to get started flag
        events.forEach(async (e) => {
          try {
            const detail = await eventService.get(e.eventId);
            if (!alive) return;
            setEnrolled((prev) =>
              prev.map((x) =>
                x.eventId === e.eventId
                  ? {
                      ...x,
                      started: detail.status === "STARTED",
                      center:
                        detail.latitude != null && detail.longitude != null
                          ? { latitude: detail.latitude, longitude: detail.longitude }
                          : x.center,
                      loading: false,
                    }
                  : x
              )
            );
          } catch {
            if (alive)
              setEnrolled((prev) =>
                prev.map((x) =>
                  x.eventId === e.eventId ? { ...x, loading: false } : x
                )
              );
          }
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (selectedEvent) {
    return (
      <LiveMap
        eventId={selectedEvent.eventId}
        name={selectedEvent.name}
        presetCenter={selectedEvent.center}
        onBack={() => setSelectedEvent(null)}
        myId={myId ?? undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(21,17,48,1)", "rgba(15,12,35,1)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Ubicación en vivo</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : enrolled.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={32} color="#6C63FF" />
            </View>
            <Text style={styles.emptyTitle}>Aún no sigues ningún evento</Text>
            <Text style={styles.emptySub}>
              Inscríbete a un evento en Eventos y, cuando empiece, verás aquí la
              ubicación en vivo de los participantes.
            </Text>
          </View>
        ) : (
          enrolled.map((c) => {
            const canTrack = c.started === true;
            const color = CATEGORY_COLORS[c.category as keyof typeof CATEGORY_COLORS] ?? "#6C63FF";
            const emoji = CATEGORY_EMOJIS[c.category as keyof typeof CATEGORY_EMOJIS] ?? "🎉";
            return (
              <Pressable
                key={c.eventId}
                disabled={!canTrack}
                onPress={() =>
                  canTrack &&
                  setSelectedEvent({
                    eventId: c.eventId,
                    name: c.title,
                    center: c.center,
                  })
                }
                style={({ pressed }) => [
                  styles.eventCard,
                  { borderColor: `${color}40` },
                  !canTrack && { opacity: 0.5 },
                  pressed && canTrack && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.eventCardTop}>
                  <View
                    style={[
                      styles.eventEmoji,
                      { backgroundColor: `${color}20` },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </View>
                  {c.loading ? (
                    <View style={styles.badgeLoading}>
                      <Text style={styles.badgeText}>…</Text>
                    </View>
                  ) : canTrack ? (
                    <View style={styles.badgeLive}>
                      <Ionicons name="radio" size={10} color="#7FE7C4" />
                      <Text style={[styles.badgeText, { color: "#7FE7C4" }]}>
                        En curso
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.badgePending}>
                      <Text style={[styles.badgeText, { color: "#90909A" }]}>
                        Aún no empieza
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.eventTitle}>{c.title}</Text>
                <Text style={styles.eventSub}>
                  {canTrack
                    ? "Toca para ver el mapa en vivo"
                    : "Disponible cuando el evento comience"}
                </Text>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ─── Live Map ─────────────────────────────────────────────────────────────── */

function LiveMap({
  eventId,
  name,
  presetCenter,
  onBack,
  myId,
}: {
  eventId: string;
  name: string;
  presetCenter: { latitude: number; longitude: number } | null;
  onBack: () => void;
  myId?: string;
}) {
  const [center, setCenter] = useState(presetCenter ?? ECI_CENTER);
  const [positions, setPositions] = useState<Map<string, LiveParticipant>>(
    new Map()
  );
  const [socketState, setSocketState] = useState<"down" | "connecting" | "up">(
    "down"
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const socketRef = useRef<GeoSocket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const upsert = useCallback(
    (p: GeoBroadcastMessage) =>
      setPositions((prev) => {
        const n = new Map(prev);
        n.set(p.userId, {
          userId: p.userId,
          username: p.username ?? "",
          latitude: p.latitude,
          longitude: p.longitude,
          timestamp: p.timestamp,
        });
        return n;
      }),
    []
  );

  useEffect(() => {
    let alive = true;
    // Fetch initial snapshot
    locationService
      .liveSnapshot(eventId)
      .then((rows) => {
        if (!alive) return;
        rows.forEach((r) =>
          upsert({
            userId: r.userId,
            username: r.username,
            latitude: r.latitude,
            longitude: r.longitude,
            timestamp: r.timestamp,
            type: "POSITION",
          })
        );
      })
      .catch(() => {});

    // Connect WebSocket
    setSocketState("connecting");
    const sock = new GeoSocket({
      onConnect: () => {
        setSocketState("up");
        sock.subscribeToEvent(eventId);
      },
      onDisconnect: () => setSocketState("down"),
      onGeoBroadcast: upsert,
    });
    socketRef.current = sock;
    sock.activate();

    // Watch own position
    let lastSentAt = 0;
    const MIN_INTERVAL_MS = 4000;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 4000 },
      (pos) => {
        const now = Date.now();
        if (now - lastSentAt < MIN_INTERVAL_MS) return;
        lastSentAt = now;
        if (socketRef.current?.connected) {
          socketRef.current.sendPosition(
            eventId,
            pos.coords.latitude,
            pos.coords.longitude
          );
        }
        if (!presetCenter) {
          setCenter({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      }
    ).then((sub) => {
      locationSubRef.current = sub;
    }).catch(() => {});

    return () => {
      alive = false;
      sock.deactivate();
      locationSubRef.current?.remove();
    };
  }, [eventId]);

  const participantList = [...positions.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const markerColors = [
    "#FF4D6A",
    "#6C63FF",
    "#7FE7C4",
    "#FFB232",
    "#FF6B9D",
    "#00C9A7",
    "#A78BFA",
    "#F97316",
  ];
  const colorForId = (id: string) =>
    markerColors[
      [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) %
        markerColors.length
    ];

  const stateColor = socketState === "up" ? "#7FE7C4" : socketState === "connecting" ? "#FFB347" : "#FF6B9D";
  const stateLabel = socketState === "up" ? "En vivo" : socketState === "connecting" ? "Conectando…" : "Sin conexión";

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
            <View style={[styles.liveBadge, { backgroundColor: `${stateColor}25` }]}>
              <Ionicons name="radio" size={10} color={stateColor} />
              <Text style={[styles.liveBadgeText, { color: stateColor }]}>
                {stateLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.participantSubHeader}>
            {positions.size} participante{positions.size !== 1 ? "s" : ""} en el mapa
          </Text>
        </View>
        <Pressable
          onPress={() => setShowReport(true)}
          style={styles.reportBtn}
        >
          <Ionicons name="alert-circle" size={20} color="#FF4D6A" />
        </Pressable>
      </View>

      {/* Privacy notice */}
      <View style={styles.privacyBanner}>
        <Ionicons name="shield-checkmark" size={14} color="#7FE7C4" />
        <Text style={styles.privacyText}>
          Las ubicaciones son efímeras y cifradas. Solo se muestran como puntos en el mapa durante el evento; nadie ve coordenadas exactas.
        </Text>
      </View>

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation={false}
        showsMyLocationButton
        customMapStyle={darkMapStyle}
      >
        {[...positions.values()].map((p) => (
          <Marker
            key={p.userId}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.username || p.userId}
          >
            <View
              style={[
                styles.customMarker,
                { backgroundColor: colorForId(p.userId) },
              ]}
            >
              <Text style={styles.markerText}>
                {(p.username ?? p.userId).charAt(0).toUpperCase()}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Participant count badge */}
      <Pressable
        onPress={() => setShowParticipants(!showParticipants)}
        style={styles.participantBadge}
      >
        <Ionicons name="people" size={16} color="#6C63FF" />
        <Text style={styles.participantCount}>{positions.size}</Text>
      </Pressable>

      {/* Participant list */}
      {showParticipants && (
        <View style={styles.participantPanel}>
          <Text style={styles.panelTitle}>Participantes</Text>
          {participantList.length === 0 && (
            <Text style={styles.emptyPanelText}>
              Nadie está transmitiendo ubicación todavía.
            </Text>
          )}
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {participantList.map((p) => {
              const tc = timeAgo(p.timestamp);
              const isMe = p.userId === myId;
              return (
                <View key={p.userId} style={styles.participantRow}>
                  <View
                    style={[
                      styles.participantDot,
                      { backgroundColor: colorForId(p.userId) },
                    ]}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.participantName} numberOfLines={1}>
                      {isMe ? "Tú" : p.username || p.userId.slice(0, 8)}
                    </Text>
                    <Text style={styles.participantTime}>Activo · {tc}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Incident Report Modal */}
      {showReport && (
        <IncidentReport
          eventId={eventId}
          onClose={() => setShowReport(false)}
        />
      )}
    </View>
  );
}

/* ─── Incident Report ──────────────────────────────────────────────────────── */

function IncidentReport({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<string>("MEDICAL_EMERGENCY");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await eventService.createReport(eventId, { reportType: type, description });
      addToast({
        type: "reporte",
        title: "Reporte enviado",
        message: "Se registró el incidente y se aseguró tu ubicación como evidencia.",
      });
      onClose();
    } catch {
      addToast({
        type: "reporte",
        title: "No se pudo reportar",
        message: "Intenta de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.reportOverlay}>
      <View style={styles.reportModal}>
        <LinearGradient
          colors={["rgba(255,77,106,0.15)", "rgba(255,107,157,0.08)"]}
          style={styles.reportGradient}
        />
        <View style={styles.reportHeader}>
          <View style={styles.reportIcon}>
            <Ionicons name="warning" size={20} color="#FF4D6A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>Reportar incidente</Text>
            <Text style={styles.reportSub}>
              Tu ubicación actual quedará como evidencia
            </Text>
          </View>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={18} color="#90909A" />
          </Pressable>
        </View>

        <Text style={styles.reportLabel}>Tipo de incidente</Text>
        <View style={styles.reportTypes}>
          {REPORT_TYPES.map((r) => {
            const on = type === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setType(r.value)}
                style={[
                  styles.reportTypeBtn,
                  on && styles.reportTypeActive,
                ]}
              >
                <Ionicons
                  name={r.icon as any}
                  size={14}
                  color={on ? "#FF4D6A" : "#90909A"}
                />
                <Text
                  style={[
                    styles.reportTypeText,
                    on && { color: "#FF4D6A" },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.textAreaWrap}>
          <Text style={styles.textArea} numberOfLines={3}>
            {description || "Describe lo que está pasando..."}
          </Text>
        </View>

        <View style={styles.reportActions}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={saving}
            style={[styles.submitBtn, saving && { opacity: 0.5 }]}
          >
            <Text style={styles.submitText}>
              {saving ? "Enviando…" : "Enviar reporte"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `hace ${m}m` : `hace ${Math.floor(m / 60)}h`;
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0C23",
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
  loadingWrap: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
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
    maxWidth: 280,
  },
  eventCard: {
    backgroundColor: "rgba(21,17,48,0.8)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  eventEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLoading: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(127,231,196,0.18)",
  },
  badgePending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  eventSub: {
    fontSize: 12,
    color: "#90909A",
  },
  mapHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 52 : 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 20,
  },
  reportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,77,106,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Participant badge */
  participantBadge: {
    position: "absolute",
    bottom: 100,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,12,35,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    zIndex: 20,
  },
  participantCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  /* Participant panel */
  participantPanel: {
    position: "absolute",
    bottom: 150,
    right: 16,
    width: 220,
    backgroundColor: "rgba(15,12,35,0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
    padding: 12,
    zIndex: 20,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  participantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  participantName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E0E0E6",
  },
  participantTime: {
    fontSize: 10,
    color: "#90909A",
    marginTop: 1,
  },
  /* Custom marker */
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  participantSubHeader: {
    fontSize: 12,
    color: "#90909A",
    marginTop: 2,
  },
  privacyBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(127,231,196,0.08)",
    borderWidth: 1,
    borderColor: "rgba(127,231,196,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 15,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: "#7FE7C4",
    lineHeight: 15,
  },
  emptyPanelText: {
    fontSize: 12,
    color: "#90909A",
    lineHeight: 18,
    marginBottom: 4,
  },
  /* Report */
  reportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  reportModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(21,17,48,1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,77,106,0.35)",
    overflow: "hidden",
  },
  reportGradient: {
    height: 4,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
    gap: 12,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,77,106,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  reportSub: {
    fontSize: 12,
    color: "#90909A",
    marginTop: 2,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#90909A",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  reportTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  reportTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
  },
  reportTypeActive: {
    backgroundColor: "rgba(255,77,106,0.15)",
    borderColor: "#FF4D6A",
  },
  reportTypeText: {
    fontSize: 12,
    color: "#90909A",
  },
  textAreaWrap: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
    padding: 12,
  },
  textArea: {
    fontSize: 13,
    color: "#90909A",
    lineHeight: 18,
  },
  reportActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(108,99,255,0.1)",
    alignItems: "center",
  },
  cancelText: {
    color: "#90909A",
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FF4D6A",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});