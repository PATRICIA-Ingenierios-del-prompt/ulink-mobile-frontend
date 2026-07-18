import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AuthContext } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { apiClient } from "@/services/apiClient";

// ─── Data ────────────────────────────────────────────────────────────────────

const CARRERAS = [
  "Ingenieria Civil", "Ingenieria Electrica", "Ingenieria de Sistemas",
  "Ingenieria Industrial", "Ingenieria Electronica", "Economia",
  "Administracion de Empresas", "Matematicas", "Ingenieria Mecanica",
  "Ingenieria Biomedica", "Ingenieria Ambiental", "Ingenieria Estadistica",
  "Ingenieria de Inteligencia Artificial", "Ingenieria de Ciberseguridad",
  "Ingenieria en Biotecnologia", "Postgrado",
];

const GENEROS = [
  { id: "masculino", label: "Masculino" },
  { id: "femenino", label: "Femenino" },
  { id: "otro", label: "Otro" },
  { id: "nd", label: "Prefiero no decirlo" },
];

interface InterestCategory {
  id: string;
  label: string;
  emoji: string;
  items: string[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: "musica", label: "Musica", emoji: "🎵", items: ["Conciertos en vivo", "DJ & Electronica", "Rock & Metal", "Reggaeton & Trap", "Pop & Indie", "Classica & Jazz"] },
  { id: "estudio", label: "Estudio", emoji: "📚", items: ["Grupos de estudio", "Tutorias", "Hackathones", "Talleres tecnicos", "Presentaciones", "Biblioteca nocturna"] },
  { id: "deporte", label: "Deporte", emoji: "🏃", items: ["Basquetbol", "Tenis / Tenis de mesa", "Gimnasio", "Futbol & Deportes", "Yoga & Meditacion", "Ciclismo", "Parques & Naturaleza", "Actividades extremas"] },
  { id: "gastro", label: "Gastronomia", emoji: "🍴", items: ["Comer en campus", "Food trucks", "Cafeterias ocultas", "Comida internacional", "Picnics & Asados", "Intercambio de recetas"] },
  { id: "tech", label: "Tech & Gaming", emoji: "🎮", items: ["Videojuegos competitivos", "Hackathones de codigo", "Desarrollo web/app", "IA & Machine Learning", "Streaming & Content", "Robotica"] },
  { id: "arte", label: "Arte & Cultura", emoji: "🎨", items: ["Exposiciones", "Cine & Peliculas", "Teatro & Danza", "Fotografia", "Murales & Street art", "Literatura & Poesia"] },
  { id: "competencias", label: "Competencias", emoji: "🏆", items: ["Competencias deportivas", "Concursos academicos", "Torneos de juegos", "Desafios de innovacion", "Maratones de programacion", "Competencias de emprendimiento"] },
  { id: "profesional", label: "Profesional", emoji: "💼", items: ["Charlas de empresas", "Ferias de empleo", "Mentorias", "Grupos profesionales", "Conferencias", "Networking events"] },
  { id: "sostenibilidad", label: "Sostenibilidad", emoji: "♻️", items: ["Reciclaje & Ecologia", "Voluntariado", "Proyectos sociales", "Derechos humanos", "Comunidad LGBTQ+", "Iniciativas campesinas"] },
  { id: "viajes", label: "Viajes", emoji: "🌍", items: ["Road trips", "Viajes internacionales", "Intercambios academicos", "Backpacking", "Viajes a pueblos", "Experiencias rurales"] },
  { id: "bienestar", label: "Bienestar", emoji: "💚", items: ["Meditacion", "Terapia & Apoyo", "Nutricion", "Sueno & Descanso", "Mindfulness", "Comunidad de bienestar"] },
];

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Paso {step} de {total}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { userId, login, setUserName, isJurado } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");

  // Step 2
  const [carrera, setCarrera] = useState("");
  const [showCarreraPicker, setShowCarreraPicker] = useState(false);
  const [semestre, setSemestre] = useState<number | null>(null);
  const [genero, setGenero] = useState("");

  // Step 3
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(INTEREST_CATEGORIES[0].id);

  const canStep1 = nombre.trim().length > 0 && apellidos.trim().length > 0;
  const canStep2 = isJurado || (carrera.length > 0 && semestre !== null);
  const canStep3 = selectedInterests.length >= 3 && selectedInterests.length <= 12;

  const handleFinish = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await userService.completarOnboarding(userId, {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        ...(isJurado ? {} : { carrera, semestre: semestre! }),
        genero: genero || undefined,
        intereses: selectedInterests,
      });
      setUserName(nombre.trim());
      router.replace("/(tabs)/home");
    } catch {
      // Backend may reject the combined payload — split into two calls:
      // 1) Profile + onboardingCompleto via the profile endpoint
      // 2) Interests via the dedicated /intereses endpoint
      try {
        await apiClient.put(`/api/v1/usuarios/${userId}/perfil`, {
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          ...(isJurado ? {} : { carrera, semestre: semestre! }),
          genero: genero || undefined,
          onboardingCompleto: true,
        });
        await userService.updateIntereses(userId, selectedInterests);
        setUserName(nombre.trim());
        router.replace("/(tabs)/home");
      } catch (err2: any) {
        Alert.alert("Error", "No se pudo completar el registro. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, nombre, apellidos, carrera, semestre, genero, selectedInterests, router, setUserName]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 12) {
        Alert.alert("Maximo 12", "Puedes seleccionar hasta 12 intereses.");
        return prev;
      }
      return [...prev, interest];
    });
  };

  // ── Step 1: Basic Data ──
  if (step === 1) {
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>Cuentanos quien eres</Text>
            <Text style={styles.stepSubtitle}>Datos basicos</Text>
          </View>

          <View style={styles.formContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOMBRE</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>APELLIDOS</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={apellidos}
                  onChangeText={setApellidos}
                  placeholder="Tus apellidos"
                  placeholderTextColor="rgba(90, 90, 104, 1)"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <ProgressBar step={1} total={isJurado ? 2 : 3} />

          <Pressable
            style={[styles.continueBtn, !canStep1 && styles.continueBtnDisabled]}
            onPress={() => setStep(2)}
            disabled={!canStep1}
          >
            <Text style={styles.continueBtnText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Academic Profile ──
  if (step === 2) {
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>{isJurado ? "🏅" : "🎓"}</Text>
            <Text style={styles.stepTitle}>{isJurado ? "Tu Perfil" : "Perfil Academico"}</Text>
            <Text style={styles.stepSubtitle}>{isJurado ? "Cuéntanos un poco de ti" : "Carrera, semestre y datos personales"}</Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {/* Carrera y Semestre — solo para estudiantes */}
            {!isJurado && (
              <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CARRERA</Text>
              <Pressable
                style={styles.selectWrap}
                onPress={() => setShowCarreraPicker(!showCarreraPicker)}
              >
                <Text style={[styles.selectText, !carrera && { color: "rgba(90, 90, 104, 1)" }]}>
                  {carrera || "Selecciona tu carrera"}
                </Text>
                <Ionicons name={showCarreraPicker ? "chevron-up" : "chevron-down"} size={18} color="rgba(143, 132, 224, 0.6)" />
              </Pressable>
              {showCarreraPicker && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {CARRERAS.map((c) => (
                      <Pressable
                        key={c}
                        style={[styles.dropdownItem, c === carrera && styles.dropdownItemActive]}
                        onPress={() => { setCarrera(c); setShowCarreraPicker(false); }}
                      >
                        <Text style={[styles.dropdownText, c === carrera && styles.dropdownTextActive]}>{c}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Semestre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SEMESTRE</Text>
              <View style={styles.semestreGrid}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.semestreBtn, semestre === s && styles.semestreBtnActive]}
                    onPress={() => setSemestre(s)}
                  >
                    <Text style={[styles.semestreText, semestre === s && styles.semestreTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
              </>
            )}

            {/* Genero (optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>GENERO (opcional)</Text>
              <View style={styles.generoRow}>
                {GENEROS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[styles.generoBtn, genero === g.id && styles.generoBtnActive]}
                    onPress={() => setGenero(genero === g.id ? "" : g.id)}
                  >
                    <Text style={[styles.generoText, genero === g.id && styles.generoTextActive]}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <ProgressBar step={2} total={isJurado ? 2 : 3} />

          <View style={styles.stepActions}>
            <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={18} color="rgba(143, 132, 224, 0.8)" />
              <Text style={styles.backBtnText}>Volver</Text>
            </Pressable>
            <Pressable
              style={[styles.continueBtn, !canStep2 && styles.continueBtnDisabled, { flex: 1, marginLeft: 12 }]}
              onPress={() => setStep(3)}
              disabled={!canStep2}
            >
              <Text style={styles.continueBtnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Interests ──
  const activeCat = INTEREST_CATEGORIES.find((c) => c.id === activeCategory) ?? INTEREST_CATEGORIES[0];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>✨</Text>
        <Text style={styles.stepTitle}>Elige tus intereses</Text>
        <Text style={styles.stepSubtitle}>Minimo 3, maximo 12</Text>
      </View>

      {/* Selected count */}
      <View style={styles.interestCounter}>
        <Text style={[styles.interestCounterText, selectedInterests.length < 3 && { color: "rgba(242, 63, 67, 1)" }]}>
          {selectedInterests.length} / 12 seleccionados
        </Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
      >
        {INTEREST_CATEGORIES.map((cat) => {
          const count = cat.items.filter((i) => selectedInterests.includes(i)).length;
          return (
            <Pressable
              key={cat.id}
              style={[styles.categoryTab, activeCategory === cat.id && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
              {count > 0 && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Interest items */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.interestGrid}
        showsVerticalScrollIndicator={false}
      >
        {activeCat.items.map((interest) => {
          const selected = selectedInterests.includes(interest);
          return (
            <Pressable
              key={interest}
              style={[styles.interestBtn, selected && styles.interestBtnActive]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[styles.interestText, selected && styles.interestTextActive]}>{interest}</Text>
              {selected && <Ionicons name="checkmark-circle" size={16} color="rgba(99, 102, 241, 1)" />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Selected pills */}
      {selectedInterests.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedPills}
        >
          {selectedInterests.map((interest) => (
            <Pressable key={interest} style={styles.pill} onPress={() => toggleInterest(interest)}>
              <Text style={styles.pillText}>{interest}</Text>
              <Ionicons name="close" size={12} color="rgba(165, 180, 252, 0.8)" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ProgressBar step={3} total={3} />

      <View style={styles.stepActions}>
        <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={18} color="rgba(143, 132, 224, 0.8)" />
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
        <Pressable
          style={[styles.continueBtn, (!canStep3 || loading) && styles.continueBtnDisabled, { flex: 1, marginLeft: 12 }]}
          onPress={handleFinish}
          disabled={!canStep3 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.continueBtnText}>Completar Registro</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Step header ──
  stepHeader: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  stepEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  stepTitle: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  stepSubtitle: {
    color: "rgba(143, 132, 224, 0.6)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },

  // ── Form ──
  formContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  fieldLabel: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 4,
  },
  input: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
  },

  // ── Select / Dropdown ──
  selectWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: "rgba(30, 32, 48, 1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
  },
  dropdownText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  dropdownTextActive: {
    color: "rgba(129, 140, 248, 1)",
    fontWeight: "600",
  },

  // ── Semestre grid ──
  semestreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  semestreBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  semestreBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  semestreText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 15,
    fontWeight: "600",
  },
  semestreTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // ── Genero ──
  generoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  generoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  generoBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  generoText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
  },
  generoTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // ── Interest counter ──
  interestCounter: {
    alignItems: "center",
    paddingBottom: 8,
  },
  interestCounterText: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Category tabs ──
  categoryTabs: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  categoryLabelActive: {
    color: "rgba(255, 255, 255, 1)",
  },
  categoryBadge: {
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  categoryBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Interest grid ──
  interestGrid: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  interestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  interestBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  interestText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
  },
  interestTextActive: {
    color: "rgba(129, 140, 248, 1)",
    fontWeight: "600",
  },

  // ── Selected pills ──
  selectedPills: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  pillText: {
    color: "rgba(165, 180, 252, 1)",
    fontSize: 11,
    fontWeight: "500",
  },

  // ── Progress ──
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 2,
  },
  progressText: {
    color: "rgba(143, 132, 224, 0.5)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  // ── Actions ──
  stepActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 1)",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 132, 224, 0.2)",
    gap: 6,
  },
  backBtnText: {
    color: "rgba(143, 132, 224, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
});
