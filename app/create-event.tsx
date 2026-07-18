import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { eventService, type CreateEventRequest, type LocationDto } from '@/services/eventService';
import { friendlyError } from '@/lib/errorMessages';

// Backend `Category` enum (PATRICIA_Events_Backend).
const CATEGORIES = ['SPORT', 'ENTERTAINMENT', 'MUSIC', 'ART', 'TECHNOLOGY', 'STUDY', 'VARIETY'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  SPORT: 'Deportivo ⚽',
  ENTERTAINMENT: 'Entretenimiento 🎬',
  MUSIC: 'Música 🎵',
  ART: 'Arte 🎨',
  TECHNOLOGY: 'Tecnología 💻',
  STUDY: 'Estudio 📚',
  VARIETY: 'Variedad 🎉',
};

// Campus fallback when the user doesn't share a precise location.
const DEFAULT_COORDS = { latitude: 4.601, longitude: -74.066 };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [category, setCategory] = useState<string>('VARIETY');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [eventDate, setEventDate] = useState(toDateStr(new Date()));
  const [startTime, setStartTime] = useState(toTimeStr(new Date()));
  const [endTime, setEndTime] = useState(toTimeStr(new Date(Date.now() + 2 * 3600_000)));
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Sin ubicación usaremos el centro del campus.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const handleCreate = async () => {
    // ── Campos obligatorios ────────────────────────────────────────────────
    if (!title.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para el evento.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Falta la descripción', '¿De qué trata el evento?');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('Falta la ubicación', 'Indica el lugar donde será el evento.');
      return;
    }

    // ── Formato de fecha ───────────────────────────────────────────────────
    if (!DATE_RE.test(eventDate)) {
      Alert.alert('Fecha inválida', 'La fecha debe tener el formato AAAA-MM-DD (ej. 2025-08-20).');
      return;
    }

    // ── Fecha no puede ser pasada ──────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(eventDate + 'T00:00');
    if (chosen < today) {
      Alert.alert('Fecha inválida', `La fecha ${eventDate} ya pasó. Elige una fecha a partir de hoy.`);
      return;
    }

    // ── Formato de horas ───────────────────────────────────────────────────
    if (!TIME_RE.test(startTime)) {
      Alert.alert('Hora inválida', 'La hora de inicio debe tener el formato HH:mm (ej. 14:30).');
      return;
    }
    if (!TIME_RE.test(endTime)) {
      Alert.alert('Hora inválida', 'La hora de fin debe tener el formato HH:mm (ej. 16:00).');
      return;
    }

    // ── Anticipación mínima de 30 min ──────────────────────────────────────
    const startsAt = new Date(eventDate + 'T' + startTime);
    const diffMinutes = (startsAt.getTime() - Date.now()) / 60_000;
    if (diffMinutes < 30) {
      Alert.alert('Hora muy próxima', 'El evento debe crearse con al menos 30 minutos de anticipación. Elige una hora de inicio más tarde.');
      return;
    }

    // ── Hora inicio ≠ hora fin ─────────────────────────────────────────────
    if (startTime === endTime) {
      Alert.alert('Horas iguales', 'La hora de inicio y la hora de fin no pueden ser iguales.');
      return;
    }

    // ── Duración máxima de 24 h ────────────────────────────────────────────
    const endsAt = endTime > startTime
      ? new Date(eventDate + 'T' + endTime)
      : new Date(new Date(eventDate + 'T' + endTime).getTime() + 86_400_000);
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
    if (durationHours > 24) {
      Alert.alert('Duración excesiva', 'El evento no puede durar más de 24 horas.');
      return;
    }

    const loc = coords ?? DEFAULT_COORDS;
    const point: LocationDto = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: locationName.trim(),
    };
    const payload: CreateEventRequest = {
      name: title.trim(),
      description: description.trim(),
      category,
      maxCapacity: parseInt(maxParticipants, 10) || 10,
      eventDate,
      startTime,
      endTime,
      meetingPoint: point,
      destination: point,
    };

    setIsSubmitting(true);
    try {
      await eventService.createEvent(payload);
      Alert.alert('¡Evento creado!', 'Tu evento ya está publicado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = friendlyError(err, 'No se pudo crear el evento. Intenta de nuevo.');
      Alert.alert('Error al crear evento', msg);
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
            <Pressable style={styles.locationBtn} onPress={useMyLocation} disabled={locating}>
              <Ionicons name="location" size={16} color="#7FE7C4" />
              <Text style={styles.locationBtnText}>
                {locating
                  ? 'Obteniendo ubicación...'
                  : coords
                    ? `Ubicación fijada (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                    : 'Usar mi ubicación actual'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha *</Text>
            <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={eventDate} onChangeText={setEventDate} autoCapitalize="none" />
          </View>
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Hora inicio *</Text>
              <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={startTime} onChangeText={setStartTime} />
            </View>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Hora fin *</Text>
              <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor="rgba(255, 255, 255, 0.3)" value={endTime} onChangeText={setEndTime} />
            </View>
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
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  label: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '500', marginBottom: 8, fontFamily: 'Inter' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 16, color: 'white', fontSize: 15, fontFamily: 'Inter' },
  textArea: { height: 100 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  locationBtnText: { color: '#7FE7C4', fontSize: 13, fontWeight: '500' },
  categoryScroll: { flexDirection: 'row', paddingTop: 4 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', marginRight: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  categoryBtnActive: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.8)' },
  categoryBtnText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, fontWeight: '500' },
  categoryBtnTextActive: { color: 'rgba(99, 102, 241, 1)', fontWeight: '600' },
  submitBtn: { backgroundColor: 'rgba(99, 102, 241, 1)', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700', fontFamily: 'Inter' },
});
