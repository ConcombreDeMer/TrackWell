import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../theme";

type SectionCardProps = {
  children: ReactNode;
};

export function SectionCard({ children }: SectionCardProps) {
  return <View style={styles.card}>{children}</View>;
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
