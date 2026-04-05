import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ProgramsStoreProvider } from "../features/programs";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <ProgramsStoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: "ios_from_right",
          contentStyle: { backgroundColor: "#F9F9F9" },
          headerBackTitle: "Back",
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="program" options={{ title: "Program", headerShown: false }} />
        <Stack.Screen
          name="program-create"
          options={{ title: "Create Program", headerShown: false }}
        />
        <Stack.Screen
          name="course"
          options={{
            animation: "slide_from_bottom",
            headerShown: false,
            presentation: "modal",
            
          }}
        />
        <Stack.Screen
          name="course-create"
          options={{ title: "Create Course", headerShown: false }}
        />
        <Stack.Screen name="chrono" options={{ title: "Chrono" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </ProgramsStoreProvider>
  );
}
