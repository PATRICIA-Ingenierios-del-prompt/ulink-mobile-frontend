import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Bienestar1 } from '../components/bienestar/Bienestar1';
import { Bienestar2 } from '../components/bienestar/Bienestar2';
import { Bienestar3 } from '../components/bienestar/Bienestar3';
import { Bienestar4 } from '../components/bienestar/Bienestar4';

export default function BienestarScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  const renderContent = () => {
    switch (activeTab) {
      case 1:
        return <Bienestar1 onTabChange={setActiveTab} />;
      case 2:
        return <Bienestar2 onTabChange={setActiveTab} />;
      case 3:
        return <Bienestar3 onTabChange={setActiveTab} />;
      case 4:
        return <Bienestar4 onTabChange={setActiveTab} />;
      default:
        return <Bienestar1 onTabChange={setActiveTab} />;
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </Pressable>
        
        <View style={styles.tabsContainer}>
          <Pressable 
            style={activeTab === 1 ? styles.activeTabButton : styles.inactiveTabButton} 
            onPress={() => setActiveTab(1)}
          >
            <Text style={activeTab === 1 ? styles.activeTabText : styles.inactiveTabText}>Mono</Text>
          </Pressable>
          
          <Pressable 
            style={activeTab === 2 ? styles.activeTabButton : styles.inactiveTabButton} 
            onPress={() => setActiveTab(2)}
          >
            <Text style={activeTab === 2 ? styles.activeTabText : styles.inactiveTabText}>Diario</Text>
          </Pressable>

          <Pressable 
            style={activeTab === 3 ? styles.activeTabButton : styles.inactiveTabButton} 
            onPress={() => setActiveTab(3)}
          >
            <Text style={activeTab === 3 ? styles.activeTabText : styles.inactiveTabText}>Sonidos</Text>
          </Pressable>

          <Pressable 
            style={activeTab === 4 ? styles.activeTabButton : styles.inactiveTabButton} 
            onPress={() => setActiveTab(4)}
          >
            <Text style={activeTab === 4 ? styles.activeTabText : styles.inactiveTabText}>Respira</Text>
          </Pressable>
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
    zIndex: 100, // Make sure it stays on top
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
  },
  activeTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 1)', // Orange for Mono active
    shadowColor: 'rgba(245, 158, 11, 0.35)',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
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
