import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { Audio } from 'expo-av';

import type { ViewStyle, StyleProp } from 'react-native';

export interface Bienestar3Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onTabChange?: (index: 1 | 2 | 3 | 4) => void;
}

const SOUNDS_DATA = [
  { id: 'lluvia', emoji: '🌧️', label: 'Lluvia', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_32c0dce5c0.mp3?filename=heavy-rain-nature-sounds-8186.mp3' },
  { id: 'bosque', emoji: '🌿', label: 'Bosque', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_82da41d01f.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3' },
  { id: 'olas', emoji: '🌊', label: 'Olas', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_24a2dfdc5e.mp3?filename=ocean-wave-1-6849.mp3' },
  { id: 'lofi', emoji: '🎵', label: 'Lo-fi', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf7eb.mp3?filename=lofi-study-112191.mp3' },
  { id: 'viento', emoji: '💨', label: 'Viento', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_a405c10557.mp3?filename=wind-outside-sound-ambient-141941.mp3' },
  { id: 'hoguera', emoji: '🔥', label: 'Hoguera', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_7311d4d38e.mp3?filename=crackling-fire-14454.mp3' },
  { id: 'cafe', emoji: '☕', label: 'Café', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_f53587002b.mp3?filename=coffee-shop-chatter-34674.mp3' },
  { id: 'cosmos', emoji: '🌌', label: 'Cosmos', url: 'https://cdn.pixabay.com/download/audio/2021/11/24/audio_27ed90bb54.mp3?filename=space-ambience-56265.mp3' },
];

export function Bienestar3(props: Bienestar3Props) {
  const [activeSounds, setActiveSounds] = useState<{ [key: string]: Audio.Sound }>({});

  useEffect(() => {
    // Establecer el modo de audio para que funcione en iOS en silencio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    
    // Cleanup sounds on unmount
    return () => {
      Object.values(activeSounds).forEach(async (sound) => {
        await sound.unloadAsync();
      });
    };
  }, []);

  const toggleSound = async (id: string, url: string) => {
    try {
      if (activeSounds[id]) {
        // Stop and unload
        const sound = activeSounds[id];
        await sound.stopAsync();
        await sound.unloadAsync();
        
        const newSounds = { ...activeSounds };
        delete newSounds[id];
        setActiveSounds(newSounds);
      } else {
        // Load and play
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        setActiveSounds(prev => ({ ...prev, [id]: sound }));
      }
    } catch (err) {
      console.log('Error toggling sound', err);
    }
  };

  return (
    <View testID={props.testID ?? '113:254'} style={[styles.root, props.style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Activa los que quieras combinar</Text>
        
        <View style={styles.grid}>
          {SOUNDS_DATA.map((item) => {
            const isActive = !!activeSounds[item.id];
            return (
              <Pressable
                key={item.id}
                style={[styles.soundButton, isActive && styles.soundButtonActive]}
                onPress={() => toggleSound(item.id, item.url)}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
                  <Text style={styles.statusText}>{isActive ? 'Reproduciendo' : 'Silencio'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 24, 1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },
  title: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  soundButton: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  soundButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusDotActive: {
    backgroundColor: 'rgba(52, 211, 153, 1)',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500',
  },
});
