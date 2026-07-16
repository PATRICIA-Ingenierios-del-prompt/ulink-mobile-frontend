import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { ViewStyle, StyleProp } from 'react-native';

export interface Bienestar2Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onTabChange?: (index: 1 | 2 | 3 | 4) => void;
}

interface JournalEntry {
  emoji: string;
  date: string;
  text: string;
  moodValue: number;
  timestamp: number;
}

const DEFAULT_ENTRIES: JournalEntry[] = [
  { emoji: '😊', date: 'Lunes 7 Jul', text: 'Hoy tuve una buena sesión de estudio con el grupo...', moodValue: 4, timestamp: Date.now() - 86400000 * 1 },
  { emoji: '😔', date: 'Domingo 6 Jul', text: 'Me costó concentrarme, pero al final logré terminar el ejercicio...', moodValue: 2, timestamp: Date.now() - 86400000 * 2 },
  { emoji: '🌟', date: 'Sábado 5 Jul', text: '¡Terminé el proyecto de IA! Fue mucho trabajo pero valió la pena...', moodValue: 5, timestamp: Date.now() - 86400000 * 3 },
];

const MOODS = [
  { emoji: '😊', label: 'Genial', color: '#7FE7C4', value: 5 },
  { emoji: '🙂', label: 'Bien', color: '#6C63FF', value: 4 },
  { emoji: '😐', label: 'Okei', color: '#FFB347', value: 3 },
  { emoji: '😔', label: 'Mal', color: '#FF6B9D', value: 2 },
  { emoji: '😰', label: 'Estres', color: '#FF4D6A', value: 1 },
];

const DIARIO_STORAGE_KEY = 'journal_entries';

// ── Streak computation (matches web frontend) ──
function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const dayMs = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const daysWithEntries = new Set(
    entries.map((e) => Math.floor(e.timestamp / dayMs))
  );

  let streak = 0;
  let checkDay = todayMs;

  // Check if today has an entry; if not, start from yesterday
  if (!daysWithEntries.has(Math.floor(todayMs / dayMs))) {
    checkDay -= dayMs;
  }

  while (daysWithEntries.has(Math.floor(checkDay / dayMs))) {
    streak++;
    checkDay -= dayMs;
  }

  return streak;
}

// ── Weekly mood chart data (matches web frontend) ──
function computeWeekMoods(entries: JournalEntry[]): (number | null)[] {
  const dayMs = 86400000;
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayMs = now.getTime() - ((dayOfWeek + 6) % 7) * dayMs;

  const week: (number | null)[] = [null, null, null, null, null, null, null];

  for (const entry of entries) {
    const entryDay = Math.floor(entry.timestamp / dayMs);
    for (let d = 0; d < 7; d++) {
      const checkDay = Math.floor((mondayMs + d * dayMs) / dayMs);
      if (entryDay === checkDay) {
        week[d] = entry.moodValue;
        break;
      }
    }
  }

  return week;
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function Bienestar2(props: Bienestar2Props) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>(DEFAULT_ENTRIES);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const saved = await SecureStore.getItemAsync(DIARIO_STORAGE_KEY);
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (selectedMood === null || !journalText.trim()) {
      Alert.alert('Faltan datos', 'Por favor selecciona un ánimo y escribe algo.');
      return;
    }

    const mood = MOODS[selectedMood];
    const newEntry: JournalEntry = {
      emoji: mood.emoji,
      date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
      text: journalText.trim(),
      moodValue: mood.value,
      timestamp: Date.now(),
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setSelectedMood(null);
    setJournalText('');

    try {
      await SecureStore.setItemAsync(DIARIO_STORAGE_KEY, JSON.stringify(updatedEntries));
      Alert.alert('Guardado', 'Tu entrada del diario ha sido guardada.');
    } catch (err) {
      console.error(err);
    }
  };

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const weekMoods = useMemo(() => computeWeekMoods(entries), [entries]);
  const maxMood = 5;

  return (
    <View testID={props.testID ?? '113:253'} style={[styles.root, props.style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak + Weekly Mood Row */}
        <View style={styles.statsRow}>
          {/* Streak card */}
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakLabel}>día{streak !== 1 ? 's' : ''} seguidos</Text>
            </View>
          </View>

          {/* Weekly mood chart */}
          <View style={styles.weekCard}>
            <Text style={styles.weekTitle}>Tu semana</Text>
            <View style={styles.chartRow}>
              {weekMoods.map((mood, i) => {
                const height = mood !== null ? (mood / maxMood) * 32 : 4;
                const color = mood !== null ? MOODS.find(m => m.value === mood)?.color ?? '#6C63FF' : 'rgba(255,255,255,0.08)';
                const isToday = i === ((new Date().getDay() + 6) % 7);
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={[styles.chartBar, { height, backgroundColor: color }]} />
                    <Text style={[styles.chartDay, isToday && styles.chartDayActive]}>
                      {DAY_LABELS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Today's card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayDate}>
              Hoy · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.comoEstas}>¿Cómo estás?</Text>
          </View>

          {/* Mood selector */}
          <View style={styles.moodRow}>
            {MOODS.map((m, i) => (
              <Pressable
                key={i}
                style={[styles.moodButton, selectedMood === i && styles.moodButtonActive]}
                onPress={() => setSelectedMood(i)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, selectedMood === i && { color: m.color }]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Journal input */}
          <TextInput
            style={styles.textArea}
            placeholder="¿Por qué te sientes así?"
            placeholderTextColor="rgba(90, 90, 104, 1)"
            multiline
            numberOfLines={4}
            value={journalText}
            onChangeText={setJournalText}
          />
          <Pressable
            style={[styles.saveButton, (selectedMood === null || !journalText.trim()) && { opacity: 0.4 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Guardar entrada</Text>
          </Pressable>
        </View>

        {/* Previous entries */}
        <Text style={styles.sectionTitle}>Entradas anteriores</Text>

        {entries.map((entry, i) => (
          <View key={i} style={styles.entryCard}>
            <View style={[styles.entryEmoji, { backgroundColor: `${MOODS.find(m => m.value === entry.moodValue)?.color ?? '#6C63FF'}18` }]}>
              <Text style={styles.entryEmojiText}>{entry.emoji}</Text>
            </View>
            <View style={styles.entryContent}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              <Text style={styles.entryText} numberOfLines={2}>{entry.text}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'stretch',
  },
  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 150, 50, 0.2)',
    backgroundColor: 'rgba(255, 150, 50, 0.06)',
    padding: 12,
    flex: 0,
  },
  streakEmoji: {
    fontSize: 22,
  },
  streakCount: {
    color: '#FFB347',
    fontSize: 18,
    fontWeight: '800',
  },
  streakLabel: {
    color: 'rgba(90, 90, 104, 1)',
    fontSize: 10,
    fontWeight: '500',
  },
  weekCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
    backgroundColor: 'rgba(108, 99, 255, 0.04)',
    padding: 12,
  },
  weekTitle: {
    color: 'rgba(90, 90, 104, 1)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 48,
  },
  chartCol: {
    alignItems: 'center',
    gap: 4,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  chartDay: {
    color: 'rgba(90, 90, 104, 1)',
    fontSize: 9,
    fontWeight: '500',
  },
  chartDayActive: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  /* Today card */
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.14)',
    backgroundColor: 'rgba(30, 24, 48, 0.70)',
    padding: 16,
    gap: 12,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayDate: {
    color: 'rgba(212, 184, 150, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
  },
  comoEstas: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  moodButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 9,
    color: 'rgba(90, 90, 104, 1)',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  saveButtonText: {
    color: 'rgba(251, 191, 36, 1)',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 13,
    padding: 12,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    paddingLeft: 4,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
  },
  entryEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryEmojiText: {
    fontSize: 20,
  },
  entryContent: {
    flex: 1,
    gap: 4,
  },
  entryDate: {
    color: 'rgba(99, 102, 241, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  entryText: {
    color: 'rgba(180, 180, 190, 1)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
});
