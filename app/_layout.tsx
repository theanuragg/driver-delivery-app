import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import {
    registerForPushNotificationsAsync,
    setupNotificationHandlers,
} from "@/src/lib/notifications";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

function RootLayoutContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login");
    } else if (user) {
      // Check if mobile is verified
      if (!user.mobile) {
        const subSegment = (segments as string[])[1];
        const isAuthSubScreen = subSegment === "mobile" || subSegment === "otp";
        if (!isAuthSubScreen) {
          router.replace("/(auth)/mobile");
        }
      } else if (inAuthGroup) {
        // Redirect to main app if authenticated and mobile verified
        router.replace("/(app)");
      }
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    const cleanup = setupNotificationHandlers(router);
    return cleanup;
  }, [router]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutContent />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
