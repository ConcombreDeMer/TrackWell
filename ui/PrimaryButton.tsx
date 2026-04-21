import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

import { radius, spacing, useThemePalette } from "../theme";
import { SquircleButton } from "./Squircle";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "success";
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
}: PrimaryButtonProps) {
  const palette = useThemePalette();

  if (variant === "secondary" || variant === "success") {
    return (
      <SquircleButton
        onPress={onPress}
        style={[
          styles.secondary,
          {
            backgroundColor: variant === "success" ? palette.success : palette.surface,
            borderColor: variant === "success" ? palette.success : palette.border,
          },
          variant === "success" && styles.success,
        ]}
      >
        <Text
          style={[
            styles.secondaryLabel,
            { color: palette.text },
            variant === "success" && styles.successLabel,
          ]}
        >
          {label}
        </Text>
      </SquircleButton>
    );
  }

  return (
    <SquircleButton onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={[palette.primaryGradientStart, palette.primaryGradientEnd]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.primary}
      >
        <Text style={[styles.primaryLabel, { color: palette.primaryForeground }]}>{label}</Text>
      </LinearGradient>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  primary: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: "100%",
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  success: {},
  successLabel: {
    fontWeight: "700",
  },
});
