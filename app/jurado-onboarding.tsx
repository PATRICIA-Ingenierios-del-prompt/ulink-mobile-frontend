import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "terms" | "name" | "interests" | "saving";

interface InterestCategory {
  categoria: string;
  intereses: string[];
}

// ─── Terms content ────────────────────────────────────────────────────────────

const TERMS_CONTENT = [
  {
    section: "Términos de uso",
    items: [
      { title: "Una comunidad, no una app cualquiera", body: "U•link es exclusivamente para la comunidad de la Escuela Colombiana de Ingeniería — por eso pedimos tu correo institucional para registrarte." },
      { title: "Respeto, siempre", body: "En los parches, chats, eventos y en cualquier rincón de U•link esperamos el mismo respeto que tendrías cara a cara con un compañero. Eso significa cero tolerancia a comportamiento inapropiado, acoso o bullying, discurso de odio, spam o publicidad no solicitada, y contenido ofensivo." },
      { title: "Si algo no está bien, repórtalo", body: "Cualquier miembro puede reportar a otro usuario desde un parche, indicando la categoría y explicando qué pasó. Los reportes llegan de forma anónima a nuestro equipo de administración, que los revisa y decide qué hacer." },
      { title: "Consecuencias", body: "Violaciones repetidas o graves a estas normas pueden llevar a la suspensión temporal o definitiva de la cuenta." },
      { title: "Tu contenido", body: "Lo que compartes (mensajes, publicaciones, archivos) sigue siendo tuyo — solo pedimos que respete estas normas mientras esté en U•link." },
      { title: "Ubicación en vivo", body: "Al usar la función de ubicación en vivo durante un evento, aceptas que tu ubicación se transmita y almacene de forma cifrada, únicamente para efectos de seguridad durante ese evento. De acuerdo con la Ley de Habeas Data (Ley 1581 de 2012), tus datos de ubicación se eliminan automáticamente después de 12 horas, salvo que se haya reportado un incidente durante ese periodo — en ese caso, se conservan como evidencia asociada al reporte." },
    ],
  },
  {
    section: "Política de privacidad",
    items: [
      { title: "Qué recopilamos", body: "Tu perfil (nombre, carrera, semestre, intereses), tu actividad dentro de la app (parches, chats y eventos a los que te unes) y, solo mientras la actives, tu ubicación en vivo durante un evento." },
      { title: "Para qué la usamos", body: "Para que la app funcione: hacer match con otros estudiantes, mostrarte parches y eventos relevantes, y — cuando compartes tu ubicación — ayudar a la seguridad durante los eventos." },
      { title: "Ubicación: cifrada y de corta duración", body: "Tu ubicación en vivo se transmite y guarda cifrada, y se borra automáticamente a las 12 horas de haberse registrado, conforme a la Ley de Habeas Data (Ley 1581 de 2012). La única excepción es si hubo un incidente reportado durante ese lapso, caso en el que se conserva como evidencia." },
      { title: "Quién ve los reportes", body: "Solo nuestro equipo de administración revisa los reportes y mensajes de soporte que envías. No se comparten con otros usuarios." },
      { title: "No vendemos tus datos", body: "Tu información nunca se vende ni se comparte con terceros fuera de U•link." },
      { title: "¿Dudas?", body: "Escríbenos a cualquiera de los correos en la sección de Contacto." },
    ],
  },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["terms", "name", "interests"];
  const idx = steps.indexOf(step);
  const current = idx === -1 ? 3 : idx + 1;
  const total = 3;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(current / total) * 100}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>Paso {current} de {total}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JuradoOnboardingScreen() {
  const router = useRouter();
  const { userId, setUserName } = useContext(AuthContext);

  const [step, setStep] = useState<Step>("terms");
  const [accepted, setAccepted] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [catalog, setCatalog] = useState<InterestCategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load interest catalog when reaching that step
  useEffect(() => {
    if (step !== "interests" || catalog.length > 0) return;
    setLoadingCatalog(true);
    apiClient
      .get<InterestCategory[]>("/api/v1/intereses/catalogo")
      .then((r) => setCatalog(r.data))
      .catch(() =>
        Alert.alert("Error", "No se pudo cargar el catálogo de intereses. Intenta de nuevo.", [
          { text: "Reintentar", onPress: () => setLoadingCatalog(false) },
        ])
      )
      .finally(() => setLoadingCatalog(false));
  }, [step]);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFinish = useCallback(async () => {
    if (!userId) return;
    if (selected.length < 1) {
      Alert.alert("Elige al menos 1 interés", "Selecciona al menos un interés para continuar.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/api/v1/usuarios/${userId}/perfil`, {
        onboardingCompleto: true,
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        carrera: "Jurado Externo",   // requerido por el backend
        semestre: 1,                  // requerido por el backend
        intereses: selected,
      });
      setUserName(nombre.trim());
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        (typeof err?.response?.data === "string" ? err.response.data : null) ??
        "No se pudo guardar tu perfil. Intenta de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }, [userId, nombre, apellidos, selected, router, setUserName]);

  // ── Step: Terms ──────────────────────────────────────────────────────────────
  if (step === "terms") {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Términos y Privacidad</Text>
          <Text style={styles.headerSub}>Léelos antes de continuar</Text>
        </View>
        <ProgressBar step="terms" />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {TERMS_CONTENT.map((section) => (
            <View key={section.section}>
              <Text style={styles.sectionTitle}>{section.section}</Text>
              {section.items.map((item) => (
                <View key={item.title} style={styles.termItem}>
                  <Text style={styles.termItemTitle}>{item.title}</Text>
                  <Text style={styles.termItemBody}>{item.body}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.acceptRow} onPress={() => setAccepted((v) => !v)}>
            <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
              {accepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.acceptLabel}>Acepto los términos y la política de privacidad</Text>
          </Pressable>
          <View style={styles.footerBtns}>
            <Pressable style={styles.backBtn} onPress={() => router.replace("/welcome-login" as any)}>
              <Text style={styles.backBtnText}>← Volver</Text>
            </Pressable>
            <Pressable
              style={[styles.continueBtn, !accepted && styles.continueBtnOff]}
              onPress={() => accepted && setStep("name")}
              disabled={!accepted}
            >
              <Text style={styles.continueBtnText}>Continuar →</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: Name ───────────────────────────────────────────────────────────────
  if (step === "name") {
    const canContinue = nombre.trim().length > 0 && apellidos.trim().length > 0;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.header}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.headerTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.headerSub}>Escribe tu nombre tal como quieres que aparezca</Text>
          </View>
          <ProgressBar step="name" />

          <View style={styles.formWrap}>
            <Text style={styles.fieldLabel}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. María"
              placeholderTextColor="rgba(90, 90, 104, 1)"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>APELLIDOS</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Gómez Rodríguez"
              placeholderTextColor="rgba(90, 90, 104, 1)"
              value={apellidos}
              onChangeText={setApellidos}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBtns}>
              <Pressable style={styles.backBtn} onPress={() => setStep("terms")}>
                <Text style={styles.backBtnText}>← Volver</Text>
              </Pressable>
              <Pressable
                style={[styles.continueBtn, !canContinue && styles.continueBtnOff]}
                onPress={() => canContinue && setStep("interests")}
                disabled={!canContinue}
              >
                <Text style={styles.continueBtnText}>Continuar →</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step: Interests ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.stepEmoji}>✨</Text>
        <Text style={styles.headerTitle}>¿Qué te interesa?</Text>
        <Text style={styles.headerSub}>
          {selected.length === 0
            ? "Elige al menos 1 interés"
            : `${selected.length} seleccionado${selected.length !== 1 ? "s" : ""}`}
        </Text>
      </View>
      <ProgressBar step="interests" />

      {loadingCatalog ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="rgba(108, 99, 255, 1)" />
          <Text style={styles.loadingText}>Cargando intereses...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {catalog.map((cat) => (
            <View key={cat.categoria}>
              <Text style={styles.catTitle}>{cat.categoria}</Text>
              <View style={styles.chipsWrap}>
                {cat.intereses.map((interest) => {
                  const on = selected.includes(interest);
                  return (
                    <Pressable
                      key={interest}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{interest}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.footerBtns}>
          <Pressable style={styles.backBtn} onPress={() => setStep("name")}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </Pressable>
          <Pressable
            style={[styles.continueBtn, (selected.length < 1 || saving) && styles.continueBtnOff]}
            onPress={handleFinish}
            disabled={selected.length < 1 || saving}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.continueBtnText}>Completar registro</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(11, 13, 24, 1)" },
  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  stepEmoji: { fontSize: 36, marginBottom: 8 },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "700", textAlign: "center", letterSpacing: -0.5 },
  headerSub: { color: "rgba(143, 132, 224, 0.8)", fontSize: 13, marginTop: 6, textAlign: "center" },

  // Progress
  progressWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: "rgba(108, 99, 255, 1)" },
  progressLabel: { color: "rgba(143,132,224,0.5)", fontSize: 11, textAlign: "center", marginTop: 6 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4 },

  // Terms
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  termItem: { marginBottom: 16 },
  termItemTitle: { color: "rgba(143, 132, 224, 1)", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  termItemBody: { color: "rgba(200, 195, 230, 0.85)", fontSize: 13, lineHeight: 21 },

  // Accept row
  acceptRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: "rgba(108, 99, 255, 0.5)",
    backgroundColor: "rgba(108, 99, 255, 0.05)",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  checkboxOn: { backgroundColor: "rgba(108, 99, 255, 1)", borderColor: "rgba(108, 99, 255, 1)" },
  checkmark: { color: "white", fontSize: 13, fontWeight: "700" },
  acceptLabel: { color: "rgba(200, 195, 230, 0.9)", fontSize: 13, flex: 1, lineHeight: 19 },

  // Form
  formWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  fieldLabel: {
    color: "rgba(108, 99, 255, 0.8)", fontSize: 11, fontWeight: "600",
    letterSpacing: 0.8, marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: 16,
    color: "white", fontSize: 16,
  },

  // Interests
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "rgba(143, 132, 224, 0.6)", fontSize: 14 },
  catTitle: {
    color: "rgba(108, 99, 255, 0.8)", fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, marginTop: 16, marginBottom: 10, textTransform: "uppercase",
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  chipOn: {
    backgroundColor: "rgba(108, 99, 255, 0.15)",
    borderColor: "rgba(108, 99, 255, 0.7)",
  },
  chipText: { color: "rgba(180, 175, 220, 0.7)", fontSize: 13, fontWeight: "500" },
  chipTextOn: { color: "rgba(108, 99, 255, 1)", fontWeight: "600" },

  // Footer
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  footerBtns: { flexDirection: "row", gap: 12 },
  backBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { color: "rgba(180, 175, 220, 0.7)", fontSize: 15, fontWeight: "600" },
  continueBtn: {
    flex: 2, paddingVertical: 16, borderRadius: 14,
    backgroundColor: "rgba(108, 99, 255, 1)",
    alignItems: "center", justifyContent: "center",
  },
  continueBtnOff: { opacity: 0.4 },
  continueBtnText: { color: "white", fontSize: 15, fontWeight: "700" },
});
