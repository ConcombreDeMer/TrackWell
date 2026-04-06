import { Pressable, StyleSheet, Text, View } from "react-native";

import { Program, getProgramCompletion, getProgramCourseCount } from "../../features/programs";
import { colors, radius, spacing } from "../../theme";

type ProgramSummaryCardProps = {
  isSelected?: boolean;
  program: Program;
  onPress: () => void;
};

export function ProgramSummaryCard({
  isSelected = false,
  program,
  onPress,
}: ProgramSummaryCardProps) {
  const courseCount = getProgramCourseCount(program);
  const completion = getProgramCompletion(program);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>{program.name}</Text>
        {isSelected ? (
          <View style={styles.selectedTag}>
            <Text style={styles.selectedTagText}>Selected</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.description}>
        {program.description || "No description yet."}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{program.numberOfWeeks}</Text>
          <Text style={styles.statLabel}>Weeks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{courseCount}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completion}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
  },
  selectedTag: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedTagText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
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
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
