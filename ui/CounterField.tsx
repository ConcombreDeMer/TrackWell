import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";

type CounterFieldProps = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
};

export function CounterField({
  label,
  value,
  onChange,
  min = 1,
  max = 52,
}: CounterFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <CounterButton
          disabled={value <= min}
          label="-"
          onPress={() => onChange(Math.max(min, value - 1))}
        />
        <Text style={styles.value}>{value}</Text>
        <CounterButton
          disabled={value >= max}
          label="+"
          onPress={() => onChange(Math.min(max, value + 1))}
        />
      </View>
    </View>
  );
}

type CounterButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

function CounterButton({ label, onPress, disabled }: CounterButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonLabel, disabled && styles.buttonLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  controls: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
  },
  buttonLabelDisabled: {
    color: colors.textMuted,
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
});
