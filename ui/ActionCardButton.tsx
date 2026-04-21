import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { radius, spacing, useThemePalette } from "../theme";
import { SquircleButton } from "./Squircle";

type ActionCardButtonProps = {
  animateContentChange?: boolean;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: "dark" | "light" | "muted";
};

export function ActionCardButton({
  animateContentChange = false,
  label,
  iconName,
  onPress,
  variant = "light",
}: ActionCardButtonProps) {
  const palette = useThemePalette();
  const dark = variant === "dark";
  const muted = variant === "muted";
  const labelTranslate = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const iconTranslate = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const previousLabelRef = useRef(label);
  const previousIconRef = useRef(iconName);

  useEffect(() => {
    if (!animateContentChange) {
      previousLabelRef.current = label;
      previousIconRef.current = iconName;
      return;
    }

    if (previousLabelRef.current === label && previousIconRef.current === iconName) {
      return;
    }

    labelTranslate.setValue(10);
    labelOpacity.setValue(0);
    iconTranslate.setValue(10);
    iconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(labelTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(iconTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    previousLabelRef.current = label;
    previousIconRef.current = iconName;
  }, [
    animateContentChange,
    iconName,
    iconOpacity,
    iconTranslate,
    label,
    labelOpacity,
    labelTranslate,
  ]);

  return (
    <SquircleButton
      onPress={onPress}
      style={[
        styles.base,
        dark ? styles.dark : muted ? styles.muted : styles.light,
        dark
          ? { backgroundColor: palette.primaryGradientStart }
          : muted
            ? {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              }
            : {
                borderColor: palette.text,
              },
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          dark ? styles.darkLabel : muted ? styles.mutedLabel : styles.lightLabel,
          {
            color: dark ? palette.primaryForeground : palette.text,
          },
          {
            opacity: labelOpacity,
            transform: [{ translateY: labelTranslate }],
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity: iconOpacity,
            transform: [{ translateY: iconTranslate }],
          },
        ]}
      >
        <Ionicons
          color={dark ? palette.primaryForeground : palette.text}
          name={iconName}
          size={28}
        />
      </Animated.View>
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
  dark: {},
  muted: { borderWidth: 1 },
  light: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "500",
  },
  darkLabel: {},
  mutedLabel: {},
  lightLabel: {},
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
  },
});
