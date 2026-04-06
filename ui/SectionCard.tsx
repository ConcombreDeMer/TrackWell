import { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "../theme";
import { SquircleView } from "./Squircle";

type SectionCardProps = {
  children: ReactNode;
};

export function SectionCard({ children }: SectionCardProps) {
  return <SquircleView style={styles.card}>{children}</SquircleView>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
