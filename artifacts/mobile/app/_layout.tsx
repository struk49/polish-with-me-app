import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { SubscriptionProvider } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="lesson/[id]"
        options={{
          title: "Lesson",
          headerBackTitle: "Back",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="quiz/[id]"
        options={{
          title: "Quiz",
          headerBackTitle: "Back",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          title: "",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: "Privacy Policy",
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <SubscriptionProvider>
                <ProgressProvider>
                  <RootLayoutNav />
                </ProgressProvider>
              </SubscriptionProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
