import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

export function BackButton() {
  const router = useRouter();
  const palette = useThemePalette();

  return (
    <SquircleButton
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/");
      }}
      style={[
        styles.button,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons color={palette.text} name="chevron-back" size={22} />
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 44,
  },
});
