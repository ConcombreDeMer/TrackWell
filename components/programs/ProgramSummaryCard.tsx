import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { Program, getProgramCompletion, getProgramCourseCount } from "../../features/programs";
import { radius, spacing, useThemePalette } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type ProgramSummaryCardProps = {
  isSelected?: boolean;
  onBookmarkPress?: () => void;
  program: Program;
  onPress: () => void;
};

export function ProgramSummaryCard({
  isSelected = false,
  onBookmarkPress,
  program,
  onPress,
}: ProgramSummaryCardProps) {
  const palette = useThemePalette();
  const courseCount = getProgramCourseCount(program);
  const completion = getProgramCompletion(program);
  const [showBookmark, setShowBookmark] = useState(isSelected);
  const bookmarkOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const bookmarkScale = useRef(new Animated.Value(isSelected ? 1 : 0.8)).current;

  useEffect(() => {
    if (isSelected) {
      setShowBookmark(true);
      Animated.parallel([
        Animated.timing(bookmarkOpacity, {
          duration: 180,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(bookmarkScale, {
          damping: 16,
          mass: 0.7,
          stiffness: 220,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(bookmarkOpacity, {
        duration: 140,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkScale, {
        duration: 140,
        toValue: 0.82,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShowBookmark(false);
      }
    });
  }, [bookmarkOpacity, bookmarkScale, isSelected]);

  function handleBookmarkPress(event: GestureResponderEvent) {
    event.stopPropagation();
    onBookmarkPress?.();
  }

  return (
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>{program.name}</Text>
        {showBookmark ? (
          <Animated.View
            style={[
              styles.selectedIconButton,
              {
                opacity: bookmarkOpacity,
                transform: [{ scale: bookmarkScale }],
              },
            ]}
          >
            <Pressable hitSlop={8} onPress={handleBookmarkPress}>
              <Ionicons color={palette.text} name="bookmark" size={22} style={styles.selectedIcon} />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={[styles.description, { color: palette.textMuted }]}>
        {program.description || "No description yet."}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.text }]}>{program.numberOfWeeks}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Weeks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.text }]}>{courseCount}</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Courses</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: palette.text }]}>{completion}%</Text>
          <Text style={[styles.statLabel, { color: palette.textMuted }]}>Completion</Text>
        </View>
      </View>
    </SquircleButton>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: { flex: 1, fontSize: 24, fontWeight: "700" },
  selectedIconButton: {
    flexShrink: 0,
  },
  selectedIcon: {
    marginTop: 2,
  },
  description: { fontSize: 16, lineHeight: 22 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  stat: {
    gap: 2,
  },
  statValue: { fontSize: 30, fontWeight: "700" },
  statLabel: { fontSize: 15, fontWeight: "600" },
});
