import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { colors, radius, spacing } from "../../theme";

export function BackButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/");
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons color={colors.text} name="chevron-back" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 44,
  },
  pressed: {
    opacity: 0.85,
  },
});
