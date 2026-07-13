import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
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
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
            <Text style={styles.profileLabel}>Perfil del Usuario</Text>
          </View>
        </View>

        {/* ── Avatar and Basic Info ── */}
        <View style={styles.profileInfoSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{id?.toString().substring(0,2).toUpperCase() || "US"}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.username}>Usuario {id}</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={10} color="rgba(240, 178, 50, 1)" />
              <Text style={styles.levelBadgeText}>5</Text>
            </View>
          </View>

          <View style={styles.degreeRow}>
            <Ionicons name="school-outline" size={14} color="rgba(143, 132, 224, 1)" />
            <Text style={styles.degreeText}>Estudiante</Text>
            <Text style={styles.degreeDot}> · </Text>
            <Text style={styles.degreeYear}>ECI</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>15</Text>
            <Text style={styles.statLabel}>{t("friends_count")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statCount}>4</Text>
            <Text style={styles.statLabel}>{t("servers_count")}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.chatButton} onPress={() => router.push(`/chat/${id}`)}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.chatButtonText}>Chat</Text>
          </Pressable>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  profileLabel: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
  profileInfoSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 10,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "rgba(129, 140, 248, 1)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(35, 165, 89, 1)",
    borderWidth: 4,
    borderColor: "rgba(11, 13, 24, 1)",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 1)",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 178, 50, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    color: "rgba(240, 178, 50, 1)",
    fontSize: 12,
    fontWeight: "700",
  },
  degreeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  degreeText: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 14,
    marginLeft: 6,
  },
  degreeDot: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 14,
    marginHorizontal: 4,
  },
  degreeYear: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 1)",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 1)",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  chatButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
