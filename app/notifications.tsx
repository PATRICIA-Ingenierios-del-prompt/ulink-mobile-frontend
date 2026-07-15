import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { matchingService } from "@/services/matchingService";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = "match" | "chat" | "evento" | "reporte" | "xp" | "logro" | "info";

interface NotificationItem {
  id: string;
  type: NotificationType;
  text: string;
  time: string;
  read: boolean;
}

const NOTIF_EMOJI: Record<NotificationType, string> = {
  match: "💜",
  chat: "💬",
  evento: "🎉",
  reporte: "⚠️",
  xp: "⚡",
  logro: "🏆",
  info: "ℹ️",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = await matchingService.solicitudesRecibidas();
        if (cancelled) return;
        setNotifs(
          ids.map((id) => ({
            id: `solicitud-${id}`,
            type: "match" as NotificationType,
            text: "Tienes una nueva solicitud de match esperando tu respuesta.",
            time: "reciente",
            read: false,
          }))
        );
      } catch {
        if (!cancelled) setNotifs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="rgba(129, 140, 248, 1)" size="small" />
            <Text style={styles.loadingText}>Cargando notificaciones...</Text>
          </View>
        ) : notifs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={36} color="rgba(90, 90, 104, 0.6)" />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtitle}>
              Te avisaremos aquí cuando pase algo nuevo
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifs.map((n) => (
              <Pressable
                key={n.id}
                style={[
                  styles.notifCard,
                  !n.read && styles.notifCardUnread,
                ]}
                onPress={() => markAsRead(n.id)}
              >
                <View style={styles.notifIconWrap}>
                  <Text style={styles.notifEmoji}>{NOTIF_EMOJI[n.type]}</Text>
                </View>
                <View style={styles.notifContent}>
                  <Text
                    style={[
                      styles.notifText,
                      n.read && styles.notifTextRead,
                    ]}
                  >
                    {n.text}
                  </Text>
                  <Text style={styles.notifTime}>Hace {n.time}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTitle: {
    flex: 1,
    color: "rgba(236, 237, 248, 1)",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
  },
  markAllText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 13,
  },
  emptyCard: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 13,
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    gap: 12,
  },
  notifCardUnread: {
    borderColor: "rgba(108, 99, 255, 0.25)",
    backgroundColor: "rgba(108, 99, 255, 0.06)",
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifEmoji: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifText: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  notifTextRead: {
    color: "rgba(90, 90, 104, 1)",
    fontWeight: "400",
  },
  notifTime: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(108, 99, 255, 1)",
    marginTop: 4,
  },
});
