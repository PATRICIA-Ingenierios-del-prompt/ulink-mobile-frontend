import { Image } from "expo-image";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WelcomeLoginScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <WelcomeHero />
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Welcome to U·link</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>

          <Pressable style={styles.button}>
            <Image
              source={require("../assets/images/microsoft.png")}
              contentFit="contain"
              style={styles.microsoftIcon}
            />
            <Text style={styles.signInButtonText}>Sign in with Microsoft</Text>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing you agree to our Terms and Privacy Policy
          </Text>
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
  termsText: {
    marginTop: 32,
    color: "rgba(90, 90, 104, 1)",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 19.5,
    textDecorationLine: "underline",
  },
});
