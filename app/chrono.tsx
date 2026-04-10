import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
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
  const { getProgramById, saveCourseProgress, setCourseCompleted } = useProgramsStore();

  const program = programId ? getProgramById(programId) : undefined;
  const parsedWeekIndex = Number(weekIndex);
  const week = program?.weeks.find((item) => item.index === parsedWeekIndex);
  const course = week?.courses.find((item) => item.id === courseId);

  const [hasStarted, setHasStarted] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(course?.progress?.currentStepIndex ?? 0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    course?.progress?.remainingSeconds ?? course?.steps[0]?.durationSeconds ?? 0,
  );
  const [showTimeline, setShowTimeline] = useState(true);
  const [isTimelineMounted, setIsTimelineMounted] = useState(true);
  const [showCompletedSteps, setShowCompletedSteps] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const hasCompletedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentStepIntroAnim = useRef(new Animated.Value(1)).current;
  const orbitPulseAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const pauseStateAnim = useRef(new Animated.Value(1)).current;
  const timelineAnim = useRef(new Animated.Value(1)).current;
  const heroFocusAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollOffsetYRef = useRef(0);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineToggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousStepIndexRef = useRef(currentStepIndex);
  const previousShowCompletedRef = useRef(showCompletedSteps);

  const resetTimelineState = useCallback(() => {
    if (timelineToggleTimeoutRef.current) {
      clearTimeout(timelineToggleTimeoutRef.current);
      timelineToggleTimeoutRef.current = null;
    }

    setShowTimeline(true);
    setIsTimelineMounted(true);
    scrollOffsetYRef.current = 0;
    timelineAnim.stopAnimation();
    heroFocusAnim.stopAnimation();
    timelineAnim.setValue(1);
    heroFocusAnim.setValue(0);
  }, [heroFocusAnim, timelineAnim]);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetTimelineState();

      return () => {
        if (timelineToggleTimeoutRef.current) {
          clearTimeout(timelineToggleTimeoutRef.current);
          timelineToggleTimeoutRef.current = null;
        }
      };
    }, [resetTimelineState]),
  );

  useEffect(() => {
    if (showTimeline) {
      setIsTimelineMounted(true);
      timelineAnim.setValue(0);
      Animated.parallel([
        Animated.timing(heroFocusAnim, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(timelineAnim, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(heroFocusAnim, {
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(timelineAnim, {
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsTimelineMounted(false);
      }
    });
  }, [heroFocusAnim, showTimeline, timelineAnim]);

  useEffect(() => {
    if (previousShowCompletedRef.current === showCompletedSteps) {
      return;
    }

    LayoutAnimation.configureNext({
      duration: 240,
      update: {
        property: LayoutAnimation.Properties.opacity,
        springDamping: 0.82,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      create: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    previousShowCompletedRef.current = showCompletedSteps;
  }, [showCompletedSteps]);

  useEffect(() => {
    if (previousStepIndexRef.current === currentStepIndex) {
      return;
    }

    LayoutAnimation.configureNext({
      duration: 260,
      update: {
        property: LayoutAnimation.Properties.scaleY,
        springDamping: 0.84,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      create: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    previousStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

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
        setRemainingSeconds(nextStep.durationSeconds);
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

    setHasStarted(false);
    setIsCountdownActive(false);
    setCountdownValue(3);
    setIsRunning(false);
    resetTimelineState();
    setCurrentStepIndex(course.progress?.currentStepIndex ?? 0);
    setRemainingSeconds(course.progress?.remainingSeconds ?? course.steps[0]?.durationSeconds ?? 0);
    countdownAnim.setValue(0);
  }, [countdownAnim, course, resetTimelineState]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
      if (timelineToggleTimeoutRef.current) {
        clearTimeout(timelineToggleTimeoutRef.current);
      }
    };
  }, []);

  function handleTimelineToggle() {
    triggerToggleTimelineHaptic();

    if (showTimeline && scrollOffsetYRef.current > 12) {
      scrollViewRef.current?.scrollTo({ animated: true, y: 0 });

      if (timelineToggleTimeoutRef.current) {
        clearTimeout(timelineToggleTimeoutRef.current);
      }

      timelineToggleTimeoutRef.current = setTimeout(() => {
        setShowTimeline(false);
      }, 260);
      return;
    }

    setShowTimeline((current) => !current);
  }

  function handleExitWorkout() {
    if (!program || !week || !course) {
      return;
    }

    Alert.alert(
      "End workout early?",
      "This workout will not be marked as completed. You can either cancel it completely or save your current progress and resume later.",
      [
        { style: "cancel", text: "Keep going" },
        {
          style: "destructive",
          text: "Cancel workout",
          onPress: () => {
            saveCourseProgress(program.id, week.index, course.id, undefined);
            setCourseCompleted(program.id, week.index, course.id, false);
            router.back();
          },
        },
        {
          text: "Save progress",
          onPress: () => {
            saveCourseProgress(program.id, week.index, course.id, {
              currentStepIndex,
              remainingSeconds,
              savedAt: new Date().toISOString(),
            });
            router.push({
              pathname: "/end-course",
              params: {
                courseId: course.id,
                partial: "true",
                programId: program.id,
                weekIndex: String(week.index),
              },
            });
          },
        },
      ],
    );
  }

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
  }, [currentStep, currentStepIndex, isRunning, progressAnim, remainingSeconds]);

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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbitPulseAnim, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(orbitPulseAnim, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [orbitPulseAnim]);

  useEffect(() => {
    if (!hasStarted) {
      pauseStateAnim.setValue(1);
      return;
    }

    Animated.timing(pauseStateAnim, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: isRunning ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [hasStarted, isRunning, pauseStateAnim]);

  useEffect(() => {
    if (!isCountdownActive) {
      return;
    }

    countdownAnim.setValue(0);
    Animated.timing(countdownAnim, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    countdownTimerRef.current = setTimeout(() => {
      setCountdownValue((current) => {
        if (current <= 1) {
          setIsCountdownActive(false);
          setHasStarted(true);
          setIsRunning(true);
          countdownAnim.setValue(0);
          return 3;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdownAnim, isCountdownActive, countdownValue]);

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
  const totalCourseSeconds = course.steps.reduce((total, step) => total + step.durationSeconds, 0);
  const elapsedCourseSeconds = course.steps
    .slice(0, currentStepIndex)
    .reduce((total, step) => total + step.durationSeconds, 0);
  const completedCourseSeconds =
    elapsedCourseSeconds + Math.max(activeStep.durationSeconds - remainingSeconds, 0);
  const overallProgress =
    totalCourseSeconds === 0 ? 0 : completedCourseSeconds / totalCourseSeconds;
  const currentStepLabel = activeStep.type === "walk" ? "Walk" : "Run";
  const circleSize = Math.min(Dimensions.get("window").width - spacing.xl * 2, 320);
  const orbitDotSize = 22;
  const orbitInset = 69;
  const orbitSize = circleSize - orbitInset * 2;
  const orbitDotTranslate = orbitSize / 2 - orbitDotSize / 2;
  const orbitRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const stepsToRender = showCompletedSteps
    ? course.steps.map((step, index) => ({ index, step }))
    : course.steps.slice(currentStepIndex).map((step, offset) => ({
        index: currentStepIndex + offset,
        step,
      }));
  const shouldHideBackButton = isCountdownActive || hasStarted;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      onScroll={(event) => {
        scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
      }}
      ref={scrollViewRef}
      scrollEventThrottle={16}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        {shouldHideBackButton ? <View style={styles.backButtonPlaceholder} /> : (
          <View style={styles.backButtonWrap}>
            <BackButton />
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.title}>{course.name}</Text>
          <Text style={styles.subtitle}>from {program.name}</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.heroSection,
          {
            transform: [
              {
                translateY: heroFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 44],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [
              {
                scale: heroFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          }}
        >
          <View style={[styles.timerShell, { height: circleSize, width: circleSize }]}>
          <Animated.View
            style={[
              styles.timerGlow,
              {
                opacity: orbitPulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.38],
                }),
                transform: [
                  {
                    scale: orbitPulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1.04],
                    }),
                  },
                ],
              },
            ]}
          />

          <View style={styles.timerOuterRing} />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.orbitLayer,
              {
                height: orbitSize,
                width: orbitSize,
                transform: [{ rotate: orbitRotation }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbitDot,
                {
                  transform: [
                    { translateY: -orbitDotTranslate },
                    {
                      scale: orbitPulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1.08],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>

          {hasStarted ? (
            <SquircleView style={styles.timerCore}>
              <Animated.View
                pointerEvents={isRunning ? "auto" : "none"}
                style={[
                  styles.timerRunningState,
                  {
                    opacity: pauseStateAnim,
                    transform: [
                      {
                        scale: pauseStateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.92, 1],
                        }),
                      },
                      {
                        translateY: pauseStateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SquircleButton
                  onPress={() => setIsRunning(false)}
                  style={styles.timerMainPressable}
                >
                  <Text style={styles.timerOverline}>
                    Step {currentStepIndex + 1}/{course.steps.length}
                  </Text>
                  <Text style={styles.timerValue}>{formatClock(remainingSeconds)}</Text>
                  <Animated.View
                    style={[
                      styles.activeBadge,
                      {
                        opacity: currentStepIntroAnim,
                        transform: [
                          {
                            translateY: currentStepIntroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [12, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons
                      color={colors.surface}
                      name={activeStep.type === "walk" ? "walk-outline" : "flash-outline"}
                      size={18}
                    />
                    <Text style={styles.activeBadgeText}>
                      {currentStepLabel} • {formatDurationFromSeconds(activeStep.durationSeconds)}
                    </Text>
                  </Animated.View>
                  <Text style={styles.timerHint}>Tap to pause</Text>
                </SquircleButton>
              </Animated.View>

              <Animated.View
                pointerEvents={isRunning ? "none" : "auto"}
                style={[
                  styles.timerPausedState,
                  {
                    opacity: pauseStateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    transform: [
                      {
                        scale: pauseStateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.92],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SquircleButton onPress={() => setIsRunning(true)} style={styles.pauseResumeButton}>
                  <View style={styles.pauseCenterRow}>
                    <View style={styles.pauseIconWrap}>
                      <Ionicons color={colors.text} name="pause" size={26} />
                    </View>
                    <Text style={styles.pauseTimeValue}>{formatClock(remainingSeconds)}</Text>
                  </View>
                  <Text style={styles.pauseLabel}>Paused</Text>
                  <Text style={styles.timerHint}>Tap to resume</Text>
                </SquircleButton>
                <SquircleButton onPress={handleExitWorkout} style={styles.endWorkoutButton}>
                  <Text style={styles.endWorkoutButtonText}>End workout</Text>
                </SquircleButton>
              </Animated.View>
            </SquircleView>
          ) : (
            <SquircleView style={styles.timerCore}>
              {!isCountdownActive ? (
                <>
                  <Text style={styles.timerOverline}>
                    Step {currentStepIndex + 1}/{course.steps.length}
                  </Text>
                  <SquircleButton
                    onPress={() => {
                      triggerStartHaptic();
                      setIsCountdownActive(true);
                      setCountdownValue(3);
                    }}
                    style={styles.centerPlayButton}
                  >
                    <Ionicons color={colors.text} name="play" size={34} />
                  </SquircleButton>
                  <Text style={styles.timerHint}>Tap to start</Text>
                </>
              ) : (
                <View style={styles.inlineCountdownWrap}>
                  <Animated.View
                    style={[
                      styles.countdownBlur,
                      {
                        opacity: countdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.55],
                        }),
                        transform: [
                          {
                            scale: countdownAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.88, 1.08],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.Text
                    style={[
                      styles.countdownValue,
                      styles.countdownValueOnDark,
                      {
                        opacity: countdownAnim.interpolate({
                          inputRange: [0, 0.15, 1],
                          outputRange: [0, 1, 0.9],
                        }),
                        transform: [
                          {
                            scale: countdownAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.7, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {countdownValue}
                  </Animated.Text>
                </View>
              )}
            </SquircleView>
          )}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.metricsRow,
            {
              transform: [
                {
                  translateY: heroFocusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 18],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Progress</Text>
            <Text style={styles.metricValue}>{Math.round(overallProgress * 100)}%</Text>
          </View>
          <SquircleButton
            onPress={handleTimelineToggle}
            style={styles.pauseButton}
          >
            <MaterialCommunityIcons
              color={colors.text}
              name={showTimeline ? "text-box-remove-outline" : "text-box-outline"}
              size={26}
            />
          </SquircleButton>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Remaining</Text>
            <Text style={styles.metricValue}>{course.steps.length - currentStepIndex - 1}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {isTimelineMounted ? (
        <Animated.View
          style={{
            opacity: timelineAnim,
            transform: [
              {
                translateY: timelineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 0],
                }),
              },
              {
                scale: timelineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          }}
        >
          <SquircleView style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.timelineEyebrow}>Sequence</Text>
              <Text style={styles.timelineTitle}>Workout Steps</Text>
            </View>
            <SquircleButton
              onPress={() => setShowCompletedSteps((current) => !current)}
              style={styles.timelineToggle}
            >
              <Ionicons
                color={colors.text}
                name={showCompletedSteps ? "eye-off-outline" : "eye-outline"}
                size={18}
              />
            </SquircleButton>
          </View>

          {stepsToRender.map(({ index, step }, visibleIndex) => {
          const isPast = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const iconName = step.type === "walk" ? "walk-outline" : "flash-outline";
          const label = step.type === "walk" ? "Walk" : "Run";
          const stepStateLabel = isPast ? "Done" : isCurrent ? "Now" : "Next";
          const rowInnerContent = (
            <>
              <View style={styles.stepLeading}>
                <View
                  style={[
                    styles.stepIndexBadge,
                    isPast && styles.stepIndexBadgePast,
                    isCurrent && styles.stepIndexBadgeCurrent,
                  ]}
                >
                  {isPast ? (
                    <Ionicons color={colors.surface} name="checkmark" size={16} />
                  ) : (
                    <Text
                      style={[
                        styles.stepIndexText,
                        isCurrent && styles.stepIndexTextCurrent,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {visibleIndex < stepsToRender.length - 1 ? (
                  <View style={[styles.stepConnector, isPast && styles.stepConnectorPast]} />
                ) : null}
              </View>

              <View style={styles.stepBody}>
                <View style={styles.stepTopRow}>
                  <View style={styles.stepTitleRow}>
                    <Ionicons
                      color={isCurrent ? colors.surface : isPast ? colors.text : colors.textMuted}
                      name={iconName}
                      size={18}
                    />
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                        !isPast && !isCurrent && styles.stepTitleFuture,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepState,
                      isCurrent && styles.stepStateCurrent,
                      isPast && styles.stepStatePast,
                    ]}
                  >
                    {stepStateLabel}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stepDuration,
                    isCurrent && styles.stepDurationCurrent,
                    !isPast && !isCurrent && styles.stepDurationFuture,
                  ]}
                >
                  {formatDurationFromSeconds(step.durationSeconds)}
                </Text>

                {isCurrent ? (
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            </>
          );

          const rowContent = isCurrent ? (
            <SquircleView style={[styles.stepCard, styles.stepCardCurrent]}>
              {rowInnerContent}
            </SquircleView>
          ) : (
            <View style={[styles.stepCard, isPast && styles.stepCardPast]}>{rowInnerContent}</View>
          );

          if (isCurrent) {
            return (
              <AnimatedSquircleView
                key={step.id}
                style={[
                  styles.currentStepContainer,
                  {
                    opacity: currentStepIntroAnim,
                    transform: [
                      {
                        translateY: currentStepIntroAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {rowContent}
              </AnimatedSquircleView>
            );
          }

            return <View key={step.id}>{rowContent}</View>;
          })}
          </SquircleView>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const AnimatedSquircleView = Animated.createAnimatedComponent(SquircleView);

async function triggerStartHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore haptics failures so the countdown still starts.
  }
}

async function triggerToggleTimelineHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore haptics failures so the toggle still works.
  }
}

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
    paddingTop: 66,
    paddingBottom: 56,
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
  backButtonPlaceholder: {
    height: 44,
    left: 0,
    position: "absolute",
    top: 0,
    width: 44,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  heroSection: {
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  startCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
  },
  startEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  startTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  startText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  startButton: {
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: 24,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  startButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  centerPlayButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 92,
    justifyContent: "center",
    marginTop: spacing.xs,
    width: 92,
  },
  timerHint: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  inlineCountdownWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    position: "relative",
    width: "100%",
  },
  countdownWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 420,
    position: "relative",
  },
  countdownBlur: {
    backgroundColor: "rgba(47,47,47,0.12)",
    borderRadius: 999,
    height: 220,
    position: "absolute",
    width: 220,
  },
  countdownValue: {
    color: colors.text,
    fontSize: 120,
    fontWeight: "800",
    letterSpacing: -6,
    lineHeight: 120,
  },
  countdownValueOnDark: {
    color: colors.surface,
  },
  timerShell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timerGlow: {
    backgroundColor: "#D9D9D9",
    borderRadius: 999,
    bottom: 22,
    left: 22,
    opacity: 0.32,
    position: "absolute",
    right: 22,
    top: 22,
  },
  timerOuterRing: {
    backgroundColor: "transparent",
    borderColor: "#E5E5E5",
    borderRadius: 999,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  orbitLayer: {
    alignItems: "center",
    justifyContent: "flex-start",
    position: "absolute",
  },
  orbitDot: {
    backgroundColor: colors.text,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 4,
    height: 22,
    width: 22,
  },
  timerCore: {
    alignItems: "center",
    backgroundColor: colors.primaryGradientStart,
    borderRadius: 999,
    gap: spacing.sm,
    height: "76%",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    position: "relative",
    width: "76%",
  },
  timerRunningState: {
    alignItems: "center",
    gap: spacing.sm,
    left: 0,
    position: "absolute",
    right: 0,
  },
  timerMainPressable: {
    alignItems: "center",
    gap: spacing.sm,
  },
  timerPausedState: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  pauseResumeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerOverline: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  timerValue: {
    color: colors.surface,
    fontSize: 58,
    fontWeight: "800",
    letterSpacing: -2.4,
    lineHeight: 58,
  },
  pauseCenterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pauseIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  pauseTimeValue: {
    color: colors.surface,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  pauseLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  endWorkoutButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  endWorkoutButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  activeBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  activeBadgeText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  metricsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    width: "100%",
  },
  metricBlock: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "#EBEBEB",
    borderColor: "#D9D9D9",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 72,
  },
  pauseButtonDisabled: {
    backgroundColor: "#B8B8B8",
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  timelineHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  timelineToggle: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  timelineEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  currentStepContainer: {
    borderRadius: 24,
  },
  stepCard: {
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 88,
    paddingVertical: spacing.xs,
  },
  stepCardPast: {
    opacity: 0.72,
  },
  stepCardCurrent: {
    backgroundColor: colors.primaryGradientStart,
    borderRadius: 24,
    padding: spacing.md,
  },
  stepLeading: {
    alignItems: "center",
    width: 30,
  },
  stepIndexBadge: {
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stepIndexBadgePast: {
    backgroundColor: colors.text,
  },
  stepIndexBadgeCurrent: {
    backgroundColor: colors.surface,
  },
  stepIndexText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  stepIndexTextCurrent: {
    color: colors.text,
  },
  stepConnector: {
    backgroundColor: "#ECECEC",
    borderRadius: 999,
    flex: 1,
    marginTop: 8,
    width: 2,
  },
  stepConnectorPast: {
    backgroundColor: "#CDCDCD",
  },
  stepBody: {
    flex: 1,
    gap: 8,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  stepTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  stepTitleCurrent: {
    color: colors.surface,
  },
  stepTitleFuture: {
    color: colors.textMuted,
  },
  stepState: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  stepStateCurrent: {
    color: "rgba(255,255,255,0.62)",
  },
  stepStatePast: {
    color: colors.text,
  },
  stepDuration: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  stepDurationCurrent: {
    color: "rgba(255,255,255,0.86)",
  },
  stepDurationFuture: {
    color: "#989898",
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    height: 6,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
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
