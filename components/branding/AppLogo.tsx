import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../theme";

type AppLogoProps = {
  showHint?: boolean;
};

export function AppLogo({ showHint = false }: AppLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require("../../assets/branding/logo.png")}
        style={styles.image}
      />
      {showHint ? (
        <Text style={styles.hint}>
          Replace `assets/branding/logo.png` with your final TrackWell logo.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
  },
  image: {
    borderRadius: radius.md,
    height: 72,
    width: 72,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
