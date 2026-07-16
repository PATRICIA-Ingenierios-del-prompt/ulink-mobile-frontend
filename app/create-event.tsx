import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eventService } from '@/services/eventService';

const CATEGORIES = ['ACADEMIC', 'SOCIAL', 'WELLNESS', 'SPORT', 'CULTURAL'];
const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: 'Académico 📚',
  SOCIAL: 'Social 🎉',
  WELLNESS: 'Bienestar 🧘',
  SPORT: 'Deportivo ⚽',
  CULTURAL: 'Cultural 🎭'
};

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [category, setCategory] = useState('SOCIAL');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title || !description || !locationName) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      await eventService.createEvent({
        title,
        description,
        locationName,
        category,
        maxParticipants: parseInt(maxParticipants) || 10,
        latitude: 4.735,
        longitude: -74.032,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString()
      });
      
      Alert.alert('Éxito', '¡Evento creado correctamente!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.log('Error creating event:', err);
      Alert.alert('Error', 'No se pudo crear el evento. Revisa tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>Crear Evento ECI</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título del evento *</Text>
            <TextInput style={styles.input} placeholder="Ej. Torneo de Ping Pong" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="¿De qué trata el evento?" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ubicación (Edificio/Lugar) *</Text>
            <TextInput style={styles.input} placeholder="Ej. Bloque C - Plazoleta" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={locationName} onChangeText={setLocationName} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cupos máximos</Text>
            <TextInput style={styles.input} placeholder="Ej. 20" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.categoryBtnText, category === cat && styles.categoryBtnTextActive]}>{CATEGORY_LABELS[cat]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <Pressable style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={isSubmitting}>
            <Text style={styles.submitBtnText}>{isSubmitting ? 'Creando...' : 'Publicar Evento'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(11, 13, 24, 1)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600', fontFamily: 'Inter' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  formGroup: { marginBottom: 24 },
  label: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '500', marginBottom: 8, fontFamily: 'Inter' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 16, color: 'white', fontSize: 15, fontFamily: 'Inter' },
  textArea: { height: 100 },
  categoryScroll: { flexDirection: 'row', paddingTop: 4 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', marginRight: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  categoryBtnActive: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.8)' },
  categoryBtnText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, fontWeight: '500' },
  categoryBtnTextActive: { color: 'rgba(99, 102, 241, 1)', fontWeight: '600' },
  submitBtn: { backgroundColor: 'rgba(99, 102, 241, 1)', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700', fontFamily: 'Inter' },
});
