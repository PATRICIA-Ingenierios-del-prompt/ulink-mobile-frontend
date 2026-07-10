import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="parches" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
