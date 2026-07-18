import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { userName, isJurado } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="rgba(129, 140, 248, 1)" />
      </View>
    );
  }

  if (isAuthenticated) {
    // Si no tiene nombre, el onboarding está incompleto.
    // isJurado viene del AuthContext (detectado del JWT).
    if (!userName) {
      return <Redirect href={isJurado ? "/jurado-onboarding" : "/onboarding"} />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/welcome-login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
