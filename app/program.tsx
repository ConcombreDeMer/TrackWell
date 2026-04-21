import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { ProgramDraftCalendar } from "../components/programs/ProgramDraftCalendar";
import { ProgramActionsMenu } from "../components/programs/ProgramActionsMenu";
import {
  formatDurationFromSeconds,
  getCourseDurationSeconds,
  getCourseForDay,
  getDayName,
  getProgramCourseCount,
  useProgramsStore,
} from "../features/programs";
import { colors, radius, spacing, useThemePalette } from "../theme";
import { ActionCardButton } from "../ui/ActionCardButton";
import { SectionCard } from "../ui/SectionCard";
import { SquircleButton, SquircleView } from "../ui/Squircle";

export default function ProgramScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const [showCompleted, setShowCompleted] = useState(false);
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const {
    clearSelectedProgram,
    deleteProgram,
    getProgramById,
    selectProgram,
    selectedProgramId,
    startEditingProgram,
  } = useProgramsStore();
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

  function handleSelectProgram() {
    if (isSelectedProgram) {
      clearSelectedProgram();
      return;
    }

    if (selectedProgramId && selectedProgramId !== selectedProgram.id) {
      Alert.alert(
        "Replace selected program",
        "You already selected a program. If you continue, the current one will be removed from the Home screen.",
        [
          { style: "cancel", text: "Cancel" },
          {
            text: "Continue",
            onPress: () => selectProgram(selectedProgram.id),
          },
        ],
      );
      return;
    }

    selectProgram(selectedProgram.id);
  }

  const isSelectedProgram = selectedProgramId === selectedProgram.id;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.topBar}>
        <BackButton />
        <ProgramActionsMenu onDelete={handleDeleteProgram} onEdit={handleEditProgram} />
      </View>
      <SectionCard>
        <Text style={styles.title}>{selectedProgram.name}</Text>
        <Text style={styles.description}>{selectedProgram.description || "No description yet."}</Text>
        <View style={styles.summaryRow}>
          <SummaryStat label="Weeks" value={String(selectedProgram.numberOfWeeks)} />
          <SummaryStat label="Courses" value={String(getProgramCourseCount(selectedProgram))} />
        </View>
      </SectionCard>

      <View style={styles.actions}>
        <ActionCardButton
          animateContentChange
          iconName={isSelectedProgram ? "bookmark" : "bookmark-outline"}
          label={isSelectedProgram ? "Program Selected" : "Select Program"}
          onPress={handleSelectProgram}
          variant={isSelectedProgram ? "dark" : "muted"}
        />
      </View>

      <ProgramDraftCalendar
        draft={selectedProgram}
        showCompleted={showCompleted}
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
        titleSlot={
          <Pressable
            onPress={() => setShowCompleted((current) => !current)}
            style={styles.checkboxRow}
          >
            <Text style={styles.checkboxLabel}>Completed</Text>
            <SquircleView
              style={[
                styles.checkbox,
                {
                  backgroundColor: showCompleted ? palette.success : palette.surface,
                  borderColor: showCompleted ? palette.success : palette.border,
                },
              ]}
            >
              {showCompleted ? (
                <Ionicons color={palette.text} name="checkmark" size={18} />
              ) : null}
            </SquircleView>
          </Pressable>
        }
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
            <SquircleView
              style={[
                styles.emptyCourseState,
                { backgroundColor: palette.surfaceMuted },
              ]}
            >
              <Text style={styles.emptyCourseText}>
                Add the first course for this week to start building the plan.
              </Text>
            </SquircleView>
          ) : (
            <View style={styles.courseList}>
              {week.courses.map((course, index) => {
                const isPartialCourse = !course.completed && (!!course.feedback || !!course.progress);

                return (
                <SquircleButton
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
                  style={[
                    styles.courseCard,
                    { backgroundColor: palette.surfaceMuted },
                  ]}
                >
                  <View style={styles.courseBody}>
                    <Text style={styles.courseTitle}>{course.name || `Course ${index + 1}`}</Text>
                    <Text style={styles.courseMeta}>
                      {getDayName(course.dayOfWeek)} • {course.steps.length} steps •{" "}
                      {formatDurationFromSeconds(getCourseDurationSeconds(course))}
                    </Text>
                  </View>
                  {course.completed ? (
                    <Ionicons
                      color={colors.success}
                      name="checkmark-circle"
                      size={24}
                      style={styles.courseCompletedIcon}
                    />
                  ) : isPartialCourse ? (
                    <MaterialCommunityIcons
                      color={palette.warningText}
                      name="waves"
                      size={24}
                      style={styles.courseCompletedIcon}
                    />
                  ) : null}
                </SquircleButton>
                );
              })}
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
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
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
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  checkbox: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  checkboxActive: {},
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
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  courseBody: {
    flex: 1,
  },
  courseCompletedIcon: {
    flexShrink: 0,
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
});
