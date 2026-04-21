import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, useThemePalette } from "../theme";
import { SquircleButton, SquircleView } from "./Squircle";

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
  const palette = useThemePalette();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <SquircleView
        style={[
          styles.controls,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <CounterButton
          disabled={value <= min}
          label="-"
          onPress={() => onChange(Math.max(min, value - 1))}
        />
        <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
        <CounterButton
          disabled={value >= max}
          label="+"
          onPress={() => onChange(Math.min(max, value + 1))}
        />
      </SquircleView>
    </View>
  );
}

type CounterButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

function CounterButton({ label, onPress, disabled }: CounterButtonProps) {
  const palette = useThemePalette();

  return (
    <SquircleButton
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: palette.surfaceMuted },
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          { color: disabled ? palette.textMuted : palette.text },
          disabled && styles.buttonLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: { fontSize: 16, fontWeight: "600" },
  controls: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
  },
  buttonLabelDisabled: {},
  value: { fontSize: 28, fontWeight: "700" },
});
