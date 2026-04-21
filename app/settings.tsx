import { useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, radius, spacing, useThemePalette, useThemePreferences } from "../theme";
import { SquircleView } from "../ui/Squircle";

const THEME_SWITCH_APPLY_DELAY_MS = 280;

export default function SettingsScreen() {
  const palette = useThemePalette();
  const { isDarkMode, setDarkMode } = useThemePreferences();
  const [pendingDarkMode, setPendingDarkMode] = useState(isDarkMode);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPendingDarkMode(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    };
  }, []);

  function handleToggle(nextValue: boolean) {
    setPendingDarkMode(nextValue);

    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
    }

    applyTimeoutRef.current = setTimeout(() => {
      void setDarkMode(nextValue);
      applyTimeoutRef.current = null;
    }, THEME_SWITCH_APPLY_DELAY_MS);
  }

  return (
    <View style={styles.screen}>
      <SquircleView
        style={[
          styles.section,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.description}>
            Switch instantly between light mode and dark mode for the iPhone app.
          </Text>
        </View>

        <View style={[styles.row, { backgroundColor: palette.surfaceMuted }]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Dark mode</Text>
            <Text style={styles.rowDescription}>
              {pendingDarkMode ? "Enabled" : "Disabled"}
            </Text>
          </View>

          <Switch onValueChange={handleToggle} value={pendingDarkMode} />
        </View>
      </SquircleView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.xl,
  },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
    paddingRight: spacing.md,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
