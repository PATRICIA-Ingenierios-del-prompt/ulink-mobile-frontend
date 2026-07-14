import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { usePathname } from "expo-router";
import { GlassNavBar } from "@/components/glass-nav-bar";

export default function TabLayout() {
  const pathname = usePathname();
  const isParche = pathname.endsWith("/parche");

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="parches" />
        <Tabs.Screen name="events" />
        {/* Hidden from tab bar — navigated to via router.push */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="parche" options={{ href: null }} />
      </Tabs>

      {/* Persistent nav bar — hidden inside parche screen */}
      {!isParche && <GlassNavBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
