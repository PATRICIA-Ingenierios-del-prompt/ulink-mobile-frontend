import React, { useState } from "react";
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

const ACTIVITY_DATA = [
  {
    initials: "CR",
    name: "Camila R.",
    action: "Joined Hackathon ECI 2028",
    time: "5 min",
    color: "rgba(124, 106, 245, 1)",
    colorBorder: "rgba(124, 106, 245, 0.16)",
    colorBg: "rgba(124, 106, 245, 0.09)",
    online: true,
  },
  {
    initials: "AT",
    name: "Andrés T.",
    action: "Joined IEEE Student Branch",
    time: "18 min",
    color: "rgba(59, 140, 245, 1)",
    colorBorder: "rgba(59, 140, 245, 0.16)",
    colorBg: "rgba(59, 140, 245, 0.09)",
    online: true,
  },
  {
    initials: "SM",
    name: "Sofía M.",
    action: "Shared Mindfulness Workshop",
    time: "34 min",
    color: "rgba(35, 165, 89, 1)",
    colorBorder: "rgba(35, 165, 89, 0.16)",
    colorBg: "rgba(35, 165, 89, 0.09)",
    online: true,
  },
  {
    initials: "FA",
    name: "Felipe A.",
    action: "Reached Level 12 at ECI",
    time: "1 h",
    color: "rgba(240, 178, 50, 1)",
    colorBorder: "rgba(240, 178, 50, 0.16)",
    colorBg: "rgba(240, 178, 50, 0.09)",
    online: false,
  },
  {
    initials: "LG",
    name: "Laura G.",
    action: "Created Cinema Night event",
    time: "2 h",
    color: "rgba(242, 63, 67, 1)",
    colorBorder: "rgba(242, 63, 67, 0.16)",
    colorBg: "rgba(242, 63, 67, 0.09)",
    online: false,
  },
];

const SERVERS_DATA = [
  {
    initials: "HE",
    name: "Hackathon ECI",
    action: "New challenge posted",
    time: "12 min",
    color: "rgba(99, 102, 241, 1)",
    colorBorder: "rgba(99, 102, 241, 0.16)",
    colorBg: "rgba(99, 102, 241, 0.09)",
    online: true,
  },
  {
    initials: "IE",
    name: "IEEE Student Branch",
    action: "Meeting scheduled for Friday",
    time: "45 min",
    color: "rgba(59, 140, 245, 1)",
    colorBorder: "rgba(59, 140, 245, 0.16)",
    colorBg: "rgba(59, 140, 245, 0.09)",
    online: true,
  },
  {
    initials: "MW",
    name: "Mindfulness Workshop",
    action: "New session available",
    time: "1 h",
    color: "rgba(35, 165, 89, 1)",
    colorBorder: "rgba(35, 165, 89, 0.16)",
    colorBg: "rgba(35, 165, 89, 0.09)",
    online: true,
  },
  {
    initials: "CN",
    name: "Cinema Night",
    action: "Poll: next movie pick",
    time: "3 h",
    color: "rgba(242, 63, 67, 1)",
    colorBorder: "rgba(242, 63, 67, 0.16)",
    colorBg: "rgba(242, 63, 67, 0.09)",
    online: false,
  },
];

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
}: {
  item: (typeof ACTIVITY_DATA)[0];
  isLast: boolean;
}) {
  return (
    <Pressable
      style={[styles.activityRow, !isLast && styles.activityRowBorder]}
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
  const [activeFilter, setActiveFilter] = useState<"friends" | "servers">("friends");

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

  const displayData = activeFilter === "friends" ? ACTIVITY_DATA : SERVERS_DATA;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View style={styles.headerSection}>
          {/* Top bar: heart icon left, U·link logo right */}
          <View style={styles.topBar}>
            <Ionicons
              name="heart-outline"
              size={34}
              color="rgba(160, 160, 190, 0.7)"
            />
            <View style={styles.topBarSpacer} />
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
                {"\n"}Juan
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

        {/* Filter tabs */}
        <View style={styles.tabsRow}>
          <Pressable
            style={activeFilter === "friends" ? styles.tabActive : styles.tabInactive}
            onPress={() => setActiveFilter("friends")}
          >
            <Text style={activeFilter === "friends" ? styles.tabActiveText : styles.tabInactiveText}>
              {t("filter_friends")}
            </Text>
          </Pressable>
          <Pressable
            style={activeFilter === "servers" ? styles.tabActive : styles.tabInactive}
            onPress={() => setActiveFilter("servers")}
          >
            <Text style={activeFilter === "servers" ? styles.tabActiveText : styles.tabInactiveText}>
              {t("filter_servers")}
            </Text>
          </Pressable>
          <View style={styles.tabSpacer} />
          <Pressable>
            <Text style={styles.seeAllText}>{t("view_all")}</Text>
          </Pressable>
        </View>

        {/* Activity list */}
        <View style={styles.activityList}>
          {displayData.map((item, index) => (
            <ActivityRow
              key={item.initials}
              item={item}
              isLast={index === displayData.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* Glass nav bar */}
      <GlassNavBar activeTab="home" />
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

  // ── Tabs ──
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
    marginTop: 28,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.28)",
    backgroundColor: "rgba(99, 102, 241, 0.18)",
  },
  tabActiveText: {
    color: "rgba(129, 140, 248, 1)",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  tabInactive: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  tabInactiveText: {
    color: "rgba(56, 56, 90, 1)",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  tabSpacer: {
    flex: 1,
  },
  seeAllText: {
    color: "rgba(143, 132, 224, 1)",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
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
