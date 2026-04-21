import { Ionicons } from "@expo/vector-icons";
import { GestureResponderEvent, StyleSheet, Text, View } from "react-native";

import { Course, Program, formatDurationFromSeconds, getCourseDurationSeconds } from "../../features/programs";
import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type NextCourseCardProps = {
  course: Course;
  onPress: () => void;
  onPlayPress: () => void;
  program: Program;
  weekIndex: number;
};

export function NextCourseCard({ course, onPlayPress, onPress, weekIndex }: NextCourseCardProps) {
  const palette = useThemePalette();

  function handlePlayPress(event: GestureResponderEvent) {
    event.stopPropagation();
    onPlayPress();
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.heading, { color: palette.text }]}>Prochaine course</Text>
      <SquircleButton
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: palette.text }]}>
            Semaine {weekIndex} - {course.name}
          </Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {formatDurationFromSeconds(getCourseDurationSeconds(course))}
          </Text>
        </View>
        <SquircleButton
          onPress={handlePlayPress}
          style={[styles.iconBox, { backgroundColor: palette.primaryGradientStart }]}
        >
          <Ionicons color={palette.primaryForeground} name="play" size={24} />
        </SquircleButton>
      </SquircleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  heading: { fontSize: 18, fontWeight: "700" },
  card: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 15, fontWeight: "600" },
  iconBox: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
});
