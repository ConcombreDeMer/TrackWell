import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, useThemePalette } from "../theme";
import { SquircleView } from "./Squircle";

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, multiline, style, ...props }: TextFieldProps) {
  const palette = useThemePalette();
  const inputBackgroundColor =
    palette.statusBarStyle === "light" ? palette.surfaceMuted : palette.surface;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <SquircleView
        style={[
          styles.inputShell,
          {
            backgroundColor: inputBackgroundColor,
            borderColor: palette.border,
          },
        ]}
      >
        <TextInput
          multiline={multiline}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, { color: palette.text }, multiline && styles.multiline, style]}
          {...props}
        />
      </SquircleView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: { fontSize: 16, fontWeight: "600" },
  inputShell: {
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: {
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});
