import { useLayoutEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ProgramsStoreProvider } from "../features/programs";
import { WatchSyncBridge } from "../features/watch-sync";
import { getColorsForTheme, ThemePreferencesProvider, useThemePalette, useThemePreferences } from "../theme";

const THEME_FADE_DURATION_MS = 560;

export default function RootLayout() {
  return (
    <ProgramsStoreProvider>
      <ThemePreferencesProvider>
        <RootNavigator />
      </ThemePreferencesProvider>
    </ProgramsStoreProvider>
  );
}

function RootNavigator() {
  const { clearThemeTransition, themeMode, transitionFromMode } = useThemePreferences();
  const palette = useThemePalette();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!transitionFromMode) {
      setOverlayColor(null);
      overlayOpacity.setValue(0);
      return;
    }

    setOverlayColor(getColorsForTheme(transitionFromMode).background);
    overlayOpacity.stopAnimation();
    overlayOpacity.setValue(1);

    if (transitionFromMode === themeMode) {
      return;
    }

    Animated.timing(overlayOpacity, {
      duration: THEME_FADE_DURATION_MS,
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        clearThemeTransition();
        setOverlayColor(null);
      }
    });
  }, [clearThemeTransition, overlayOpacity, themeMode, transitionFromMode]);

  return (
    <View style={styles.container}>
      <WatchSyncBridge />
      <StatusBar style={palette.statusBarStyle} />
      <View style={styles.navigatorWrap}>
        <Stack
          screenOptions={{
            animation: "ios_from_right",
            contentStyle: { backgroundColor: palette.background },
            headerBackTitle: "Back",
            headerLargeTitle: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text,
            headerTitleStyle: { color: palette.text },
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
          <Stack.Screen
            name="chrono"
            options={{ title: "Chrono", headerBackButtonMenuEnabled: false, headerShown: false }}
          />
          <Stack.Screen
            name="end-course"
            options={{ title: "End Course", headerShown: false }}
          />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack>
      </View>
      {overlayColor ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.themeOverlay,
            {
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigatorWrap: {
    flex: 1,
  },
  themeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
