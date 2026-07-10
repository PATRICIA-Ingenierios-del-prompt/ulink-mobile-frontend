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
import { GlassNavBar } from "@/components/glass-nav-bar";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.profileLabel}>{t("your_profile")}</Text>
            <Text style={styles.appTitle}>U·link</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerButton}>
              <Ionicons name="paw-outline" size={20} color="rgba(143, 132, 224, 0.8)" />
            </Pressable>
            <Pressable style={styles.headerButton}>
              <Ionicons name="pencil-outline" size={20} color="rgba(143, 132, 224, 0.8)" />
            </Pressable>
            <Pressable style={[styles.headerButton, styles.headerButtonActive]} onPress={() => router.push("/settings")}>
              <Ionicons name="settings-outline" size={20} color="rgba(129, 140, 248, 1)" />
            </Pressable>
          </View>
        </View>

        {/* ── Avatar and Basic Info ── */}
        <View style={styles.profileInfoSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{t("you")}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.username}>Juan García</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={10} color="rgba(240, 178, 50, 1)" />
              <Text style={styles.levelBadgeText}>12</Text>
            </View>
          </View>

          <View style={styles.degreeRow}>
            <Ionicons name="school-outline" size={14} color="rgba(143, 132, 224, 1)" />
            <Text style={styles.degreeText}>Ingeniería de Sistemas</Text>
            <Text style={styles.degreeDot}> · </Text>
            <Text style={styles.degreeYear}>3er año · ECI</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>24</Text>
            <Text style={styles.statLabel}>{t("friends_count")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statCount}>8</Text>
            <Text style={styles.statLabel}>{t("servers_count")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statCount}>12</Text>
            <Text style={styles.statLabel}>{t("events_count")}</Text>
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            Desarrollador full-stack, amante del café y los hackathons ☕ Construyendo el futuro desde la ECI, un commit a la vez.
          </Text>
        </View>

        {/* ── Interests ── */}
        <View style={styles.interestsSection}>
          <Text style={styles.sectionLabel}>{t("interests")}</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>Full Stack</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Robótica</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Open Source</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Café ☕</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Hackathons</Text></View>
          </View>
        </View>

        {/* ── XP Progress ── */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <View style={styles.xpHeaderLeft}>
              <Ionicons name="flash-outline" size={16} color="rgba(99, 102, 241, 1)" style={{ marginRight: 6 }} />
              <Text style={styles.xpLabel}>{t("xp_progress")}</Text>
            </View>
            <Text style={styles.xpValue}>2 340 / 3 000 XP</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.xpSubtitle}>{t("level")} 12 · 660 {t("xp_next")}</Text>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionLabelWhite}>{t("recent_activity")}</Text>
            <Text style={styles.viewAllText}>{t("view_all")}</Text>
          </View>

          <View style={styles.activityCard}>
            <ActivityItem 
              initials="CR" 
              name="Camila R." 
              action={`${t("activity_invite")} Hackathon ECI 2028`}
              time="5 min" 
              color="rgba(124, 106, 245, 1)" 
            />
            <ActivityItem 
              initials="AT" 
              name="Andrés T." 
              action={`${t("activity_join")} IEEE Student Branch`}
              time="18 min" 
              color="rgba(59, 140, 245, 1)" 
            />
            <ActivityItem 
              initials="SM" 
              name="Sofía M." 
              action={`${t("activity_share")} Mindfulness Workshop`}
              time="34 min" 
              color="rgba(35, 165, 89, 1)" 
            />
            <ActivityItem 
              initials="FA" 
              name="Felipe A." 
              action={`${t("activity_level")} 12`}
              time="1 h" 
              color="rgba(240, 178, 50, 1)" 
              noBorder
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Glass nav bar ── */}
      <GlassNavBar activeTab="profile" />
    </SafeAreaView>
  );
}

function ActivityItem({ initials, name, action, time, color, noBorder }: any) {
  return (
    <View style={[styles.activityItem, !noBorder && styles.activityItemBorder]}>
      <View style={[styles.activityAvatar, { borderColor: color.replace("1)", "0.2)"), backgroundColor: color.replace("1)", "0.1)") }]}>
        <Text style={[styles.activityAvatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{name}</Text>
        <Text style={styles.activityAction}>{action}</Text>
      </View>
      <View style={styles.activityTime}>
        <Text style={styles.activityTimeText}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerLeft: {},
  profileLabel: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  appTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.25)",
  },

  // ── Avatar ──
  profileInfoSection: {
    alignItems: "center",
    marginTop: 24,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 30,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(35, 165, 89, 1)",
    borderWidth: 2,
    borderColor: "rgba(11, 13, 24, 1)",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  username: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "700",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 178, 50, 0.12)",
    borderColor: "rgba(240, 178, 50, 0.25)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  levelBadgeText: {
    color: "rgba(240, 178, 50, 1)",
    fontSize: 11,
    fontWeight: "600",
  },
  degreeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  degreeText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  degreeDot: {
    color: "rgba(143, 132, 224, 0.4)",
    fontSize: 12,
  },
  degreeYear: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 12,
  },

  // ── Stats ──
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 24,
    height: 90,
  },
  statItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statCount: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "50%",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  // ── Bio ──
  bioContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  bioText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    lineHeight: 21,
  },

  // ── Interests ──
  interestsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    color: "rgba(143, 132, 224, 0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sectionLabelWhite: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderColor: "rgba(99, 102, 241, 0.24)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    color: "rgba(165, 180, 252, 1)",
    fontSize: 11,
    fontWeight: "500",
  },

  // ── XP Progress ──
  xpSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  xpLabel: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 13,
    fontWeight: "600",
  },
  xpValue: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 11,
    fontWeight: "500",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    width: "78%", // 2340 / 3000
    height: "100%",
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 3,
  },
  xpSubtitle: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 10,
    marginTop: 8,
  },

  // ── Recent Activity ──
  activitySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 11,
    fontWeight: "500",
  },
  activityCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: 22,
    marginTop: 12,
    paddingVertical: 4,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  activityAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityAvatarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "600",
  },
  activityAction: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  activityTime: {
    marginLeft: 8,
  },
  activityTimeText: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 11,
  }
});
