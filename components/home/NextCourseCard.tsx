import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Course, Program, formatDurationFromSeconds, getCourseDurationSeconds } from "../../features/programs";
import { colors, radius, spacing } from "../../theme";

type NextCourseCardProps = {
  course: Course;
  onPlayPress: () => void;
  program: Program;
  weekIndex: number;
};

export function NextCourseCard({ course, onPlayPress, weekIndex }: NextCourseCardProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Prochaine course</Text>
      <View style={styles.card}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            Semaine {weekIndex} - {course.name}
          </Text>
          <Text style={styles.meta}>
            {formatDurationFromSeconds(getCourseDurationSeconds(course))}
          </Text>
        </View>
        <Pressable
          onPress={onPlayPress}
          style={({ pressed }) => [styles.iconBox, pressed && styles.pressed]}
        >
          <Ionicons color={colors.surface} name="play" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radius.md,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
});
