import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { ViewStyle, StyleProp } from 'react-native';

export interface Bienestar2Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onTabChange?: (index: 1 | 2 | 3 | 4) => void;
}

const DEFAULT_ENTRIES = [
  { emoji: '😊', date: 'Lunes 7 Jul', text: 'Hoy tuve una buena sesión de estudio con el grupo...' },
  { emoji: '😔', date: 'Domingo 6 Jul', text: 'Me costó concentrarme, pero al final logré terminar el ejercicio...' },
  { emoji: '🌟', date: 'Sábado 5 Jul', text: '¡Terminé el proyecto de IA! Fue mucho trabajo pero valió la pena...' },
];

const MOODS = [
  { emoji: '😊', label: 'Bien' },
  { emoji: '😐', label: 'Neutro' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😤', label: 'Enojado' },
  { emoji: '🌟', label: 'Genial' },
  { emoji: '😴', label: 'Cansado' },
];

export function Bienestar2(props: Bienestar2Props) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const saved = await SecureStore.getItemAsync('journal_entries');
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

    const newEntry = {
      emoji: MOODS[selectedMood].emoji,
      date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
      text: journalText.trim()
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setSelectedMood(null);
    setJournalText('');

    try {
      await SecureStore.setItemAsync('journal_entries', JSON.stringify(updatedEntries));
      Alert.alert('Guardado', 'Tu entrada del diario ha sido guardada.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View testID={props.testID ?? '113:253'} style={[styles.root, props.style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayDate}>Hoy · miércoles, 8 de jul</Text>
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
              </Pressable>
            ))}
          </View>

          {/* Journal input */}
          <TextInput
            style={styles.textArea}
            placeholder="¿Por qué te sientes agradecido?"
            placeholderTextColor="rgba(90, 90, 104, 1)"
            multiline
            numberOfLines={4}
            value={journalText}
            onChangeText={setJournalText}
          />
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar entrada</Text>
          </Pressable>
        </View>

        {/* Previous entries */}
        <Text style={styles.sectionTitle}>Entradas anteriores</Text>

        {entries.map((entry, i) => (
          <View key={i} style={styles.entryCard}>
            <View style={styles.entryEmoji}>
              <Text style={styles.entryEmojiText}>{entry.emoji}</Text>
            </View>
            <View style={styles.entryContent}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              <Text style={styles.entryText} numberOfLines={2}>{entry.text}</Text>
            </View>
          </View>
        ))}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moodButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
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
  moodEmoji: {
    fontSize: 22,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
