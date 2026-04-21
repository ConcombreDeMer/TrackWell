import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "../../components/branding/AppLogo";
import { NextCourseCard } from "../../components/home/NextCourseCard";
import { SelectedProgramCard } from "../../components/home/SelectedProgramCard";
import { getNextCourse, useProgramsStore } from "../../features/programs";
import { colors, spacing, useThemePalette } from "../../theme";
import { PrimaryButton } from "../../ui/PrimaryButton";
import { SquircleView } from "../../ui/Squircle";

export default function HomeScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const { getSelectedProgram } = useProgramsStore();
  const selectedProgram = getSelectedProgram();
  const nextCourse = selectedProgram ? getNextCourse(selectedProgram) : undefined;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <AppLogo size={52} />
          <Text style={styles.title}>Welcome back</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[
            styles.settingsButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons color={palette.text} name="settings-outline" size={20} />
        </Pressable>
      </View>

      {selectedProgram ? (
        <>
          <SelectedProgramCard
            onPress={() =>
              router.push({
                pathname: "/program",
                params: { programId: selectedProgram.id },
              })
            }
            program={selectedProgram}
          />

          {nextCourse ? (
            <NextCourseCard
              course={nextCourse.course}
              onPress={() =>
                router.push({
                  pathname: "/course",
                  params: {
                    programId: selectedProgram.id,
                    weekIndex: String(nextCourse.weekIndex),
                    courseId: nextCourse.course.id,
                  },
                })
              }
              onPlayPress={() =>
                router.push({
                  pathname: "/chrono",
                  params: {
                    programId: selectedProgram.id,
                    weekIndex: String(nextCourse.weekIndex),
                    courseId: nextCourse.course.id,
                  },
                })
              }
              program={selectedProgram}
              weekIndex={nextCourse.weekIndex}
            />
          ) : (
            <SquircleView
              style={[
                styles.doneState,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={styles.doneTitle}>All courses completed</Text>
              <Text style={styles.doneText}>
                This selected program is fully completed. Great work.
              </Text>
            </SquircleView>
          )}
        </>
      ) : (
        <SquircleView
          style={[
            styles.emptyState,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={styles.emptyTitle}>No selected program</Text>
          <Text style={styles.emptyText}>
            Select one program to pin it here and access it quickly from Home.
          </Text>
          <PrimaryButton label="Browse Programs" onPress={() => router.replace("/programs")} />
        </SquircleView>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  settingsButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  doneState: {
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  doneTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  doneText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  shortcuts: {
    gap: spacing.sm,
  },
});
