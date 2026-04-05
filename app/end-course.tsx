import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import {
  DifficultyLevel,
  PainLevel,
  useProgramsStore,
} from "../features/programs";
import { colors, radius, spacing } from "../theme";
import { PrimaryButton } from "../ui/PrimaryButton";
import { SectionCard } from "../ui/SectionCard";

const difficultyOptions: Array<{ label: string; value: DifficultyLevel }> = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
  { label: "Extra hard", value: "extra-hard" },
];

const painOptions: Array<{ label: string; value: PainLevel }> = [
  { label: "None", value: "none" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Very high", value: "very-high" },
];

export default function EndCourseScreen() {
  const router = useRouter();
  const { courseId, edit, programId, weekIndex } = useLocalSearchParams<{
    courseId?: string;
    edit?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const { getProgramById, saveCourseFeedback } = useProgramsStore();

  const isEditingFeedback = edit === "true";
  const parsedWeekIndex = Number(weekIndex);
  const program = programId ? getProgramById(programId) : undefined;
  const week = program?.weeks.find((item) => item.index === parsedWeekIndex);
  const course = week?.courses.find((item) => item.id === courseId);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(course?.feedback?.difficulty ?? "medium");
  const [pain, setPain] = useState<PainLevel>(course?.feedback?.pain ?? "none");
  const [feeling, setFeeling] = useState(course?.feedback?.feeling ?? "");

  if (!program || !week || !course || !programId || Number.isNaN(parsedWeekIndex)) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <BackButton />
        <SectionCard>
          <Text style={styles.title}>End Course</Text>
          <Text style={styles.helper}>
            The completed course could not be loaded.
          </Text>
        </SectionCard>
      </ScrollView>
    );
  }

  const safeProgramId = programId;
  const selectedCourse = course;
  const selectedProgram = program;

  function handleValidate() {
    saveCourseFeedback(safeProgramId, parsedWeekIndex, selectedCourse.id, {
      completedAt: selectedCourse.feedback?.completedAt ?? new Date().toISOString(),
      difficulty,
      feeling,
      pain,
    });

    if (isEditingFeedback) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/course",
      params: {
        courseId: selectedCourse.id,
        programId: safeProgramId,
        weekIndex: String(parsedWeekIndex),
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <BackButton />

      <View style={styles.header}>
        <Text style={styles.title}>{isEditingFeedback ? "Edit Course" : "End Course"}</Text>
        <Text style={styles.subtitle}>{selectedCourse.name} from {selectedProgram.name}</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Level of difficulty</Text>
        <View style={styles.optionList}>
          {difficultyOptions.map((option) => (
            <ChoiceChip
              active={difficulty === option.value}
              key={option.value}
              label={option.label}
              onPress={() => setDifficulty(option.value)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Level of pain</Text>
        <View style={styles.optionList}>
          {painOptions.map((option) => (
            <ChoiceChip
              active={pain === option.value}
              key={option.value}
              label={option.label}
              onPress={() => setPain(option.value)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Feeling</Text>
        <FeelingInput onChangeText={setFeeling} value={feeling} />
      </SectionCard>

      <PrimaryButton label={isEditingFeedback ? "Save" : "Validate"} onPress={handleValidate} />
    </ScrollView>
  );
}

function ChoiceChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function FeelingInput({
  onChangeText,
  value,
}: {
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <TextInput
      multiline
      onChangeText={onChangeText}
      placeholder="Write a short note..."
      placeholderTextColor={colors.textMuted}
      style={styles.textArea}
      value={value}
    />
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
    paddingTop: 70,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  optionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primaryGradientStart,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: colors.surface,
  },
  textArea: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    color: colors.text,
    minHeight: 90,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  helper: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.9,
  },
});
