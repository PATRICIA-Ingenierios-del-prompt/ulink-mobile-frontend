import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { GlassNavBar } from "@/components/glass-nav-bar";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Ionicons name="calendar-outline" size={60} color="rgba(143, 132, 224, 1)" />
        <Text style={styles.title}>Eventos</Text>
        <Text style={styles.subtitle}>¡Próximamente!</Text>
      </View>
      <GlassNavBar activeTab="events" />
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
