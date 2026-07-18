import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { authService, getMicrosoftAuthUrl, MS_REDIRECT_URI } from "../services/authService";

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // ── OTP flow state ──
  const [otpStep, setOtpStep] = useState<"none" | "email" | "code" | "jurado">("none");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // ── Jurado (external evaluator) flow state ──
  const [juradoEmail, setJuradoEmail] = useState("");
  const [juradoPassword, setJuradoPassword] = useState("");
  const [showJuradoTerms, setShowJuradoTerms] = useState(false);
  const [juradoTermsAccepted, setJuradoTermsAccepted] = useState(false);

  // ── Microsoft OAuth ──

  const handleMicrosoftLogin = useCallback(async () => {
    try {
      setLoading(true);
      const authUrl = getMicrosoftAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(authUrl, MS_REDIRECT_URI);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          const tokens = await authService.loginMicrosoft(code);
          await login(tokens);
          const { registerForPushNotifications } = await import("@/services/notificationsService");
          registerForPushNotifications().catch(() => {});
          const { userService } = await import("@/services/userService");
          const { tokenManager } = await import("@/services/tokenManager");
          const uid = tokenManager.getUserIdFromToken(tokens.accessToken);
          if (uid) {
            const needsOnboarding = await userService.necesitaOnboarding(uid);
            if (needsOnboarding) {
              router.replace("/onboarding" as any);
              return;
            }
          }
          router.replace("/(tabs)/home");
        } else {
          Alert.alert("Error", "No se recibió el código de autenticación");
        }
      }
    } catch (err: unknown) {
      console.log("[AUTH ERROR]", JSON.stringify(err, null, 2));
      let message = "Error al iniciar sesión";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: unknown } };
        if (axiosErr.response) {
          message = `Error ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert("Auth Error", message);
    } finally {
      setLoading(false);
    }
  }, [login, router]);

  // ── OTP handlers ──

  const handleRequestOtp = useCallback(async () => {
    if (!otpEmail.trim()) return;
    try {
      setLoading(true);
      await authService.requestOtp(otpEmail.trim());
      setOtpStep("code");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al enviar código";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [otpEmail]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode.trim()) return;
    try {
      setLoading(true);
      const tokens = await authService.verifyOtp(otpEmail.trim(), otpCode.trim());
      await login(tokens);
      const { registerForPushNotifications } = await import("@/services/notificationsService");
      registerForPushNotifications().catch(() => {});
      const { userService } = await import("@/services/userService");
      const { tokenManager } = await import("@/services/tokenManager");
      const uid = tokenManager.getUserIdFromToken(tokens.accessToken);
      if (uid) {
        const needsOnboarding = await userService.necesitaOnboarding(uid);
        if (needsOnboarding) {
          router.replace("/onboarding" as any);
          return;
        }
      }
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Código inválido";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [otpEmail, otpCode, login, router]);

  // ── Jurado handler ──

  const handleJuradoLogin = useCallback(async () => {
    if (!juradoEmail.trim() || !juradoPassword) return;
    try {
      setLoading(true);
      const tokens = await authService.loginJurado(juradoEmail.trim(), juradoPassword);
      await login(tokens);
      const { registerForPushNotifications } = await import("@/services/notificationsService");
      registerForPushNotifications().catch(() => {});
      const { userService } = await import("@/services/userService");
      const { tokenManager } = await import("@/services/tokenManager");
      const uid = tokenManager.getUserIdFromToken(tokens.accessToken);
      if (uid) {
        const needsOnboarding = await userService.necesitaOnboarding(uid);
        if (needsOnboarding) {
          // Jurados: flujo propio de onboarding (términos → nombre → intereses)
          router.replace("/jurado-onboarding" as any);
          return;
        }
      }
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      let message = "Correo o contraseña incorrectos";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status !== 401) {
          message = "No se pudo iniciar sesión. Intenta de nuevo.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [juradoEmail, juradoPassword, login, router]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <WelcomeHero />
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Welcome to U·link</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>

          {otpStep === "none" ? (
            <>
              {/* Microsoft button */}
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleMicrosoftLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="rgba(10, 10, 12, 1)" size="small" />
                ) : (
                  <>
                    <Image
                      source={require("../assets/images/microsoft.png")}
                      contentFit="contain"
                      style={styles.microsoftIcon}
                    />
                    <Text style={styles.signInButtonText}>Sign in with Microsoft</Text>
                  </>
                )}
              </Pressable>

              {/* OTP alternative */}
              <Pressable
                style={styles.otpLink}
                onPress={() => setOtpStep("email")}
              >
                <Text style={styles.otpLinkText}>Iniciar con código de correo</Text>
              </Pressable>

              {/* Jurado access */}
              <Pressable
                style={styles.otpLink}
                onPress={() => setOtpStep("jurado")}
              >
                <Text style={styles.otpLinkText}>¿Eres jurado? Inicia sesión aquí</Text>
              </Pressable>
            </>
          ) : otpStep === "email" ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="tu@email.escuelaing.edu.co"
                placeholderTextColor="rgba(90, 90, 104, 1)"
                value={otpEmail}
                onChangeText={setOtpEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading || !otpEmail.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="rgba(10, 10, 12, 1)" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Enviar código</Text>
                )}
              </Pressable>
              <Pressable style={styles.otpLink} onPress={() => setOtpStep("none")}>
                <Text style={styles.otpLinkText}>Volver</Text>
              </Pressable>
            </>
          ) : otpStep === "jurado" ? (
            <>
              <Text style={styles.otpHint}>
                Ingresa con el correo y la contraseña que te asignó el equipo de U·link.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="jurado@ejemplo.com"
                placeholderTextColor="rgba(90, 90, 104, 1)"
                value={juradoEmail}
                onChangeText={setJuradoEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="rgba(90, 90, 104, 1)"
                value={juradoPassword}
                onChangeText={setJuradoPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {/* Aceptación de términos */}
              <Pressable
                style={styles.juradoTermsRow}
                onPress={() => setJuradoTermsAccepted(v => !v)}
              >
                <View style={[styles.checkbox, juradoTermsAccepted && styles.checkboxChecked]}>
                  {juradoTermsAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Acepto los{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowJuradoTerms(true)}
                  >
                    términos de uso y política de privacidad
                  </Text>
                </Text>
              </Pressable>

              <Pressable
                style={[styles.button, (loading || !juradoTermsAccepted) && styles.buttonDisabled]}
                onPress={handleJuradoLogin}
                disabled={loading || !juradoEmail.trim() || !juradoPassword || !juradoTermsAccepted}
              >
                {loading ? (
                  <ActivityIndicator color="rgba(10, 10, 12, 1)" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Iniciar sesión</Text>
                )}
              </Pressable>

              {/* Modal de términos */}
              <Modal
                visible={showJuradoTerms}
                animationType="slide"
                transparent
                onRequestClose={() => setShowJuradoTerms(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Términos y Privacidad</Text>
                      <Pressable onPress={() => setShowJuradoTerms(false)}>
                        <Text style={styles.modalClose}>✕</Text>
                      </Pressable>
                    </View>
                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                      <Text style={styles.termsSectionTitle}>Términos de uso</Text>
                      <Text style={styles.termsSubtitle}>Una comunidad, no una app cualquiera</Text>
                      <Text style={styles.termsBody}>U•link es exclusivamente para la comunidad de la Escuela Colombiana de Ingeniería — por eso pedimos tu correo institucional para registrarte.</Text>
                      <Text style={styles.termsSubtitle}>Respeto, siempre</Text>
                      <Text style={styles.termsBody}>En los parches, chats, eventos y en cualquier rincón de U•link esperamos el mismo respeto que tendrías cara a cara con un compañero. Eso significa cero tolerancia a comportamiento inapropiado, acoso o bullying, discurso de odio, spam o publicidad no solicitada, y contenido ofensivo.</Text>
                      <Text style={styles.termsSubtitle}>Si algo no está bien, repórtalo</Text>
                      <Text style={styles.termsBody}>Cualquier miembro puede reportar a otro usuario desde un parche, indicando la categoría y explicando qué pasó. Los reportes llegan de forma anónima a nuestro equipo de administración, que los revisa y decide qué hacer.</Text>
                      <Text style={styles.termsSubtitle}>Consecuencias</Text>
                      <Text style={styles.termsBody}>Violaciones repetidas o graves a estas normas pueden llevar a la suspensión temporal o definitiva de la cuenta.</Text>
                      <Text style={styles.termsSubtitle}>Tu contenido</Text>
                      <Text style={styles.termsBody}>Lo que compartes (mensajes, publicaciones, archivos) sigue siendo tuyo — solo pedimos que respete estas normas mientras esté en U•link.</Text>
                      <Text style={styles.termsSubtitle}>Ubicación en vivo</Text>
                      <Text style={styles.termsBody}>Al usar la función de ubicación en vivo durante un evento, aceptas que tu ubicación se transmita y almacene de forma cifrada, únicamente para efectos de seguridad durante ese evento. De acuerdo con la Ley de Habeas Data (Ley 1581 de 2012), tus datos de ubicación se eliminan automáticamente después de 12 horas, salvo que se haya reportado un incidente durante ese periodo — en ese caso, se conservan como evidencia asociada al reporte.</Text>

                      <Text style={[styles.termsSectionTitle, { marginTop: 24 }]}>Política de privacidad</Text>
                      <Text style={styles.termsSubtitle}>Qué recopilamos</Text>
                      <Text style={styles.termsBody}>Tu perfil (nombre, carrera, semestre, intereses), tu actividad dentro de la app (parches, chats y eventos a los que te unes) y, solo mientras la actives, tu ubicación en vivo durante un evento.</Text>
                      <Text style={styles.termsSubtitle}>Para qué la usamos</Text>
                      <Text style={styles.termsBody}>Para que la app funcione: hacer match con otros estudiantes, mostrarte parches y eventos relevantes, y — cuando compartes tu ubicación — ayudar a la seguridad durante los eventos.</Text>
                      <Text style={styles.termsSubtitle}>Ubicación: cifrada y de corta duración</Text>
                      <Text style={styles.termsBody}>Tu ubicación en vivo se transmite y guarda cifrada, y se borra automáticamente a las 12 horas de haberse registrado, conforme a la Ley de Habeas Data (Ley 1581 de 2012). La única excepción es si hubo un incidente reportado durante ese lapso, caso en el que se conserva como evidencia.</Text>
                      <Text style={styles.termsSubtitle}>Quién ve los reportes</Text>
                      <Text style={styles.termsBody}>Solo nuestro equipo de administración revisa los reportes y mensajes de soporte que envías. No se comparten con otros usuarios.</Text>
                      <Text style={styles.termsSubtitle}>No vendemos tus datos</Text>
                      <Text style={styles.termsBody}>Tu información nunca se vende ni se comparte con terceros fuera de U•link.</Text>
                      <Text style={styles.termsSubtitle}>¿Dudas?</Text>
                      <Text style={styles.termsBody}>Escríbenos a cualquiera de los correos en la sección de Contacto.</Text>
                      <View style={{ height: 32 }} />
                    </ScrollView>
                    <Pressable
                      style={styles.modalAcceptBtn}
                      onPress={() => { setJuradoTermsAccepted(true); setShowJuradoTerms(false); }}
                    >
                      <Text style={styles.modalAcceptText}>Entendido y acepto</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
              <Pressable
                style={styles.otpLink}
                onPress={() => {
                  setOtpStep("none");
                  setJuradoEmail("");
                  setJuradoPassword("");
                }}
              >
                <Text style={styles.otpLinkText}>Volver</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.otpHint}>
                Código enviado a {otpEmail}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Código de 6 dígitos"
                placeholderTextColor="rgba(90, 90, 104, 1)"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading || otpCode.length < 6}
              >
                {loading ? (
                  <ActivityIndicator color="rgba(10, 10, 12, 1)" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Verificar</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.otpLink}
                onPress={() => {
                  setOtpStep("email");
                  setOtpCode("");
                }}
              >
                <Text style={styles.otpLinkText}>Reenviar código</Text>
              </Pressable>
            </>
          )}

          <View style={styles.termsRow}>
            <Text style={styles.termsText}>By continuing you agree to our </Text>
            <Pressable onPress={() => router.push("/legal")}>
              <Text style={styles.termsLink}>Terms</Text>
            </Pressable>
            <Text style={styles.termsText}> and </Text>
            <Pressable onPress={() => router.push("/legal")}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function WelcomeHero() {
  return (
    <View style={styles.hero}>
      <Image
        source={require("../assets/images/gradientbg.png")}
        contentFit="cover"
        style={styles.heroBackground}
      />
      <Image
        source={require("../assets/images/logoNuevoOscuro.png")}
        contentFit="contain"
        style={styles.heroLogo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 12, 1)",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 12, 1)",
  },
  hero: {
    height: 420,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  heroLogo: {
    width: 190,
    height: 170,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 28,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#08080B",
  },
  welcomeTitle: {
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 32,
    letterSpacing: -0.48,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(90, 90, 104, 1)",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 36,
  },
  button: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 319,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "rgba(240, 240, 242, 1)",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  microsoftIcon: {
    width: 22,
    height: 22,
  },
  signInButtonText: {
    color: "rgba(10, 10, 12, 1)",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  otpLink: {
    marginTop: 16,
  },
  otpLinkText: {
    color: "rgba(129, 140, 248, 1)",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  input: {
    width: "100%",
    maxWidth: 319,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 1)",
    fontSize: 15,
    marginBottom: 16,
  },
  otpHint: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  termsRow: {
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    color: "rgba(90, 90, 104, 1)",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 19.5,
  },
  termsLink: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 19.5,
    textDecorationLine: "underline",
  },

  // ── Jurado terms ──
  juradoTermsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(108, 99, 255, 0.5)",
    backgroundColor: "rgba(108, 99, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "rgba(108, 99, 255, 1)",
    borderColor: "rgba(108, 99, 255, 1)",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "rgba(18, 14, 40, 1)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  modalClose: {
    color: "rgba(143, 132, 224, 0.7)",
    fontSize: 18,
    fontWeight: "600",
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  termsSectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "Inter",
  },
  termsSubtitle: {
    color: "rgba(143, 132, 224, 1)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 14,
    fontFamily: "Inter",
  },
  termsBody: {
    color: "rgba(200, 195, 230, 0.85)",
    fontSize: 13,
    lineHeight: 21,
    fontFamily: "Inter",
  },
  modalAcceptBtn: {
    backgroundColor: "rgba(108, 99, 255, 1)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  modalAcceptText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter",
  },
});
