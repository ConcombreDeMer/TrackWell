import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Course,
  Program,
  ProgramDraft,
  formatDurationFromSeconds,
  useProgramsStore,
} from "../features/programs";
import { colors, radius, spacing } from "../theme";

type CourseStepGroup =
  | {
      kind: "single";
      key: string;
      step: Course["steps"][number];
    }
  | {
      kind: "pair-repeat";
      key: string;
      repeatCount: number;
      steps: [Course["steps"][number], Course["steps"][number]];
    };

export default function CourseScreen() {
  const router = useRouter();
  const { courseId, draft, programId, weekIndex } = useLocalSearchParams<{
    courseId?: string;
    draft?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const {
    deleteCourseFromDraft,
    deleteCourseFromProgram,
    getProgramById,
    programDraft,
    setCourseCompleted,
  } = useProgramsStore();

  const isDraftFlow = draft === "true";
  const source = getCourseSource({
    courseId,
    isDraftFlow,
    programDraft,
    programId,
    weekIndex,
    getProgramById,
  });

  if (!source) {
    return (
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Course not found</Text>
          <Text style={styles.subtitle}>
            The selected course could not be loaded from the current program.
          </Text>
          <CloseButton onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const selectedSource = source;
  const groups = groupCourseSteps(selectedSource.course.steps);

  function handleEdit() {
    router.replace({
      pathname: "/course-create",
      params: isDraftFlow
        ? {
            courseId: selectedSource.course.id,
            draft: "true",
            dayOfWeek: String(selectedSource.course.dayOfWeek),
            weekIndex: String(Number(weekIndex)),
          }
        : {
            courseId: selectedSource.course.id,
            dayOfWeek: String(selectedSource.course.dayOfWeek),
            programId,
            weekIndex: String(Number(weekIndex)),
          },
    });
  }

  function handleDelete() {
    Alert.alert("Delete course", `Delete "${selectedSource.course.name}"?`, [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Delete",
        onPress: () => {
          if (isDraftFlow) {
            deleteCourseFromDraft(Number(weekIndex), selectedSource.course.id);
          } else if (programId) {
            deleteCourseFromProgram(programId, Number(weekIndex), selectedSource.course.id);
          }

          router.back();
        },
      },
    ]);
  }

  function handleToggleCompletion() {
    if (!programId) {
      return;
    }

    if (selectedSource.course.completed) {
      Alert.alert(
        "Mark course as incomplete?",
        "This will remove the data from the previous completion, including difficulty, pain, and feeling.",
        [
          { style: "cancel", text: "Cancel" },
          {
            style: "destructive",
            text: "Continue",
            onPress: () => {
              setCourseCompleted(programId, Number(weekIndex), selectedSource.course.id, false);
            },
          },
        ],
      );

      return;
    }

    setCourseCompleted(programId, Number(weekIndex), selectedSource.course.id, true);
  }

  function handleRetry() {
    if (!programId) {
      return;
    }

    router.replace({
      pathname: "/chrono",
      params: {
        courseId: selectedSource.course.id,
        programId,
        weekIndex: String(Number(weekIndex)),
      },
    });
  }

  function handleEditFeedback() {
    if (!programId) {
      return;
    }

    router.push({
      pathname: "/end-course",
      params: {
        courseId: selectedSource.course.id,
        edit: "true",
        programId,
        weekIndex: String(Number(weekIndex)),
      },
    });
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{selectedSource.course.name}</Text>
            <Text style={styles.subtitle}>from {selectedSource.programName}</Text>
          </View>
          <CloseButton onPress={() => router.back()} />
        </View>

        <View style={styles.actionRow}>
          <ActionPill label="Edit" onPress={handleEdit} />
          <ActionPill destructive label="Delete" onPress={handleDelete} />
          {!isDraftFlow ? (
            <ActionPill
              emphasis={selectedSource.course.completed ? "success" : "default"}
              label={selectedSource.course.completed ? "Completed" : "Mark Complete"}
              onPress={handleToggleCompletion}
            />
          ) : null}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!isDraftFlow && selectedSource.course.feedback ? (
            <View style={styles.feedbackWrap}>
              <View style={styles.feedbackTopRow}>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Done</Text>
                  <Ionicons color={colors.surface} name="checkmark" size={24} />
                </View>
                <View style={styles.feedbackActions}>
                  <Pressable
                    onPress={handleEditFeedback}
                    style={({ pressed }) => [styles.iconSquare, pressed && styles.pressed]}
                  >
                    <Ionicons color="#7A7A7A" name="create-outline" size={26} />
                  </Pressable>
                  <Pressable
                    onPress={handleRetry}
                    style={({ pressed }) => [styles.iconSquare, pressed && styles.pressed]}
                  >
                    <Ionicons color="#7A7A7A" name="refresh" size={28} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.feedbackCard}>
                <FeedbackRow
                  label="Date"
                  value={formatFeedbackDate(selectedSource.course.feedback.completedAt)}
                />
                <FeedbackRow
                  badge
                  badgeTone={getDifficultyTone(selectedSource.course.feedback.difficulty)}
                  label="Difficulty"
                  value={formatDifficulty(selectedSource.course.feedback.difficulty)}
                />
                <FeedbackRow
                  badge
                  badgeTone={getPainTone(selectedSource.course.feedback.pain)}
                  label="Pain"
                  value={formatPain(selectedSource.course.feedback.pain)}
                />
                <View style={styles.feedbackNotes}>
                  <Text style={styles.feedbackNotesTitle}>Feeling</Text>
                  <Text style={styles.feedbackNotesText}>
                    {selectedSource.course.feedback.feeling || "-"}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            {groups.map((group, index) => (
              <View key={group.key}>
                {group.kind === "single" ? (
                  <CourseStepRow step={group.step} />
                ) : (
                  <RepeatedPairBlock repeatCount={group.repeatCount} steps={group.steps} />
                )}
                {index < groups.length - 1 ? <View style={styles.connector} /> : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function FeedbackRow({
  badge = false,
  badgeTone = "neutral",
  label,
  value,
}: {
  badge?: boolean;
  badgeTone?: "green" | "yellow" | "orange" | "red" | "neutral";
  label: string;
  value: string;
}) {
  const badgeStyle = getFeedbackBadgeStyle(badgeTone);

  return (
    <View style={styles.feedbackRow}>
      <Text style={styles.feedbackLabel}>{label}</Text>
      {badge ? (
        <View style={[styles.feedbackBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[styles.feedbackBadgeText, { color: badgeStyle.textColor }]}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.feedbackValue}>{value}</Text>
      )}
    </View>
  );
}

function getFeedbackBadgeStyle(tone: "green" | "yellow" | "orange" | "red" | "neutral") {
  switch (tone) {
    case "green":
      return {
        backgroundColor: "#9AC29B",
        textColor: "#FFFFFF",
      };
    case "yellow":
      return {
        backgroundColor: "#E3C66D",
        textColor: "#3D3312",
      };
    case "orange":
      return {
        backgroundColor: "#E4A35A",
        textColor: "#FFFFFF",
      };
    case "red":
      return {
        backgroundColor: "#D96B6B",
        textColor: "#FFFFFF",
      };
    default:
      return {
        backgroundColor: "#D9D9D9",
        textColor: colors.text,
      };
  }
}

function formatFeedbackDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatDifficulty(value: string) {
  switch (value) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "extra-hard":
      return "Extra hard";
    default:
      return value;
  }
}

function formatPain(value: string) {
  switch (value) {
    case "none":
      return "None";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "very-high":
      return "Very high";
    default:
      return value;
  }
}

function getDifficultyTone(value: string): "green" | "yellow" | "orange" | "red" {
  switch (value) {
    case "easy":
      return "green";
    case "medium":
      return "yellow";
    case "hard":
      return "orange";
    case "extra-hard":
      return "red";
    default:
      return "yellow";
  }
}

function getPainTone(value: string): "green" | "yellow" | "orange" | "red" {
  switch (value) {
    case "none":
      return "green";
    case "medium":
      return "yellow";
    case "high":
      return "orange";
    case "very-high":
      return "red";
    default:
      return "yellow";
  }
}

function ActionPill({
  emphasis = "default",
  destructive = false,
  label,
  onPress,
}: {
  emphasis?: "default" | "success";
  destructive?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionPill,
        emphasis === "success" && styles.actionPillSuccess,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionPillLabel,
          destructive && styles.actionPillLabelDestructive,
          emphasis === "success" && styles.actionPillLabelSuccess,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getCourseSource({
  courseId,
  isDraftFlow,
  programDraft,
  programId,
  weekIndex,
  getProgramById,
}: {
  courseId?: string;
  isDraftFlow: boolean;
  programDraft: ProgramDraft;
  programId?: string;
  weekIndex?: string;
  getProgramById: (programId: string) => Program | undefined;
}) {
  const parsedWeekIndex = Number(weekIndex);

  if (!courseId || Number.isNaN(parsedWeekIndex)) {
    return null;
  }

  if (isDraftFlow) {
    const week = programDraft.weeks.find((item) => item.index === parsedWeekIndex);
    const course = week?.courses.find((item) => item.id === courseId);

    if (!week || !course) {
      return null;
    }

    return {
      course,
      programName: programDraft.name || "Program",
    };
  }

  if (!programId) {
    return null;
  }

  const program = getProgramById(programId);
  const week = program?.weeks.find((item) => item.index === parsedWeekIndex);
  const course = week?.courses.find((item) => item.id === courseId);

  if (!program || !week || !course) {
    return null;
  }

  return {
    course,
    programName: program.name,
  };
}

function groupCourseSteps(steps: Course["steps"]): CourseStepGroup[] {
  const groups: CourseStepGroup[] = [];
  let index = 0;

  while (index < steps.length) {
    const first = steps[index];
    const second = steps[index + 1];

    if (first && second) {
      let repeatCount = 1;
      let cursor = index + 2;

      while (cursor + 1 < steps.length) {
        const nextFirst = steps[cursor];
        const nextSecond = steps[cursor + 1];

        if (
          nextFirst.type === first.type &&
          nextFirst.durationSeconds === first.durationSeconds &&
          nextSecond.type === second.type &&
          nextSecond.durationSeconds === second.durationSeconds
        ) {
          repeatCount += 1;
          cursor += 2;
        } else {
          break;
        }
      }

      if (repeatCount > 1) {
        groups.push({
          kind: "pair-repeat",
          key: `repeat-${index}`,
          repeatCount,
          steps: [first, second],
        });
        index += repeatCount * 2;
        continue;
      }
    }

    groups.push({
      key: `single-${first.id}`,
      kind: "single",
      step: first,
    });
    index += 1;
  }

  return groups;
}

function CourseStepRow({ step }: { step: Course["steps"][number] }) {
  const iconName = step.type === "walk" ? "walk-outline" : "flash-outline";
  const label = step.type === "walk" ? "walk" : "run";

  return (
    <View style={styles.stepRow}>
      <Ionicons color={colors.text} name={iconName} size={32} />
      <Text style={styles.stepLabel}>
        {formatDurationFromSeconds(step.durationSeconds)} - {label}
      </Text>
    </View>
  );
}

function RepeatedPairBlock({
  repeatCount,
  steps,
}: {
  repeatCount: number;
  steps: [Course["steps"][number], Course["steps"][number]];
}) {
  return (
    <View style={styles.repeatBlock}>
      <Text style={styles.repeatCount}>x{repeatCount}</Text>
      <CourseStepRow step={steps[0]} />
      <CourseStepRow step={steps[1]} />
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
      <Ionicons color={colors.text} name="close" size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    // backgroundColor: "rgba(20, 20, 20, 0.18)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    minHeight: "100%",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#C7C7C7",
    borderRadius: radius.pill,
    height: 6,
    marginBottom: spacing.lg,
    width: 42,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    gap: 4,
    paddingTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    elevation: 2,
    height: 52,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: 52,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  actionPillSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionPillLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  actionPillLabelDestructive: {
    color: "#A33B3B",
  },
  actionPillLabelSuccess: {
    color: colors.text,
  },
  content: {
    paddingBottom: 40,
  },
  feedbackWrap: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  feedbackTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feedbackActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  completedBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
  },
  completedBadgeText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: "700",
  },
  iconSquare: {
    alignItems: "center",
    backgroundColor: "#E4E4E4",
    borderColor: "#D0D0D0",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 66,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  feedbackRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feedbackLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  feedbackValue: {
    color: colors.textMuted,
    fontSize: 18,
  },
  feedbackBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackNotes: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  feedbackNotesTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  feedbackNotesText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  stepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
  },
  stepLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  connector: {
    backgroundColor: "#7A7A7A",
    borderRadius: radius.pill,
    height: 64,
    marginLeft: 15,
    width: 4,
  },
  repeatBlock: {
    backgroundColor: "#D8D8D8",
    borderRadius: 28,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    position: "relative",
  },
  repeatCount: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
