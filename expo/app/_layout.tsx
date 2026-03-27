import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PetsProvider, usePets } from "@/hooks/usePets";
import { ScansProvider, useScans } from "@/hooks/useScans";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-pet" 
        options={{ 
          presentation: "modal",
          title: "Agregar Mascota",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
        }} 
      />
      <Stack.Screen 
        name="scan-result" 
        options={{ 
          title: "Resultado del Análisis",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
        }} 
      />
      <Stack.Screen 
        name="pet-details" 
        options={{ 
          title: "Detalles",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
        }} 
      />
    </Stack>
  );
}

function AppReady() {
  const { isLoading: petsLoading } = usePets();
  const { isLoading: scansLoading } = useScans();

  useEffect(() => {
    console.log('[AppReady] Pets loading:', petsLoading, 'Scans loading:', scansLoading);
    
    const timeout = setTimeout(() => {
      console.log('[AppReady] Timeout reached, forcing splash screen hide');
      SplashScreen.hideAsync();
    }, 3000);

    if (!petsLoading && !scansLoading) {
      console.log('[AppReady] Data loaded, hiding splash screen...');
      clearTimeout(timeout);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timeout);
  }, [petsLoading, scansLoading]);

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PetsProvider>
          <ScansProvider>
            <AppReady />
          </ScansProvider>
        </PetsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
