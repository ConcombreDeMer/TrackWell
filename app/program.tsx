import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { ProgramDraftCalendar } from "../components/programs/ProgramDraftCalendar";
import { ProgramActionsMenu } from "../components/programs/ProgramActionsMenu";
import {
  formatDurationFromSeconds,
  getCourseDurationSeconds,
  getCourseForDay,
  getDayName,
  getProgramCourseCount,
  shareProgramFile,
  useProgramsStore,
} from "../features/programs";
import { colors, radius, spacing, useThemePalette } from "../theme";
import { ActionCardButton } from "../ui/ActionCardButton";
import { SectionCard } from "../ui/SectionCard";
import { SquircleButton, SquircleView } from "../ui/Squircle";

export default function ProgramScreen() {
  const router = useRouter();
  const palette = useThemePalette();
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
  const [collapsedWeekIds, setCollapsedWeekIds] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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

  async function handleExportProgram() {
    try {
      await shareProgramFile(selectedProgram);
    } catch (error) {
      Alert.alert(
        "Export unavailable",
        error instanceof Error ? error.message : "TrackWell could not export this program.",
      );
    }
  }

  function expandAllWeeks() {
    LayoutAnimation.configureNext(expandCollapseAnimation);
    setCollapsedWeekIds([]);
  }

  function collapseAllWeeks() {
    LayoutAnimation.configureNext(expandCollapseAnimation);
    setCollapsedWeekIds(selectedProgram.weeks.map((week) => week.id));
  }

  function toggleWeek(weekId: string) {
    LayoutAnimation.configureNext(expandCollapseAnimation);
    setCollapsedWeekIds((current) =>
      current.includes(weekId) ? current.filter((id) => id !== weekId) : [...current, weekId],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.topBar}>
        <BackButton />
        <ProgramActionsMenu
          onDelete={handleDeleteProgram}
          onEdit={handleEditProgram}
          onExport={handleExportProgram}
        />
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
      <View style={styles.blockSection}>
        <Text style={styles.blockTitle}>Calendar</Text>
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
      </View>

      <View style={styles.blockSection}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Training Plan</Text>
          <View style={styles.blockActions}>
            <Pressable
              onPress={expandAllWeeks}
              style={[
                styles.compactToggleButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: 0.8,
                },
              ]}
            >
              <View style={styles.compactToggleIconStack}>
                <Ionicons color={palette.text} name="chevron-up" size={10} />
                <Ionicons color={palette.text} name="chevron-down" size={10} />
              </View>
            </Pressable>
            <Pressable
              onPress={collapseAllWeeks}
              style={[
                styles.compactToggleButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: 0.8,
                },
              ]}
            >
              <View style={styles.compactToggleIconStack}>
                <Ionicons color={palette.text} name="chevron-down" size={10} />
                <Ionicons color={palette.text} name="chevron-up" size={10} />
              </View>
            </Pressable>
          </View>
        </View>
        <SectionCard>
          <View style={styles.weekList}>
            {selectedProgram.weeks.map((week, weekIndex) => (
              <Pressable
                key={week.id}
                onPress={() => toggleWeek(week.id)}
                style={[
                  styles.weekSection,
                  weekIndex > 0 && styles.weekSectionDivider,
                  weekIndex > 0 && { borderTopColor: withAlpha(palette.text, 0.18) },
                ]}
              >
                <View style={styles.weekHeader}>
                  <View style={styles.weekHeaderRow}>
                    <Text style={styles.sectionTitle}>Week {week.index}</Text>
                    {week.courses.length > 0 ? (
                      <Text style={styles.sectionSubtitle}>
                        {`${week.courses.length} course${week.courses.length > 1 ? "s" : ""}`}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {!collapsedWeekIds.includes(week.id) ? (
                  week.courses.length === 0 ? (
                    <SquircleView
                      style={[
                        styles.emptyCourseState,
                        { backgroundColor: palette.surfaceMuted },
                      ]}
                    >
                      <Text style={styles.emptyCourseText}>
                        No course planned for this week yet.
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
                                color={colors.warningText}
                                name="waves"
                                size={24}
                                style={styles.courseCompletedIcon}
                              />
                            ) : null}
                          </SquircleButton>
                        );
                      })}
                    </View>
                  )
                ) : null}
              </Pressable>
            ))}
          </View>
        </SectionCard>
      </View>
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

function withAlpha(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");

  if (sanitized.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${Math.min(Math.max(alpha, 0), 1)})`;
}

const expandCollapseAnimation = {
  duration: 320,
  create: {
    duration: 260,
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    duration: 220,
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    marginTop: 60,
  },
  content: {
    gap: spacing.xl,
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
  blockSection: {
    gap: spacing.xs,
  },
  blockHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blockTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  blockActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  compactToggleButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  compactToggleIconStack: {
    gap: 0,
    marginVertical: -3,
  },
  weekList: {
    gap: spacing.lg,
  },
  weekSection: {
    gap: spacing.md,
  },
  weekSectionDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  weekHeader: {
    gap: spacing.md,
  },
  weekHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
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
