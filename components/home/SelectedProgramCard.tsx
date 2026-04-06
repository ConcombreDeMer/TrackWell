import { StyleSheet, Text, View } from "react-native";

import { Program, getProgramCompletion, getProgramCourseCount } from "../../features/programs";
import { colors, radius, spacing } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type SelectedProgramCardProps = {
  program: Program;
  onPress: () => void;
};

export function SelectedProgramCard({ program, onPress }: SelectedProgramCardProps) {
  const courseCount = getProgramCourseCount(program);
  const completion = getProgramCompletion(program);

  return (
    <SquircleButton onPress={onPress} style={styles.card}>
      <Text style={styles.title}>{program.name}</Text>
      <Text numberOfLines={2} style={styles.description}>
        {program.description || "No description yet."}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{program.numberOfWeeks}</Text>
          <Text style={styles.statLabel}>Semaine</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{courseCount}</Text>
          <Text style={styles.statLabel}>Course</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completion}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: "rgba(255,255,255,0.72)",
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
  statValue: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "600",
  },
});
