import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

export function BackButton() {
  const router = useRouter();

  return (
    <SquircleButton
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/");
      }}
      style={styles.button}
    >
      <Ionicons color={colors.text} name="chevron-back" size={22} />
    </SquircleButton>
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
});
