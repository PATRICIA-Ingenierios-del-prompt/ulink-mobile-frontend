import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { userName } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="rgba(129, 140, 248, 1)" />
      </View>
    );
  }

  if (isAuthenticated) {
    // Si el usuario no tiene nombre (onboarding incompleto), mandarlo a onboarding.
    // Esto cubre el caso del jurado que llega con nombre: null.
    if (!userName) {
      return <Redirect href="/onboarding" />;
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
