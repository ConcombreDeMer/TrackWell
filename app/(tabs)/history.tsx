import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  formatDurationFromSeconds,
  getChronologicalCourses,
  getCourseDurationSeconds,
  useProgramsStore,
} from "../../features/programs";
import { colors, radius, spacing } from "../../theme";
import { SquircleButton, SquircleView } from "../../ui/Squircle";

export default function HistoryScreen() {
  const router = useRouter();
  const { programs } = useProgramsStore();

  const historyCourses = programs.flatMap((program) =>
    getChronologicalCourses(program)
      .filter(({ course }) => course.completed || !!course.feedback || !!course.progress)
      .map(({ course, weekIndex }) => ({
        course,
        isPartial: !course.completed,
        program,
        weekIndex,
      })),
  );

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>History</Text>

      {historyCourses.length === 0 ? (
        <SquircleView style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No courses in history yet</Text>
          <Text style={styles.emptyText}>
            Completed and partial courses will appear here once you start progressing through a
            program.
          </Text>
        </SquircleView>
      ) : (
        <View style={styles.list}>
          {historyCourses.map(({ course, isPartial, program, weekIndex }) => (
            <SquircleButton
              key={course.id}
              onPress={() =>
                router.push({
                  pathname: "/course",
                  params: {
                    programId: program.id,
                    weekIndex: String(weekIndex),
                    courseId: course.id,
                  },
                })
              }
              style={styles.card}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{course.name}</Text>
                <Text style={styles.cardMeta}>
                  {program.name} • Week {weekIndex}
                </Text>
                <Text style={styles.cardMeta}>
                  {formatDurationFromSeconds(getCourseDurationSeconds(course))}
                </Text>
              </View>
              <SquircleView style={[styles.statusBadge, isPartial && styles.statusBadgePartial]}>
                <Text style={[styles.statusBadgeText, isPartial && styles.statusBadgeTextPartial]}>
                  {isPartial ? "Partial" : "Done"}
                </Text>
              </SquircleView>
            </SquircleButton>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 120,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusBadgePartial: {
    backgroundColor: "#F3E0BF",
  },
  statusBadgeText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadgeTextPartial: {
    color: "#8A5A1F",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
