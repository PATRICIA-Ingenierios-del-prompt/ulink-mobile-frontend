import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthContext } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import type { PerfilResponse, ActualizarPerfilPayload } from "@/services/types";

// ─── Activity Item ───────────────────────────────────────────────────────────

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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId, userName, setUserName } = useContext(AuthContext);

  const [profile, setProfile] = useState<PerfilResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Draft state used while editing
  const [draft, setDraft] = useState<ActualizarPerfilPayload>({
    bio: "",
    carrera: "",
    semestre: "",
    intereses: [],
  });
  const [newTag, setNewTag] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await userService.getPerfil(userId);
      setProfile(data);
      // Keep auth context userName in sync with the real name from the backend
      const fullNameFromApi = [data.nombre, data.apellidos].filter(Boolean).join(" ").trim();
      if (fullNameFromApi) {
        setUserName(fullNameFromApi);
      }
    } catch {
      // Profile may not exist yet — show defaults
    } finally {
      setLoading(false);
    }
  }, [userId, setUserName]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fullName = profile
    ? [profile.nombre, profile.apellidos].filter(Boolean).join(" ")
    : "";

  const initials = fullName
    ? fullName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const degreeLine = [profile?.carrera, profile?.semestre ? `Sem ${profile.semestre}` : null]
    .filter(Boolean)
    .join(" · ");

  const handleEditPress = () => {
    setDraft({
      bio: profile?.bio ?? "",
      carrera: profile?.carrera ?? "",
      semestre: profile?.semestre ?? "",
      intereses: profile?.intereses ?? [],
    });
    setNewTag("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const updated = await userService.updatePerfil(userId, draft);
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert("Error", "No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (draft.intereses?.includes(tag)) {
      setNewTag("");
      return;
    }
    setDraft((d) => ({ ...d, intereses: [...(d.intereses ?? []), tag] }));
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setDraft((d) => ({
      ...d,
      intereses: (d.intereses ?? []).filter((t) => t !== tag),
    }));
  };

  // ── Loading State ──

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Edit View ──

  if (isEditing) {
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <View style={styles.editHeader}>
            <Pressable style={styles.editCancelBtn} onPress={handleCancel}>
              <Text style={styles.editCancelText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.editTitle}>Editar perfil</Text>
            <Pressable
              style={[styles.editSaveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.editSaveText}>Guardar</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar (display only in edit) */}
            <View style={styles.editAvatarSection}>
              <View style={styles.avatarWrap}>
                {profile?.foto ? (
                  <Image source={{ uri: profile.foto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.onlineBadge} />
                <View style={styles.editAvatarOverlay}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>
              <Text style={styles.editAvatarHint}>Toca para cambiar foto</Text>
            </View>

            {/* Name (read-only from JWT — show for reference) */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>Nombre</Text>
              <View style={styles.editInputWrap}>
                <TextInput
                  style={[styles.editInput, { opacity: 0.5 }]}
                  value={fullName}
                  editable={false}
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                />
              </View>
            </View>

            {/* Carrera */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>Carrera</Text>
              <View style={styles.editInputWrap}>
                <TextInput
                  style={styles.editInput}
                  value={draft.carrera}
                  onChangeText={(v) => setDraft((d) => ({ ...d, carrera: v }))}
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  placeholder="Ej. Ingeniería de Sistemas"
                />
              </View>
            </View>

            {/* Semestre */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>Semestre</Text>
              <View style={styles.editInputWrap}>
                <TextInput
                  style={styles.editInput}
                  value={String(draft.semestre ?? "")}
                  onChangeText={(v) => setDraft((d) => ({ ...d, semestre: v }))}
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  placeholder="Ej. 3"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>Biografía</Text>
              <View style={[styles.editInputWrap, styles.editTextAreaWrap]}>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={draft.bio}
                  onChangeText={(v) => setDraft((d) => ({ ...d, bio: v }))}
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  placeholder="Cuéntale al parche quién eres..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
              <Text style={styles.editCharCount}>{(draft.bio ?? "").length} / 200</Text>
            </View>

            {/* Interests */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>Intereses</Text>
              <View style={styles.editTagsWrap}>
                {(draft.intereses ?? []).map((tag) => (
                  <Pressable key={tag} style={styles.editTag} onPress={() => handleRemoveTag(tag)}>
                    <Text style={styles.editTagText}>{tag}</Text>
                    <Ionicons name="close" size={12} color="rgba(165, 180, 252, 0.8)" style={{ marginLeft: 4 }} />
                  </Pressable>
                ))}
              </View>
              <View style={styles.editTagInputRow}>
                <View style={[styles.editInputWrap, { flex: 1 }]}>
                  <TextInput
                    style={styles.editInput}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholderTextColor="rgba(90, 90, 104, 1)"
                    placeholder="Añadir interés..."
                    returnKeyType="done"
                    onSubmitEditing={handleAddTag}
                  />
                </View>
                <Pressable style={styles.editTagAddBtn} onPress={handleAddTag}>
                  <Ionicons name="add" size={20} color="white" />
                </Pressable>
              </View>
              <Text style={styles.editTagHint}>Toca una etiqueta para eliminarla</Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── View Mode ──

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
            <Pressable style={styles.headerButton} onPress={() => router.push("/monas")}>
              <Ionicons name="paw-outline" size={20} color="rgba(143, 132, 224, 0.8)" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleEditPress}>
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
            {profile?.foto ? (
              <Image source={{ uri: profile.foto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.username}>{fullName || userName || "Usuario"}</Text>
          </View>

          {degreeLine ? (
            <View style={styles.degreeRow}>
              <Ionicons name="school-outline" size={14} color="rgba(143, 132, 224, 1)" />
              <Text style={styles.degreeText}>{degreeLine}</Text>
            </View>
          ) : null}

          {profile?.email ? (
            <View style={styles.degreeRow}>
              <Ionicons name="mail-outline" size={14} color="rgba(143, 132, 224, 0.6)" />
              <Text style={[styles.degreeText, { opacity: 0.6 }]}>{profile.email}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats (placeholder — web also shows "--") ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>--</Text>
            <Text style={styles.statLabel}>{t("friends_count")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statCount}>--</Text>
            <Text style={styles.statLabel}>{t("servers_count")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statCount}>--</Text>
            <Text style={styles.statLabel}>{t("events_count")}</Text>
          </View>
        </View>

        {/* ── Bio ── */}
        {profile?.bio ? (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : (
          <Pressable style={styles.bioContainer} onPress={handleEditPress}>
            <Text style={[styles.bioText, { fontStyle: "italic", opacity: 0.4 }]}>
              Añade una biografía...
            </Text>
          </Pressable>
        )}

        {/* ── Interests ── */}
        {profile?.intereses && profile.intereses.length > 0 ? (
          <View style={styles.interestsSection}>
            <Text style={styles.sectionLabel}>{t("interests")}</Text>
            <View style={styles.tagsContainer}>
              {profile.intereses.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.interestsSection}>
            <Pressable onPress={handleEditPress}>
              <Text style={[styles.sectionLabel, { fontStyle: "italic", opacity: 0.4 }]}>
                Añade tus intereses...
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── XP Progress ── */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <View style={styles.xpHeaderLeft}>
              <Ionicons name="flash-outline" size={16} color="rgba(99, 102, 241, 1)" style={{ marginRight: 6 }} />
              <Text style={styles.xpLabel}>{t("xp_progress")}</Text>
            </View>
            <Text style={styles.xpValue}>-- / -- XP</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "0%" }]} />
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionLabelWhite}>{t("recent_activity")}</Text>
            <Text style={styles.viewAllText}>{t("view_all")}</Text>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={32} color="rgba(143,132,224,0.3)" />
              <Text style={styles.emptyText}>Próximamente</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
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
    height: "100%",
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 3,
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
  },

  // ── Edit Mode ──
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  editTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
  editCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editCancelText: {
    color: "rgba(143, 132, 224, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  editSaveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 12,
    minWidth: 72,
    alignItems: "center",
  },
  editSaveText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  editScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  editAvatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  editAvatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(11, 13, 24, 1)",
  },
  editAvatarHint: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 11,
    marginTop: 10,
  },
  editFieldGroup: {
    marginBottom: 20,
  },
  editFieldLabel: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  editInputWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
  },
  editInput: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "400",
  },
  editTextAreaWrap: {
    paddingVertical: 12,
  },
  editTextArea: {
    minHeight: 90,
    lineHeight: 22,
  },
  editCharCount: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    textAlign: "right",
    marginTop: 6,
  },
  editTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  editTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editTagText: {
    color: "rgba(165, 180, 252, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  editTagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editTagAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(99, 102, 241, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  editTagHint: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 10,
    marginTop: 8,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyText: {
    color: "rgba(143, 132, 224, 0.40)",
    fontSize: 13,
    fontWeight: "500",
  },
});
