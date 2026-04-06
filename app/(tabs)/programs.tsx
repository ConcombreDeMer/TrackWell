import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgramSummaryCard } from "../../components/programs/ProgramSummaryCard";
import { useProgramsStore } from "../../features/programs";
import { colors, spacing } from "../../theme";
import { ActionCardButton } from "../../ui/ActionCardButton";

export default function ProgramsScreen() {
  const router = useRouter();
  const { programs, resetProgramDraft, selectedProgramId } = useProgramsStore();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>Programs</Text>

      <View style={styles.actions}>
        <ActionCardButton
          iconName="add"
          label="Create program"
          onPress={() => {
            resetProgramDraft();
            router.push("/program-create");
          }}
          variant="dark"
        />
        <ActionCardButton iconName="document-text-outline" label="Import program" />
      </View>

      <View style={styles.list}>
        {programs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No programs yet</Text>
            <Text style={styles.emptyText}>
              Create your first running program to generate weeks, then add courses inside each week.
            </Text>
          </View>
        ) : (
          programs.map((program) => (
            <ProgramSummaryCard
              isSelected={program.id === selectedProgramId}
              key={program.id}
              onPress={() =>
                router.push({
                  pathname: "/program",
                  params: { programId: program.id },
                })
              }
              program={program}
            />
          ))
        )}
      </View>
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
    paddingBottom: 120,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  actions: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
