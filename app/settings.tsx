import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useAccessibility, type VisionMode } from "@/context/AccessibilityContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { logout } = useAuth();
  const { visionMode, setVisionMode, dyslexiaMode, setDyslexiaMode } = useAccessibility();
  
  // Toggles state
  const [matchesNotif, setMatchesNotif] = useState(true);
  const [messagesNotif, setMessagesNotif] = useState(true);
  const [eventsNotif, setEventsNotif] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);
  
  // Selections
  const [profileVis, setProfileVis] = useState<"public" | "private">("public");

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="rgba(236, 237, 248, 1)" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("settings")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Idioma ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("language")}</Text>
          <View style={styles.card}>
            <View style={styles.paddingRow}>
              <View style={styles.radioGroup}>
                <RadioOption 
                  selected={language === "es"} 
                  onPress={() => setLanguage("es")}
                  title={t("lang_es")} 
                  activeIcon="checkmark-circle"
                />
                <RadioOption 
                  selected={language === "en"} 
                  onPress={() => setLanguage("en")}
                  title={t("lang_en")} 
                  activeIcon="checkmark-circle"
                />
                <RadioOption 
                  selected={language === "fr"} 
                  onPress={() => setLanguage("fr")}
                  title={t("lang_fr")} 
                  activeIcon="checkmark-circle"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Notificaciones ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("notifications")}</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="people-outline" 
              title={t("new_matches")} 
              desc={t("new_matches_desc")}
              control={<CustomSwitch value={matchesNotif} onValueChange={setMatchesNotif} />}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="notifications-outline" 
              title={t("messages")} 
              desc={t("messages_desc")}
              control={<CustomSwitch value={messagesNotif} onValueChange={setMessagesNotif} />}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="flash-outline" 
              title={t("nearby_events")} 
              desc={t("nearby_events_desc")}
              control={<CustomSwitch value={eventsNotif} onValueChange={setEventsNotif} />}
            />
          </View>
        </View>

        {/* ── Privacidad ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("privacy")}</Text>
          <View style={styles.card}>
            <View style={styles.paddingRow}>
              <View style={styles.rowHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="eye-outline" size={18} color="rgba(129, 140, 248, 1)" />
                </View>
                <Text style={styles.rowTitle}>{t("profile_visibility")}</Text>
              </View>
              <View style={styles.segmentedControl}>
                <Pressable 
                  style={[styles.segmentBtn, profileVis === "public" && styles.segmentBtnActive]}
                  onPress={() => setProfileVis("public")}
                >
                  <Ionicons name="eye" size={14} color={profileVis === "public" ? "#fff" : "rgba(143, 132, 224, 0.6)"} />
                  <Text style={[styles.segmentText, profileVis === "public" && styles.segmentTextActive]}>{t("public")}</Text>
                </Pressable>
                <Pressable 
                  style={[styles.segmentBtn, profileVis === "private" && styles.segmentBtnActive]}
                  onPress={() => setProfileVis("private")}
                >
                  <Ionicons name="eye-off" size={14} color={profileVis === "private" ? "#fff" : "rgba(143, 132, 224, 0.6)"} />
                  <Text style={[styles.segmentText, profileVis === "private" && styles.segmentTextActive]}>{t("private")}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <SettingRow 
              icon="eye-off-outline" 
              title={t("incognito")} 
              desc={t("incognito_desc")}
              control={<CustomSwitch value={incognitoMode} onValueChange={setIncognitoMode} />}
            />
          </View>
        </View>

        {/* ── Accesibilidad ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("accessibility")}</Text>
          <View style={styles.card}>
            <View style={styles.paddingRow}>
              <View style={styles.rowHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="color-palette-outline" size={18} color="rgba(129, 140, 248, 1)" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{t("color_vision")}</Text>
                  <Text style={styles.rowDescSmall}>Brettel et al., 1997</Text>
                </View>
              </View>
              <Text style={styles.accessibilityDesc}>
                {t("color_vision_desc")}
              </Text>
              
              <View style={styles.radioGroup}>
                <RadioOption 
                  selected={visionMode === "normal"} 
                  onPress={() => setVisionMode("normal")}
                  title={t("normal_vision")} 
                  desc={t("normal_vision_desc")}
                  activeIcon="checkmark-circle"
                />
                <RadioOption 
                  selected={visionMode === "deuteranopia"} 
                  onPress={() => setVisionMode("deuteranopia")}
                  title={t("deuteranopia")} 
                  desc={t("deuteranopia_desc")}
                />
                <RadioOption 
                  selected={visionMode === "protanopia"} 
                  onPress={() => setVisionMode("protanopia")}
                  title={t("protanopia")} 
                  desc={t("protanopia_desc")}
                />
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <SettingRow 
              icon="text-outline" 
              title={t("easy_reading")} 
              desc={t("easy_reading_desc")}
              control={<CustomSwitch value={dyslexiaMode} onValueChange={setDyslexiaMode} />}
            />
          </View>
        </View>

        {/* ── Sesión y Cuenta ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_session")}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  "Cerrar sesión",
                  "¿Estás seguro que deseas cerrar sesión?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Cerrar sesión",
                      style: "destructive",
                      onPress: () => {
                        logout();
                        router.replace("/welcome-login");
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="rgba(255, 100, 100, 1)" />
              <Text style={styles.actionButtonTextDanger}>{t("logout")}</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="trash-outline" size={18} color="rgba(255, 100, 100, 1)" />
              <Text style={styles.actionButtonTextDanger}>{t("delete_account")}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Sobre U-link ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about_ulink")}</Text>
          <View style={styles.card}>
            <View style={styles.aboutGrid}>
              <View style={styles.aboutCol}>
                <Text style={styles.aboutLabel}>{t("version")}</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={styles.aboutCol}>
                <Text style={styles.aboutLabel}>{t("institution")}</Text>
                <Text style={styles.aboutValue}>ECI</Text>
              </View>
              <View style={styles.aboutCol}>
                <Text style={styles.aboutLabel}>{t("support")}</Text>
                <Text style={styles.aboutValue}>24/7</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.card, { marginTop: 12 }]}>
            <SettingLink icon="document-text-outline" title={t("terms")} onPress={() => router.push("/legal")} />
            <View style={styles.divider} />
            <SettingLink icon="shield-checkmark-outline" title={t("privacy_policy")} onPress={() => router.push("/legal")} />
            <View style={styles.divider} />
            <SettingLink icon="help-circle-outline" title={t("help_center")} onPress={() => router.push("/legal")} />
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>U·link</Text>
          <Text style={styles.footerCredits}>{t("made_in")} · v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helper Components ──

const SettingRow = React.memo(({ icon, title, desc, control }: any) => {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color="rgba(129, 140, 248, 1)" />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <View style={styles.controlBox}>
        {control}
      </View>
    </View>
  );
});

const SettingLink = React.memo(({ icon, title, onPress }: any) => {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color="rgba(129, 140, 248, 1)" />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.3)" />
    </Pressable>
  );
});

const CustomSwitch = React.memo(({ value, onValueChange }: any) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "rgba(99, 102, 241, 1)" }}
      thumbColor={"#fff"}
      ios_backgroundColor="rgba(255, 255, 255, 0.1)"
    />
  );
});

const RadioOption = React.memo(({ selected, onPress, title, desc, activeIcon }: any) => {
  return (
    <Pressable 
      style={[styles.radioOption, selected && styles.radioOptionActive]} 
      onPress={onPress}
    >
      <View style={[styles.radioDot, selected && styles.radioDotActive]}>
        {selected && <View style={styles.radioDotInner} />}
      </View>
      <View style={styles.radioTextWrap}>
        <Text style={[styles.radioTitle, selected && styles.radioTitleActive]}>{title}</Text>
        {desc && <Text style={styles.radioDesc}>{desc}</Text>}
      </View>
      {selected && activeIcon && (
        <Ionicons name={activeIcon} size={16} color="rgba(129, 140, 248, 1)" style={{ marginLeft: "auto" }} />
      )}
    </Pressable>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 22,
    fontWeight: "700",
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "rgba(143, 132, 224, 0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    marginLeft: 62,
    marginRight: 16,
  },

  // Setting Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  paddingRow: {
    padding: 16,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  rowDesc: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  rowDescSmall: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 10,
    marginTop: 1,
  },
  controlBox: {
    justifyContent: "center",
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 1)",
    shadowColor: "rgba(99, 102, 241, 0.35)",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#fff",
  },

  // Accessibility
  accessibilityDesc: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    gap: 12,
  },
  radioOptionActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioDotActive: {
    borderColor: "rgba(129, 140, 248, 1)",
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(129, 140, 248, 1)",
  },
  radioTextWrap: {
    flex: 1,
  },
  radioTitle: {
    color: "rgba(236, 237, 248, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  radioTitleActive: {
    color: "rgba(165, 180, 252, 1)",
  },
  radioDesc: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 10,
    marginTop: 2,
  },

  // Session buttons
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonTextDanger: {
    color: "rgba(255, 100, 100, 1)",
    fontSize: 13,
    fontWeight: "600",
  },

  // About Grid
  aboutGrid: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
  },
  aboutCol: {
    alignItems: "center",
  },
  aboutLabel: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  aboutValue: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 40,
  },
  footerTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  footerCredits: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 11,
    marginTop: 4,
  },
});
