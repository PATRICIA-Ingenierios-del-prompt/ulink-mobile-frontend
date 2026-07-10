import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { GlassNavBar } from "@/components/glass-nav-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";

export default function ParchesScreen() {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Ionicons name="people-outline" size={60} color="rgba(143, 132, 224, 1)" />
        <Text style={styles.title}>{t("nav_parches")}</Text>
        <Text style={styles.subtitle}>{t("coming_soon")}</Text>
      </View>
      <GlassNavBar activeTab="parches" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(11, 13, 24, 1)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  title: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  subtitle: {
    color: "rgba(143, 132, 224, 0.8)",
    fontSize: 14,
    marginTop: 8,
  },
});
