import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { userService } from "@/services/userService";
import type { PerfilResponse } from "@/services/types";

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProfile(id as string);
    }
  }, [id]);

  const loadProfile = async (userId: string) => {
    try {
      const data = await userService.getPerfil(userId);
      setPerfil(data);
    } catch (err) {
      console.log("[USER PROFILE] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initials = perfil
    ? `${perfil.nombre?.[0] || ""}${perfil.apellidos?.[0] || ""}`.toUpperCase() || "US"
    : id?.toString().substring(0, 2).toUpperCase() || "US";

  const fullName = perfil
    ? `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() || "Usuario"
    : "Usuario";

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

        {loading ? (
          <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Avatar and Basic Info ── */}
            <View style={styles.profileInfoSection}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.onlineBadge} />
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.username}>{fullName}</Text>
              </View>

              <View style={styles.degreeRow}>
                <Ionicons name="school-outline" size={14} color="rgba(143, 132, 224, 1)" />
                <Text style={styles.degreeText}>{perfil?.carrera || "Estudiante"}</Text>
                {perfil?.semestre && (
                  <>
                    <Text style={styles.degreeDot}> · </Text>
                    <Text style={styles.degreeYear}>{perfil.semestre}° semestre</Text>
                  </>
                )}
              </View>

              {perfil?.intereses && perfil.intereses.length > 0 && (
                <View style={styles.interestsRow}>
                  {perfil.intereses.slice(0, 5).map((interes, i) => (
                    <View key={i} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interes}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Actions ── */}
            <View style={styles.actionsContainer}>
              <Pressable style={styles.chatButton} onPress={() => router.push(`/chat/${id}`)}>
                <Ionicons name="chatbubble-outline" size={20} color="white" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  interestText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 12,
    fontWeight: "500",
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
