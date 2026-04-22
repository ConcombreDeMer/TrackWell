import { StyleSheet, Text, View } from "react-native";

import { DayOfWeek, ProgramDraft, getCoursesForDay, weekDayLabels } from "../../features/programs";
import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton, SquircleView } from "../../ui/Squircle";

type ProgramDraftCalendarProps = {
  draft: ProgramDraft;
  onSelectCell: (weekIndex: number, dayOfWeek: DayOfWeek) => void;
};

export function ProgramDraftCalendar({ draft, onSelectCell }: ProgramDraftCalendarProps) {
  const palette = useThemePalette();

  return (
    <SquircleView
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.weekLabelSpacer} />
        {weekDayLabels.map((label, index) => (
          <Text key={`weekday-${index}`} style={[styles.headerLabel, { color: palette.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.rows}>
        {draft.weeks.map((week) => (
          <View key={week.id} style={styles.row}>
            <Text style={[styles.weekLabel, { color: palette.text }]}>{week.index}</Text>
            {weekDayLabels.map((_, index) => {
              const dayOfWeek = index as DayOfWeek;
              const courses = getCoursesForDay(week, dayOfWeek);
              const hasCourse = courses.length > 0;
              const hasCompletedCourse = courses.some((course) => course.completed);

              return (
                <SquircleButton
                  key={`${week.id}-${index}`}
                  onPress={() => onSelectCell(week.index, dayOfWeek)}
                  style={[
                    styles.cell,
                    !hasCourse && { backgroundColor: palette.surfaceMuted },
                    hasCourse &&
                      !hasCompletedCourse && {
                        backgroundColor: palette.textMuted,
                      },
                    hasCourse &&
                      hasCompletedCourse && {
                        backgroundColor: palette.success,
                      },
                    hasCourse ? styles.cellFilled : styles.cellEmpty,
                  ]}
                >
                  {hasCompletedCourse ? (
                    <Text style={[styles.cellCheckmark, { color: palette.primaryForeground }]}>✓</Text>
                  ) : null}
                </SquircleButton>
              );
            })}
          </View>
        ))}
      </View>
    </SquircleView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekLabelSpacer: {
    width: 20,
  },
  headerLabel: { flex: 1, fontSize: 15, textAlign: "center" },
  rows: {
    gap: spacing.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekLabel: { fontSize: 16, fontWeight: "700", width: 20 },
  cell: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  cellEmpty: {},
  cellFilled: {},
  cellCheckmark: {
    fontSize: 15,
    fontWeight: "700",
  },
});
