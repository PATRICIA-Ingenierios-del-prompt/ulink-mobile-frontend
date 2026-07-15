import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { GlassNavBar } from "@/components/glass-nav-bar";
import { useTranslation } from "@/hooks/useTranslation";
import { parcheService } from "@/services/parcheService";
import { useAuth } from "@/hooks/useAuth";
import type { ParcheSummaryResponse } from "@/services/types";

// ── Category color maps extracted to module level (no re-create per render) ──
const CATEGORY_COLORS: Record<string, string> = {
  MUSICA: "rgba(255, 107, 157, 1)",
  MUSIC: "rgba(255, 107, 157, 1)",
  DEPORTE: "rgba(127, 231, 196, 1)",
  SPORT: "rgba(127, 231, 196, 1)",
  ESTUDIO: "rgba(108, 99, 255, 1)",
  STUDY: "rgba(108, 99, 255, 1)",
  GASTRONOMIA: "rgba(255, 179, 71, 1)",
  GAMING: "rgba(91, 200, 255, 1)",
  ARTE: "rgba(167, 139, 250, 1)",
  ART: "rgba(167, 139, 250, 1)",
  VARIETY: "rgba(99, 102, 241, 1)",
  TECHNOLOGY: "rgba(91, 200, 255, 1)",
  ENTERTAINMENT: "rgba(242, 63, 67, 1)",
};
const FALLBACK_COLOR = "rgba(99, 102, 241, 1)";
const getCategoryColor = (cat?: string) => CATEGORY_COLORS[cat || ""] ?? FALLBACK_COLOR;
const getCategoryColorBorder = (cat?: string) => getCategoryColor(cat).replace("1)", "0.16)");
const getCategoryColorBg = (cat?: string) => getCategoryColor(cat).replace("1)", "0.09)");

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={skeletonStyles.row}>
      <View style={skeletonStyles.dot} />
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.info}>
        <View style={skeletonStyles.line} />
        <View style={[skeletonStyles.line, { width: "55%", marginTop: 6, opacity: 0.5 }]} />
      </View>
      <View style={skeletonStyles.time} />
    </View>
  );
}
const skeletonStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.06)" },
  avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  info: { flex: 1 },
  line: { height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", width: "70%" },
  time: { width: 34, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)" },
});

interface FeedItem {
  id: string;
  initials: string;
  name: string;
  action: string;
  time: string;
  color: string;
  colorBorder: string;
  colorBg: string;
  online: boolean;
  parcheId?: string;
}

function ClockIcon({ size = 12, color = "rgba(143, 132, 224, 1)" }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 1,
          height: size * 0.3,
          backgroundColor: color,
          position: "absolute",
          top: size * 0.18,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: 1,
          backgroundColor: color,
          position: "absolute",
          top: size * 0.38,
          left: size * 0.42,
        }}
      />
    </View>
  );
}

function ActivityRow({
  item,
  isLast,
  onPress,
  onAvatarPress,
}: {
  item: FeedItem;
  isLast: boolean;
  onPress?: () => void;
  onAvatarPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.activityRow, !isLast && styles.activityRowBorder]}
      onPress={onPress}
    >
      {/* Online indicator */}
      <View style={styles.onlineIndicatorWrap}>
        <View
          style={[
            styles.onlineDot,
            item.online
              ? { backgroundColor: "rgba(35, 165, 89, 1)" }
              : {
                  backgroundColor: "transparent",
                  borderWidth: 1.5,
                  borderColor: "rgba(42, 42, 64, 1)",
                },
          ]}
        />
      </View>

      {/* Avatar */}
      <Pressable onPress={onAvatarPress}>
        <View
          style={[
            styles.avatar,
            {
              borderColor: item.colorBorder,
              backgroundColor: item.colorBg,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: item.color }]}>
            {item.initials}
          </Text>
        </View>
      </Pressable>

      {/* Info */}
      <View style={styles.activityInfo}>
        <Text style={styles.activityName}>{item.name}</Text>
        <Text style={styles.activityAction}>{item.action}</Text>
      </View>

      {/* Time */}
      <View style={styles.timeWrap}>
        <ClockIcon />
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userName } = useAuth();
  const [publicParches, setPublicParches] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, numberOfElements: 0, empty: true, first: true, last: true };

  const loadData = useCallback(async () => {
    try {
      // Fetch first 10 items per section for a fast first paint
      const publicData = await parcheService.byVisibility("PUBLIC", { page: 0, size: 10 }).catch(() => EMPTY_PAGE);

      setPublicParches((publicData.content || []).map((p: ParcheSummaryResponse) => ({
        id: p.parcheId,
        initials: p.name.substring(0, 2).toUpperCase(),
        name: p.name,
        action: `${p.memberCount || 0} miembros`,
        time: "",
        color: getCategoryColor(p.category),
        colorBorder: getCategoryColorBorder(p.category),
        colorBg: getCategoryColorBg(p.category),
        online: (p.memberCount ?? 0) > 0,
        parcheId: p.parcheId,
      })));
    } catch (err) {
      console.log("[HOME] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("good_morning");
    if (hour < 18) return t("good_afternoon");
    return t("good_evening");
  };

  // Get formatted date
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View style={styles.headerSection}>
          {/* Top bar: leaf wellness icon left, bell + logo right */}
          <View style={styles.topBar}>
            <Pressable onPress={() => router.push("/bienestar")}>
              <Ionicons
                name="leaf-outline"
                size={28}
                color="rgba(143, 132, 224, 0.75)"
              />
            </Pressable>
            <View style={styles.topBarSpacer} />
            <Pressable
              style={styles.bellBtn}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="rgba(143, 132, 224, 0.75)"
              />
            </Pressable>
            <Pressable
              style={styles.bellBtn}
              onPress={() => router.push("/location")}
            >
              <Ionicons
                name="location-outline"
                size={22}
                color="rgba(143, 132, 224, 0.75)"
              />
            </Pressable>
            <Image
              source={require("../assets/images/logoNuevoOscuro.png")}
              contentFit="contain"
              style={styles.headerLogo}
            />
          </View>

          {/* Greeting row: text left, big avatar right */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextWrap}>
              <Text style={styles.greetingText}>
                {getGreeting()},
                {"\n"}{userName || "Usuario"}
              </Text>
            </View>
            <Pressable style={styles.bigAvatarWrap} onPress={() => router.push("/profile")}>
              <View style={styles.bigAvatar}>
                <Text style={styles.bigAvatarText}>You</Text>
              </View>
              {/* Online indicator on avatar */}
              <View style={styles.bigAvatarOnline}>
                <View style={styles.bigAvatarOnlineDot} />
              </View>
            </Pressable>
          </View>

          {/* Date & subtitle */}
          <View style={styles.metaSection}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.subtitleText}>
              {t("recent_activity")}
            </Text>
          </View>
        </View>

        {/* Activity list */}
        <View style={styles.activityList}>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : publicParches.length === 0 ? (
            <Text style={{ color: "rgba(90, 90, 104, 1)", textAlign: "center", marginTop: 20, fontSize: 13 }}>
              {t("no_activity") || "Sin actividad reciente"}
            </Text>
          ) : (
            publicParches.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={index === publicParches.length - 1}
                onPress={() => item.parcheId && router.push(`/(tabs)/parche?parcheId=${item.parcheId}`)}
                onAvatarPress={() => item.parcheId && router.push(`/(tabs)/parche?parcheId=${item.parcheId}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },

  // ── Header ──
  headerSection: {
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 65,
    height: 56,
  },
  topBarSpacer: {
    flex: 1,
  },
  bellBtn: {
    marginRight: 12,
    padding: 4,
  },

  // ── Greeting row with large avatar ──
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingText: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 44,
    letterSpacing: -1.5,
  },

  // Big avatar (right side of greeting)
  bigAvatarWrap: {
    marginLeft: 16,
  },
  bigAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(99, 102, 241, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  bigAvatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bigAvatarOnline: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(11, 13, 24, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  bigAvatarOnlineDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: "rgba(35, 165, 89, 1)",
  },

  // ── Date & subtitle ──
  metaSection: {
    paddingTop: 4,
  },
  dateText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0.13,
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21,
    marginTop: 6,
  },

  // ── Activity list ──
  activityList: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  onlineIndicatorWrap: {
    width: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 0.14,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  activityAction: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 2,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
});
