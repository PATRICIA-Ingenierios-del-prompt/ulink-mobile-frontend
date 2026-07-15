import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { addToast } from "@/components/ToastSystem";

type Tab = "terminos" | "privacidad" | "ayuda" | "contacto";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "terminos", label: "Términos", icon: "document-text-outline" },
  { id: "privacidad", label: "Privacidad", icon: "shield-checkmark-outline" },
  { id: "ayuda", label: "Ayuda", icon: "help-circle-outline" },
  { id: "contacto", label: "Contacto", icon: "mail-outline" },
];

const CONTACT_EMAILS = [
  "juan.lcruz@mail.escuelaing.edu.co",
  "mariana.malagon-t@mail.escuelaing.edu.co",
];

// ── Terms of Service ──
function TerminosContent() {
  return (
    <View style={styles.contentBlock}>
      <Text style={styles.contentHeading}>Términos de Uso</Text>

      <Text style={styles.contentSubheading}>1. Reglas de la comunidad</Text>
      <Text style={styles.contentText}>
        U-Link es un espacio seguro para estudiantes universarios. Al usar la
        plataforma, aceptas tratar a todos los miembros con respeto y
        dignidad. No se tolera el acoso, la intimidación ni ningún tipo de
        discriminación.
      </Text>

      <Text style={styles.contentSubheading}>2. Política de respeto</Text>
      <Text style={styles.contentText}>
        Cada usuario es responsable de su comportamiento. Las ofensas graves,
        el lenguaje odioso y las amenazas resultarán en la suspensión
        inmediata de la cuenta sin previo aviso.
      </Text>

      <Text style={styles.contentSubheading}>3. Reportes y moderación</Text>
      <Text style={styles.contentText}>
        Si experimentas o presencias un comportamiento inapropiado, utilice el
        sistema de reportes. Los reportes son confidenciales y serán revisados
        por nuestro equipo de moderación.
      </Text>

      <Text style={styles.contentSubheading}>4. Consecuencias</Text>
      <Text style={styles.contentText}>
        Las infracciones resultarán en advertencias, restricciones temporales
        o la eliminación permanente de la cuenta, dependiendo de la gravedad.
      </Text>

      <Text style={styles.contentSubheading}>5. Propiedad del contenido</Text>
      <Text style={styles.contentText}>
        El contenido que publiques en U-Link (publicaciones, fotos, mensajes)
        sigue siendo tuyo. Al publicar, otorgas a U-Link una licencia limitada
        para mostrar dicho contenido dentro de la plataforma.
      </Text>
    </View>
  );
}

// ── Privacy Policy ──
function PrivacidadContent() {
  return (
    <View style={styles.contentBlock}>
      <Text style={styles.contentHeading}>Política de Privacidad</Text>

      <Text style={styles.contentSubheading}>1. Datos que recopilamos</Text>
      <Text style={styles.contentText}>
        Recopilamos información básica de perfil (nombre, correo electrónico,
        carrera, intereses) y datos de uso necesarios para el funcionamiento
        de la plataforma.
      </Text>

      <Text style={styles.contentSubheading}>2. Uso de la información</Text>
      <Text style={styles.contentText}>
        Utilizamos tus datos para mejorar las recomendaciones de matching,
        personalizar tu experiencia y garantizar la seguridad de la comunidad.
      </Text>

      <Text style={styles.contentSubheading}>3. Quién ve tus reportes</Text>
      <Text style={styles.contentText}>
        Los reportes de incidentes son revisados exclusivamente por el equipo
        de moderación. Tu identidad como reportero nunca se revela al usuario
        reportado.
      </Text>

      <Text style={styles.contentSubheading}>4. No vendemos tus datos</Text>
      <Text style={styles.contentText}>
        U-Link nunca vende, alquila ni comparte información personal con
        terceros con fines comerciales.
      </Text>

      <Text style={styles.contentSubheading}>5. Contacto</Text>
      <Text style={styles.contentText}>
        Para preguntas sobre privacidad, escríbenos a
        juan.lcruz@mail.escuelaing.edu.co
      </Text>
    </View>
  );
}

// ── Help Center / Support Form ──
function AyudaContent({ onSubmitted }: { onSubmitted: () => void }) {
  const { userName, userEmail } = useAuth();
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState(userEmail || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Mock submission (same as web's SupportContext)
      await new Promise((r) => setTimeout(r, 1000));
      addToast({
        type: "info",
        title: "Mensaje enviado",
        message: "Nuestro equipo te responderá pronto.",
      });
      onSubmitted();
    } catch {
      addToast({
        type: "reporte",
        title: "Error",
        message: "No se pudo enviar el mensaje.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.contentBlock}>
      <Text style={styles.contentHeading}>Centro de Ayuda</Text>
      <Text style={styles.contentText}>
        ¿Tienes un problema o sugerencia? Envíanos un mensaje y te
        responderemos lo antes posible.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Nombre</Text>
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor="rgba(90,90,104,0.6)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Correo electrónico</Text>
        <TextInput
          style={styles.formInput}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          placeholderTextColor="rgba(90,90,104,0.6)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Mensaje</Text>
        <TextInput
          style={[styles.formInput, styles.formTextArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe tu problema o sugerencia..."
          placeholderTextColor="rgba(90,90,104,0.6)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[styles.submitBtn, (!message.trim() || sending) && { opacity: 0.4 }]}
        onPress={handleSubmit}
        disabled={!message.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Enviar mensaje</Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Contact ──
function ContactoContent() {
  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <View style={styles.contentBlock}>
      <Text style={styles.contentHeading}>Contacto</Text>
      <Text style={styles.contentText}>
        ¿Tienes preguntas, sugerencias o quieres colaborar? Escríbenos a
        alguno de nuestros correos:
      </Text>

      {CONTACT_EMAILS.map((email) => (
        <Pressable
          key={email}
          style={styles.emailCard}
          onPress={() => openEmail(email)}
        >
          <Ionicons name="mail" size={18} color="#6C63FF" />
          <Text style={styles.emailText}>{email}</Text>
          <Ionicons name="open-outline" size={14} color="rgba(90,90,104,0.6)" />
        </Pressable>
      ))}
    </View>
  );
}

// ── Main Screen ──
export default function LegalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("terminos");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(21,17,48,1)", "rgba(15,12,35,1)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Legal y Soporte</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const on = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, on && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={on ? "#6C63FF" : "#90909A"}
              />
              <Text style={[styles.tabText, on && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "terminos" && <TerminosContent />}
        {activeTab === "privacidad" && <PrivacidadContent />}
        {activeTab === "ayuda" && (
          <AyudaContent onSubmitted={() => router.back()} />
        )}
        {activeTab === "contacto" && <ContactoContent />}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0C23",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  /* Tabs */
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tabActive: {
    backgroundColor: "rgba(108,99,255,0.15)",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#90909A",
  },
  tabTextActive: {
    color: "#6C63FF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  /* Content */
  contentBlock: {
    gap: 12,
  },
  contentHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  contentSubheading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E0E0E6",
    marginTop: 8,
  },
  contentText: {
    fontSize: 13,
    color: "#90909A",
    lineHeight: 20,
  },
  /* Form */
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#90909A",
  },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 14,
  },
  formTextArea: {
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  /* Contact email */
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(108,99,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.15)",
    borderRadius: 12,
    padding: 14,
  },
  emailText: {
    flex: 1,
    fontSize: 13,
    color: "#E0E0E6",
  },
});
