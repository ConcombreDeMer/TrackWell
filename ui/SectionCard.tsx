import { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { radius, spacing, useThemePalette } from "../theme";
import { SquircleView } from "./Squircle";

type SectionCardProps = {
  children: ReactNode;
};

export function SectionCard({ children }: SectionCardProps) {
  const palette = useThemePalette();

  return (
    <SquircleView
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      {children}
    </SquircleView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
