import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useReports, type ReportCategory } from "@/context/ReportsContext";
import { addToast } from "@/components/ToastSystem";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserName: string;
  parcheName: string;
}

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES: ReportCategory[] = [
  "Comportamiento inapropiado",
  "Spam o publicidad",
  "Contenido ofensivo",
  "Acoso o bullying",
  "Otro",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportModal({
  visible,
  onClose,
  reportedUserName,
  parcheName,
}: ReportModalProps) {
  const { addReport } = useReports();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!category || !description.trim()) return;
    addReport({
      reportedUserName,
      parcheName,
      category,
      description: description.trim(),
    });
    addToast({
      type: "reporte",
      title: "Reporte enviado",
      message: "Gracias, nuestro equipo lo revisará pronto.",
    });
    setCategory(null);
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="flag" size={20} color="rgba(248, 113, 113, 1)" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Denunciar a {reportedUserName}</Text>
              <Text style={styles.subtitle}>Tu reporte es anónimo</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="rgba(90, 90, 104, 1)" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Category selection */}
            <Text style={styles.sectionLabel}>Categoría</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    category === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionLabel}>Descripción</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Cuéntanos qué pasó..."
              placeholderTextColor="rgba(90, 90, 104, 1)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Submit */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitBtn,
                (!category || !description.trim()) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!category || !description.trim()}
            >
              <Text style={styles.submitText}>Enviar reporte</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "80%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.2)",
    backgroundColor: "rgba(18, 20, 36, 0.98)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: "rgba(236, 237, 248, 1)",
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
    maxHeight: 400,
  },
  sectionLabel: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  categoryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  categoryBtnActive: {
    borderColor: "rgba(248, 113, 113, 0.4)",
    backgroundColor: "rgba(248, 113, 113, 0.12)",
  },
  categoryText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "rgba(248, 113, 113, 1)",
  },
  textArea: {
    width: "100%",
    height: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "rgba(236, 237, 248, 1)",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 13,
    fontWeight: "500",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(248, 113, 113, 1)",
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
