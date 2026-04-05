import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "../theme";

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
  if (variant === "secondary" || variant === "success") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.secondary,
          variant === "success" && styles.success,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.secondaryLabel,
            variant === "success" && styles.successLabel,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.primary}
      >
        <Text style={styles.primaryLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
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
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: "100%",
  },
  secondaryLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  successLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
  },
});
