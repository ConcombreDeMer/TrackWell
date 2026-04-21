import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { spacing, useThemePalette } from "../../theme";
import { PrimaryButton } from "../../ui/PrimaryButton";

type FinishedWorkoutViewProps = {
  onNext: () => void;
};

export function FinishedWorkoutView({ onNext }: FinishedWorkoutViewProps) {
  const palette = useThemePalette();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={palette.text} name="sparkles-outline" size={78} />
        <Ionicons color={palette.text} name="sparkles" size={34} style={styles.iconAccentOne} />
        <Ionicons color={palette.text} name="sparkles" size={24} style={styles.iconAccentTwo} />
      </View>

      <View style={styles.copyBlock}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>Course terminee</Text>
        <Text style={[styles.title, { color: palette.text }]}>Felicitations</Text>
      </View>

      <View style={styles.buttonWrap}>
        <PrimaryButton label="Suivant" onPress={onNext} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    alignItems: "center",
    height: 120,
    justifyContent: "center",
    marginBottom: spacing.xxl,
    position: "relative",
    width: 140,
  },
  iconAccentOne: {
    position: "absolute",
    right: 18,
    top: 8,
  },
  iconAccentTwo: {
    bottom: 14,
    left: 20,
    position: "absolute",
  },
  copyBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  eyebrow: { fontSize: 22, fontWeight: "500" },
  title: { fontSize: 42, fontWeight: "800", letterSpacing: -1.6, textAlign: "center" },
  buttonWrap: {
    marginTop: 84,
    width: "100%",
  },
});
