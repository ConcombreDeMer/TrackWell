import { useRouter } from "expo-router";
import { useRef } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgramDraftCalendar } from "../components/programs/ProgramDraftCalendar";
import { getCourseForDay, getDayName, useProgramsStore } from "../features/programs";
import { colors, spacing, useThemePalette } from "../theme";
import { ActionCardButton } from "../ui/ActionCardButton";
import { CounterField } from "../ui/CounterField";
import { SectionCard } from "../ui/SectionCard";
import { SquircleButton } from "../ui/Squircle";
import { TextField } from "../ui/TextField";

export default function ProgramCreateScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const {
    programDraft,
    resetProgramDraft,
    saveProgramDraft,
    setDraftNumberOfWeeks,
    updateProgramDraft,
  } = useProgramsStore();

  const isEditing = Boolean(programDraft.editingProgramId);
  const totalCourses = programDraft.weeks.reduce(
    (count, week) => count + week.courses.length,
    0,
  );
  const initialDraftSnapshot = useRef(serializeProgramDraft(programDraft));
  const hasUnsavedChanges = serializeProgramDraft(programDraft) !== initialDraftSnapshot.current;

  function handleSaveProgram() {
    if (!programDraft.name.trim()) {
      Alert.alert("Program name required", "Please enter a name before saving the program.");
      return;
    }

    const program = saveProgramDraft();

    if (isEditing) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/program",
      params: { programId: program.id },
    });
  }

  function handleClose() {
    if (!hasUnsavedChanges) {
      resetProgramDraft();
      router.back();
      return;
    }

    Alert.alert(
      "Discard changes?",
      "No changes will be saved if you leave this screen now.",
      [
        { style: "cancel", text: "Keep editing" },
        {
          style: "destructive",
          text: "Discard",
          onPress: () => {
            resetProgramDraft();
            router.back();
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{isEditing ? "Edit" : "Create"}</Text>
        <Text style={styles.heroSubtitle}>program</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Informations</Text>
        <TextField
          label="Name"
          onChangeText={(value) => updateProgramDraft({ name: value })}
          placeholder="Half marathon base"
          value={programDraft.name}
        />
        <TextField
          label="Description"
          multiline
          onChangeText={(value) => updateProgramDraft({ description: value })}
          placeholder="Progressive running plan focused on endurance and consistency."
          value={programDraft.description}
        />
      </SectionCard>

      <SectionCard>
        <CounterField
          label="Number of weeks"
          onChange={setDraftNumberOfWeeks}
          value={programDraft.numberOfWeeks}
        />
        <Text style={styles.helper}>
          Tap any calendar cell to create the course planned for that exact week and day.
        </Text>
      </SectionCard>

      <ProgramDraftCalendar
        draft={programDraft}
        onSelectCell={(weekIndex, dayOfWeek) => {
          const selectedWeek = programDraft.weeks.find((week) => week.index === weekIndex);
          const existingCourse = selectedWeek
            ? getCourseForDay(selectedWeek, dayOfWeek)
            : undefined;

          if (existingCourse) {
            router.push({
              pathname: "/course",
              params: {
                draft: "true",
                weekIndex: String(weekIndex),
                courseId: existingCourse.id,
              },
            });
            return;
          }

          router.push({
            pathname: "/course-create",
            params: {
              draft: "true",
              weekIndex: String(weekIndex),
              dayOfWeek: String(dayOfWeek),
            },
          });
        }}
      />

      <SectionCard>
        <Text style={styles.sectionTitle}>Details</Text>
        {totalCourses === 0 ? (
          <Text style={styles.helper}>
            No courses scheduled yet. Start by selecting a cell in the calendar.
          </Text>
        ) : (
          <View style={styles.weekList}>
            {programDraft.weeks.map((week) => (
              <View key={week.id} style={styles.weekBlock}>
                <Text style={styles.weekTitle}>Week {week.index}</Text>
                {week.courses.length === 0 ? (
                  <Text style={styles.helper}>No courses in this week.</Text>
                ) : (
                  <View style={styles.courseList}>
                    {week.courses.map((course) => (
                      <SquircleButton
                        key={course.id}
                        onPress={() =>
                          router.push({
                            pathname: "/course",
                            params: {
                              draft: "true",
                              weekIndex: String(week.index),
                              courseId: course.id,
                            },
                          })
                        }
                        style={[
                          styles.courseRow,
                          {
                            backgroundColor: palette.surfaceMuted,
                          },
                        ]}
                      >
                        <Text style={styles.courseName}>{course.name}</Text>
                        <Text style={styles.courseMeta}>{getDayName(course.dayOfWeek)}</Text>
                      </SquircleButton>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </SectionCard>

      <View style={styles.ctaGroup}>
        <ActionCardButton
          iconName={isEditing ? "pencil" : "add"}
          label={isEditing ? "Save Program" : "Create Program"}
          onPress={handleSaveProgram}
          variant="dark"
        />
        <ActionCardButton
          iconName="close-outline"
          label="Cancel"
          onPress={handleClose}
          variant="light"
        />
      </View>
    </ScrollView>
  );
}

function serializeProgramDraft(programDraft: ReturnType<typeof useProgramsStore>["programDraft"]) {
  return JSON.stringify({
    description: programDraft.description,
    name: programDraft.name,
    numberOfWeeks: programDraft.numberOfWeeks,
    weeks: programDraft.weeks.map((week) => ({
      courses: week.courses.map((course) => ({
        completed: course.completed,
        dayOfWeek: course.dayOfWeek,
        feedback: course.feedback ?? null,
        name: course.name,
        steps: course.steps.map((step) => ({
          durationSeconds: step.durationSeconds,
          target: step.target,
          type: step.type,
        })),
      })),
      index: week.index,
    })),
  });
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
  ctaGroup: {
    gap: 8,
  },
  hero: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 52,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: "400",
    lineHeight: 30,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  weekList: {
    gap: spacing.md,
  },
  weekBlock: {
    gap: spacing.sm,
  },
  weekTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  courseList: {
    gap: spacing.xs,
  },
  courseRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  courseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  courseMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
