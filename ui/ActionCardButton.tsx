import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../theme";
import { SquircleButton } from "./Squircle";

type ActionCardButtonProps = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: "dark" | "light";
};

export function ActionCardButton({
  label,
  iconName,
  onPress,
  variant = "light",
}: ActionCardButtonProps) {
  const dark = variant === "dark";

  return (
    <SquircleButton
      onPress={onPress}
      style={[styles.base, dark ? styles.dark : styles.light]}
    >
      <Text style={[styles.label, dark ? styles.darkLabel : styles.lightLabel]}>{label}</Text>
      <View style={styles.iconWrap}>
        <Ionicons color={dark ? colors.surface : colors.text} name={iconName} size={28} />
      </View>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  dark: {
    backgroundColor: colors.primaryGradientStart,
  },
  light: {
    backgroundColor: "transparent",
    borderColor: colors.text,
    borderWidth: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "500",
  },
  darkLabel: {
    color: colors.surface,
  },
  lightLabel: {
    color: colors.text,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
  },
});
