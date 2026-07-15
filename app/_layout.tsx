import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/hooks/useTranslation';
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import { ReportsProvider } from '@/context/ReportsContext';
import { ToastContainer } from '@/components/ToastSystem';

export const unstable_settings = {
  anchor: '(tabs)',
};

function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);

      // Handle invite codes: ulink://invite/{token}
      if (parsed.path?.startsWith('invite/')) {
        const token = parsed.path.split('invite/')[1];
        if (token) {
          router.push({ pathname: '/(tabs)/parches', params: { inviteToken: token } });
        }
        return;
      }

      // Handle parche links: ulink://parche/{id}
      if (parsed.path?.startsWith('parche/')) {
        const parcheId = parsed.path.split('parche/')[1];
        if (parcheId) {
          router.push({ pathname: '/(tabs)/parche', params: { parcheId } });
        }
        return;
      }
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function NotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as any);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => redirect(response.notification)
    );

    return () => subscription.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <AuthProvider>
        <ReportsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <DeepLinkHandler />
            <NotificationObserver />
            <ToastContainer />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome-login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="bienestar" options={{ headerShown: false }} />
            <Stack.Screen name="call" options={{ headerShown: false }} />
            <Stack.Screen name="video-call" options={{ headerShown: false }} />
            <Stack.Screen name="monas" options={{ headerShown: false }} />
            <Stack.Screen name="create-parche" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="location" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        </ReportsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
