import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ChronoProgressRing } from "../components/chrono/ChronoProgressRing";
import { FinishedWorkoutView } from "../components/chrono/FinishedWorkoutView";
import { StepTimelineSheet } from "../components/chrono/StepTimelineSheet";
import { BackButton } from "../components/navigation/BackButton";
import { formatDurationFromSeconds, useProgramsStore } from "../features/programs";
import {
  addWatchCommandListener,
  buildWatchHistorySnapshot,
  buildWatchProgramsSnapshot,
  publishWatchSession,
  WatchWorkoutSnapshot,
} from "../features/watch-sync";
import { colors, radius, spacing, useThemePalette, useThemePreferences } from "../theme";
import { SquircleButton } from "../ui/Squircle";

type WorkoutVisualState = "idle" | "running" | "paused" | "finished";

export default function ChronoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const { isDarkMode } = useThemePreferences();
  const { autoStart, courseId, programId, weekIndex } = useLocalSearchParams<{
    autoStart?: string;
    courseId?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const { getProgramById, programs, saveCourseProgress, selectedProgramId, setCourseCompleted } =
    useProgramsStore();
  const programsSnapshot = useMemo(
    () => buildWatchProgramsSnapshot(programs, selectedProgramId),
    [programs, selectedProgramId],
  );
  const historySnapshot = useMemo(() => buildWatchHistorySnapshot(programs), [programs]);

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
  const [isStepSheetOpen, setIsStepSheetOpen] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [isFinishTransitioning, setIsFinishTransitioning] = useState(false);
  const [isLaunchAnimating, setIsLaunchAnimating] = useState(false);
  const [isLaunchInterludeVisible, setIsLaunchInterludeVisible] = useState(false);
  const previousCourseIdRef = useRef<string | undefined>(undefined);
  const allowNavigationRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const hasAnimatedChronoEntranceRef = useRef(false);
  const hasAppliedAutoStartRef = useRef<string | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseBackdropAnim = useRef(new Animated.Value(0)).current;
  const stepLabelTranslate = useRef(new Animated.Value(0)).current;
  const stepLabelOpacity = useRef(new Animated.Value(1)).current;
  const stepIconTranslate = useRef(new Animated.Value(0)).current;
  const stepIconOpacity = useRef(new Animated.Value(1)).current;
  const footerHintTranslate = useRef(new Animated.Value(0)).current;
  const footerHintOpacity = useRef(new Animated.Value(1)).current;
  const swipeHintOpacity = useRef(new Animated.Value(0.28)).current;
  const swipeHintTranslateY = useRef(new Animated.Value(0)).current;
  const playPressScale = useRef(new Animated.Value(1)).current;
  const playFadeOpacity = useRef(new Animated.Value(1)).current;
  const launchScreenOpacity = useRef(new Animated.Value(1)).current;
  const launchContentOpacity = useRef(new Animated.Value(1)).current;
  const chronoInterfaceOpacity = useRef(new Animated.Value(1)).current;
  const chronoInterfaceScale = useRef(new Animated.Value(1)).current;
  const finishTransitionOpacity = useRef(new Animated.Value(1)).current;
  const finishTransitionScale = useRef(new Animated.Value(1)).current;
  const finishedScreenOpacity = useRef(new Animated.Value(0)).current;
  const finishedScreenScale = useRef(new Animated.Value(0.9)).current;

  const currentStep = course?.steps[currentStepIndex];
  const advanceToNextStep = useCallback(
    (reason: "auto" | "skip" = "auto") => {
      if (!course) {
        return;
      }

      const nextStep = course.steps[currentStepIndex + 1];

      if (nextStep) {
        setCurrentStepIndex((index) => index + 1);
        setRemainingSeconds(nextStep.durationSeconds);

        if (reason === "skip") {
          triggerSkipHaptic();
        }
        return;
      }

      setRemainingSeconds(0);
      setIsRunning(false);
      setIsStepSheetOpen(false);
      setHasFinished(true);
      setIsFinishTransitioning(true);
      finishTransitionOpacity.setValue(1);
      finishTransitionScale.setValue(1);
      finishedScreenOpacity.setValue(0);
      finishedScreenScale.setValue(0.9);

      Animated.parallel([
        Animated.timing(finishTransitionOpacity, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(finishTransitionScale, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
          toValue: 0.96,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(finishedScreenOpacity, {
              duration: 260,
              easing: Easing.out(Easing.cubic),
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.timing(finishedScreenScale, {
              duration: 300,
              easing: Easing.out(Easing.cubic),
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsFinishTransitioning(false);
          });
        }, 500);
      });

      if (reason === "skip") {
        triggerSkipHaptic();
      }
    },
    [course, currentStepIndex],
  );

  useEffect(() => {
    if (!course) {
      return;
    }

    const isSameCourse = previousCourseIdRef.current === course.id;
    previousCourseIdRef.current = course.id;

    if (isSameCourse && hasFinished) {
      return;
    }

    hasCompletedRef.current = false;
    setHasStarted(Boolean(course.progress));
    setIsCountdownActive(false);
    setCountdownValue(3);
    setIsRunning(false);
    setCurrentStepIndex(course.progress?.currentStepIndex ?? 0);
    setRemainingSeconds(course.progress?.remainingSeconds ?? course.steps[0]?.durationSeconds ?? 0);
    setIsStepSheetOpen(false);
    setHasFinished(false);
    setIsFinishTransitioning(false);
    setIsLaunchAnimating(false);
    setIsLaunchInterludeVisible(false);
    hasAnimatedChronoEntranceRef.current = Boolean(course.progress);
    playPressScale.setValue(1);
    playFadeOpacity.setValue(1);
    launchScreenOpacity.setValue(1);
    launchContentOpacity.setValue(course.progress ? 1 : 0);
    chronoInterfaceOpacity.setValue(1);
    chronoInterfaceScale.setValue(1);
    finishTransitionOpacity.setValue(1);
    finishTransitionScale.setValue(1);
    finishedScreenOpacity.setValue(0);
    finishedScreenScale.setValue(0.9);
  }, [course]);

  useEffect(() => {
    if (!course || autoStart !== "true" || course.progress || hasStarted || isCountdownActive || hasFinished) {
      return;
    }

    if (hasAppliedAutoStartRef.current === course.id) {
      return;
    }

    hasAppliedAutoStartRef.current = course.id;
    hasAnimatedChronoEntranceRef.current = false;
    setIsLaunchAnimating(false);
    setIsLaunchInterludeVisible(false);
    launchScreenOpacity.setValue(0);
    launchContentOpacity.setValue(1);
    chronoInterfaceOpacity.setValue(0);
    chronoInterfaceScale.setValue(0.94);
    setCountdownValue(3);
    setIsCountdownActive(true);
  }, [
    autoStart,
    chronoInterfaceOpacity,
    chronoInterfaceScale,
    course,
    hasFinished,
    hasStarted,
    isCountdownActive,
    launchContentOpacity,
    launchScreenOpacity,
  ]);

  useEffect(() => {
    if (!course || !isRunning || hasFinished) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (remainingSeconds > 1) {
        setRemainingSeconds((current) => current - 1);
        return;
      }

      advanceToNextStep("auto");
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [advanceToNextStep, course, hasFinished, isRunning, remainingSeconds]);

  useEffect(() => {
    if (!hasFinished || !program || !week || !course || hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    setCourseCompleted(program.id, week.index, course.id, true);
    saveCourseProgress(program.id, week.index, course.id, undefined);
  }, [course, hasFinished, program, saveCourseProgress, setCourseCompleted, week]);

  useEffect(() => {
    if (!isCountdownActive) {
      return;
    }

    countdownTimerRef.current = setTimeout(() => {
      setCountdownValue((current) => {
        if (current <= 1) {
          hasAnimatedChronoEntranceRef.current = false;
          chronoInterfaceOpacity.setValue(0);
          chronoInterfaceScale.setValue(0.94);
          setIsCountdownActive(false);
          setHasStarted(true);
          setIsRunning(true);
          triggerStartHaptic();
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
  }, [chronoInterfaceOpacity, chronoInterfaceScale, countdownValue, isCountdownActive]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, []);

  const elapsedCourseSeconds =
    course?.steps
      .slice(0, currentStepIndex)
      .reduce((total, step) => total + step.durationSeconds, 0) ?? 0;
  const activeStep = currentStep;
  const completedCourseSeconds = activeStep
    ? elapsedCourseSeconds + Math.max(activeStep.durationSeconds - remainingSeconds, 0)
    : elapsedCourseSeconds;
  const progressPercent = activeStep?.durationSeconds
    ? ((activeStep.durationSeconds - remainingSeconds) / activeStep.durationSeconds) * 100
    : 0;
  const visualState: WorkoutVisualState = hasFinished
    ? "finished"
    : !hasStarted
      ? "idle"
      : isRunning
        ? "running"
        : "paused";
  const currentStepLabel = activeStep ? (activeStep.type === "walk" ? "Walk" : "Run") : "Run";
  const secondaryLabel = hasFinished
    ? "Workout complete"
    : `Step ${Math.min(currentStepIndex + 1, course?.steps.length ?? 1)}/${course?.steps.length ?? 1}`;
  const footerHint = hasFinished
    ? "Session complete"
    : visualState === "running"
      ? "Tap to pause"
      : visualState === "paused"
        ? "Tap to play"
        : "Tap to play";
  const overallDurationLabel = formatClock(completedCourseSeconds);
  const canSkip = !hasFinished && Boolean(course?.steps[currentStepIndex + 1] || currentStep);
  const isWorkoutActive = hasStarted || isCountdownActive;
  const isIdleLaunchState = !hasStarted && !isCountdownActive;
  const shouldShowLaunchScreen = isIdleLaunchState && !isLaunchInterludeVisible;
  const shouldShowWorkoutScreen = !hasFinished && !shouldShowLaunchScreen && !isLaunchInterludeVisible;
  const shouldShowCountdownOnly = shouldShowWorkoutScreen && isCountdownActive;
  const shouldShowChronoInterface = shouldShowWorkoutScreen && !isCountdownActive;
  const shouldRenderWorkoutContent = (!hasFinished && !isLaunchInterludeVisible) || isFinishTransitioning;
  const shouldWarnBeforeLeaving =
    !hasFinished && (hasStarted || isCountdownActive || isLaunchAnimating || isLaunchInterludeVisible);
  const stepIconName = activeStep?.type === "walk" ? "walk" : "run-fast";
  const previousStepLabelRef = useRef(currentStepLabel);
  const previousStepIconRef = useRef(stepIconName);
  const previousFooterHintRef = useRef(footerHint);

  useEffect(() => {
    Animated.timing(pauseBackdropAnim, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: !hasFinished && visualState === "paused" ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [hasFinished, pauseBackdropAnim, visualState]);

  useEffect(() => {
    if (!isWorkoutActive) {
      previousStepLabelRef.current = currentStepLabel;
      previousStepIconRef.current = stepIconName;
      return;
    }

    if (
      previousStepLabelRef.current === currentStepLabel &&
      previousStepIconRef.current === stepIconName
    ) {
      return;
    }

    stepLabelTranslate.setValue(10);
    stepLabelOpacity.setValue(0);
    stepIconTranslate.setValue(10);
    stepIconOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(stepLabelTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(stepLabelOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(stepIconTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(stepIconOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    previousStepLabelRef.current = currentStepLabel;
    previousStepIconRef.current = stepIconName;
  }, [
    currentStepLabel,
    isWorkoutActive,
    stepIconName,
    stepIconOpacity,
    stepIconTranslate,
    stepLabelOpacity,
    stepLabelTranslate,
  ]);

  useEffect(() => {
    if (previousFooterHintRef.current === footerHint) {
      return;
    }

    footerHintTranslate.setValue(10);
    footerHintOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(footerHintTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(footerHintOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    previousFooterHintRef.current = footerHint;
  }, [footerHint, footerHintOpacity, footerHintTranslate]);

  useEffect(() => {
    if (!isIdleLaunchState) {
      swipeHintOpacity.stopAnimation();
      swipeHintTranslateY.stopAnimation();
      swipeHintOpacity.setValue(0.28);
      swipeHintTranslateY.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(swipeHintOpacity, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.6,
            useNativeDriver: true,
          }),
          Animated.timing(swipeHintOpacity, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.22,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(swipeHintTranslateY, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            toValue: -4,
            useNativeDriver: true,
          }),
          Animated.timing(swipeHintTranslateY, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isIdleLaunchState, swipeHintOpacity, swipeHintTranslateY]);

  usePreventRemove(shouldWarnBeforeLeaving, ({ data }) => {
    if (allowNavigationRef.current) {
      allowNavigationRef.current = false;
      navigation.dispatch(data.action);
      return;
    }

    Alert.alert(
      "Leave workout?",
      "You are about to leave this workout. Do you want to leave or continue the timer?",
      [
        {
          style: "cancel",
          text: "Keep going",
        },
        {
          style: "destructive",
          text: "Leave workout",
          onPress: () => {
            allowNavigationRef.current = true;
            navigation.dispatch(data.action);
          },
        },
      ],
    );
  });

  useEffect(() => {
    if (!shouldShowChronoInterface) {
      return;
    }

    if (hasAnimatedChronoEntranceRef.current) {
      chronoInterfaceOpacity.setValue(1);
      chronoInterfaceScale.setValue(1);
      return;
    }

    hasAnimatedChronoEntranceRef.current = true;
    chronoInterfaceOpacity.setValue(0);
    chronoInterfaceScale.setValue(0.94);

    Animated.parallel([
      Animated.timing(chronoInterfaceOpacity, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(chronoInterfaceScale, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chronoInterfaceOpacity, chronoInterfaceScale, shouldShowChronoInterface]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy < -14 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) + 6,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          gestureState.dy < -14 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) + 6,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -56) {
            setIsStepSheetOpen(true);
            triggerSheetHaptic();
          }
        },
      }),
    [],
  );

  const watchSnapshot = useMemo<WatchWorkoutSnapshot | null>(() => {
    if (!program || !week || !course || !activeStep) {
      return null;
    }

    return {
      countdownValue: isCountdownActive ? countdownValue : 0,
      context: "workout",
      courseName: course.name,
      state:
        hasFinished
          ? "finished"
          : isCountdownActive
            ? "countdown"
            : !hasStarted
              ? "idle"
              : isRunning
                ? "running"
                : "paused",
      updatedAt: new Date().toISOString(),
      courseId: course.id,
      currentStepIndex,
      elapsedSeconds: completedCourseSeconds,
      programId: program.id,
      programName: program.name,
      progressPercent: progressPercent,
      remainingSeconds,
      steps: course.steps,
      stepDurationSeconds: activeStep.durationSeconds,
      stepLabel: currentStepLabel,
      stepType: activeStep.type,
      totalDurationSeconds:
        course.steps.reduce((total, step) => total + step.durationSeconds, 0),
      totalSteps: course.steps.length,
      weekIndex: week.index,
      history: historySnapshot,
      programs: programsSnapshot,
    };
  }, [
    activeStep,
    completedCourseSeconds,
    countdownValue,
    currentStepIndex,
    currentStepLabel,
    hasFinished,
    hasStarted,
    isCountdownActive,
    isRunning,
    remainingSeconds,
    course,
    historySnapshot,
    program,
    programsSnapshot,
    week,
  ]);

  useEffect(() => {
    publishWatchSession(watchSnapshot);
  }, [watchSnapshot]);

  const resetWorkoutState = useCallback(
    (clearSavedProgress = false) => {
      if (!program || !week || !course) {
        return;
      }

      setHasStarted(false);
      setIsCountdownActive(false);
      setCountdownValue(3);
      setIsRunning(false);
      setCurrentStepIndex(0);
      setRemainingSeconds(course.steps[0]?.durationSeconds ?? 0);
      setIsStepSheetOpen(false);
      setHasFinished(false);
      setIsFinishTransitioning(false);
      setIsLaunchAnimating(false);
      setIsLaunchInterludeVisible(false);
      hasAnimatedChronoEntranceRef.current = false;
      hasCompletedRef.current = false;
      playPressScale.setValue(1);
      playFadeOpacity.setValue(1);
      launchScreenOpacity.setValue(1);
      launchContentOpacity.setValue(0);
      chronoInterfaceOpacity.setValue(1);
      chronoInterfaceScale.setValue(1);
      finishTransitionOpacity.setValue(1);
      finishTransitionScale.setValue(1);
      finishedScreenOpacity.setValue(0);
      finishedScreenScale.setValue(0.9);

      if (clearSavedProgress) {
        saveCourseProgress(program.id, week.index, course.id, undefined);
        setCourseCompleted(program.id, week.index, course.id, false);
      }
    },
    [
      chronoInterfaceOpacity,
      chronoInterfaceScale,
      finishTransitionOpacity,
      finishTransitionScale,
      finishedScreenOpacity,
      finishedScreenScale,
      launchContentOpacity,
      launchScreenOpacity,
      playFadeOpacity,
      playPressScale,
      course,
      program,
      week,
      saveCourseProgress,
      setCourseCompleted,
    ],
  );

  const beginCountdownDirectly = useCallback(() => {
    if (hasFinished || isStepSheetOpen || isLaunchAnimating) {
      return;
    }

    hasAnimatedChronoEntranceRef.current = false;
    setIsLaunchAnimating(false);
    setIsLaunchInterludeVisible(false);
    launchScreenOpacity.setValue(0);
    launchContentOpacity.setValue(1);
    chronoInterfaceOpacity.setValue(0);
    chronoInterfaceScale.setValue(0.94);
    setCountdownValue(3);
    setIsCountdownActive(true);
  }, [
    chronoInterfaceOpacity,
    chronoInterfaceScale,
    hasFinished,
    isLaunchAnimating,
    isStepSheetOpen,
    launchContentOpacity,
    launchScreenOpacity,
  ]);

  const handlePrimarySurfacePress = useCallback(() => {
    if (hasFinished || isStepSheetOpen || isLaunchAnimating) {
      return;
    }

    if (!hasStarted && !isCountdownActive) {
      setCountdownValue(3);
      setIsCountdownActive(true);
      return;
    }

    if (isCountdownActive) {
      return;
    }

    setIsRunning((current) => {
      const nextValue = !current;
      if (nextValue) {
        triggerResumeHaptic();
      } else {
        triggerPauseHaptic();
      }
      return nextValue;
    });
  }, [hasFinished, hasStarted, isCountdownActive, isLaunchAnimating, isStepSheetOpen]);

  function handleIdlePlayPressIn() {
    if (!isIdleLaunchState || isLaunchAnimating) {
      return;
    }

    Animated.timing(playPressScale, {
      duration: 110,
      easing: Easing.out(Easing.cubic),
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }

  function handleIdlePlayRelease() {
    if (!isIdleLaunchState || isLaunchAnimating) {
      return;
    }

    setIsLaunchAnimating(true);
    launchContentOpacity.setValue(0);
    hasAnimatedChronoEntranceRef.current = false;

    Animated.parallel([
      Animated.timing(playPressScale, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
        toValue: 1.18,
        useNativeDriver: true,
      }),
      Animated.timing(playFadeOpacity, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(launchScreenOpacity, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        setIsLaunchAnimating(false);
        return;
      }

      setIsLaunchInterludeVisible(true);

      setTimeout(() => {
        launchContentOpacity.setValue(0);
        setCountdownValue(3);
        setIsCountdownActive(true);
        setIsLaunchInterludeVisible(false);

        Animated.timing(launchContentOpacity, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }).start(() => {
          setIsLaunchAnimating(false);
        });
      }, 500);
    });
  }

  function handleExitWorkout() {
    Alert.alert(
      "End workout early?",
      "This workout will not be marked as completed. You can either cancel it completely or save your current progress and resume later.",
      [
        { style: "cancel", text: "Keep going" },
        {
          style: "destructive",
          text: "Cancel workout",
          onPress: () => {
            saveCourseProgress(safeProgram.id, safeWeek.index, safeCourse.id, undefined);
            setCourseCompleted(safeProgram.id, safeWeek.index, safeCourse.id, false);
            allowNavigationRef.current = true;
            router.back();
          },
        },
        {
          text: "Save progress",
          onPress: () => {
            saveCourseProgress(safeProgram.id, safeWeek.index, safeCourse.id, {
              currentStepIndex,
              remainingSeconds,
              savedAt: new Date().toISOString(),
            });
            router.push({
              pathname: "/end-course",
              params: {
                courseId: safeCourse.id,
                partial: "true",
                programId: safeProgram.id,
                weekIndex: String(safeWeek.index),
              },
            });
          },
        },
      ],
    );
  }

  const handleSkipStep = useCallback(() => {
    if (hasFinished) {
      return;
    }

    advanceToNextStep("skip");
  }, [advanceToNextStep, hasFinished]);

  useEffect(() => {
    return addWatchCommandListener((command) => {
      if (command.courseId && command.courseId !== course?.id) {
        return;
      }

      switch (command.action) {
        case "startWorkout":
          if (!hasStarted && !isCountdownActive) {
            beginCountdownDirectly();
          }
          break;
        case "togglePlayback":
          handlePrimarySurfacePress();
          break;
        case "skipStep":
          if (hasStarted && !isCountdownActive && !hasFinished) {
            handleSkipStep();
          }
          break;
        case "resetWorkout":
          resetWorkoutState(true);
          break;
        case "saveProgress":
          if (program && week && course) {
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
          }
          break;
      }
    });
  }, [
    beginCountdownDirectly,
    course,
    currentStepIndex,
    handlePrimarySurfacePress,
    handleSkipStep,
    hasFinished,
    hasStarted,
    isCountdownActive,
    program,
    resetWorkoutState,
    remainingSeconds,
    router,
    saveCourseProgress,
    week,
    course?.id,
  ]);

  if (!program || !week || !course || (!currentStep && !hasFinished)) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
        <View style={styles.fallback}>
          <BackButton />
          <Text style={styles.fallbackTitle}>Chrono unavailable</Text>
          <Text style={styles.fallbackText}>
            The selected course could not be loaded. Return to Home and launch a valid workout.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const safeProgram = program;
  const safeWeek = week;
  const safeCourse = course;

  function handleFinishedNext() {
    // TODO: brancher logique existante si la route ressenti diffère de /end-course.
    allowNavigationRef.current = true;
    router.replace({
      pathname: "/end-course",
      params: {
        courseId: safeCourse.id,
        programId: safeProgram.id,
        weekIndex: String(safeWeek.index),
      },
    });
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.screenPauseOverlay, { opacity: pauseBackdropAnim }]}
      />

      <View
        {...panResponder.panHandlers}
        style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      >
        {shouldShowLaunchScreen ? (
          <Animated.View style={[styles.topBar, { opacity: launchScreenOpacity }]}>
            <BackButton />
            <View style={styles.backPlaceholder} />
          </Animated.View>
        ) : shouldShowChronoInterface ? (
          <Animated.View style={[styles.topBar, { opacity: launchContentOpacity }]}>
            <View style={styles.backPlaceholder} />
            <SquircleButton
              onPress={() => setIsStepSheetOpen(true)}
              style={[
                styles.topSheetButton,
                {
                  backgroundColor: isDarkMode ? "rgba(38,38,38,0.9)" : "rgba(255,255,255,0.72)",
                  borderColor: isDarkMode ? "rgba(82,82,82,0.36)" : palette.border,
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[styles.controlOverlay, styles.topSheetButtonOverlay, { opacity: pauseBackdropAnim }]}
              />
              <View style={styles.controlContent}>
                <Ionicons color={palette.text} name="reorder-three-outline" size={22} />
              </View>
            </SquircleButton>
          </Animated.View>
        ) : (
          <View style={styles.topBar}>
            <View style={styles.backPlaceholder} />
            <View style={styles.backPlaceholder} />
          </View>
        )}

        {shouldRenderWorkoutContent ? (
          <>
            <Animated.View
              style={{
                flex: 1,
                opacity: finishTransitionOpacity,
                transform: [{ scale: finishTransitionScale }],
              }}
            >
              <Pressable
                onPress={shouldShowLaunchScreen ? undefined : handlePrimarySurfacePress}
                style={styles.mainSurface}
              >
                {shouldShowLaunchScreen ? (
                  <Animated.View style={[styles.launchScreen, { opacity: launchScreenOpacity }]}>
                    <View style={[styles.heroHeader, styles.heroHeaderIdle]}>
                      <MaterialCommunityIcons color={colors.text} name="run-fast" size={72} />
                      <Text style={styles.courseTitle}>{safeCourse.name}</Text>
                      <Text style={styles.courseSubtitle}>de {safeProgram.name}</Text>
                    </View>

                    <View style={styles.idlePlaySection}>
                      <Animated.View
                        pointerEvents="box-none"
                        style={{
                          opacity: playFadeOpacity,
                          transform: [{ scale: playPressScale }],
                        }}
                      >
                        <Pressable
                          accessibilityRole="button"
                          hitSlop={20}
                          onPressIn={handleIdlePlayPressIn}
                          onPressOut={handleIdlePlayRelease}
                          style={styles.idlePlayButton}
                        >
                          <Ionicons
                            color={palette.textMuted}
                            name="play"
                            size={172}
                            style={styles.idlePlayIcon}
                          />
                        </Pressable>
                      </Animated.View>
                    </View>

                    <View style={[styles.footerMeta, styles.footerMetaIdle]}>
                      <Text style={styles.secondaryHint}>Tap to play</Text>
                    </View>
                  </Animated.View>
                ) : null}

                {shouldShowWorkoutScreen || isFinishTransitioning ? (
                  <Animated.View style={[styles.workoutScreen, { opacity: launchContentOpacity }]}>
                    {shouldShowCountdownOnly ? (
                      <View style={styles.countdownWrap}>
                        <Text style={styles.countdownValue}>{countdownValue}</Text>
                      </View>
                    ) : (
                      <Animated.View
                        style={{
                          opacity: chronoInterfaceOpacity,
                          transform: [{ scale: chronoInterfaceScale }],
                          width: "100%",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View style={styles.heroHeader}>
                          <Animated.View
                            style={{
                              opacity: stepIconOpacity,
                              transform: [{ translateY: stepIconTranslate }],
                            }}
                          >
                            <MaterialCommunityIcons
                              color={palette.textMuted}
                              name={stepIconName}
                              size={42}
                            />
                          </Animated.View>
                          <Animated.Text
                            style={[
                              styles.stepHeaderLabel,
                              {
                                opacity: stepLabelOpacity,
                                transform: [{ translateY: stepLabelTranslate }],
                              },
                            ]}
                          >
                            {currentStepLabel}
                          </Animated.Text>
                        </View>

                        <View style={styles.chronoBlock}>
                          <ChronoProgressRing
                            progressPercent={clamp(progressPercent, 0, 100)}
                            secondaryLabel={secondaryLabel}
                            timeLabel={formatClock(remainingSeconds)}
                            visualState={visualState === "finished" ? "running" : visualState}
                          />
                        </View>

                        <Animated.View style={styles.footerMeta}>
                          {isWorkoutActive ? (
                            <Text style={styles.secondaryTime}>{overallDurationLabel}</Text>
                          ) : null}
                          <Animated.Text
                            style={[
                              styles.secondaryHint,
                              visualState === "paused" && styles.secondaryHintPaused,
                              {
                                opacity: footerHintOpacity,
                                transform: [{ translateY: footerHintTranslate }],
                              },
                            ]}
                          >
                            {footerHint}
                          </Animated.Text>
                          {isWorkoutActive ? (
                            <Text style={styles.elapsedLabel}>
                              {activeStep ? formatDurationFromSeconds(activeStep.durationSeconds) : ""}
                            </Text>
                          ) : null}
                        </Animated.View>
                      </Animated.View>
                    )}
                  </Animated.View>
                ) : null}
              </Pressable>

              {shouldShowLaunchScreen && !isLaunchAnimating ? (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.swipeHintWrap, { opacity: launchScreenOpacity }]}
                >
                  <Animated.View
                    style={{
                      opacity: swipeHintOpacity,
                      transform: [{ translateY: swipeHintTranslateY }],
                    }}
                  >
                    <Ionicons color={palette.textMuted} name="chevron-up" size={18} />
                  </Animated.View>
                  <Text style={styles.swipeHintText}>Swipe vers le haut pour plus de details</Text>
                </Animated.View>
              ) : null}

              {shouldShowChronoInterface || isFinishTransitioning ? (
                <Animated.View style={[styles.bottomActions, { opacity: launchContentOpacity }]}>
                  <SquircleButton
                    onPress={handleExitWorkout}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.controlOverlay, styles.actionButtonOverlay, { opacity: pauseBackdropAnim }]}
                    />
                    <View style={styles.controlContent}>
                      <Ionicons color={palette.text} name="stop" size={22} />
                    </View>
                  </SquircleButton>

                  <SquircleButton
                    disabled={!canSkip}
                    onPress={handleSkipStep}
                    style={[
                      styles.actionButton,
                      styles.actionButtonSecondary,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      },
                      !canSkip && styles.actionButtonDisabled,
                    ]}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.controlOverlay, styles.actionButtonOverlay, { opacity: pauseBackdropAnim }]}
                    />
                    <View style={styles.controlContent}>
                      <Ionicons color={palette.text} name="play-skip-forward" size={24} />
                    </View>
                  </SquircleButton>
                </Animated.View>
              ) : null}
            </Animated.View>
          </>
        ) : null}

        {(hasFinished || isFinishTransitioning) ? (
          <Animated.View
            pointerEvents={hasFinished && !isFinishTransitioning ? "auto" : "none"}
            style={[
              styles.finishedScreenWrap,
              {
                opacity: finishedScreenOpacity,
                transform: [{ scale: finishedScreenScale }],
              },
            ]}
          >
            <FinishedWorkoutView onNext={handleFinishedNext} />
          </Animated.View>
        ) : null}
      </View>

      <StepTimelineSheet
        completedStepsCount={currentStepIndex}
        currentStepIndex={currentStepIndex}
        onClose={() => setIsStepSheetOpen(false)}
        progressPercent={clamp(progressPercent, 0, 100)}
        steps={safeCourse.steps}
        visible={isStepSheetOpen && !hasFinished}
      />
    </SafeAreaView>
  );
}

async function triggerStartHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore haptic failures to keep the workout flow responsive.
  }
}

async function triggerPauseHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore haptic failures to keep the workout flow responsive.
  }
}

async function triggerResumeHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore haptic failures to keep the workout flow responsive.
  }
}

async function triggerSkipHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore haptic failures to keep the workout flow responsive.
  }
}

async function triggerSheetHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore haptic failures to keep the workout flow responsive.
  }
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  screenPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31,31,31,0.12)",
    zIndex: 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    zIndex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    zIndex: 1,
  },
  backPlaceholder: {
    height: 44,
    width: 44,
  },
  topSheetButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  topSheetButtonOverlay: {
    backgroundColor: "rgba(94,94,94,0.32)",
    borderColor: "rgba(170,170,170,0.24)",
    borderRadius: 999,
    borderWidth: 1,
  },
  mainSurface: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
    zIndex: 1,
  },
  launchScreen: {
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  workoutScreen: {
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  finishedScreenWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  heroHeader: {
    alignItems: "center",
    gap: 2,
    minHeight: 116,
    justifyContent: "center",
  },
  heroHeaderIdle: {
    gap: 0,
    minHeight: 190,
  },
  courseTitle: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1.8,
    lineHeight: 52,
    textAlign: "center",
  },
  courseSubtitle: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  stepHeaderLabel: {
    color: colors.textMuted,
    fontSize: 30,
    fontWeight: "500",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  countdownWrap: {
    alignItems: "center",
    bottom: 100,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  chronoBlock: {
    marginTop: 0,
  },
  idlePlaySection: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 100,
    left: 0,
    right: 0,
  },
  idlePlayButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  idlePlayIcon: {
    marginLeft: 8,
  },
  countdownValue: {
    color: colors.text,
    fontSize: 176,
    fontWeight: "800",
    letterSpacing: -8,
    lineHeight: 180,
  },
  footerMeta: {
    alignItems: "center",
    gap: 6,
    position: "absolute",
    bottom: spacing.xl,
  },
  footerMetaIdle: {
    bottom: 220,
    gap: 0,
  },
  secondaryTime: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  secondaryHint: {
    color: colors.textMuted,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  secondaryHintPaused: {
    color: colors.textMuted,
  },
  elapsedLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingTop: spacing.sm,
    zIndex: 1,
  },
  swipeHintWrap: {
    alignItems: "center",
    bottom: 0,
    gap: 6,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 1,
  },
  swipeHintText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: -0.1,
    opacity: 0.42,
    textAlign: "center",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 120,
  },
  actionButtonOverlay: {
    backgroundColor: "rgba(108,108,108,0.28)",
    borderColor: "rgba(182,182,182,0.24)",
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  actionButtonSecondary: {
    marginLeft: 0,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  controlOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controlContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  fallback: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  fallbackTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
});
