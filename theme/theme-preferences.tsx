import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { getColorsForTheme, type ThemeMode } from "./colors";

const THEME_STORAGE_KEY = "trackwell/theme-mode";

type ThemePreferencesContextValue = {
  clearThemeTransition: () => void;
  isDarkMode: boolean;
  isReady: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
  themeMode: ThemeMode;
  transitionFromMode: ThemeMode | null;
};

const ThemePreferencesContext = createContext<ThemePreferencesContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function applyThemeMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode);
}

export function ThemePreferencesProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [transitionFromMode, setTransitionFromMode] = useState<ThemeMode | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrateThemePreferences() {
      try {
        const storedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const nextThemeMode = isThemeMode(storedThemeMode) ? storedThemeMode : "light";

        applyThemeMode(nextThemeMode);

        if (mounted) {
          setThemeMode(nextThemeMode);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    hydrateThemePreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const clearThemeTransition = useCallback(() => {
    setTransitionFromMode(null);
  }, []);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    const nextThemeMode: ThemeMode = enabled ? "dark" : "light";

    if (nextThemeMode === themeMode) {
      return;
    }

    setTransitionFromMode(themeMode);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        setThemeMode(nextThemeMode);
        applyThemeMode(nextThemeMode);
        resolve();
      });
    });

    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      clearThemeTransition,
      isDarkMode: themeMode === "dark",
      isReady,
      setDarkMode,
      themeMode,
      transitionFromMode,
    }),
    [clearThemeTransition, isReady, setDarkMode, themeMode, transitionFromMode],
  );

  return (
    <ThemePreferencesContext.Provider value={value}>
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences() {
  const context = useContext(ThemePreferencesContext);

  if (!context) {
    throw new Error("useThemePreferences must be used inside ThemePreferencesProvider.");
  }

  return context;
}

export function useThemePalette() {
  const { themeMode } = useThemePreferences();
  return getColorsForTheme(themeMode);
}
