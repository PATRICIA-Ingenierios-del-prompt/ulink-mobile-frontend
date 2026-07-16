import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, withSequence } from 'react-native-reanimated';
import { Audio } from 'expo-av';

import type { ViewStyle, StyleProp } from 'react-native';

export interface Bienestar4Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onTabChange?: (index: 1 | 2 | 3 | 4) => void;
}

const TECHNIQUES = [
  {
    key: '478',
    label: '4-7-8',
    steps: ['Inhala 4s', 'Sostén 7s', 'Exhala 8s'],
    sequence: [
      { phase: 'Inhala', duration: 4000, scale: 1.5, color: 'rgba(52, 211, 153, 0.4)' },
      { phase: 'Sostén', duration: 7000, scale: 1.5, color: 'rgba(245, 158, 11, 0.4)' },
      { phase: 'Exhala', duration: 8000, scale: 1, color: 'rgba(99, 102, 241, 0.4)' },
    ],
  },
  {
    key: 'box',
    label: 'Box',
    steps: ['Inhala 4s', 'Sostén 4s', 'Exhala 4s', 'Sostén 4s'],
    sequence: [
      { phase: 'Inhala', duration: 4000, scale: 1.5, color: 'rgba(52, 211, 153, 0.4)' },
      { phase: 'Sostén', duration: 4000, scale: 1.5, color: 'rgba(245, 158, 11, 0.4)' },
      { phase: 'Exhala', duration: 4000, scale: 1, color: 'rgba(99, 102, 241, 0.4)' },
      { phase: 'Sostén', duration: 4000, scale: 1, color: 'rgba(245, 158, 11, 0.4)' },
    ],
  },
  {
    key: 'calma',
    label: 'Calma',
    steps: ['Inhala 4s', 'Exhala 6s'],
    sequence: [
      { phase: 'Inhala', duration: 4000, scale: 1.5, color: 'rgba(52, 211, 153, 0.4)' },
      { phase: 'Exhala', duration: 6000, scale: 1, color: 'rgba(99, 102, 241, 0.4)' },
    ],
  },
];

export function Bienestar4(props: Bienestar4Props) {
  const [selectedTechnique, setSelectedTechnique] = useState('478');
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('Toca Comenzar');
  const [countdown, setCountdown] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const technique = TECHNIQUES.find(t => t.key === selectedTechnique)!;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const stopAnimation = useCallback(async () => {
    setIsActive(false);
    setCurrentPhase('Toca Comenzar');
    setCountdown(null);
    scale.value = withTiming(1, { duration: 500 });
    opacity.value = withTiming(0.3, { duration: 500 });
    
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
  }, [scale, opacity]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/science_fiction/humming_drone.ogg' },
          { isLooping: true, volume: 0.5 }
        );
        soundRef.current = sound;
      } catch (e) {
        console.log("Audio load error (safe on web):", e);
      }
    };
    setupAudio();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    if (isActive) {
      if (soundRef.current) {
        soundRef.current.playAsync().catch(() => {});
      }
      
      const runSequence = async () => {
        let currentStepIndex = 0;
        
        const nextStep = () => {
          if (!isMounted || !isActive) return;
          const step = technique.sequence[currentStepIndex];
          setCurrentPhase(step.phase);
          setCountdown(step.duration / 1000);

          scale.value = withTiming(step.scale, { 
            duration: step.phase === 'Sostén' ? 0 : step.duration, 
            easing: Easing.inOut(Easing.ease) 
          });
          
          opacity.value = withTiming(step.phase === 'Inhala' ? 0.8 : 0.4, { duration: step.duration });

          let elapsed = 0;
          intervalId = setInterval(() => {
            elapsed += 1000;
            if (elapsed < step.duration) {
              setCountdown((prev) => (prev !== null ? prev - 1 : null));
            }
          }, 1000);

          timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            currentStepIndex = (currentStepIndex + 1) % technique.sequence.length;
            nextStep();
          }, step.duration);
        };
        
        nextStep();
      };
      
      runSequence();
    } else {
      stopAnimation();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isActive, technique, scale, opacity]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <View testID={props.testID ?? '113:255'} style={[styles.root, props.style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.techniqueSelector}>
          {TECHNIQUES.map(t => (
            <Pressable
              key={t.key}
              style={selectedTechnique === t.key ? styles.techButtonActive : styles.techButton}
              onPress={() => {
                if (!isActive) setSelectedTechnique(t.key);
              }}
            >
              <Text style={selectedTechnique === t.key ? styles.techLabelActive : styles.techLabel}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.circleWrapper}>
          <Animated.View style={[styles.glowRing, glowStyle, animatedStyle]} />
          <Animated.View style={[styles.ring3, animatedStyle]} />
          <Animated.View style={[styles.ring2, animatedStyle]} />
          <Animated.View style={[styles.ring1, animatedStyle]} />
          <Animated.View style={[styles.circle, animatedStyle]}>
            <Text style={styles.circleEmoji}>{'🌬️'}</Text>
            <Text style={styles.circleLabel}>{currentPhase}</Text>
            {countdown !== null && isActive && <Text style={styles.circleCountdown}>{countdown}</Text>}
          </Animated.View>
        </View>

        <View style={styles.stepsContainer}>
          {technique.steps.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: technique.sequence[i].color.replace('0.4', '1') }]} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.startButton, 
            isActive && styles.stopButton,
            pressed && { transform: [{ scale: 0.96 }] }
          ]} 
          onPress={handleToggle}
        >
          <Text style={styles.startButtonText}>{isActive ? 'Detener Ejercicio' : 'Comenzar a Respirar'}</Text>
        </Pressable>
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
    alignItems: 'center',
    gap: 32,
  },
  techniqueSelector: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
    paddingHorizontal: 8,
  },
  techButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  techButtonActive: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.6)',
    alignItems: 'center',
    shadowColor: 'rgba(99, 102, 241, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  techLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
  },
  techLabelActive: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
  },
  circleWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: 'rgba(99, 102, 241, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 10,
  },
  ring3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  ring2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  ring1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(28, 30, 48, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(129, 140, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  circleEmoji: {
    fontSize: 28,
  },
  circleLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  circleCountdown: {
    color: 'rgba(52, 211, 153, 1)',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
    flexWrap: 'wrap',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    alignSelf: 'stretch',
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 1)',
    alignItems: 'center',
    shadowColor: 'rgba(99, 102, 241, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: 'rgba(242, 63, 67, 1)',
    shadowColor: 'rgba(242, 63, 67, 0.5)',
  },
  startButtonText: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
