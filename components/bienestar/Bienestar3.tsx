import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

import type { ViewStyle, StyleProp } from 'react-native';

export interface Bienestar3Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onTabChange?: (index: 1 | 2 | 3 | 4) => void;
}

const SOUNDS_DATA = [
  { id: 'lluvia', emoji: '🌧️', label: 'Lluvia', url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  { id: 'bosque', emoji: '🌿', label: 'Bosque', url: 'https://assets.mixkit.co/active_storage/sfx/2500/2500-preview.mp3' },
  { id: 'olas', emoji: '🌊', label: 'Olas', url: 'https://assets.mixkit.co/active_storage/sfx/1195/1195-preview.mp3' },
  { id: 'lofi', emoji: '🎵', label: 'Lo-fi', url: 'https://assets.mixkit.co/active_storage/sfx/143/143-preview.mp3' },
  { id: 'viento', emoji: '💨', label: 'Viento', url: 'https://assets.mixkit.co/active_storage/sfx/2416/2416-preview.mp3' },
  { id: 'hoguera', emoji: '🔥', label: 'Hoguera', url: 'https://assets.mixkit.co/active_storage/sfx/2951/2951-preview.mp3' },
  { id: 'cafe', emoji: '☕', label: 'Café', url: 'https://assets.mixkit.co/active_storage/sfx/2917/2917-preview.mp3' },
  { id: 'cosmos', emoji: '🌌', label: 'Cosmos', url: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3' },
];

export function Bienestar3(props: Bienestar3Props) {
  const [activeSounds, setActiveSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [loadingSounds, setLoadingSounds] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Wrap in async function with try/catch to prevent web crashes
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      } catch (e) {
        console.log('Audio mode setup error (safe to ignore on web):', e);
      }
    };
    setupAudio();
    
    // Cleanup sounds on unmount
    return () => {
      setActiveSounds((currentSounds) => {
        Object.values(currentSounds).forEach(async (sound) => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (e) {
            // Ignore unload errors
          }
        });
        return {};
      });
    };
  }, []);

  const toggleSound = async (id: string, url: string) => {
    if (loadingSounds[id]) return; // Prevent spam clicks
    
    try {
      setLoadingSounds(prev => ({ ...prev, [id]: true }));
      
      if (activeSounds[id]) {
        // Stop and unload
        const sound = activeSounds[id];
        await sound.stopAsync();
        await sound.unloadAsync();
        
        setActiveSounds(prev => {
          const newSounds = { ...prev };
          delete newSounds[id];
          return newSounds;
        });
      } else {
        // Load and play
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        setActiveSounds(prev => ({ ...prev, [id]: sound }));
      }
    } catch (err: any) {
      console.log('Error toggling sound', err);
      // Fallback alert for the user to report exact error
      import('react-native').then(({ Alert }) => {
        Alert.alert('Error de audio', 'No se pudo cargar el sonido: ' + (err.message || 'Verifica tu conexión.'));
      });
    } finally {
      setLoadingSounds(prev => {
        const newLoading = { ...prev };
        delete newLoading[id];
        return newLoading;
      });
    }
  };

  return (
    <View testID={props.testID ?? '113:254'} style={[styles.root, props.style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Activa los que quieras combinar 🎧</Text>
        
        <View style={styles.grid}>
          {SOUNDS_DATA.map((item) => {
            const isActive = !!activeSounds[item.id];
            const isLoading = !!loadingSounds[item.id];
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.soundButton,
                  isActive && styles.soundButtonActive,
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }
                ]}
                onPress={() => toggleSound(item.id, item.url)}
                disabled={isLoading}
              >
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  {isLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color={isActive ? "rgba(255,255,255,0.9)" : "rgba(99, 102, 241, 1)"} />
                    </View>
                  )}
                </View>
                
                <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
                
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
                  <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                    {isLoading ? 'Cargando...' : isActive ? 'Reproduciendo' : 'Silencio'}
                  </Text>
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  soundButton: {
    width: '45%',
    backgroundColor: 'rgba(28, 30, 48, 0.6)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  soundButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: 'rgba(129, 140, 248, 0.6)',
    shadowColor: 'rgba(99, 102, 241, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  emoji: {
    fontSize: 32,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
  },
  labelActive: {
    color: 'rgba(255, 255, 255, 1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDotActive: {
    backgroundColor: 'rgba(52, 211, 153, 1)',
    shadowColor: 'rgba(52, 211, 153, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
  },
  statusTextActive: {
    color: 'rgba(52, 211, 153, 0.9)',
    fontWeight: '600',
  },
});
