import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DayOfWeek, ProgramDraft, getCoursesForDay, weekDayLabels } from "../../features/programs";
import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton, SquircleView } from "../../ui/Squircle";

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
  const palette = useThemePalette();
  const completedPreviewColor = mixHexColors(palette.success, palette.surface, 0.52);

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
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.text }]}>Calendar</Text>
        {titleSlot}
      </View>

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
                      !showCompleted &&
                      hasCompletedCourse && {
                        backgroundColor: completedPreviewColor,
                      },
                    hasCourse &&
                      showCompleted &&
                      hasCompletedCourse && {
                        backgroundColor: palette.success,
                      },
                    hasCourse
                      ? showCompleted && hasCompletedCourse
                        ? styles.cellCompleted
                        : styles.cellFilled
                      : styles.cellEmpty,
                  ]}
                >
                  {courses.length > 0 ? (
                    <Text style={[styles.cellText, { color: palette.primaryForeground }]}>
                      {courses.length}
                    </Text>
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

function mixHexColors(baseHex: string, mixHex: string, amount: number) {
  const base = parseHexColor(baseHex);
  const mix = parseHexColor(mixHex);

  if (!base || !mix) {
    return baseHex;
  }

  const clampedAmount = Math.min(Math.max(amount, 0), 1);
  const red = Math.round(base.red + (mix.red - base.red) * clampedAmount);
  const green = Math.round(base.green + (mix.green - base.green) * clampedAmount);
  const blue = Math.round(base.blue + (mix.blue - base.blue) * clampedAmount);

  return rgbToHex(red, green, blue);
}

function parseHexColor(hex: string) {
  const sanitized = hex.replace("#", "");

  if (sanitized.length !== 6) {
    return null;
  }

  return {
    blue: Number.parseInt(sanitized.slice(4, 6), 16),
    green: Number.parseInt(sanitized.slice(2, 4), 16),
    red: Number.parseInt(sanitized.slice(0, 2), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: { fontSize: 16, fontWeight: "700" },
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
  cellCompleted: {},
  cellText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
