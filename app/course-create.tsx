import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { DayOfWeek, StepType, getDayName, useProgramsStore } from "../features/programs";
import { colors, radius, spacing } from "../theme";
import { CounterField } from "../ui/CounterField";
import { PrimaryButton } from "../ui/PrimaryButton";
import { SectionCard } from "../ui/SectionCard";
import { SquircleButton } from "../ui/Squircle";

type DraftStep = {
  id: string;
  type: StepType;
  durationMinutes: number;
};

export default function CourseCreateScreen() {
  const router = useRouter();
  const { courseId, draft, dayOfWeek, programId, weekIndex } = useLocalSearchParams<{
    courseId?: string;
    draft?: string;
    dayOfWeek?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const {
    addCourseToDraft,
    getProgramById,
    programDraft,
    updateCourseInDraft,
    updateCourseInProgram,
  } = useProgramsStore();

  const isDraftFlow = draft === "true";
  const parsedWeekIndex = Number(weekIndex);
  const parsedDayOfWeek = Number(dayOfWeek) as DayOfWeek;
  const savedProgram = programId ? getProgramById(programId) : undefined;
  const sourceWeek = isDraftFlow
    ? programDraft.weeks.find((week) => week.index === parsedWeekIndex)
    : savedProgram?.weeks.find((week) => week.index === parsedWeekIndex);
  const editingCourse = courseId
    ? sourceWeek?.courses.find((course) => course.id === courseId)
    : undefined;
  const isEditing = Boolean(editingCourse);

  const [stepType, setStepType] = useState<StepType>("run");
  const [stepDurationMinutes, setStepDurationMinutes] = useState(5);
  const [steps, setSteps] = useState<DraftStep[]>(
    () =>
      editingCourse?.steps.map((step, index) => ({
        durationMinutes: Math.max(1, Math.round(step.durationSeconds / 60)),
        id: `draft-step-${index + 1}`,
        type: step.type,
      })) ?? [],
  );

  if (
    Number.isNaN(parsedWeekIndex) ||
    Number.isNaN(parsedDayOfWeek) ||
    (!isDraftFlow && !savedProgram)
  ) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <BackButton />
        <SectionCard>
          <Text style={styles.heroTitle}>Create course</Text>
          <Text style={styles.helper}>
            This screen needs a valid week/day context from a program.
          </Text>
        </SectionCard>
      </ScrollView>
    );
  }

  function handleAddStep() {
    setSteps((current) => [
      ...current,
      {
        id: `draft-step-${current.length + 1}`,
        type: stepType,
        durationMinutes: stepDurationMinutes,
      },
    ]);
  }

  function handleCreateCourse() {
    if (steps.length === 0) {
      Alert.alert("No steps yet", "Add at least one walk or run step before creating the course.");
      return;
    }

    const payload = {
      dayOfWeek: parsedDayOfWeek,
      weekIndex: parsedWeekIndex,
      steps: steps.map((step) => ({
        type: step.type,
        durationSeconds: step.durationMinutes * 60,
      })),
    };

    if (editingCourse) {
      if (isDraftFlow) {
        updateCourseInDraft({
          ...payload,
          courseId: editingCourse.id,
        });
      } else if (savedProgram) {
        updateCourseInProgram(savedProgram.id, {
          ...payload,
          courseId: editingCourse.id,
        });
      }
    } else {
      addCourseToDraft(payload);
    }

    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <BackButton />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{isEditing ? "Edit" : "Create"}</Text>
        <Text style={styles.heroSubtitle}>course</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Context</Text>
        <Text style={styles.helper}>
          {(isDraftFlow ? programDraft.name : savedProgram?.name) || "Untitled program"} • Week{" "}
          {parsedWeekIndex} • {getDayName(parsedDayOfWeek)}
        </Text>
        <Text style={styles.helper}>
          The course name is generated automatically based on its order in the program.
        </Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>New step</Text>
        <View style={styles.toggleRow}>
          <StepTypeButton active={stepType === "walk"} label="Walk" onPress={() => setStepType("walk")} />
          <StepTypeButton active={stepType === "run"} label="Run" onPress={() => setStepType("run")} />
        </View>
        <CounterField
          label="Duration (minutes)"
          max={180}
          min={1}
          onChange={setStepDurationMinutes}
          value={stepDurationMinutes}
        />
        <PrimaryButton label="Add Step" onPress={handleAddStep} variant="secondary" />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Steps preview</Text>
        {steps.length === 0 ? (
          <Text style={styles.helper}>No steps added yet.</Text>
        ) : (
          <View style={styles.stepsList}>
            {steps.map((step, index) => (
              <SquircleButton
                key={step.id}
                onPress={() => setSteps((current) => current.filter((item) => item.id !== step.id))}
                style={styles.stepCard}
              >
                <Text style={styles.stepText}>
                  Step {index + 1} • {step.type} • {step.durationMinutes} min
                </Text>
                <Text style={styles.stepDelete}>Delete</Text>
              </SquircleButton>
            ))}
          </View>
        )}
      </SectionCard>

      <PrimaryButton label={isEditing ? "Save Course" : "Create Course"} onPress={handleCreateCourse} />
    </ScrollView>
  );
}

type StepTypeButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function StepTypeButton({ label, active, onPress }: StepTypeButtonProps) {
  return (
    <SquircleButton
      onPress={onPress}
      style={[styles.stepTypeButton, active && styles.stepTypeButtonActive]}
    >
      <Text style={[styles.stepTypeLabel, active && styles.stepTypeLabelActive]}>{label}</Text>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 48,
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
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepTypeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  stepTypeButtonActive: {
    backgroundColor: colors.success,
  },
  stepTypeLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  stepTypeLabelActive: {
    fontWeight: "700",
  },
  stepsList: {
    gap: spacing.sm,
  },
  stepCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  stepDelete: {
    color: "#A33B3B",
    fontSize: 14,
    fontWeight: "700",
  },
});
