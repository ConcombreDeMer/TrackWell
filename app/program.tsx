import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { ProgramDraftCalendar } from "../components/programs/ProgramDraftCalendar";
import {
  formatDurationFromSeconds,
  getCourseDurationSeconds,
  getCourseForDay,
  getDayName,
  getProgramCourseCount,
  useProgramsStore,
} from "../features/programs";
import { colors, radius, spacing } from "../theme";
import { PrimaryButton } from "../ui/PrimaryButton";
import { SectionCard } from "../ui/SectionCard";

export default function ProgramScreen() {
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const { deleteProgram, getProgramById, startEditingProgram } = useProgramsStore();
  const program = programId ? getProgramById(programId) : undefined;

  if (!program) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <BackButton />
        <SectionCard>
          <Text style={styles.title}>Program not found</Text>
          <Text style={styles.description}>
            This program is not available in local state. Create one from the Programs tab first.
          </Text>
        </SectionCard>
      </ScrollView>
    );
  }

  const selectedProgram = program;

  function handleEditProgram() {
    startEditingProgram(selectedProgram.id);
    router.push("/program-create");
  }

  function handleDeleteProgram() {
    Alert.alert(
      "Delete program",
      `Do you want to delete "${selectedProgram.name}"? This action cannot be undone.`,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: () => {
            deleteProgram(selectedProgram.id);
            router.replace("/programs");
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <BackButton />
      <SectionCard>
        <Text style={styles.title}>{selectedProgram.name}</Text>
        <Text style={styles.description}>{selectedProgram.description || "No description yet."}</Text>
        <View style={styles.summaryRow}>
          <SummaryStat label="Weeks" value={String(selectedProgram.numberOfWeeks)} />
          <SummaryStat label="Courses" value={String(getProgramCourseCount(selectedProgram))} />
        </View>
      </SectionCard>

      <View style={styles.actions}>
        <PrimaryButton label="Edit Program" onPress={handleEditProgram} />
        <PrimaryButton label="Delete Program" onPress={handleDeleteProgram} variant="secondary" />
      </View>

      <ProgramDraftCalendar
        draft={selectedProgram}
        onSelectCell={(weekIndex, dayOfWeek) => {
          const selectedWeek = selectedProgram.weeks.find((week) => week.index === weekIndex);
          const existingCourse = selectedWeek ? getCourseForDay(selectedWeek, dayOfWeek) : undefined;

          if (!existingCourse) {
            return;
          }

          router.push({
            pathname: "/course",
            params: {
              programId: selectedProgram.id,
              weekIndex: String(weekIndex),
              courseId: existingCourse.id,
            },
          });
        }}
      />

      {selectedProgram.weeks.map((week) => (
        <SectionCard key={week.id}>
          <View style={styles.weekHeader}>
            <View style={styles.weekHeaderText}>
              <Text style={styles.weekTitle}>Week {week.index}</Text>
              <Text style={styles.weekSubtitle}>
                {week.courses.length === 0
                  ? "No courses yet"
                  : `${week.courses.length} course${week.courses.length > 1 ? "s" : ""}`}
              </Text>
            </View>
          </View>

          {week.courses.length === 0 ? (
            <View style={styles.emptyCourseState}>
              <Text style={styles.emptyCourseText}>
                Add the first course for this week to start building the plan.
              </Text>
            </View>
          ) : (
            <View style={styles.courseList}>
              {week.courses.map((course, index) => (
                <Pressable
                  key={course.id}
                  onPress={() =>
                    router.push({
                        pathname: "/course",
                        params: {
                          programId: selectedProgram.id,
                          weekIndex: String(week.index),
                          courseId: course.id,
                        },
                    })
                  }
                  style={({ pressed }) => [styles.courseCard, pressed && styles.pressed]}
                >
                  <View style={styles.courseBody}>
                    <Text style={styles.courseTitle}>{course.name || `Course ${index + 1}`}</Text>
                    <Text style={styles.courseMeta}>
                      {getDayName(course.dayOfWeek)} • {course.steps.length} steps •{" "}
                      {formatDurationFromSeconds(getCourseDurationSeconds(course))}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </SectionCard>
      ))}
    </ScrollView>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    marginTop: 60,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 48,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryStat: {
    flex: 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    gap: spacing.sm,
  },
  weekHeader: {
    gap: spacing.md,
  },
  weekHeaderText: {
    gap: 2,
  },
  weekTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  weekSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  emptyCourseState: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  emptyCourseText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  courseList: {
    gap: spacing.sm,
  },
  courseCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  courseBody: {
    flex: 1,
  },
  courseTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  courseMeta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.9,
  },
});
