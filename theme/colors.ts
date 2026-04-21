import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

export type ThemeMode = "light" | "dark";

export type ThemePalette = {
  background: string;
  border: string;
  primaryForeground: string;
  primaryForegroundMuted: string;
  primaryGradientEnd: string;
  primaryGradientStart: string;
  statusBarStyle: "dark" | "light";
  success: string;
  surface: string;
  surfaceMuted: string;
  tabIconDefault: string;
  text: string;
  textMuted: string;
  warningSurface: string;
  warningText: string;
};

export const lightColors: ThemePalette = {
  background: "#F9F9F9",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F1F1",
  text: "#1F1F1F",
  textMuted: "#6B6B6B",
  border: "#E6E6E6",
  success: "#9AC29B",
  primaryGradientStart: "#2F2F2F",
  primaryGradientEnd: "#555555",
  primaryForeground: "#FFFFFF",
  primaryForegroundMuted: "rgba(255,255,255,0.72)",
  tabIconDefault: "#848484",
  statusBarStyle: "dark" as const,
  warningSurface: "#F3E0BF",
  warningText: "#8A5A1F",
};

export const darkColors: ThemePalette = {
  background: "#0E0F11",
  surface: "#24262B",
  surfaceMuted: "#30333A",
  text: "#ECE9E3",
  textMuted: "#AAA7A2",
  border: "#474B54",
  success: "#6D9D72",
  primaryGradientStart: "#E7E3DC",
  primaryGradientEnd: "#CBC5BD",
  primaryForeground: "#1B1B1B",
  primaryForegroundMuted: "rgba(27,27,27,0.68)",
  tabIconDefault: "#757575",
  statusBarStyle: "light" as const,
  warningSurface: "#5B4727",
  warningText: "#F3D59A",
};

function createDynamicColorToken(token: keyof Omit<ThemePalette, "statusBarStyle">): ColorValue {
  if (Platform.OS !== "ios") {
    return lightColors[token];
  }

  return DynamicColorIOS({
    dark: darkColors[token],
    light: lightColors[token],
  });
}

export const colors = {
  background: createDynamicColorToken("background"),
  surface: createDynamicColorToken("surface"),
  surfaceMuted: createDynamicColorToken("surfaceMuted"),
  text: createDynamicColorToken("text"),
  textMuted: createDynamicColorToken("textMuted"),
  border: createDynamicColorToken("border"),
  success: createDynamicColorToken("success"),
  primaryGradientStart: createDynamicColorToken("primaryGradientStart"),
  primaryGradientEnd: createDynamicColorToken("primaryGradientEnd"),
  primaryForeground: createDynamicColorToken("primaryForeground"),
  primaryForegroundMuted: createDynamicColorToken("primaryForegroundMuted"),
  tabIconDefault: createDynamicColorToken("tabIconDefault"),
  warningSurface: createDynamicColorToken("warningSurface"),
  warningText: createDynamicColorToken("warningText"),
} as const;

export function getColorsForTheme(mode: ThemeMode): ThemePalette {
  return mode === "dark" ? darkColors : lightColors;
}
