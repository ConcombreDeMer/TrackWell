import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "../theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: "ios_from_right",
          contentStyle: { backgroundColor: "transparent"},
          headerBackTitle: "Back",
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="program" options={{ title: "Program" }} />
        <Stack.Screen name="program-create" options={{ title: "Create Program", headerShown: false }} />
        <Stack.Screen name="course" options={{ title: "Course" }} />
        <Stack.Screen name="chrono" options={{ title: "Chrono" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </>
  );
}
