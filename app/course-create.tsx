import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  LayoutAnimation,
  LayoutAnimationConfig,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayOfWeek, StepType, getDayName, useProgramsStore } from "../features/programs";
import { colors, radius, spacing } from "../theme";
import { ActionCardButton } from "../ui/ActionCardButton";
import { SquircleButton, SquircleView } from "../ui/Squircle";

type DraftStep = {
  id: string;
  type: StepType;
  durationMinutes: number;
};

type BuilderItem =
  | {
      id: string;
      kind: "step";
      step: DraftStep;
    }
  | {
      id: string;
      kind: "loop";
      repeatCount: number;
      steps: DraftStep[];
    };

type ChoiceType = "step" | "loop";

type LayoutBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const LONG_PRESS_DURATION_MS = 220;
const MOVE_TOLERANCE = 18;
const SIDE_SELECTION_DEADZONE = 14;
const DELETE_ACTION_WIDTH = 118;
const DELETE_OPEN_THRESHOLD = DELETE_ACTION_WIDTH * 0.18;
const DELETE_TRIGGER_THRESHOLD = DELETE_ACTION_WIDTH * 1.55;
const DELETE_MAX_SWIPE = Dimensions.get("window").width;
const DELETE_CLOSE_THRESHOLD = DELETE_ACTION_WIDTH * 0.72;
const DURATION_REPEAT_INITIAL_DELAY_MS = 260;
const DURATION_REPEAT_INTERVAL_MS = 90;
const CARD_RADIUS = 24;
const AnimatedSquircleView = Animated.createAnimatedComponent(SquircleView);

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CourseCreateScreen() {
  const router = useRouter();
  const { courseId, draft, dayOfWeek, programId, weekIndex } = useLocalSearchParams<{
    courseId?: string;
    draft?: string;
    dayOfWeek?: string;
    programId?: string;
    weekIndex?: string;
  }>();
  const {
    addCourseToDraft,
    getProgramById,
    programDraft,
    updateCourseInDraft,
    updateCourseInProgram,
  } = useProgramsStore();

  const isDraftFlow = draft === "true";
  const parsedWeekIndex = Number(weekIndex);
  const parsedDayOfWeek = Number(dayOfWeek) as DayOfWeek;
  const savedProgram = programId ? getProgramById(programId) : undefined;
  const sourceWeek = isDraftFlow
    ? programDraft.weeks.find((week) => week.index === parsedWeekIndex)
    : savedProgram?.weeks.find((week) => week.index === parsedWeekIndex);
  const editingCourse = courseId
    ? sourceWeek?.courses.find((course) => course.id === courseId)
    : undefined;
  const isEditing = Boolean(editingCourse);

  const [items, setItems] = useState<BuilderItem[]>(() =>
    editingCourse ? groupExistingSteps(editingCourse.steps) : [],
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [highlightedChoice, setHighlightedChoice] = useState<ChoiceType | null>(null);
  const [plusBounds, setPlusBounds] = useState<LayoutBox | null>(null);
  const [stepBounds, setStepBounds] = useState<LayoutBox | null>(null);
  const [loopBounds, setLoopBounds] = useState<LayoutBox | null>(null);
  const [isSwipingItem, setIsSwipingItem] = useState(false);
  const [animatedItemId, setAnimatedItemId] = useState<string | null>(null);
  const [animatedLoopStepId, setAnimatedLoopStepId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedLoopId, setExpandedLoopId] = useState<string | null>(null);
  const initialItemsSnapshot = useRef(
    serializeBuilderItems(editingCourse ? groupExistingSteps(editingCourse.steps) : []),
  );

  const plusWrapRef = useRef<View | null>(null);
  const stepChoiceRef = useRef<View | null>(null);
  const loopChoiceRef = useRef<View | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const selectionArmed = useRef(false);
  const highlightedChoiceRef = useRef<ChoiceType | null>(null);
  const menuProgress = useRef(new Animated.Value(0)).current;
  const plusPressProgress = useRef(new Animated.Value(0)).current;
  const hasUnsavedChanges = serializeBuilderItems(items) !== initialItemsSnapshot.current;

  useEffect(() => {
    return () => {
      clearLongPressTimer(longPressTimer);
    };
  }, []);

  useEffect(() => {
    Animated.timing(menuProgress, {
      duration: menuVisible ? 180 : 140,
      toValue: menuVisible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [menuProgress, menuVisible]);

  useEffect(() => {
    Animated.spring(plusPressProgress, {
      damping: 16,
      mass: 0.7,
      stiffness: 240,
      toValue: menuVisible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, plusPressProgress]);

  if (
    Number.isNaN(parsedWeekIndex) ||
    Number.isNaN(parsedDayOfWeek) ||
    (!isDraftFlow && !savedProgram)
  ) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
        <View style={styles.invalidState}>
          <Text style={styles.heroTitle}>Create</Text>
          <Text style={styles.heroSubtitle}>course</Text>
          <Text style={styles.invalidText}>
            This screen needs a valid week/day context from a program.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  function addItem(choice: ChoiceType) {
    const nextItem = choice === "step" ? createStepItem(items.length) : createLoopItem(items.length);

    setAnimatedItemId(nextItem.id);
    setItems((current) => [...current, nextItem]);
  }

  function handleCreateCourse() {
    if (items.length === 0) {
      Alert.alert("No items yet", "Add at least one step or one loop before saving the course.");
      return;
    }

    const payload = {
      dayOfWeek: parsedDayOfWeek,
      weekIndex: parsedWeekIndex,
      steps: flattenBuilderItems(items).map((step) => ({
        type: step.type,
        durationSeconds: step.durationMinutes * 60,
      })),
    };

    if (editingCourse) {
      if (isDraftFlow) {
        updateCourseInDraft({
          ...payload,
          courseId: editingCourse.id,
        });
      } else if (savedProgram) {
        updateCourseInProgram(savedProgram.id, {
          ...payload,
          courseId: editingCourse.id,
        });
      }
    } else {
      addCourseToDraft(payload);
    }

    router.back();
  }

  function handleClose() {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    Alert.alert(
      "Discard changes?",
      "No changes will be saved if you leave this screen now.",
      [
        { style: "cancel", text: "Keep editing" },
        {
          style: "destructive",
          text: "Discard",
          onPress: () => router.back(),
        },
      ],
    );
  }

  function removeItem(itemId: string) {
    LayoutAnimation.configureNext({
      duration: 240,
      update: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function removeLoopStep(itemId: string, stepId: string) {
    LayoutAnimation.configureNext({
      duration: 240,
      update: {
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "loop"
          ? {
              ...item,
              steps: item.steps.filter((step) => step.id !== stepId),
            }
          : item,
      ),
    );
    setExpandedStepId((current) => (current === stepId ? null : current));
  }

  function handleStepPress(itemId: string) {
    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId((current) => (current === itemId ? null : itemId));
  }

  function handleStepTypeChange(itemId: string, type: StepType) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "step"
          ? {
              ...item,
              step: {
                ...item.step,
                type,
              },
            }
          : item,
      ),
    );
  }

  function handleStepDurationChange(itemId: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "step"
          ? {
              ...item,
              step: {
                ...item.step,
                durationMinutes: Math.max(1, item.step.durationMinutes + delta),
              },
            }
          : item,
      ),
    );
  }

  function handleDuplicateStep(itemId: string) {
    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId(null);

    setTimeout(() => {
      let duplicatedItemId: string | null = null;

      LayoutAnimation.configureNext(getBouncyLayoutAnimation());
      setItems((current) => {
        const itemIndex = current.findIndex((item) => item.id === itemId && item.kind === "step");

        if (itemIndex === -1) {
          return current;
        }

        const sourceItem = current[itemIndex] as Extract<BuilderItem, { kind: "step" }>;
        const duplicatedItem: Extract<BuilderItem, { kind: "step" }> = {
          id: createBuilderId("step"),
          kind: "step",
          step: {
            ...sourceItem.step,
            id: createBuilderId(`draft-${sourceItem.step.type}`),
          },
        };

        duplicatedItemId = duplicatedItem.id;

        return [
          ...current.slice(0, itemIndex + 1),
          duplicatedItem,
          ...current.slice(itemIndex + 1),
        ];
      });

      if (duplicatedItemId) {
        setAnimatedItemId(duplicatedItemId);
      }
    }, 300);
  }

  function handleLoopStepPress(stepId: string) {
    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId((current) => (current === stepId ? null : stepId));
  }

  function handleLoopStepTypeChange(itemId: string, stepIndex: number, type: StepType) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId || item.kind !== "loop") {
          return item;
        }

        const nextSteps = item.steps.map((step, index) =>
          index === stepIndex
            ? {
                ...step,
                type,
              }
            : step,
        );

        return {
          ...item,
          steps: nextSteps,
        };
      }),
    );
  }

  function handleLoopStepDurationChange(itemId: string, stepIndex: number, delta: number) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId || item.kind !== "loop") {
          return item;
        }

        const nextSteps = item.steps.map((step, index) =>
          index === stepIndex
            ? {
                ...step,
                durationMinutes: Math.max(1, step.durationMinutes + delta),
              }
            : step,
        );

        return {
          ...item,
          steps: nextSteps,
        };
      }),
    );
  }

  function addStepToLoop(itemId: string) {
    let nextStepId: string | null = null;

    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "loop"
          ? {
              ...item,
              steps: [
                ...item.steps,
                (() => {
                  const nextStep = createDraftStep("walk", 1);
                  nextStepId = nextStep.id;
                  return nextStep;
                })(),
              ],
            }
          : item,
      ),
    );

    if (nextStepId) {
      setAnimatedLoopStepId(nextStepId);
    }
  }

  function handleLoopRepeatCountChange(itemId: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "loop"
          ? {
              ...item,
              repeatCount: Math.max(1, Math.min(12, item.repeatCount + delta)),
            }
          : item,
      ),
    );
  }

  function startSelection(x: number, y: number) {
    gestureStart.current = { x, y };
    selectionArmed.current = false;
    clearLongPressTimer(longPressTimer);
    longPressTimer.current = setTimeout(() => {
      selectionArmed.current = true;
      setMenuVisible(true);
      triggerSelectionHaptic();
    }, LONG_PRESS_DURATION_MS);
  }

  function updateHighlightedChoice(x: number, y: number) {
    const nextChoice = getChoiceAtPoint(x, y, plusBounds, stepBounds, loopBounds);

    if (nextChoice && nextChoice !== highlightedChoiceRef.current) {
      triggerOptionSelectionHaptic();
    }

    highlightedChoiceRef.current = nextChoice;
    setHighlightedChoice(nextChoice);
  }

  function cancelSelection() {
    clearLongPressTimer(longPressTimer);
    gestureStart.current = null;
    selectionArmed.current = false;
    highlightedChoiceRef.current = null;
    setMenuVisible(false);
    setHighlightedChoice(null);
  }

  function finishSelection(x: number, y: number) {
    const shouldCommit = selectionArmed.current;
    const choice =
      getChoiceAtPoint(x, y, plusBounds, stepBounds, loopBounds) ?? highlightedChoice;

    cancelSelection();

    if (shouldCommit && choice) {
      addItem(choice);
    }
  }

  function handleAbsoluteLayout(
    targetRef: RefObject<View | null>,
    setter: (layout: LayoutBox | null) => void,
  ) {
    requestAnimationFrame(() => {
      targetRef.current?.measureInWindow((x, y, width, height) => {
        setter({ height, width, x, y });
      });
    });
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (event) => {
      const { pageX, pageY } = event.nativeEvent;

      if (!plusBounds || !pointIsInsideBox(pageX, pageY, plusBounds)) {
        return;
      }

      startSelection(pageX, pageY);
    },
    onPanResponderMove: (event) => {
      const { pageX, pageY } = event.nativeEvent;

      if (!gestureStart.current) {
        return;
      }

      if (!selectionArmed.current) {
        const distance = getDistance(gestureStart.current, { x: pageX, y: pageY });

        if (distance > MOVE_TOLERANCE) {
          cancelSelection();
        }

        return;
      }

      updateHighlightedChoice(pageX, pageY);
    },
    onPanResponderRelease: (event) => {
      const { pageX, pageY } = event.nativeEvent;

      if (!gestureStart.current) {
        cancelSelection();
        return;
      }

      finishSelection(pageX, pageY);
    },
    onPanResponderTerminate: cancelSelection,
    onStartShouldSetPanResponder: (event) => {
      const { pageX, pageY } = event.nativeEvent;

      return Boolean(plusBounds && pointIsInsideBox(pageX, pageY, plusBounds));
    },
  });

  const contextLabel = `${(isDraftFlow ? programDraft.name : savedProgram?.name) || "Untitled program"} • Week ${parsedWeekIndex} • ${getDayName(parsedDayOfWeek)}`;
  const sideOpacity = menuProgress;
  const leftChoiceTransform = [
    {
      translateX: menuProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 0],
      }),
    },
  ];
  const rightChoiceTransform = [
    {
      translateX: menuProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-16, 0],
      }),
    },
  ];
  const backgroundOpacity = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const chevronOpacity = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const plusScale = plusPressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.layout}>
        <View style={[styles.mainContent, menuVisible && styles.dimmedContent]}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{isEditing ? "Edit" : "Create"}</Text>
            <Text style={styles.heroSubtitle}>course</Text>
            <Text style={styles.contextLabel}>{contextLabel}</Text>
          </View>

          <View style={styles.builderArea}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Add a step to your course</Text>
                <Text style={styles.emptyHint}>Press and hold the + button to choose a step or a loop.</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.itemsContent}
                scrollEnabled={!isSwipingItem}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item) =>
                  item.kind === "step" ? (
                    <SwipeToDeleteRow
                      animateIn={item.id === animatedItemId}
                      key={item.id}
                      onDelete={() => removeItem(item.id)}
                      onSwipeStateChange={setIsSwipingItem}
                    >
                      <BuilderStepCard
                        expanded={expandedStepId === item.step.id}
                        onDuplicate={() => handleDuplicateStep(item.id)}
                        onDurationChange={(delta) => handleStepDurationChange(item.id, delta)}
                        onPress={() => handleStepPress(item.step.id)}
                        onTypeChange={(type) => handleStepTypeChange(item.id, type)}
                        step={item.step}
                      />
                    </SwipeToDeleteRow>
                  ) : (
                    <SwipeToDeleteRow
                      animateIn={item.id === animatedItemId}
                      key={item.id}
                      onDelete={() => removeItem(item.id)}
                      onSwipeStateChange={setIsSwipingItem}
                    >
                      <BuilderLoopCard
                        animatedStepId={animatedLoopStepId}
                        expandedStepId={expandedStepId}
                        isRepeatExpanded={expandedLoopId === item.id}
                        item={item}
                        onIncrement={() => addStepToLoop(item.id)}
                        onLoopBackgroundPress={() => {
                          const hasExpandedLoopStep = item.steps.some(
                            (step) => step.id === expandedStepId,
                          );

                          if (expandedLoopId !== item.id && !hasExpandedLoopStep) {
                            return;
                          }

                          LayoutAnimation.configureNext(getBouncyLayoutAnimation());
                          setExpandedLoopId(null);
                          if (hasExpandedLoopStep) {
                            setExpandedStepId(null);
                          }
                        }}
                        onLoopRepeatCountChange={(delta) => handleLoopRepeatCountChange(item.id, delta)}
                        onLoopRepeatPress={() => {
                          LayoutAnimation.configureNext(getBouncyLayoutAnimation());
                          setExpandedLoopId((current) => (current === item.id ? null : item.id));
                        }}
                        onLoopStepDelete={(stepId) => removeLoopStep(item.id, stepId)}
                        onLoopStepDurationChange={handleLoopStepDurationChange}
                        onLoopStepPress={handleLoopStepPress}
                        onSwipeStateChange={setIsSwipingItem}
                        onLoopStepTypeChange={handleLoopStepTypeChange}
                      />
                    </SwipeToDeleteRow>
                  ),
                )}
              </ScrollView>
            )}
          </View>
        </View>

        <LinearGradient
          colors={["rgba(249,249,249,0)", "rgba(249,249,249,0.72)", colors.background]}
          pointerEvents="none"
          locations={[0, 0.58, 1]}
          style={styles.footerGradient}
        />
        <View pointerEvents="box-none" style={styles.footer}>
          <View pointerEvents="box-none" style={styles.selectorZone}>
            <View pointerEvents="box-none" style={styles.selectorMenuShell}>
              <AnimatedSquircleView
                pointerEvents="none"
                style={[styles.selectorMenuBackground, { opacity: backgroundOpacity }]}
              />
              <SquircleView pointerEvents="box-none" style={styles.selectorMenu}>
                <Animated.View style={{ opacity: sideOpacity, transform: leftChoiceTransform }}>
                  <ChoiceButton
                    active={highlightedChoice === "loop"}
                    icon="refresh-outline"
                    innerRef={loopChoiceRef}
                    label="Loop"
                    onLayout={() => handleAbsoluteLayout(loopChoiceRef, setLoopBounds)}
                  />
                </Animated.View>
                <View pointerEvents="box-none" style={styles.selectorCenter}>
                  <ChevronTrail direction="left" opacity={chevronOpacity} />
                <View
                  {...panResponder.panHandlers}
                  onLayout={() => handleAbsoluteLayout(plusWrapRef, setPlusBounds)}
                  ref={plusWrapRef}
                  style={styles.selectorPlusWrap}
                >
                  <Animated.View pointerEvents="none" style={{ transform: [{ scale: plusScale }] }}>
                    <SquircleButton style={styles.selectorPlus}>
                      <Text pointerEvents="none" style={styles.plusLabel}>
                        +
                      </Text>
                    </SquircleButton>
                  </Animated.View>
                </View>
                  <ChevronTrail direction="right" opacity={chevronOpacity} />
              </View>
                <Animated.View style={{ opacity: sideOpacity, transform: rightChoiceTransform }}>
                  <ChoiceButton
                    active={highlightedChoice === "step"}
                    icon="walk-outline"
                    innerRef={stepChoiceRef}
                    label="Step"
                    onLayout={() => handleAbsoluteLayout(stepChoiceRef, setStepBounds)}
                  />
                </Animated.View>
              </SquircleView>
            </View>
          </View>

          <ActionCardButton
            iconName={isEditing ? "pencil" : "add"}
            label={isEditing ? "Save Course" : "Create Course"}
            onPress={handleCreateCourse}
            variant="dark"
          />
          <ActionCardButton
            iconName="close-outline"
            label="Cancel"
            onPress={handleClose}
            variant="light"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function BuilderStepCard({
  expanded,
  onDuplicate,
  onDurationChange,
  onPress,
  onTypeChange,
  step,
}: {
  expanded: boolean;
  onDuplicate: () => void;
  onDurationChange: (delta: number) => void;
  onPress: () => void;
  onTypeChange: (type: StepType) => void;
  step: DraftStep;
}) {
  return (
    <SquircleButton onPress={onPress} style={styles.stepCard}>
      <View style={styles.stepCardContent}>
        <CompactStepRow step={step} />
        {expanded ? (
          <StepEditor
            durationMinutes={step.durationMinutes}
            onDuplicate={onDuplicate}
            onDecrease={() => onDurationChange(-1)}
            onIncrease={() => onDurationChange(1)}
            onSelectType={onTypeChange}
            type={step.type}
          />
        ) : null}
      </View>
    </SquircleButton>
  );
}

function BuilderLoopCard({
  animatedStepId,
  expandedStepId,
  isRepeatExpanded,
  item,
  onIncrement,
  onLoopBackgroundPress,
  onLoopRepeatCountChange,
  onLoopRepeatPress,
  onLoopStepDelete,
  onLoopStepDurationChange,
  onLoopStepPress,
  onSwipeStateChange,
  onLoopStepTypeChange,
}: {
  animatedStepId: string | null;
  expandedStepId: string | null;
  isRepeatExpanded: boolean;
  item: Extract<BuilderItem, { kind: "loop" }>;
  onIncrement: () => void;
  onLoopBackgroundPress: () => void;
  onLoopRepeatCountChange: (delta: number) => void;
  onLoopRepeatPress: () => void;
  onLoopStepDelete: (stepId: string) => void;
  onLoopStepDurationChange: (itemId: string, stepIndex: number, delta: number) => void;
  onLoopStepPress: (stepId: string) => void;
  onSwipeStateChange: (isSwiping: boolean) => void;
  onLoopStepTypeChange: (itemId: string, stepIndex: number, type: StepType) => void;
}) {
  const repeatTranslate = useRef(new Animated.Value(0)).current;
  const repeatOpacity = useRef(new Animated.Value(1)).current;
  const previousRepeatRef = useRef(item.repeatCount);
  const hasExpandedLoopStep = item.steps.some((step) => step.id === expandedStepId);

  useEffect(() => {
    if (previousRepeatRef.current === item.repeatCount) {
      return;
    }

    repeatTranslate.setValue(8);
    repeatOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(repeatTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(repeatOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    previousRepeatRef.current = item.repeatCount;
  }, [item.repeatCount, repeatOpacity, repeatTranslate]);

  return (
    <SquircleView style={styles.loopCard}>
      <Pressable
        onPress={onLoopBackgroundPress}
        pointerEvents={isRepeatExpanded || hasExpandedLoopStep ? "auto" : "none"}
        style={styles.loopBackgroundDismissTap}
      />
      <View style={styles.loopSteps}>
        {item.steps.map((step, index) => (
          <AnimatedEntryView animateIn={animatedStepId === step.id} key={step.id}>
            <SwipeToDeleteRow
              onDelete={() => onLoopStepDelete(step.id)}
              onSwipeStateChange={onSwipeStateChange}
            >
              <SquircleButton
                onPress={() => onLoopStepPress(step.id)}
                style={styles.loopStepCard}
              >
                <View style={styles.stepCardContent}>
                  <CompactStepRow step={step} />
                  {expandedStepId === step.id ? (
                    <StepEditor
                      durationMinutes={step.durationMinutes}
                      onDecrease={() => onLoopStepDurationChange(item.id, index, -1)}
                      onIncrease={() => onLoopStepDurationChange(item.id, index, 1)}
                      onSelectType={(type) => onLoopStepTypeChange(item.id, index, type)}
                      type={step.type}
                    />
                  ) : null}
                </View>
              </SquircleButton>
            </SwipeToDeleteRow>
          </AnimatedEntryView>
        ))}
      </View>

      <View style={styles.loopFooter}>
        <SquircleButton onPress={onLoopRepeatPress} style={[styles.loopRepeatControl, isRepeatExpanded && styles.loopRepeatControlExpanded]}>
          <View style={styles.loopRepeatTopRow}>
          <Text style={styles.loopRepeatLabel}>Time</Text>
          <SquircleView style={styles.loopRepeatValueWrap}>
            <Animated.Text
              style={[
                styles.loopRepeatValue,
                {
                  opacity: repeatOpacity,
                  transform: [{ translateY: repeatTranslate }],
                },
              ]}
            >
              {item.repeatCount}
            </Animated.Text>
          </SquircleView>
        </View>
          {isRepeatExpanded ? (
            <View style={styles.loopRepeatButtonsRow}>
              <RepeatingIconButton label="−" onStep={() => onLoopRepeatCountChange(-1)} />
              <RepeatingIconButton label="+" onStep={() => onLoopRepeatCountChange(1)} />
            </View>
          ) : null}
        </SquircleButton>
        <SquircleButton onPress={onIncrement} style={styles.innerAddButton}>
          <Text style={styles.innerAddLabel}>+</Text>
        </SquircleButton>
      </View>
    </SquircleView>
  );
}

function CompactStepRow({ step }: { step: DraftStep }) {
  const compactIconTranslate = useRef(new Animated.Value(0)).current;
  const compactIconOpacity = useRef(new Animated.Value(1)).current;
  const compactTypeTranslate = useRef(new Animated.Value(0)).current;
  const compactTypeOpacity = useRef(new Animated.Value(1)).current;
  const previousTypeRef = useRef(step.type);

  useEffect(() => {
    if (previousTypeRef.current === step.type) {
      return;
    }

    compactIconTranslate.setValue(10);
    compactIconOpacity.setValue(0);
    compactTypeTranslate.setValue(10);
    compactTypeOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(compactIconTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(compactIconOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(compactTypeTranslate, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(compactTypeOpacity, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    previousTypeRef.current = step.type;
  }, [
    compactIconOpacity,
    compactIconTranslate,
    compactTypeOpacity,
    compactTypeTranslate,
    step.type,
  ]);

  return (
    <View style={styles.stepRowTop}>
      <View style={styles.stepIconWrap}>
        <Animated.View
          style={{
            opacity: compactIconOpacity,
            transform: [{ translateY: compactIconTranslate }],
          }}
        >
          <Ionicons
            color={colors.text}
            name={step.type === "walk" ? "walk-outline" : "flash-outline"}
            size={34}
          />
        </Animated.View>
      </View>
      <View style={styles.stepMeta}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.stepTypeLabel,
            {
              opacity: compactTypeOpacity,
              transform: [{ translateY: compactTypeTranslate }],
            },
          ]}
        >
          {step.type === "walk" ? "Walk" : "Run"}
        </Animated.Text>
      </View>
      <Text numberOfLines={1} style={styles.stepDuration}>{step.durationMinutes} min</Text>
    </View>
  );
}

function StepEditor({
  durationMinutes,
  onDuplicate,
  onDecrease,
  onIncrease,
  onSelectType,
  type,
}: {
  durationMinutes: number;
  onDuplicate?: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelectType: (type: StepType) => void;
  type: StepType;
}) {
  return (
    <View style={styles.stepEditor}>
      <View style={styles.typeToggleRow}>
        <MiniOptionButton
          active={type === "walk"}
          label="Walk"
          onPress={() => onSelectType("walk")}
        />
        <MiniOptionButton
          active={type === "run"}
          label="Run"
          onPress={() => onSelectType("run")}
        />
      </View>
      <View style={styles.durationEditorRow}>
        <RepeatingIconButton label="−" onStep={onDecrease} />
        <Text style={styles.durationEditorValue}>{durationMinutes} min</Text>
        <RepeatingIconButton label="+" onStep={onIncrease} />
      </View>
      {onDuplicate ? (
        <SquircleButton onPress={onDuplicate} style={styles.duplicateButton}>
          <Ionicons color={colors.text} name="copy-outline" size={18} />
          <Text style={styles.duplicateButtonLabel}>Duplicate</Text>
        </SquircleButton>
      ) : null}
    </View>
  );
}

function MiniOptionButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  function handlePress() {
    triggerTypeSelectionHaptic();
    onPress();
  }

  return (
    <SquircleButton onPress={handlePress} style={[styles.miniOptionButton, active && styles.miniOptionButtonActive]}>
      <Text style={[styles.miniOptionLabel, active && styles.miniOptionLabelActive]}>{label}</Text>
    </SquircleButton>
  );
}

function MiniIconButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <SquircleButton onPress={onPress} style={styles.miniIconButton}>
      <Text style={styles.miniIconLabel}>{label}</Text>
    </SquircleButton>
  );
}

function RepeatingIconButton({
  label,
  onStep,
}: {
  label: string;
  onStep: () => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      clearRepeatTimers(timeoutRef, intervalRef);
    };
  }, []);

  function runStep() {
    onStep();
    triggerDurationStepHaptic();
  }

  function handlePress() {
    if (longPressActiveRef.current) {
      return;
    }

    runStep();
  }

  function handlePressIn() {
    clearRepeatTimers(timeoutRef, intervalRef);
    longPressActiveRef.current = false;
    timeoutRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      runStep();
      intervalRef.current = setInterval(() => {
        runStep();
      }, DURATION_REPEAT_INTERVAL_MS);
    }, DURATION_REPEAT_INITIAL_DELAY_MS);
  }

  function handlePressOut() {
    clearRepeatTimers(timeoutRef, intervalRef);
    setTimeout(() => {
      longPressActiveRef.current = false;
    }, 0);
  }

  return (
    <SquircleButton
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.miniIconButton}
    >
      <Text style={styles.miniIconLabel}>{label}</Text>
    </SquircleButton>
  );
}

function AnimatedEntryView({
  animateIn = false,
  children,
}: {
  animateIn?: boolean;
  children: ReactNode;
}) {
  const enterOpacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const enterTranslateY = useRef(new Animated.Value(animateIn ? 18 : 0)).current;
  const enterScale = useRef(new Animated.Value(animateIn ? 0.96 : 1)).current;

  useEffect(() => {
    if (!animateIn) {
      return;
    }

    Animated.parallel([
      Animated.timing(enterOpacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(enterTranslateY, {
        damping: 18,
        mass: 0.7,
        stiffness: 240,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(enterScale, {
        damping: 18,
        mass: 0.7,
        stiffness: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateIn, enterOpacity, enterScale, enterTranslateY]);

  return (
    <Animated.View
      style={{
        opacity: enterOpacity,
        transform: [{ translateY: enterTranslateY }, { scale: enterScale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function SwipeToDeleteRow({
  animateIn = false,
  children,
  onDelete,
  onSwipeStateChange,
}: {
  animateIn?: boolean;
  children: ReactNode;
  onDelete: () => void;
  onSwipeStateChange: (isSwiping: boolean) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteFade = useRef(new Animated.Value(1)).current;
  const enterOpacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const enterTranslateY = useRef(new Animated.Value(animateIn ? 18 : 0)).current;
  const enterScale = useRef(new Animated.Value(animateIn ? 0.96 : 1)).current;
  const offsetRef = useRef(0);
  const isSwipeActiveRef = useRef(false);
  const isDeletingRef = useRef(false);
  const revealProgress = translateX.interpolate({
    inputRange: [-DELETE_ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  function animateTo(value: number, velocity = 0) {
    offsetRef.current = value;
    if (value === 0) {
      deleteFade.setValue(1);
    }
    Animated.spring(translateX, {
      damping: 15,
      mass: 0.8,
      velocity,
      overshootClamping: false,
      restDisplacementThreshold: 0.25,
      restSpeedThreshold: 0.25,
      stiffness: 180,
      toValue: value,
      useNativeDriver: true,
    }).start();
  }

  function triggerDelete() {
    if (isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;
    setSwipeActive(false);
    deleteFade.setValue(1);
    triggerDeleteHaptic();
    translateX.stopAnimation((currentValue) => {
      offsetRef.current = currentValue;
      Animated.parallel([
        Animated.timing(translateX, {
          duration: 240,
          toValue: -DELETE_MAX_SWIPE,
          useNativeDriver: true,
        }),
        Animated.timing(deleteFade, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDelete();
      });
    });
  }

  function setSwipeActive(nextValue: boolean) {
    if (isSwipeActiveRef.current === nextValue) {
      return;
    }

    isSwipeActiveRef.current = nextValue;
    onSwipeStateChange(nextValue);
  }

  useEffect(() => {
    if (!animateIn) {
      return;
    }

    Animated.parallel([
      Animated.timing(enterOpacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(enterTranslateY, {
        damping: 18,
        mass: 0.7,
        stiffness: 240,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(enterScale, {
        damping: 18,
        mass: 0.7,
        stiffness: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateIn, enterOpacity, enterScale, enterTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1 &&
        Math.abs(gestureState.dx) > 6,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          offsetRef.current = value;
        });
      },
      onPanResponderStart: () => {
        setSwipeActive(true);
      },
      onPanResponderMove: (_, gestureState) => {
        setSwipeActive(true);
        const nextValue = clamp(offsetRef.current + gestureState.dx, -DELETE_MAX_SWIPE, 0);
        translateX.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalValue = offsetRef.current + gestureState.dx;
        const isCurrentlyOpen = offsetRef.current <= -DELETE_ACTION_WIDTH * 0.5;

        if (finalValue <= -DELETE_TRIGGER_THRESHOLD) {
          triggerDelete();
          return;
        }

        const shouldClose =
          isCurrentlyOpen &&
          (finalValue > -DELETE_CLOSE_THRESHOLD || gestureState.vx > 0.12);

        if (shouldClose) {
          animateTo(0, gestureState.vx);
          setSwipeActive(false);
          return;
        }

        const shouldOpen = finalValue < -DELETE_OPEN_THRESHOLD || gestureState.vx < -0.18;

        if (shouldOpen) {
          animateTo(-DELETE_ACTION_WIDTH, gestureState.vx);
        } else {
          animateTo(0, gestureState.vx);
        }

        setSwipeActive(false);
      },
      onPanResponderTerminate: () => {
        animateTo(0);
        setSwipeActive(false);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  useEffect(() => {
    return () => {
      if (isSwipeActiveRef.current) {
        onSwipeStateChange(false);
      }
    };
  }, [onSwipeStateChange]);

  return (
    <View style={styles.swipeRow}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.deleteActionWrap,
          {
            opacity: Animated.multiply(revealProgress, deleteFade),
            transform: [
              {
                scale: revealProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.82, 1],
                }),
              },
            ],
          },
        ]}
      >
        <SquircleButton onPress={triggerDelete} style={styles.deleteAction}>
          <Ionicons color={colors.surface} name="trash" size={28} />
        </SquircleButton>
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeCard,
          {
            opacity: Animated.multiply(
              enterOpacity,
              deleteFade.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            ),
            transform: [{ translateX }, { translateY: enterTranslateY }, { scale: enterScale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function ChoiceButton({
  active,
  icon,
  innerRef,
  label,
  onLayout,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  innerRef: RefObject<View | null>;
  label: string;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const activeProgress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeProgress, {
      damping: 18,
      mass: 0.8,
      stiffness: 240,
      toValue: active ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [active, activeProgress]);

  return (
    <View ref={innerRef} onLayout={onLayout}>
      <SquircleView style={[styles.choiceButton, active && styles.choiceButtonActive]}>
        <AnimatedSquircleView
          pointerEvents="none"
          style={[
            styles.choiceButtonHighlight,
            {
              opacity: activeProgress,
              transform: [
                {
                  scale: activeProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.82, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={{
            transform: [
              {
                scale: activeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.18],
                }),
              },
            ],
          }}
        >
          <Ionicons color={colors.text} name={icon} size={32} />
        </Animated.View>
        <Text style={styles.choiceLabel}>{label}</Text>
      </SquircleView>
    </View>
  );
}

function ChevronTrail({
  direction,
  opacity,
}: {
  direction: "left" | "right";
  opacity: Animated.AnimatedInterpolation<number>;
}) {
  const first = useRef(new Animated.Value(0.35)).current;
  const second = useRef(new Animated.Value(0.55)).current;
  const third = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const values = [first, second, third];
    values.forEach((value) => value.setValue(0.2));

    const animations = Animated.loop(
      Animated.sequence(
        values.flatMap((value) => [
          Animated.timing(value, {
            duration: 240,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            duration: 240,
            toValue: 0.2,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.start();

    return () => {
      animations.stop();
    };
  }, [first, second, third]);

  const symbol = direction === "left" ? "‹" : "›";
  const orderedValues = direction === "left" ? [third, second, first] : [first, second, third];

  return (
    <Animated.View style={[styles.chevronTrail, { opacity }]}>
      {orderedValues.map((value, index) => (
        <Animated.Text
          key={`${direction}-${index}`}
          style={[styles.selectorChevron, { opacity: value }]}
        >
          {symbol}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

function groupExistingSteps(
  steps: {
    durationSeconds: number;
    id: string;
    type: StepType;
  }[],
): BuilderItem[] {
  const items: BuilderItem[] = [];
  let index = 0;

  while (index < steps.length) {
    const first = steps[index];
    const second = steps[index + 1];

    if (first && second) {
      let repeatCount = 1;
      let cursor = index + 2;

      while (cursor + 1 < steps.length) {
        const nextFirst = steps[cursor];
        const nextSecond = steps[cursor + 1];

        if (
          nextFirst.type === first.type &&
          nextFirst.durationSeconds === first.durationSeconds &&
          nextSecond.type === second.type &&
          nextSecond.durationSeconds === second.durationSeconds
        ) {
          repeatCount += 1;
          cursor += 2;
        } else {
          break;
        }
      }

      if (repeatCount > 1) {
        items.push({
          id: createBuilderId("loop"),
          kind: "loop",
          repeatCount,
          steps: [
            createDraftStep(first.type, Math.max(1, Math.round(first.durationSeconds / 60))),
            createDraftStep(second.type, Math.max(1, Math.round(second.durationSeconds / 60))),
          ],
        });
        index += repeatCount * 2;
        continue;
      }
    }

    items.push({
      id: createBuilderId("step"),
      kind: "step",
      step: createDraftStep(first.type, Math.max(1, Math.round(first.durationSeconds / 60))),
    });
    index += 1;
  }

  return items;
}

function flattenBuilderItems(items: BuilderItem[]) {
  return items.flatMap((item) => {
    if (item.kind === "step") {
      return [item.step];
    }

    return Array.from({ length: item.repeatCount }, () => item.steps.map((step) => ({ ...step }))).flat();
  });
}

function serializeBuilderItems(items: BuilderItem[]) {
  return JSON.stringify(
    items.map((item) =>
      item.kind === "step"
        ? {
            kind: item.kind,
            step: {
              durationMinutes: item.step.durationMinutes,
              type: item.step.type,
            },
          }
        : {
            kind: item.kind,
            repeatCount: item.repeatCount,
            steps: item.steps.map((step) => ({
              durationMinutes: step.durationMinutes,
              type: step.type,
            })),
          },
    ),
  );
}

function createStepItem(index: number): BuilderItem {
  return {
    id: createBuilderId(`step-item-${index}`),
    kind: "step",
    step: createDraftStep("walk", 5),
  };
}

function createLoopItem(index: number): BuilderItem {
  return {
    id: createBuilderId(`loop-item-${index}`),
    kind: "loop",
    repeatCount: 3,
    steps: [createDraftStep("run", 1), createDraftStep("walk", 1)],
  };
}

function createBuilderId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDraftStep(type: StepType, durationMinutes: number): DraftStep {
  return {
    durationMinutes,
    id: createBuilderId(`draft-${type}`),
    type,
  };
}

function clearLongPressTimer(timerRef: { current: ReturnType<typeof setTimeout> | null }) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function pointIsInsideBox(x: number, y: number, box: LayoutBox) {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

function getChoiceAtPoint(
  x: number,
  y: number,
  plusBox: LayoutBox | null,
  stepBox: LayoutBox | null,
  loopBox: LayoutBox | null,
): ChoiceType | null {
  if (!plusBox) {
    return null;
  }

  const menuTop = Math.min(stepBox?.y ?? plusBox.y, loopBox?.y ?? plusBox.y, plusBox.y);
  const menuBottom = Math.max(
    (stepBox?.y ?? plusBox.y) + (stepBox?.height ?? plusBox.height),
    (loopBox?.y ?? plusBox.y) + (loopBox?.height ?? plusBox.height),
    plusBox.y + plusBox.height,
  );

  if (y < menuTop || y > menuBottom) {
    return null;
  }

  const plusCenterX = plusBox.x + plusBox.width / 2;

  if (x < plusCenterX - SIDE_SELECTION_DEADZONE) {
    return "loop";
  }

  if (x > plusCenterX + SIDE_SELECTION_DEADZONE) {
    return "step";
  }

  return null;
}

function getDistance(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBouncyLayoutAnimation(): LayoutAnimationConfig {
  return {
    create: {
      duration: 280,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      duration: 240,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    duration: 380,
    update: {
      springDamping: 0.76,
      type: LayoutAnimation.Types.spring,
    },
  };
}

async function triggerSelectionHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

async function triggerOptionSelectionHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

async function triggerDeleteHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

async function triggerStepOpenHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

async function triggerDurationStepHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

async function triggerTypeSelectionHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Some environments may disable haptics; fail silently.
  }
}

function clearRepeatTimers(
  timeoutRef: { current: ReturnType<typeof setTimeout> | null },
  intervalRef: { current: ReturnType<typeof setInterval> | null },
) {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  layout: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  dimmedContent: {
    opacity: 0.2,
  },
  hero: {
    alignItems: "center",
    gap: 2,
    paddingTop: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 52,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: "400",
    lineHeight: 30,
  },
  contextLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  builderArea: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  emptyHint: {
    color: "#A0A0A0",
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  itemsContent: {
    gap: spacing.xs,
    paddingBottom: 240,
  },
  swipeRow: {
    overflow: "hidden",
    position: "relative",
  },
  swipeCard: {
    zIndex: 1,
  },
  deleteActionWrap: {
    alignItems: "flex-end",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    width: DELETE_ACTION_WIDTH,
  },
  deleteAction: {
    alignItems: "center",
    backgroundColor: "#F48484",
    borderRadius: 28,
    height: "100%",
    justifyContent: "center",
    width: DELETE_ACTION_WIDTH - 6,
  },
  stepCard: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: "#ECECEC",
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    minHeight: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepCardContent: {
    width: "100%",
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 54,
  },
  stepRowTop: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 36,
  },
  stepIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
  },
  stepMeta: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  stepTypeLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  stepDuration: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "500",
  },
  stepEditor: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  typeToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  miniOptionButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  miniOptionButtonActive: {
    backgroundColor: "#DCDCDC",
  },
  miniOptionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  miniOptionLabelActive: {
    fontWeight: "700",
  },
  durationEditorRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniIconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 52,
  },
  miniIconLabel: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 26,
  },
  durationEditorValue: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  duplicateButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  duplicateButtonLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  loopCard: {
    backgroundColor: "#E5E5E5",
    borderRadius: CARD_RADIUS,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    position: "relative",
  },
  loopBackgroundDismissTap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
  },
  loopSteps: {
    gap: spacing.xs,
  },
  loopStepCard: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderRadius: CARD_RADIUS,
    minHeight: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loopFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  loopRepeatControl: {
    alignItems: "center",
    backgroundColor: "#CFCFCF",
    borderRadius: 20,
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  loopRepeatControlExpanded: {
    minHeight: 106,
    paddingBottom: spacing.sm,
  },
  loopRepeatTopRow: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: 125,
  },
  loopRepeatButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  loopRepeatLabel: {
    color: "#4A4A4A",
    fontSize: 15,
    fontWeight: "500",
  },
  loopRepeatValueWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    minWidth: 58,
    // paddingHorizontal: spacing.sm,
  },
  loopRepeatValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  innerAddButton: {
    alignItems: "center",
    backgroundColor: "#C9C9C9",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  innerAddLabel: {
    color: colors.surface,
    fontSize: 28,
    lineHeight: 28,
  },
  footer: {
    bottom: spacing.sm,
    gap: 8,
    left: spacing.xl,
    position: "absolute",
    right: spacing.xl,
    zIndex: 30,
  },
  footerGradient: {
    bottom: 0,
    height: 170,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  selectorZone: {
    alignItems: "center",
    minHeight: 154,
    justifyContent: "flex-end",
  },
  selectorMenuShell: {
    alignSelf: "stretch",
    justifyContent: "center",
    width: "100%",
  },
  selectorMenuBackground: {
    backgroundColor: "#F0F0F0",
    borderRadius: 28,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  selectorMenu: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 108,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: "100%",
  },
  choiceButton: {
    alignItems: "center",
    borderRadius: radius.lg,
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 72,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    position: "relative",
  },
  choiceButtonActive: {
  },
  choiceButtonHighlight: {
    backgroundColor: "#E3E3E3",
    borderRadius: radius.lg,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  choiceLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  selectorCenter: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  selectorPlusWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 84,
    minWidth: 104,
  },
  chevronTrail: {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    justifyContent: "center",
    minWidth: 36,
  },
  selectorChevron: {
    color: "#D2D2D2",
    fontSize: 34,
    lineHeight: 34,
  },
  selectorPlus: {
    alignItems: "center",
    backgroundColor: "#A7A7A7",
    borderRadius: 22,
    height: 52,
    justifyContent: "center",
    width: 68,
  },
  plusWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#A7A7A7",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 68,
  },
  addButtonLabel: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: "300",
    lineHeight: 34,
  },
  plusLabel: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 30,
  },
  invalidState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  invalidText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
