import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppLogo } from "../../components/branding/AppLogo";
import { NextCourseCard } from "../../components/home/NextCourseCard";
import { SelectedProgramCard } from "../../components/home/SelectedProgramCard";
import { getNextCourse, useProgramsStore } from "../../features/programs";
import { colors, spacing } from "../../theme";
import { PrimaryButton } from "../../ui/PrimaryButton";

export default function HomeScreen() {
  const router = useRouter();
  const { getSelectedProgram } = useProgramsStore();
  const selectedProgram = getSelectedProgram();
  const nextCourse = selectedProgram ? getNextCourse(selectedProgram) : undefined;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <AppLogo size={52} />
        <Text style={styles.title}>Welcome back</Text>
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
            <View style={styles.doneState}>
              <Text style={styles.doneTitle}>All courses completed</Text>
              <Text style={styles.doneText}>
                This selected program is fully completed. Great work.
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No selected program</Text>
          <Text style={styles.emptyText}>
            Select one program to pin it here and access it quickly from Home.
          </Text>
          <PrimaryButton label="Browse Programs" onPress={() => router.replace("/programs")} />
        </View>
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
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
