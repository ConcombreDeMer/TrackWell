import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Host } from "@expo/ui/swift-ui";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getExerciseById } from "../../features/exercises";
import { Step, formatDurationFromSeconds } from "../../features/programs";
import { colors, radius, spacing, useThemePalette } from "../../theme";
import { SquircleView } from "../../ui/Squircle";

type StepTimelineSheetProps = {
  completedStepsCount: number;
  currentStepIndex: number;
  progressPercent: number;
  steps: Step[];
  visible: boolean;
  onClose: () => void;
};

export function StepTimelineSheet(props: StepTimelineSheetProps) {
  if (Platform.OS === "ios") {
    return <SwiftUIStepTimelineSheet {...props} />;
  }

  return <DefaultStepTimelineSheet {...props} />;
}

function SwiftUIStepTimelineSheet({
  completedStepsCount,
  currentStepIndex,
  progressPercent,
  steps,
  visible,
  onClose,
}: StepTimelineSheetProps) {
  const { width } = Dimensions.get("window");

  return (
    <Host style={[styles.host, { width }]}>
      <BottomSheet
        isOpened={visible}
        onIsOpenedChange={(isOpened) => {
          if (!isOpened) {
            onClose();
          }
        }}
        presentationDetents={[0.46, 0.72]}
        presentationDragIndicator="visible"
      >
        <Host matchContents={{ horizontal: true, vertical: true }} style={styles.sheetHost}>
          <StepTimelineContent
            completedStepsCount={completedStepsCount}
            currentStepIndex={currentStepIndex}
            progressPercent={progressPercent}
            steps={steps}
          />
        </Host>
      </BottomSheet>
    </Host>
  );
}

function DefaultStepTimelineSheet({
  completedStepsCount,
  currentStepIndex,
  progressPercent,
  steps,
  visible,
  onClose,
}: StepTimelineSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.defaultSheetWrap}>
          <StepTimelineContent
            completedStepsCount={completedStepsCount}
            currentStepIndex={currentStepIndex}
            progressPercent={progressPercent}
            steps={steps}
          />
        </View>
      </View>
    </Modal>
  );
}

function StepTimelineContent({
  completedStepsCount,
  currentStepIndex,
  progressPercent,
  steps,
}: Omit<StepTimelineSheetProps, "visible" | "onClose">) {
  const palette = useThemePalette();
  const stepsToRender = steps.slice(currentStepIndex).map((step, offset) => ({
    index: currentStepIndex + offset,
    step,
  }));
  const completedLabel = `${completedStepsCount + 1}/${steps.length}`;

  return (
    <SquircleView style={[styles.sheet, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workout Steps</Text>
        </View>

        <Text style={styles.completedCount}>{completedLabel}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {stepsToRender.map(({ index, step }) => {
          const isCurrent = index === currentStepIndex;
          const exercise = getExerciseById(step.type);
          const label = exercise?.nom ?? (step.type === "walk" ? "Walk" : "Run");
          const iconName = step.type === "walk" ? "walk-outline" : "flash-outline";

          return (
            <SquircleView
              key={step.id}
              style={[
                styles.stepRow,
                {
                  backgroundColor: isCurrent ? palette.primaryGradientStart : palette.surface,
                },
              ]}
            >
              <View style={styles.stepHead}>
                <View style={styles.stepTitleRow}>
                  {exercise ? (
                    <Image
                      source={exercise.iconSource}
                      style={[
                        styles.stepIcon,
                        { tintColor: isCurrent ? palette.primaryForeground : palette.text },
                      ]}
                    />
                  ) : (
                    <Ionicons
                      color={isCurrent ? palette.primaryForeground : palette.text}
                      name={iconName}
                      size={18}
                    />
                  )}
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: isCurrent ? palette.primaryForeground : palette.text },
                    ]}
                  >
                    {label}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stepIndex,
                    {
                      color: isCurrent ? palette.primaryForegroundMuted : palette.textMuted,
                    },
                  ]}
                >
                  Step {index + 1}
                </Text>
              </View>

              <Text
                style={[
                  styles.stepDuration,
                  {
                    color: isCurrent ? palette.primaryForegroundMuted : palette.textMuted,
                  },
                ]}
              >
                {formatDurationFromSeconds(step.durationSeconds)}
              </Text>

              {isCurrent ? (
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${Math.max(progressPercent, 2)}%` }]}
                  />
                </View>
              ) : null}
            </SquircleView>
          );
        })}
      </ScrollView>
    </SquircleView>
  );
}

const styles = StyleSheet.create({
  host: {
    bottom: 0,
    height: 1,
    left: 0,
    position: "absolute",
    zIndex: 20,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHost: {
    width: "100%",
  },
  defaultSheetWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sheet: {
    borderRadius: 34,
    maxHeight: "100%",
    minHeight: "42%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  completedCount: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  stepRow: {
    borderRadius: 22,
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stepRowCurrent: {},
  stepHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  stepLabel: { fontSize: 18, fontWeight: "700" },
  stepIcon: {
    height: 22,
    resizeMode: "contain",
    width: 22,
  },
  stepLabelCurrent: {},
  stepIndex: { fontSize: 13, fontWeight: "700" },
  stepIndexCurrent: {},
  stepDuration: { fontSize: 15, fontWeight: "600" },
  stepDurationCurrent: {},
  progressTrack: {
    backgroundColor: colors.primaryForegroundMuted,
    borderRadius: radius.pill,
    height: 6,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: "100%",
  },
});
