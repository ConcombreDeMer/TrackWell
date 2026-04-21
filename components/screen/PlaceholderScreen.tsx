import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, useThemePalette } from "../../theme";
import { SquircleView } from "../../ui/Squircle";

type PlaceholderScreenProps = {
  title: string;
  description: string;
  children?: ReactNode;
  footer?: ReactNode;
  headerSlot?: ReactNode;
};

export function PlaceholderScreen({
  title,
  description,
  children,
  footer,
  headerSlot,
}: PlaceholderScreenProps) {
  const palette = useThemePalette();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {headerSlot}
      <SquircleView
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </SquircleView>
      <View style={styles.actions}>{children}</View>
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
});
