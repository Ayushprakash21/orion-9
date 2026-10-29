import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/features/auth';
import { DataProvider } from '../src/features/control-tower';
import { AlertProvider } from '../src/features/alerts';
import { Colors } from '../src/theme';

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationGate>
          <DataProvider>
            <AlertProvider>
              <StatusBar style="light" backgroundColor={Colors.background} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="details/[type]/[id]"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                  }}
                />
                <Stack.Screen
                  name="settings/notifications"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                  }}
                />
              </Stack>
            </AlertProvider>
          </DataProvider>
        </NavigationGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
