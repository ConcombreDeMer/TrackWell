import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DayOfWeek, ProgramDraft, getCoursesForDay, weekDayLabels } from "../../features/programs";
import { colors, radius, spacing } from "../../theme";

type ProgramDraftCalendarProps = {
  draft: ProgramDraft;
  onSelectCell: (weekIndex: number, dayOfWeek: DayOfWeek) => void;
  titleSlot?: ReactNode;
  showCompleted?: boolean;
};

export function ProgramDraftCalendar({
  draft,
  onSelectCell,
  showCompleted = false,
  titleSlot,
}: ProgramDraftCalendarProps) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Calendar</Text>
        {titleSlot}
      </View>

      <View style={styles.headerRow}>
        <View style={styles.weekLabelSpacer} />
        {weekDayLabels.map((label, index) => (
          <Text key={`weekday-${index}`} style={styles.headerLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.rows}>
        {draft.weeks.map((week) => (
          <View key={week.id} style={styles.row}>
            <Text style={styles.weekLabel}>{week.index}</Text>
            {weekDayLabels.map((_, index) => {
              const dayOfWeek = index as DayOfWeek;
              const courses = getCoursesForDay(week, dayOfWeek);
              const hasCourse = courses.length > 0;
              const hasCompletedCourse = courses.some((course) => course.completed);

              return (
                <Pressable
                  key={`${week.id}-${index}`}
                  onPress={() => onSelectCell(week.index, dayOfWeek)}
                  style={({ pressed }) => [
                    styles.cell,
                    hasCourse
                      ? showCompleted && hasCompletedCourse
                        ? styles.cellCompleted
                        : styles.cellFilled
                      : styles.cellEmpty,
                    pressed && styles.cellPressed,
                  ]}
                >
                  {courses.length > 0 ? (
                    <Text style={styles.cellText}>{courses.length}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
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
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekLabelSpacer: {
    width: 20,
  },
  headerLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15,
    textAlign: "center",
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    width: 20,
  },
  cell: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  cellEmpty: {
    backgroundColor: colors.surfaceMuted,
  },
  cellFilled: {
    backgroundColor: "#AFAFAF",
  },
  cellCompleted: {
    backgroundColor: colors.success,
  },
  cellPressed: {
    opacity: 0.8,
  },
  cellText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
});
