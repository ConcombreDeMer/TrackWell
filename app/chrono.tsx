import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { formatDurationFromSeconds, useProgramsStore } from "../features/programs";
import { colors, radius, spacing } from "../theme";
import { SquircleButton, SquircleView } from "../ui/Squircle";

export default function ChronoScreen() {
  const router = useRouter();
  const { courseId, programId, weekIndex } = useLocalSearchParams<{
    courseId?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const { getProgramById, setCourseCompleted } = useProgramsStore();

  const program = programId ? getProgramById(programId) : undefined;
  const parsedWeekIndex = Number(weekIndex);
  const week = program?.weeks.find((item) => item.index === parsedWeekIndex);
  const course = week?.courses.find((item) => item.id === courseId);

  const [isRunning, setIsRunning] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(course?.steps[0]?.durationSeconds ?? 0);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const hasCompletedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentStepIntroAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!course || !isRunning) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (remainingSeconds > 1) {
        setRemainingSeconds((current) => current - 1);
        return;
      }

      const nextStep = course.steps[currentStepIndex + 1];

      if (nextStep) {
        setCurrentStepIndex((index) => index + 1);
        return;
      }

      setRemainingSeconds(0);
      setIsRunning(false);
      setHasFinished(true);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    course,
    currentStepIndex,
    isRunning,
    program,
    remainingSeconds,
    router,
    setCourseCompleted,
    week,
  ]);

  useEffect(() => {
    if (!hasFinished || !program || !week || !course || hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    setCourseCompleted(program.id, week.index, course.id, true);
    router.replace({
      pathname: "/end-course",
      params: {
        courseId: course.id,
        programId: program.id,
        weekIndex: String(week.index),
      },
    });
  }, [course, hasFinished, program, router, setCourseCompleted, week]);

  useEffect(() => {
    if (!course) {
      return;
    }

    setRemainingSeconds(course.steps[currentStepIndex]?.durationSeconds ?? 0);
  }, [course, currentStepIndex]);

  const currentStep = course?.steps[currentStepIndex];
  useEffect(() => {
    if (!currentStep) {
      return;
    }

    if (!isRunning) {
      progressAnim.stopAnimation();
      return;
    }

    const stepDuration = currentStep.durationSeconds;
    const initialProgress =
      stepDuration === 0 ? 1 : (stepDuration - remainingSeconds) / stepDuration;

    progressAnim.stopAnimation(() => {
      progressAnim.setValue(Math.max(0, Math.min(1, initialProgress)));
      Animated.timing(progressAnim, {
        duration: Math.max(remainingSeconds, 0) * 1000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep, currentStepIndex, isRunning, progressAnim]);

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    currentStepIntroAnim.setValue(0);
    Animated.timing(currentStepIntroAnim, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [currentStep, currentStepIntroAnim]);

  if (!program || !week || !course || !currentStep) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <BackButton />
        <SquircleView style={styles.fallbackCard}>
          <Text style={styles.fallbackTitle}>Chrono unavailable</Text>
          <Text style={styles.fallbackText}>
            The selected course could not be loaded. Return to Home and launch a valid next course.
          </Text>
        </SquircleView>
      </ScrollView>
    );
  }

  const activeStep = currentStep;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.backButtonWrap}>
          <BackButton />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>{course.name}</Text>
          <Text style={styles.subtitle}>de {program.name}</Text>
        </View>
      </View>

      <SquircleView style={styles.timerCard}>
        <View>
          <Text style={styles.timerLabel}>Timer</Text>
          <Text style={styles.timerValue}>{formatClock(remainingSeconds)}</Text>
        </View>

        <SquircleButton
          onPress={() => setIsRunning((current) => !current)}
          style={styles.pauseButton}
        >
          <Ionicons color={colors.surface} name={isRunning ? "pause" : "play"} size={46} />
        </SquircleButton>
      </SquircleView>

      <SquircleView style={styles.timelineCard}>
        {course.steps.map((step, index) => {
          const isPast = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const iconName = step.type === "walk" ? "walk-outline" : "flash-outline";
          const label = step.type === "walk" ? "walk" : "run";

          if (isCurrent) {
            return (
              <View key={step.id} style={styles.currentStepContainer}>
                <View style={styles.stepRow}>
                  <Ionicons color={colors.text} name={iconName} size={40} />
                  <Text style={styles.currentStepText}>
                    {formatDurationFromSeconds(activeStep.durationSeconds)} - {label}
                  </Text>
                </View>
                <AnimatedSquircleView
                  style={[
                    styles.currentProgressCard,
                    {
                      opacity: currentStepIntroAnim,
                      transform: [
                        {
                          translateY: currentStepIntroAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.View
                    style={{
                      opacity: currentStepIntroAnim,
                      transform: [
                        {
                          translateY: currentStepIntroAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons color={colors.surface} name={iconName} size={42} />
                  </Animated.View>
                  <View
                    onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}
                    style={styles.progressTrack}
                  >
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, progressTrackWidth],
                          }),
                        },
                      ]}
                    />
                  </View>
                </AnimatedSquircleView>
              </View>
            );
          }

          return (
            <View key={step.id} style={styles.stepRow}>
              <Ionicons
                color={isPast ? colors.text : "#BDBDBD"}
                name={iconName}
                size={isPast ? 38 : 32}
              />
              <Text style={[styles.stepText, !isPast && styles.futureStepText]}>
                {formatDurationFromSeconds(step.durationSeconds)} - {label}
              </Text>
            </View>
          );
        })}
      </SquircleView>
    </ScrollView>
  );
}

const AnimatedSquircleView = Animated.createAnimatedComponent(SquircleView);

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 70,
    paddingBottom: 48,
  },
  topBar: {
    justifyContent: "center",
    minHeight: 72,
    position: "relative",
  },
  backButtonWrap: {
    left: 0,
    position: "absolute",
    top: 0,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  timerCard: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.xl,
    marginTop: 100,
  },
  timerLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 18,
    marginBottom: 8,
  },
  timerValue: {
    color: colors.surface,
    fontSize: 62,
    fontWeight: "700",
    letterSpacing: -2,
    lineHeight: 64,
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "#666666",
    borderRadius: 28,
    height: 128,
    justifyContent: "center",
    width: 128,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  stepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  stepText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  futureStepText: {
    color: "#B0B0B0",
    fontWeight: "500",
  },
  currentStepContainer: {
    gap: spacing.md,
  },
  currentStepText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  currentProgressCard: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: 24,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: radius.pill,
    height: 4,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    backgroundColor: colors.surface,
    height: "100%",
  },
  fallbackCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  fallbackTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
