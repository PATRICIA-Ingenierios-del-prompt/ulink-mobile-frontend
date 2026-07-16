import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "@/hooks/useTranslation";
import { parcheService } from "@/services/parcheService";
import type { ParcheCategory, Visibility } from "@/services/types";

const CATEGORIES: { value: ParcheCategory; label: string; emoji: string }[] = [
  { value: "MUSIC", label: "Música", emoji: "🎵" },
  { value: "SPORT", label: "Deporte", emoji: "⚽" },
  { value: "STUDY", label: "Estudio", emoji: "📚" },
  { value: "TECHNOLOGY", label: "Tecnología", emoji: "💻" },
  { value: "ENTERTAINMENT", label: "Entretenimiento", emoji: "🎮" },
  { value: "ART", label: "Arte", emoji: "🎨" },
  { value: "VARIETY", label: "Variado", emoji: "🎉" },
];

const VISIBILITIES: { value: Visibility; label: string; icon: string }[] = [
  { value: "PUBLIC", label: "Público", icon: "globe-outline" },
  { value: "PRIVATE", label: "Privado", icon: "lock-closed-outline" },
];

export default function CreateParcheScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ParcheCategory>("VARIETY");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [maxCapacity, setMaxCapacity] = useState("20");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "La descripción es obligatoria");
      return;
    }

    const capacity = parseInt(maxCapacity, 10);
    if (isNaN(capacity) || capacity < 2) {
      Alert.alert("Error", "La capacidad debe ser al menos 2");
      return;
    }

    try {
      setLoading(true);
      const result = await parcheService.create({
        name: name.trim(),
        description: description.trim(),
        category,
        maxCapacity: capacity,
        visibility,
      });
      router.replace(`/(tabs)/parche?parcheId=${result.parcheId}`);
    } catch (err) {
      console.log("[CREATE PARCHE] Error:", err);
      Alert.alert("Error", "No se pudo crear el parche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
          <Text style={styles.headerTitle}>Crear Parche</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Club de Fotografía"
            placeholderTextColor="rgba(90, 90, 104, 1)"
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntanos de qué trata tu parche..."
            placeholderTextColor="rgba(90, 90, 104, 1)"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Visibility */}
        <View style={styles.field}>
          <Text style={styles.label}>Visibilidad</Text>
          <View style={styles.visibilityRow}>
            {VISIBILITIES.map((vis) => (
              <Pressable
                key={vis.value}
                style={[
                  styles.visibilityChip,
                  visibility === vis.value && styles.visibilityChipActive,
                ]}
                onPress={() => setVisibility(vis.value)}
              >
                <Ionicons
                  name={vis.icon as any}
                  size={16}
                  color={
                    visibility === vis.value
                      ? "rgba(129, 140, 248, 1)"
                      : "rgba(90, 90, 104, 1)"
                  }
                />
                <Text
                  style={[
                    styles.visibilityText,
                    visibility === vis.value && styles.visibilityTextActive,
                  ]}
                >
                  {vis.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.field}>
          <Text style={styles.label}>Capacidad máxima</Text>
          <TextInput
            style={styles.input}
            value={maxCapacity}
            onChangeText={setMaxCapacity}
            placeholder="20"
            placeholderTextColor="rgba(90, 90, 104, 1)"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Create button */}
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.createButtonText}>Crear Parche</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    fontWeight: "700",
  },

  // Fields
  field: {
    marginBottom: 24,
  },
  label: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Category
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // Visibility
  visibilityRow: {
    flexDirection: "row",
    gap: 12,
  },
  visibilityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 8,
  },
  visibilityChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.5)",
  },
  visibilityText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  visibilityTextActive: {
    color: "rgba(129, 140, 248, 1)",
  },

  // Create button
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 1)",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
