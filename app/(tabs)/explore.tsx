import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { matchingService } from "@/services/matchingService";
import { userService } from "@/services/userService";
import { ACCENT_COLORS } from "@/lib/colors";
import { UserAvatar } from "@/components/UserAvatar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = SCREEN_HEIGHT * 0.60;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchProfile {
  id: string;
  name: string;
  career: string;
  year: string;
  tags: string[];
  compatibility: number;
  initials: string;
  university: string;
  bio: string;
  bgColor1: string;
  bgColor2: string;
  accentColor: string;
  foto?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lowercase + strip diacritics so "María" matches "maria". */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ── Photo Gate Component ──────────────────────────────────────────────────────

interface PhotoGateProps {
  userId: string;
  onPhotoVerified: () => void;
}

function PhotoGate({ userId, onPhotoVerified }: PhotoGateProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Necesitamos permiso para acceder a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      setPreview(dataUrl);
    }
  };

  const takePhoto = async () => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Necesitamos permiso para usar la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      setPreview(dataUrl);
    }
  };

  const handleVerify = async () => {
    if (!preview) return;

    // If the preview is already the saved backend URL, just let the user in
    if (savedUrl && preview === savedUrl) {
      onPhotoVerified();
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      const res = await userService.subirFotoPerfil(userId, preview);
      if (res.tienePersonaEnFoto === false) {
        setError(
          "La foto no parece contener una persona visible. Sube una foto donde aparezcas claramente."
        );
        return;
      }
      const url = res.foto ?? preview;
      setSavedUrl(url);
      setPreview(url);
      onPhotoVerified();
    } catch {
      setError("No pudimos guardar tu foto. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setVerifying(false);
    }
  };

  const showPicker = () => {
    Alert.alert("Subir foto", "¿Cómo quieres agregar tu foto?", [
      { text: "📸 Tomar foto", onPress: takePhoto },
      { text: "🖼️ Elegir de galería", onPress: pickFromLibrary },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <ScrollView
      style={gateStyles.scroll}
      contentContainerStyle={gateStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <LinearGradient
        colors={["#3B2F8E", "#6C63FF", "#9B55D4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gateStyles.heroBanner}
      >
        <View style={gateStyles.heroIconWrap}>
          <Text style={gateStyles.heroIcon}>📸</Text>
        </View>
        <Text style={gateStyles.heroTitle}>Foto de perfil obligatoria</Text>
        <Text style={gateStyles.heroSub}>
          Para usar Matching necesitas subir una foto real tuya. La verificamos
          automáticamente para garantizar una comunidad segura.
        </Text>
      </LinearGradient>

      <View style={gateStyles.body}>
        {/* Trust chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gateStyles.chipsRow}
        >
          {["Foto privada y segura", "Verificación con IA", "Solo fotos reales"].map((label) => (
            <View key={label} style={gateStyles.chip}>
              <Text style={gateStyles.chipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Photo preview or picker CTA */}
        {preview ? (
          <View style={gateStyles.previewWrap}>
            <Image source={{ uri: preview }} style={gateStyles.previewImg} />
            {/* Only show change button if it's a new photo (not the saved one) */}
            {(!savedUrl || preview !== savedUrl) && (
              <Pressable style={gateStyles.changeBtn} onPress={showPicker}>
                <Ionicons name="refresh" size={14} color="#6C63FF" />
                <Text style={gateStyles.changeBtnText}>Cambiar foto</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable style={gateStyles.pickerCta} onPress={showPicker}>
            <Text style={gateStyles.pickerCtaIcon}>📷</Text>
            <Text style={gateStyles.pickerCtaTitle}>Subir mi foto</Text>
            <Text style={gateStyles.pickerCtaSub}>JPG, PNG · desde cámara o galería</Text>
          </Pressable>
        )}

        {/* Error message */}
        {error && (
          <View style={gateStyles.errorBox}>
            <Text style={gateStyles.errorIcon}>❌</Text>
            <View style={{ flex: 1 }}>
              <Text style={gateStyles.errorTitle}>Verificación fallida</Text>
              <Text style={gateStyles.errorMsg}>{error}</Text>
            </View>
          </View>
        )}

        {/* Verify / Enter button */}
        <Pressable
          style={[
            gateStyles.verifyBtn,
            (!preview || verifying) && gateStyles.verifyBtnDisabled,
          ]}
          onPress={handleVerify}
          disabled={!preview || verifying}
        >
          {verifying ? (
            <View style={gateStyles.verifyingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={gateStyles.verifyBtnText}>Verificando…</Text>
            </View>
          ) : (
            <Text style={gateStyles.verifyBtnText}>
              {savedUrl && preview === savedUrl
                ? "Acceder al Matching →"
                : "Verificar y acceder al Matching"}
            </Text>
          )}
        </Pressable>

        <Text style={gateStyles.footnote}>
          Sin foto verificada no puedes ver ni conectar con otros usuarios.
        </Text>
      </View>
    </ScrollView>
  );
}

const gateStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  heroBanner: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIcon: { fontSize: 28 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    lineHeight: 20,
  },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  chipsRow: { gap: 8, paddingBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(108,99,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
  },
  chipText: { fontSize: 12, color: "#8B7FFF", fontWeight: "600" },
  previewWrap: { alignItems: "center", marginBottom: 20 },
  previewImg: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#6C63FF",
    marginBottom: 12,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.3)",
    backgroundColor: "rgba(108,99,255,0.08)",
  },
  changeBtnText: { fontSize: 13, color: "#6C63FF", fontWeight: "600" },
  pickerCta: {
    alignItems: "center",
    paddingVertical: 36,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(108,99,255,0.35)",
    borderStyle: "dashed",
    backgroundColor: "rgba(108,99,255,0.05)",
    marginBottom: 20,
  },
  pickerCtaIcon: { fontSize: 40, marginBottom: 10 },
  pickerCtaTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6C63FF",
    marginBottom: 4,
  },
  pickerCtaSub: { fontSize: 12, color: "#90909A" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,77,106,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,77,106,0.25)",
    marginBottom: 16,
  },
  errorIcon: { fontSize: 18 },
  errorTitle: { fontSize: 13, fontWeight: "700", color: "#FF4D6A", marginBottom: 2 },
  errorMsg: { fontSize: 12, color: "#FF4D6A", lineHeight: 17 },
  verifyBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    marginBottom: 14,
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  verifyingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  footnote: {
    fontSize: 11,
    color: "#90909A",
    textAlign: "center",
    lineHeight: 16,
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MatchingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId } = useAuth();

  // ── Photo gate state ──────────────────────────────────────────────────────
  const [checkingPhoto, setCheckingPhoto] = useState(true);
  const [hasPhoto, setHasPhoto] = useState(false);
  // Keep the existing URL so the gate can show "this is your current photo"
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setCheckingPhoto(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const perfil = await userService.getPerfil(userId);
        if (!cancelled && perfil.foto) {
          setHasPhoto(true);
          setMyPhotoUrl(perfil.foto);
        }
      } catch {
        // Network error or 404 → treat as no photo yet
      } finally {
        if (!cancelled) setCheckingPhoto(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Swipe feed state ──────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingFeed, setLoadingFeed] = useState(false);
  // Users decided on this session (LIKE or DESCARTE). Never re-shown in the
  // deck, even if a cached/stale suggestion list still contains them.
  const decididosRef = useRef<Set<string>>(new Set());
  const pan = useRef(new Animated.ValueXY()).current;
  const SWIPE_THRESHOLD = 120;

  // ── Match celebration ─────────────────────────────────────────────────────
  const [matchWith, setMatchWith] = useState<MatchProfile | null>(null);

  const hydrateProfile = useCallback(
    async (candidatoId: string, scoreTotal: number, i: number): Promise<MatchProfile | null> => {
      try {
        const perfil = await userService.getPerfil(candidatoId);
        return {
          id: candidatoId,
          name: `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() || "Usuario",
          career: perfil.carrera || "",
          year: perfil.semestre ? `${perfil.semestre}° semestre` : "",
          tags: (perfil.intereses || []).slice(0, 3),
          compatibility: Math.max(0, Math.min(100, Math.round(scoreTotal * 100))),
          initials:
            (perfil.nombre?.[0] || "U").toUpperCase() +
            (perfil.apellidos?.[0] || "").toUpperCase(),
          university: "ECI",
          bio: perfil.bio || "",
          bgColor1: "rgba(55, 40, 120, 1)",
          bgColor2: "rgba(20, 15, 60, 1)",
          accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
          foto: perfil.foto,
        } as MatchProfile;
      } catch {
        return null;
      }
    },
    []
  );

  const loadProfiles = useCallback(async (refresh = false) => {
    setLoadingFeed(true);
    try {
      if (refresh) matchingService.invalidarSugerencias();
      const sugerencias = await matchingService.obtenerSugerencias(20);
      const hydrated = await Promise.all(
        sugerencias
          .filter((s) => s.candidatoId !== userId && !decididosRef.current.has(s.candidatoId))
          .map((s, i) => hydrateProfile(s.candidatoId, s.scoreTotal, i))
      );
      const fresh = hydrated.filter((p): p is MatchProfile => p !== null);
      setProfiles(fresh);
      setCurrentIndex(0);
    } catch (err) {
      console.log("[MATCHING] Load error:", err);
    } finally {
      setLoadingFeed(false);
    }
  }, [userId, hydrateProfile]);

  // Load feed once the photo gate is passed
  useEffect(() => {
    if (hasPhoto) loadProfiles();
  }, [hasPhoto, loadProfiles]);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPool, setSearchPool] = useState<MatchProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentLikes, setSentLikes] = useState<Set<string>>(new Set());

  const openSearch = useCallback(async () => {
    setSearchOpen(true);
    if (searchPool.length > 0) return;
    setSearchLoading(true);
    try {
      // Searchable pool = suggestion queue + people who sent me a request.
      // Confirmed matches are excluded (you connect with them from Matches).
      const [sugerencias, matches, solicitudes] = await Promise.all([
        matchingService.obtenerSugerencias(50).catch(() => []),
        matchingService.listarMatches().catch(() => []),
        matchingService.solicitudesRecibidas().catch(() => []),
      ]);
      const matchedIds = new Set(matches.map((m) => m.otroUsuarioId));
      const pool = new Map<string, number>();
      sugerencias.forEach((s) => {
        if (s.candidatoId !== userId) pool.set(s.candidatoId, s.scoreTotal);
      });
      solicitudes.forEach((id) => {
        if (id !== userId && !pool.has(id)) pool.set(id, 0);
      });
      const hydrated = await Promise.all(
        [...pool.entries()]
          .filter(([id]) => !matchedIds.has(id))
          .map(([id, score], i) => hydrateProfile(id, score, i))
      );
      setSearchPool(hydrated.filter((p): p is MatchProfile => p !== null));
    } finally {
      setSearchLoading(false);
    }
  }, [searchPool.length, userId, hydrateProfile]);

  const searchResults =
    query.trim().length === 0
      ? []
      : searchPool.filter(
          (p) =>
            normalize(p.name).includes(normalize(query)) ||
            normalize(p.career).includes(normalize(query))
        );

  const likeFromSearch = async (p: MatchProfile) => {
    try {
      const res = await matchingService.decidir(p.id, "LIKE");
      decididosRef.current.add(p.id);
      setSentLikes((prev) => new Set(prev).add(p.id));
      if (res.matchConfirmado) {
        setSearchOpen(false);
        setMatchWith(p);
      }
    } catch {
      Alert.alert(
        "No se pudo enviar la solicitud",
        "Este usuario ya no está disponible para matching en este momento."
      );
    }
  };

  // ── Swipe mechanics ───────────────────────────────────────────────────────
  // No wrap-around: once the deck is exhausted we show the end-of-deck state.
  // Wrapping re-showed users the person had already rejected. Also skip
  // anyone already decided on (e.g. liked from the search overlay).
  let deckIdx = currentIndex;
  while (deckIdx < profiles.length && decididosRef.current.has(profiles[deckIdx].id)) deckIdx++;
  const profile = deckIdx < profiles.length ? profiles[deckIdx] : undefined;
  const deckExhausted = !loadingFeed && profiles.length > 0 && !profile;

  // The PanResponder is created once, so route its callbacks through a ref —
  // otherwise the gesture handlers close over the first render's (empty)
  // profile and swipes never reach the backend.
  const onReleaseRef = useRef<(dx: number) => void>(() => {});
  onReleaseRef.current = (dx: number) => {
    if (dx > SWIPE_THRESHOLD) forceSwipe("right");
    else if (dx < -SWIPE_THRESHOLD) forceSwipe("left");
    else resetPosition();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, gesture) => onReleaseRef.current(gesture.dx),
    })
  ).current;

  const forceSwipe = (direction: "left" | "right") => {
    const x = direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(pan, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: "left" | "right") => {
    const decision = direction === "right" ? "LIKE" : "DESCARTE";
    const decided = profile;
    if (decided) {
      decididosRef.current.add(decided.id);
      matchingService
        .decidir(decided.id, decision)
        .then((res) => {
          // Two mutual likes → the backend auto-confirms the match.
          if (res.matchConfirmado) setMatchWith(decided);
        })
        .catch(() => {});
    }
    pan.setValue({ x: 0, y: 0 });
    setCurrentIndex((i) => i + 1);
  };

  const resetPosition = () => {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  };

  const handleAction = (action: "like" | "dislike") => {
    if (action === "like") forceSwipe("right");
    else forceSwipe("left");
  };

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const cardStyle = {
    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Checking photo on mount
  if (checkingPhoto) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  // Photo gate — user hasn't verified a photo yet
  if (!hasPhoto) {
    return (
      <SafeAreaView style={styles.root}>
        {/* Minimal top bar so the user knows where they are */}
        <View style={styles.topBar}>
          <Pressable style={styles.topHeart} onPress={() => router.push("/bienestar")}>
            <Ionicons name="leaf-outline" size={24} color="rgba(143, 132, 224, 0.75)" />
          </Pressable>
          <View style={styles.topCenter}>
            <View style={styles.topDividerLine} />
          </View>
          <UserAvatar
            size={42}
            style={styles.topAvatar}
            onPress={() => router.push("/profile")}
          />
        </View>
        <PhotoGate
          userId={userId!}
          onPhotoVerified={() => {
            setHasPhoto(true);
          }}
        />
      </SafeAreaView>
    );
  }

  // Main swipe feed
  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.topHeart} onPress={() => router.push("/bienestar")}>
          <Ionicons name="leaf-outline" size={24} color="rgba(143, 132, 224, 0.75)" />
        </Pressable>
        <View style={styles.topCenter}>
          <View style={styles.topDividerLine} />
        </View>
        <Pressable style={styles.topHeart} onPress={openSearch}>
          <Ionicons name="search" size={23} color="rgba(143, 132, 224, 0.9)" />
        </Pressable>
        <UserAvatar
            size={42}
            style={styles.topAvatar}
            onPress={() => router.push("/profile")}
          />
      </View>

      {/* ── Title ── */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Matching</Text>
      </View>

      {/* Loading */}
      {loadingFeed && profiles.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles" size={48} color="rgba(99, 102, 241, 0.5)" />
          <Text style={styles.emptyText}>Buscando personas compatibles...</Text>
        </View>
      )}

      {/* Empty */}
      {!loadingFeed && profiles.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="rgba(99, 102, 241, 0.5)" />
          <Text style={styles.emptyText}>No hay sugerencias disponibles</Text>
          <Text style={styles.emptySubtext}>
            Vuelve más tarde para descubrir personas nuevas
          </Text>
          <Pressable style={styles.refreshBtn} onPress={() => loadProfiles(true)}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.refreshBtnText}>Actualizar</Text>
          </Pressable>
        </View>
      )}

      {/* Deck exhausted — everyone in the queue got a decision */}
      {deckExhausted && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color="rgba(99, 102, 241, 0.5)" />
          <Text style={styles.emptyText}>¡Estás al día!</Text>
          <Text style={styles.emptySubtext}>
            Ya decidiste sobre todas las sugerencias. Busca a alguien o vuelve más tarde.
          </Text>
          <Pressable style={styles.refreshBtn} onPress={() => loadProfiles(true)}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.refreshBtnText}>Buscar más personas</Text>
          </Pressable>
        </View>
      )}

      {/* ── Swipe card ── */}
      {profiles.length > 0 && profile && (
        <Animated.View style={[styles.cardWrap, cardStyle]} {...panResponder.panHandlers}>
          <View style={styles.card}>
            <LinearGradient
              colors={[profile.bgColor1, profile.bgColor2]}
              style={styles.cardImageArea}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
            >
              {/* Decorative circles */}
              <View style={[styles.decorCircle1, { backgroundColor: profile.accentColor.replace("1)", "0.08)") }]} />
              <View style={[styles.decorCircle2, { backgroundColor: profile.accentColor.replace("1)", "0.05)") }]} />
              <View style={[styles.decorCircle3, { backgroundColor: profile.accentColor.replace("1)", "0.06)") }]} />

              {/* Full photo if available */}
              {profile.foto ? (
                <Image
                  source={{ uri: profile.foto }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}

              {/* Top chips */}
              <View style={styles.cardTopChips}>
                <View style={styles.matchChip}>
                  <Ionicons name="sparkles" size={14} color="rgba(251, 191, 36, 1)" />
                  <Text style={styles.matchChipText}>
                    {profile.compatibility}% {t("match_compatibility")}
                  </Text>
                </View>
                <View style={styles.uniChip}>
                  <Text style={styles.uniChipText}>{profile.university}</Text>
                </View>
              </View>

              {/* Big avatar (only when no photo) */}
              {!profile.foto && (
                <View style={styles.bigAvatarWrap}>
                  <View style={[styles.bigAvatarRing, { borderColor: profile.accentColor.replace("1)", "0.30)") }]}>
                    <View style={[styles.bigAvatar, { backgroundColor: profile.accentColor.replace("1)", "0.18)") }]}>
                      <Text style={[styles.bigAvatarText, { color: profile.accentColor }]}>
                        {profile.initials}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Bottom gradient + info */}
              <LinearGradient
                colors={["transparent", "rgba(11, 13, 24, 0.9)", "rgba(11, 13, 24, 1)"]}
                style={styles.cardBottomGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{profile.name}</Text>
                </View>
                <View style={styles.cardCareerRow}>
                  <Ionicons name="school-outline" size={13} color={profile.accentColor} style={{ marginRight: 5 }} />
                  <Text style={styles.cardCareer}>
                    {profile.career}
                    {profile.year ? (
                      <Text style={styles.cardYear}>{" · "}{profile.year}</Text>
                    ) : null}
                  </Text>
                </View>
                {profile.bio ? (
                  <Text style={styles.cardBio} numberOfLines={2}>{profile.bio}</Text>
                ) : null}
                <View style={styles.tagsRow}>
                  {profile.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>

          {/* ── Action buttons ── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleAction("dislike")}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionDislike,
                pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
              ]}
            >
              <Ionicons name="close" size={28} color="rgba(242, 63, 67, 1)" />
            </Pressable>
            <Pressable
              onPress={() => handleAction("like")}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionLike,
                pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
              ]}
            >
              <Ionicons name="heart" size={26} color="rgba(255, 255, 255, 1)" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ── Search overlay ── */}
      <Modal visible={searchOpen} animationType="slide" transparent onRequestClose={() => setSearchOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={searchStyles.backdrop}
        >
          <View style={searchStyles.sheet}>
            <View style={searchStyles.headerRow}>
              <View style={searchStyles.inputWrap}>
                <Ionicons name="search" size={18} color="#90909A" />
                <TextInput
                  style={searchStyles.input}
                  placeholder="Buscar por nombre o carrera…"
                  placeholderTextColor="#90909A"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#90909A" />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => setSearchOpen(false)} style={searchStyles.cancelBtn}>
                <Text style={searchStyles.cancelText}>Cerrar</Text>
              </Pressable>
            </View>

            {searchLoading ? (
              <View style={searchStyles.centerBox}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={searchStyles.hint}>Cargando personas…</Text>
              </View>
            ) : query.trim().length === 0 ? (
              <View style={searchStyles.centerBox}>
                <Ionicons name="people-circle-outline" size={44} color="rgba(108,99,255,0.5)" />
                <Text style={searchStyles.hint}>
                  Escribe un nombre o carrera para encontrar personas.
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={searchStyles.centerBox}>
                <Ionicons name="sad-outline" size={44} color="rgba(108,99,255,0.5)" />
                <Text style={searchStyles.hint}>Sin resultados para “{query.trim()}”.</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={searchStyles.list}>
                {searchResults.map((p) => {
                  const liked = sentLikes.has(p.id) || decididosRef.current.has(p.id);
                  return (
                    <View key={p.id} style={searchStyles.row}>
                      <Pressable
                        style={searchStyles.rowMain}
                        onPress={() => {
                          setSearchOpen(false);
                          router.push(`/user/${p.id}`);
                        }}
                      >
                        {p.foto ? (
                          <Image source={{ uri: p.foto }} style={searchStyles.avatar} />
                        ) : (
                          <View style={[searchStyles.avatar, searchStyles.avatarFallback]}>
                            <Text style={searchStyles.avatarInitials}>{p.initials}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={searchStyles.rowName} numberOfLines={1}>{p.name}</Text>
                          <Text style={searchStyles.rowCareer} numberOfLines={1}>
                            {p.career}{p.year ? ` · ${p.year}` : ""}
                          </Text>
                        </View>
                      </Pressable>
                      {liked ? (
                        <View style={searchStyles.sentChip}>
                          <Ionicons name="checkmark" size={14} color="#7FE7C4" />
                          <Text style={searchStyles.sentChipText}>Enviada</Text>
                        </View>
                      ) : (
                        <Pressable style={searchStyles.likeBtn} onPress={() => likeFromSearch(p)}>
                          <Ionicons name="heart" size={16} color="#fff" />
                          <Text style={searchStyles.likeBtnText}>Solicitud</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── "It's a match!" celebration ── */}
      <Modal visible={!!matchWith} animationType="fade" transparent onRequestClose={() => setMatchWith(null)}>
        <View style={matchStyles.backdrop}>
          <LinearGradient
            colors={["#3B2F8E", "#6C63FF", "#9B55D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={matchStyles.card}
          >
            <Text style={matchStyles.sparkle}>✨</Text>
            <Text style={matchStyles.title}>¡Es un match!</Text>
            <Text style={matchStyles.sub}>
              A {matchWith?.name} también le interesa conectar contigo.
            </Text>
            {matchWith?.foto ? (
              <Image source={{ uri: matchWith.foto }} style={matchStyles.photo} />
            ) : (
              <View style={[matchStyles.photo, matchStyles.photoFallback]}>
                <Text style={matchStyles.photoInitials}>{matchWith?.initials}</Text>
              </View>
            )}
            <Pressable
              style={matchStyles.chatBtn}
              onPress={() => {
                const id = matchWith?.id;
                setMatchWith(null);
                if (id) router.push(`/chat/${id}`);
              }}
            >
              <Ionicons name="chatbubble" size={16} color="#3B2F8E" />
              <Text style={matchStyles.chatBtnText}>Enviar mensaje</Text>
            </Pressable>
            <Pressable style={matchStyles.laterBtn} onPress={() => setMatchWith(null)}>
              <Text style={matchStyles.laterText}>Seguir descubriendo</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Search overlay styles ─────────────────────────────────────────────────────

const searchStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(5, 5, 15, 0.75)", justifyContent: "flex-end" },
  sheet: {
    height: "85%",
    backgroundColor: "#151130",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.25)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.25)",
  },
  input: { flex: 1, color: "#fff", fontSize: 14 },
  cancelBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  cancelText: { color: "#8B7FFF", fontSize: 14, fontWeight: "600" },
  centerBox: { alignItems: "center", paddingTop: 60, paddingHorizontal: 30, gap: 12 },
  hint: { color: "#90909A", fontSize: 13, textAlign: "center", lineHeight: 19 },
  list: { gap: 10, paddingBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.15)",
    borderRadius: 16,
    padding: 10,
  },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: "rgba(108,99,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontWeight: "800", fontSize: 15 },
  rowName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  rowCareer: { color: "#90909A", fontSize: 11, marginTop: 2 },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  likeBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  sentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(127,231,196,0.4)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sentChipText: { color: "#7FE7C4", fontSize: 12, fontWeight: "600" },
});

// ── Match celebration styles ──────────────────────────────────────────────────

const matchStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 5, 15, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    alignItems: "center",
    paddingVertical: 34,
    paddingHorizontal: 24,
  },
  sparkle: { fontSize: 34, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  sub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  photoFallback: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitials: { fontSize: 36, fontWeight: "800", color: "#fff" },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  chatBtnText: { color: "#3B2F8E", fontSize: 15, fontWeight: "800" },
  laterBtn: { marginTop: 14, padding: 6 },
  laterText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Empty / loading state ──
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 20,
  },
  refreshBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topHeart: { width: 42, height: 42, justifyContent: "center", alignItems: "center" },
  topCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  topDividerLine: { flex: 1, height: 1, backgroundColor: "rgba(99, 102, 241, 0.20)" },
  topAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(99, 102, 241, 0.80)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(143, 132, 224, 0.40)",
  },
  topAvatarText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Title ──
  titleSection: { paddingHorizontal: 22, paddingTop: 2, paddingBottom: 12 },
  mainTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },

  // ── Card wrapper ──
  cardWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // ── Card ──
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.18)",
    shadowColor: "rgba(99, 102, 241, 0.35)",
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    elevation: 12,
  },
  cardImageArea: { flex: 1, position: "relative" },

  decorCircle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -80,
  },
  decorCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 40,
    left: -60,
  },
  decorCircle3: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: 120,
    right: -40,
  },

  cardTopChips: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    zIndex: 2,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 13, 24, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(143, 132, 224, 0.25)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  matchChipText: { color: "rgba(143, 132, 224, 1)", fontSize: 12, fontWeight: "600" },
  uniChip: {
    backgroundColor: "rgba(11, 13, 24, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  uniChipText: { color: "rgba(220, 220, 240, 1)", fontSize: 12, fontWeight: "600" },

  bigAvatarWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  bigAvatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  bigAvatar: {
    width: 122,
    height: 122,
    borderRadius: 61,
    justifyContent: "center",
    alignItems: "center",
  },
  bigAvatarText: { fontSize: 42, fontWeight: "700", letterSpacing: 2 },

  cardBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  cardNameRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  cardName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  cardCareerRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  cardCareer: { color: "rgba(200, 200, 220, 0.85)", fontSize: 13, fontWeight: "500" },
  cardYear: { color: "rgba(143, 132, 224, 0.85)", fontWeight: "400" },
  cardBio: {
    color: "rgba(180, 180, 210, 0.75)",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  tagText: { color: "rgba(220, 220, 240, 1)", fontSize: 12, fontWeight: "500" },

  // ── Action buttons ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 18,
  },
  actionBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
  },
  actionDislike: {
    width: 60,
    height: 60,
    borderColor: "rgba(242, 63, 67, 0.30)",
    backgroundColor: "rgba(242, 63, 67, 0.10)",
  },
  actionLike: {
    width: 60,
    height: 60,
    borderColor: "rgba(99, 102, 241, 0.50)",
    backgroundColor: "rgba(99, 102, 241, 0.75)",
    shadowColor: "rgba(99, 102, 241, 0.55)",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 10,
  },
});
