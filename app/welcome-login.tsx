import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { authService, getMicrosoftAuthUrl, MS_REDIRECT_URI } from "../services/authService";
import { AnimatedBackground } from "@/components/AnimatedBackground";

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeLoginScreen() {
  const router = useRouter();
  const { login, skipAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  // ── OTP flow state ──
  const [otpStep, setOtpStep] = useState<"none" | "email" | "code">("none");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

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

  return (
    <SafeAreaView style={styles.root}>
      <AnimatedBackground />
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

          <Pressable
            style={styles.skipButton}
            onPress={() => {
              skipAuth();
              router.replace("/(tabs)/home");
            }}
          >
            <Text style={styles.skipButtonText}>Skip (Auth service down)</Text>
          </Pressable>

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
  skipButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  skipButtonText: {
    color: "rgba(129, 140, 248, 0.7)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
