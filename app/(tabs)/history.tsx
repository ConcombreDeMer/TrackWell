import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  formatDurationFromSeconds,
  getChronologicalCourses,
  getCourseDurationSeconds,
  useProgramsStore,
} from "../../features/programs";
import { colors, radius, spacing } from "../../theme";

export default function HistoryScreen() {
  const router = useRouter();
  const { programs } = useProgramsStore();

  const completedCourses = programs.flatMap((program) =>
    getChronologicalCourses(program)
      .filter(({ course }) => course.completed)
      .map(({ course, weekIndex }) => ({
        course,
        program,
        weekIndex,
      })),
  );

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>History</Text>

      {completedCourses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No completed courses yet</Text>
          <Text style={styles.emptyText}>
            Completed courses will appear here once you start progressing through a program.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {completedCourses.map(({ course, program, weekIndex }) => (
            <View key={course.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{course.name}</Text>
                <Text style={styles.cardMeta}>
                  {program.name} • Week {weekIndex}
                </Text>
                <Text style={styles.cardMeta}>
                  {formatDurationFromSeconds(getCourseDurationSeconds(course))}
                </Text>
              </View>
              <Text
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
                style={styles.openLink}
              >
                Open
              </Text>
            </View>
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
    paddingTop: 96,
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
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  openLink: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
