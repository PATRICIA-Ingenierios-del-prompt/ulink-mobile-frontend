import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Bienestar1 } from '../components/bienestar/Bienestar1';
import { Bienestar2 } from '../components/bienestar/Bienestar2';
import { Bienestar3 } from '../components/bienestar/Bienestar3';
import { Bienestar4 } from '../components/bienestar/Bienestar4';

const TABS = [
  { id: 1 as const, label: 'Mono' },
  { id: 2 as const, label: 'Diario' },
  { id: 3 as const, label: 'Sonidos' },
  { id: 4 as const, label: 'Respira' },
];

function AnimatedTab({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Instagram-style: compress then spring bounce back
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.82,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 14,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={{ flexShrink: 1 }}>
      <Animated.View
        style={[
          isActive ? styles.activeTabButton : styles.inactiveTabButton,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function BienestarScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);
  const backScale = useRef(new Animated.Value(1)).current;

  const handleBackPress = () => {
    Animated.sequence([
      Animated.spring(backScale, { toValue: 0.85, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(backScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]).start();
    router.back();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 1: return <Bienestar1 onTabChange={setActiveTab} />;
      case 2: return <Bienestar2 onTabChange={setActiveTab} />;
      case 3: return <Bienestar3 onTabChange={setActiveTab} />;
      case 4: return <Bienestar4 onTabChange={setActiveTab} />;
      default: return <Bienestar1 onTabChange={setActiveTab} />;
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerContainer}>
        <Pressable onPress={handleBackPress} style={{ flexShrink: 0 }}>
          <Animated.View style={[styles.backButton, { transform: [{ scale: backScale }] }]}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </Animated.View>
        </Pressable>

        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <AnimatedTab
              key={tab.id}
              label={tab.label}
              isActive={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 24, 1)',
  },
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 56,
    paddingLeft: 16,
    paddingBottom: 12,
    paddingRight: 16,
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  backButton: {
    flexDirection: 'row',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 1)',
    shadowColor: 'rgba(245, 158, 11, 0.35)',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
  },
  inactiveTabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTabText: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
