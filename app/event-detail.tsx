import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { eventService, type EventMapResponse } from '@/services/eventService';

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMIC: 'rgba(59, 140, 245, 1)',
  SOCIAL: 'rgba(35, 165, 89, 1)',
  WELLNESS: 'rgba(129, 140, 248, 1)',
  SPORT: 'rgba(240, 178, 50, 1)',
  CULTURAL: 'rgba(251, 146, 60, 1)',
};

const CATEGORY_EMOJI: Record<string, string> = {
  ACADEMIC: '📚',
  SOCIAL: '🎉',
  WELLNESS: '🧘',
  SPORT: '⚽',
  CULTURAL: '🎭',
};

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<EventMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      // Usar servicio público o detallado según backend real
      const data = await eventService.publicMap({ page: 0, size: 100 });
      const found = data.content?.find(e => e.eventId === id);
      setEvent(found || null);
    } catch (err) {
      console.log('Error loading event detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // Simulación de unirse a evento (implementar endpoint en eventService real)
      await new Promise(r => setTimeout(r, 1000));
      Alert.alert('¡Genial!', 'Te has inscrito al evento exitosamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'No pudimos inscribirte, intenta de nuevo.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="rgba(99, 102, 241, 1)" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
        <Pressable style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnFallbackText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const color = CATEGORY_COLORS[event.category] || 'rgba(99, 102, 241, 1)';
  const emoji = CATEGORY_EMOJI[event.category] || '🎉';
  const isFull = event.currentParticipants >= event.maxParticipants;

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.8)" />
        </Pressable>
        <Text style={styles.headerTitle}>Detalles del Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: color.replace('1)', '0.1)') }]}>
          <Text style={styles.bannerEmoji}>{emoji}</Text>
        </View>

        {/* Titulo & Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.locationText}>{event.locationName || 'Sin ubicación específica'}</Text>
          </View>

          {event.status === 'STARTED' && (
            <Pressable
              style={styles.liveBtn}
              onPress={() =>
                router.push({
                  pathname: '/location',
                  params: {
                    eventId: event.eventId,
                    name: event.title,
                    ...(event.latitude != null && event.longitude != null
                      ? { lat: String(event.latitude), lng: String(event.longitude) }
                      : {}),
                  },
                })
              }
            >
              <Ionicons name="radio" size={16} color="#7FE7C4" />
              <Text style={styles.liveBtnText}>Ver ubicación en vivo</Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.statLabel}>Cupos</Text>
            <Text style={[styles.statValue, isFull && { color: 'rgba(248, 113, 113, 1)' }]}>
              {event.currentParticipants}/{event.maxParticipants}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.statLabel}>Inicio</Text>
            <Text style={styles.statValue}>Hoy</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>Acerca del evento</Text>
          <Text style={styles.descText}>
            {event.description || 'Únete a este espacio para compartir y disfrutar con la comunidad de la Escuela Colombiana de Ingeniería.'}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.bottomBar}>
        <Pressable 
          style={[
            styles.joinBtn, 
            { backgroundColor: color }, 
            (isJoining || isFull) && { opacity: 0.5 }
          ]}
          onPress={handleJoin}
          disabled={isJoining || isFull}
        >
          {isJoining ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.joinBtnText}>
              {isFull ? 'Evento Lleno' : 'Inscribirme al Evento'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(11, 13, 24, 1)' },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 16, marginBottom: 16, fontFamily: 'Inter' },
  backBtnFallback: { padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8 },
  backBtnFallbackText: { color: 'white', fontFamily: 'Inter' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600', fontFamily: 'Inter' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  
  banner: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerEmoji: { fontSize: 80 },
  
  infoSection: { paddingHorizontal: 24, marginBottom: 24 },
  title: { color: 'white', fontSize: 26, fontWeight: '700', fontFamily: 'Inter', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 14, fontFamily: 'Inter' },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127, 231, 196, 0.35)',
    backgroundColor: 'rgba(127, 231, 196, 0.12)',
  },
  liveBtnText: { color: '#7FE7C4', fontSize: 13, fontWeight: '600', fontFamily: 'Inter' },
  
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 32 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginTop: 8, marginBottom: 4, fontFamily: 'Inter' },
  statValue: { color: 'white', fontSize: 18, fontWeight: '700', fontFamily: 'Inter' },
  
  descSection: { paddingHorizontal: 24 },
  descTitle: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12, fontFamily: 'Inter' },
  descText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 15, lineHeight: 24, fontFamily: 'Inter' },
  
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 24,
    backgroundColor: 'rgba(11, 13, 24, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  joinBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: { color: 'white', fontSize: 16, fontWeight: '700', fontFamily: 'Inter' },
});
