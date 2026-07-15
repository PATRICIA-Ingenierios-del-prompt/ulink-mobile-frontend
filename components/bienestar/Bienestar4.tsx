import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Pressable, ScrollView } from 'react-native';

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
  },
  {
    key: 'box',
    label: 'Box',
    steps: ['Inhala 4s', 'Sostén 4s', 'Exhala 4s', 'Sostén 4s'],
  },
  {
    key: 'calma',
    label: 'Calma',
    steps: ['Inhala 4s', 'Exhala 6s'],
  },
];

export function Bienestar4(props: Bienestar4Props) {
  const [selectedTechnique, setSelectedTechnique] = useState('478');
  const technique = TECHNIQUES.find(t => t.key === selectedTechnique)!;

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
              onPress={() => setSelectedTechnique(t.key)}
            >
              <Text style={selectedTechnique === t.key ? styles.techLabelActive : styles.techLabel}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.circleWrapper}>
          <View style={styles.ring3} />
          <View style={styles.ring2} />
          <View style={styles.ring1} />
          <View style={styles.circle}>
            <Text style={styles.circleEmoji}>{'🌬️'}</Text>
            <Text style={styles.circleLabel}>Toca para empezar</Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          {technique.steps.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.startButton}>
          <Text style={styles.startButtonText}>Comenzar</Text>
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
    gap: 24,
  },
  techniqueSelector: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
  },
  techButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  techButtonActive: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 1)',
    alignItems: 'center',
  },
  techLabel: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  techLabelActive: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  circleWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  ring3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  ring2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
  },
  ring1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  circleEmoji: {
    fontSize: 28,
  },
  circleLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  stepText: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
  },
  startButton: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 1)',
    alignItems: 'center',
    elevation: 8,
  },
  startButtonText: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
