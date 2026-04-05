import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../theme";
import { ActionCardButton } from "../../ui/ActionCardButton";

export default function ProgramsScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Programs</Text>
        <View style={styles.actions}>
          <ActionCardButton
            iconName="add"
            label="Create program"
            onPress={() => router.push("/program-create")}
            variant="dark"
          />
          <ActionCardButton iconName="document-text-outline" label="Import program" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
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
});
