import { StyleSheet, Text, View } from "react-native";

import { Program, getProgramCompletion, getProgramCourseCount } from "../../features/programs";
import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type SelectedProgramCardProps = {
  program: Program;
  onPress: () => void;
};

export function SelectedProgramCard({ program, onPress }: SelectedProgramCardProps) {
  const palette = useThemePalette();
  const courseCount = getProgramCourseCount(program);
  const completion = getProgramCompletion(program);

  return (
    <SquircleButton
      onPress={onPress}
      style={[styles.card, { backgroundColor: palette.primaryGradientStart }]}
    >
      <Text style={[styles.title, { color: palette.primaryForeground }]}>{program.name}</Text>
      <Text numberOfLines={2} style={[styles.description, { color: palette.primaryForegroundMuted }]}>
        {program.description || "No description yet."}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.primaryForeground }]}>
            {program.numberOfWeeks}
          </Text>
          <Text style={[styles.statLabel, { color: palette.primaryForegroundMuted }]}>Semaine</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.primaryForeground }]}>{courseCount}</Text>
          <Text style={[styles.statLabel, { color: palette.primaryForegroundMuted }]}>Course</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.primaryForeground }]}>{completion}%</Text>
          <Text style={[styles.statLabel, { color: palette.primaryForegroundMuted }]}>Completion</Text>
        </View>
      </View>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: { fontSize: 24, fontWeight: "700" },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  stat: {
    gap: 2,
  },
  statValue: { fontSize: 30, fontWeight: "700" },
  statLabel: { fontSize: 15, fontWeight: "600" },
});
