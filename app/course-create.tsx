import { Ionicons } from "@expo/vector-icons";
import { Host, Slider } from "@expo/ui/swift-ui";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  LayoutAnimation,
  LayoutAnimationConfig,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addExerciseSelectionListener, getExerciseById } from "../features/exercises";
import { DayOfWeek, StepType, getDayName, useProgramsStore } from "../features/programs";
import { colors, radius, spacing, useThemePalette } from "../theme";
import { SquircleButton, SquircleView } from "../ui/Squircle";

type DraftStep = {
  durationSeconds: number;
  id: string;
  type: StepType;
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

const DELETE_ACTION_WIDTH = 118;
const DELETE_OPEN_THRESHOLD = DELETE_ACTION_WIDTH * 0.18;
const DELETE_TRIGGER_THRESHOLD = DELETE_ACTION_WIDTH * 1.55;
const DELETE_MAX_SWIPE = Dimensions.get("window").width;
const DELETE_CLOSE_THRESHOLD = DELETE_ACTION_WIDTH * 0.72;
const DURATION_REPEAT_INITIAL_DELAY_MS = 260;
const DURATION_REPEAT_INTERVAL_MS = 90;
const CARD_RADIUS = 24;
const DURATION_SLIDER_PRESET_SECONDS = [
  5,
  10,
  15,
  20,
  25,
  30,
  45,
  60,
  ...Array.from({ length: 14 }, (_, index) => (index + 2) * 60),
  ...Array.from({ length: 8 }, (_, index) => (index + 4) * 5 * 60),
  60 * 60,
  2 * 60 * 60,
] as const;
const DURATION_SLIDER_MAX_SECONDS =
  DURATION_SLIDER_PRESET_SECONDS[DURATION_SLIDER_PRESET_SECONDS.length - 1];
const DURATION_SLIDER_CUSTOM_INDEX = DURATION_SLIDER_PRESET_SECONDS.length;

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CourseCreateScreen() {
  const router = useRouter();
  const palette = useThemePalette();
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
  const [isSwipingItem, setIsSwipingItem] = useState(false);
  const [animatedItemId, setAnimatedItemId] = useState<string | null>(null);
  const [animatedLoopStepId, setAnimatedLoopStepId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedLoopId, setExpandedLoopId] = useState<string | null>(null);
  const ignoreStepPressUntilRef = useRef(0);
  const initialItemsSnapshot = useRef(
    serializeBuilderItems(editingCourse ? groupExistingSteps(editingCourse.steps) : []),
  );

  const menuProgress = useRef(new Animated.Value(0)).current;
  const hasUnsavedChanges = serializeBuilderItems(items) !== initialItemsSnapshot.current;

  useEffect(() => {
    return addExerciseSelectionListener(({ targetId, type }) => {
      setItems((current) =>
        current.map((item) => {
          if (item.kind === "step") {
            return item.step.id === targetId
              ? {
                  ...item,
                  step: {
                    ...item.step,
                    type,
                  },
                }
              : item;
          }

          return {
            ...item,
            steps: item.steps.map((step) =>
              step.id === targetId
                ? {
                    ...step,
                    type,
                  }
                : step,
            ),
          };
        }),
      );
    });
  }, []);

  useEffect(() => {
    Animated.spring(menuProgress, {
      damping: 18,
      mass: 0.65,
      stiffness: 260,
      toValue: menuVisible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [menuProgress, menuVisible]);

  if (
    Number.isNaN(parsedWeekIndex) ||
    Number.isNaN(parsedDayOfWeek) ||
    (!isDraftFlow && !savedProgram)
  ) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
        <View style={styles.invalidState}>
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

  function handleToggleAddMenu() {
    setMenuVisible((current) => !current);
    triggerOptionSelectionHaptic();
  }

  function handleAddChoice(choice: ChoiceType) {
    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    addItem(choice);
    setMenuVisible(false);
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
        durationSeconds: step.durationSeconds,
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

  function closeExpandedEditors() {
    if (!expandedStepId && !expandedLoopId) {
      return;
    }

    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId(null);
    setExpandedLoopId(null);
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
    if (Date.now() < ignoreStepPressUntilRef.current) {
      return;
    }

    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId((current) => (current === itemId ? null : itemId));
  }

  function handleDurationSliderInteractionChange(isInteracting: boolean) {
    ignoreStepPressUntilRef.current = Date.now() + 240;
  }

  function openExercisePicker(step: DraftStep) {
    router.push({
      pathname: "/exercise-picker",
      params: {
        selectedType: step.type,
        targetId: step.id,
      },
    });
  }

  function handleStepDurationChange(itemId: string, durationSeconds: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId && item.kind === "step"
          ? {
              ...item,
              step: {
                ...item.step,
                durationSeconds: normalizeDurationSeconds(durationSeconds),
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
    if (Date.now() < ignoreStepPressUntilRef.current) {
      return;
    }

    LayoutAnimation.configureNext(getBouncyLayoutAnimation());
    setExpandedStepId((current) => (current === stepId ? null : stepId));
  }

  function handleLoopStepDurationChange(
    itemId: string,
    stepIndex: number,
    durationSeconds: number,
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId || item.kind !== "loop") {
          return item;
        }

        const nextSteps = item.steps.map((step, index) =>
          index === stepIndex
            ? {
                ...step,
                durationSeconds: normalizeDurationSeconds(durationSeconds),
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
                  const nextStep = createDraftStep("pompes", 60);
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

  const contextLabel = `${(isDraftFlow ? programDraft.name : savedProgram?.name) || "Untitled program"} • Week ${parsedWeekIndex} • ${getDayName(parsedDayOfWeek)}`;
  const addMenuOpacity = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const addMenuTransform = [
    {
      translateY: menuProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 0],
      }),
    },
  ];
  const plusRotation = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });
  const footerGradientColors = [
    hexToRgba(palette.background, 0),
    hexToRgba(palette.background, 0.76),
    palette.background,
  ] as const;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.layout}>
        <CloseCourseButton onPress={handleClose} />
        <View style={styles.mainContent}>
          <Pressable onPress={closeExpandedEditors} style={styles.heroDismissArea}>
            <View pointerEvents="none" style={styles.hero}>
              <Text style={[styles.heroTitle, { color: palette.text }]}>
                {isEditing ? "Edit" : "Create"}
              </Text>
              <Text style={[styles.heroSubtitle, { color: palette.textMuted }]}>course</Text>
              <Text style={styles.contextLabel}>{contextLabel}</Text>
            </View>
          </Pressable>

          <View style={styles.builderArea}>
            {items.length === 0 ? (
              <Pressable onPress={closeExpandedEditors} style={styles.emptyState}>
                <View style={styles.emptyCopy}>
                  <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                    Ajoute une étape à ta course
                  </Text>
                </View>
              </Pressable>
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
                      swipeDisabled={expandedStepId === item.step.id}
                    >
                      <BuilderStepCard
                        expanded={expandedStepId === item.step.id}
                        onDuplicate={() => handleDuplicateStep(item.id)}
                        onDurationChange={(durationSeconds) =>
                          handleStepDurationChange(item.id, durationSeconds)
                        }
                        onDurationInteractionChange={handleDurationSliderInteractionChange}
                        onOpenTypePicker={() => openExercisePicker(item.step)}
                        onPress={() => handleStepPress(item.step.id)}
                        step={item.step}
                      />
                    </SwipeToDeleteRow>
                  ) : (
                    <SwipeToDeleteRow
                      animateIn={item.id === animatedItemId}
                      key={item.id}
                      onDelete={() => removeItem(item.id)}
                      onSwipeStateChange={setIsSwipingItem}
                      swipeDisabled={item.steps.some((step) => step.id === expandedStepId)}
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
                        onLoopStepDurationInteractionChange={handleDurationSliderInteractionChange}
                        onLoopStepOpenTypePicker={openExercisePicker}
                        onLoopStepPress={handleLoopStepPress}
                        onSwipeStateChange={setIsSwipingItem}
                      />
                    </SwipeToDeleteRow>
                  ),
                )}
                <Pressable onPress={closeExpandedEditors} style={styles.itemsDismissArea} />
              </ScrollView>
            )}
          </View>
        </View>

        <Animated.View
          pointerEvents={menuVisible ? "auto" : "none"}
          style={[
            styles.menuBlurOverlay,
            {
              opacity: addMenuOpacity,
            },
          ]}
        >
          <Pressable onPress={() => setMenuVisible(false)} style={StyleSheet.absoluteFill}>
            <BlurView
              experimentalBlurMethod="dimezisBlurView"
              intensity={12}
              style={StyleSheet.absoluteFill}
              tint={palette.statusBarStyle === "light" ? "dark" : "light"}
            />
            <View
              pointerEvents="none"
              style={[
                styles.menuBlurTint,
                {
                  backgroundColor:
                    palette.statusBarStyle === "light"
                      ? "rgba(0,0,0,0.10)"
                      : "rgba(255,255,255,0.05)",
                },
              ]}
            />
          </Pressable>
        </Animated.View>

        <LinearGradient
          colors={footerGradientColors}
          pointerEvents="none"
          locations={[0, 0.58, 1]}
          style={styles.footerGradient}
        />
        <View pointerEvents="box-none" style={styles.footer}>
          <Animated.View
            pointerEvents={menuVisible ? "auto" : "none"}
            style={[
              styles.floatingChoices,
              {
                opacity: addMenuOpacity,
                transform: addMenuTransform,
              },
            ]}
          >
            <FloatingChoiceAction
              icon="refresh-outline"
              label="Loop"
              onPress={() => handleAddChoice("loop")}
            />
            <FloatingChoiceAction
              icon="walk-outline"
              label="Step"
              onPress={() => handleAddChoice("step")}
            />
          </Animated.View>
          <View style={styles.floatingActionsRow}>
            <SquircleButton
              onPress={handleCreateCourse}
              style={[styles.floatingIconButton, { backgroundColor: palette.primaryGradientStart }]}
            >
              <Ionicons color={palette.primaryForeground} name="download-outline" size={25} />
            </SquircleButton>
            <SquircleButton
              onPress={handleToggleAddMenu}
              style={[styles.floatingIconButton, { backgroundColor: palette.primaryGradientStart }]}
            >
              <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
                <Ionicons color={palette.primaryForeground} name="add" size={30} />
              </Animated.View>
            </SquircleButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function CloseCourseButton({ onPress }: { onPress: () => void }) {
  const palette = useThemePalette();

  return (
    <SquircleButton
      onPress={onPress}
      style={[
        styles.closeCourseButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons color={palette.text} name="close" size={31} />
    </SquircleButton>
  );
}

function FloatingChoiceAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const palette = useThemePalette();

  return (
    <SquircleButton
      onPress={onPress}
      style={[
        styles.floatingChoiceButton,
        {
          backgroundColor: palette.statusBarStyle === "light" ? "#5F5F5F" : "#5c5c5c",
        },
      ]}
    >
      <Ionicons color="#FFFFFF" name={icon} size={26} />
      <Text style={styles.floatingChoiceLabel}>{label}</Text>
    </SquircleButton>
  );
}

function BuilderStepCard({
  expanded,
  onDuplicate,
  onDurationChange,
  onDurationInteractionChange,
  onOpenTypePicker,
  onPress,
  step,
}: {
  expanded: boolean;
  onDuplicate: () => void;
  onDurationChange: (durationSeconds: number) => void;
  onDurationInteractionChange: (isInteracting: boolean) => void;
  onOpenTypePicker: () => void;
  onPress: () => void;
  step: DraftStep;
}) {
  const palette = useThemePalette();

  return (
    <SquircleView
      style={[
        styles.stepCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.stepCardContent}>
        <Pressable onPress={onPress}>
          <CompactStepRow step={step} />
        </Pressable>
        {expanded ? (
          <StepEditor
            durationSeconds={step.durationSeconds}
            onDuplicate={onDuplicate}
            onDurationChange={onDurationChange}
            onDurationInteractionChange={onDurationInteractionChange}
            onOpenTypePicker={onOpenTypePicker}
            type={step.type}
          />
        ) : null}
      </View>
    </SquircleView>
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
  onLoopStepDurationInteractionChange,
  onLoopStepOpenTypePicker,
  onLoopStepPress,
  onSwipeStateChange,
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
  onLoopStepDurationChange: (
    itemId: string,
    stepIndex: number,
    durationSeconds: number,
  ) => void;
  onLoopStepDurationInteractionChange: (isInteracting: boolean) => void;
  onLoopStepOpenTypePicker: (step: DraftStep) => void;
  onLoopStepPress: (stepId: string) => void;
  onSwipeStateChange: (isSwiping: boolean) => void;
}) {
  const palette = useThemePalette();
  const loopShellColor = mixHexColors(
    palette.surfaceMuted,
    "#FFFFFF",
    palette.statusBarStyle === "light" ? 0.08 : 0.1,
  );
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
    <SquircleView
      style={[
        styles.loopCard,
        {
          backgroundColor: loopShellColor,
          borderColor: palette.border,
        },
      ]}
    >
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
              swipeDisabled={expandedStepId === step.id}
            >
              <SquircleView
                style={[
                  styles.loopStepCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.stepCardContent}>
                  <Pressable onPress={() => onLoopStepPress(step.id)}>
                    <CompactStepRow step={step} />
                  </Pressable>
                  {expandedStepId === step.id ? (
                    <StepEditor
                      durationSeconds={step.durationSeconds}
                      onDurationChange={(durationSeconds) =>
                        onLoopStepDurationChange(item.id, index, durationSeconds)
                      }
                      onDurationInteractionChange={onLoopStepDurationInteractionChange}
                      onOpenTypePicker={() => onLoopStepOpenTypePicker(step)}
                      type={step.type}
                    />
                  ) : null}
                </View>
              </SquircleView>
            </SwipeToDeleteRow>
          </AnimatedEntryView>
        ))}
      </View>

      <View style={styles.loopFooter}>
        <SquircleButton
          onPress={onLoopRepeatPress}
          style={[
            styles.loopRepeatControl,
            isRepeatExpanded && styles.loopRepeatControlExpanded,
            {
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.loopRepeatTopRow}>
          <Text style={[styles.loopRepeatLabel, { color: palette.textMuted }]}>Time</Text>
          <SquircleView
            style={[
              styles.loopRepeatValueWrap,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.loopRepeatValue,
                {
                  color: palette.text,
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
        <SquircleButton
          onPress={onIncrement}
          style={[
            styles.innerAddButton,
            {
              backgroundColor: palette.primaryGradientStart,
            },
          ]}
        >
          <Text style={[styles.innerAddLabel, { color: palette.primaryForeground }]}>+</Text>
        </SquircleButton>
      </View>
    </SquircleView>
  );
}

function CompactStepRow({ step }: { step: DraftStep }) {
  const palette = useThemePalette();
  const exercise = getExerciseById(step.type);
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
          {exercise ? (
            <Image
              source={exercise.iconSource}
              style={[styles.stepExerciseIcon, { tintColor: palette.text }]}
            />
          ) : (
            <Ionicons
              color={palette.text}
              name={step.type === "walk" ? "walk-outline" : "flash-outline"}
              size={34}
            />
          )}
        </Animated.View>
      </View>
      <View style={styles.stepMeta}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.stepTypeLabel,
            { color: palette.text },
            {
              opacity: compactTypeOpacity,
              transform: [{ translateY: compactTypeTranslate }],
            },
          ]}
        >
          {exercise?.nom ?? (step.type === "walk" ? "Walk" : "Run")}
        </Animated.Text>
      </View>
      <Text numberOfLines={1} style={[styles.stepDuration, { color: palette.text }]}>
        {formatBuilderDuration(step.durationSeconds)}
      </Text>
    </View>
  );
}

function StepEditor({
  durationSeconds,
  onDuplicate,
  onDurationChange,
  onDurationInteractionChange,
  onOpenTypePicker,
  type,
}: {
  durationSeconds: number;
  onDuplicate?: () => void;
  onDurationChange: (durationSeconds: number) => void;
  onDurationInteractionChange: (isInteracting: boolean) => void;
  onOpenTypePicker: () => void;
  type: StepType;
}) {
  const palette = useThemePalette();

  return (
    <View style={styles.stepEditor}>
      <View style={[styles.stepEditorSeparator, { backgroundColor: palette.border }]} />
      <ExerciseTypeButton onPress={onOpenTypePicker} type={type} />
      <DurationSliderEditor
        durationSeconds={durationSeconds}
        onDurationChange={onDurationChange}
        onInteractionChange={onDurationInteractionChange}
      />
      {onDuplicate ? (
        <SquircleButton
          onPress={onDuplicate}
          style={[
            styles.duplicateButton,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons color={palette.text} name="copy-outline" size={18} />
          <Text style={[styles.duplicateButtonLabel, { color: palette.text }]}>Duplicate</Text>
        </SquircleButton>
      ) : null}
    </View>
  );
}

function DurationSliderEditor({
  durationSeconds,
  onDurationChange,
  onInteractionChange,
}: {
  durationSeconds: number;
  onDurationChange: (durationSeconds: number) => void;
  onInteractionChange: (isInteracting: boolean) => void;
}) {
  const palette = useThemePalette();
  const [customDurationUnit, setCustomDurationUnit] = useState<"minutes" | "hours">("minutes");
  const [customDurationValue, setCustomDurationValue] = useState(() =>
    formatCustomDurationValue(durationSeconds, "minutes"),
  );
  const [customDurationFocused, setCustomDurationFocused] = useState(false);
  const [customDurationSelected, setCustomDurationSelected] = useState(
    durationSeconds > DURATION_SLIDER_MAX_SECONDS,
  );
  const [customDurationMounted, setCustomDurationMounted] = useState(customDurationSelected);
  const [sliderValue, setSliderValue] = useState(() =>
    customDurationSelected
      ? DURATION_SLIDER_CUSTOM_INDEX
      : getClosestDurationSliderIndex(durationSeconds),
  );
  const [previewDurationSeconds, setPreviewDurationSeconds] = useState(durationSeconds);
  const [previewCustomSelected, setPreviewCustomSelected] = useState(customDurationSelected);
  const sliderValueRef = useRef(sliderValue);
  const sliderDraggingRef = useRef(false);
  const lastHapticSliderIndexRef = useRef(sliderValue);
  const customDurationAnimation = useRef(new Animated.Value(customDurationSelected ? 1 : 0)).current;
  const effectiveDurationSeconds = sliderDraggingRef.current
    ? previewDurationSeconds
    : durationSeconds;
  const effectiveCustomSelected = sliderDraggingRef.current
    ? previewCustomSelected
    : customDurationSelected;
  const showCustomInput = effectiveCustomSelected || effectiveDurationSeconds > DURATION_SLIDER_MAX_SECONDS;
  const sliderIndex = showCustomInput
    ? DURATION_SLIDER_CUSTOM_INDEX
    : getClosestDurationSliderIndex(effectiveDurationSeconds);
  const durationDisplay =
    effectiveCustomSelected && effectiveDurationSeconds <= DURATION_SLIDER_MAX_SECONDS
      ? "Custom"
      : formatBuilderDuration(effectiveDurationSeconds);

  useEffect(() => {
    if (!customDurationFocused) {
      setCustomDurationValue(formatCustomDurationValue(durationSeconds, customDurationUnit));
    }
  }, [customDurationFocused, customDurationUnit, durationSeconds]);

  useEffect(() => {
    if (durationSeconds > DURATION_SLIDER_MAX_SECONDS) {
      setCustomDurationSelected(true);
    }

    if (!sliderDraggingRef.current) {
      setPreviewDurationSeconds(durationSeconds);
      setPreviewCustomSelected(durationSeconds > DURATION_SLIDER_MAX_SECONDS);
    }
  }, [durationSeconds]);

  useEffect(() => {
    if (!sliderDraggingRef.current) {
      setSliderValue(sliderIndex);
    }
  }, [sliderIndex]);

  useEffect(() => {
    if (showCustomInput) {
      setCustomDurationMounted(true);
    }

    Animated.timing(customDurationAnimation, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: showCustomInput ? 1 : 0,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !showCustomInput) {
        setCustomDurationMounted(false);
      }
    });
  }, [customDurationAnimation, showCustomInput]);

  useEffect(() => {
    return () => {
      onInteractionChange(false);
    };
  }, [onInteractionChange]);

  function handleSliderValueChange(value: number) {
    sliderValueRef.current = value;
    setSliderValue(value);

    const nextIndex = clamp(Math.round(value), 0, DURATION_SLIDER_CUSTOM_INDEX);

    if (nextIndex !== lastHapticSliderIndexRef.current) {
      lastHapticSliderIndexRef.current = nextIndex;
      triggerDurationStepHaptic();
    }

    if (nextIndex === DURATION_SLIDER_CUSTOM_INDEX) {
      setPreviewCustomSelected(true);
      setPreviewDurationSeconds(durationSeconds);
      return;
    }

    const nextDurationSeconds = DURATION_SLIDER_PRESET_SECONDS[nextIndex];

    setPreviewCustomSelected(false);
    setPreviewDurationSeconds(nextDurationSeconds);
  }

  function handleSliderInteractionEnd() {
    const nextIndex = clamp(Math.round(sliderValueRef.current), 0, DURATION_SLIDER_CUSTOM_INDEX);

    sliderDraggingRef.current = false;
    setSliderValue(nextIndex);

    if (nextIndex === DURATION_SLIDER_CUSTOM_INDEX) {
      setCustomDurationSelected(true);
    } else {
      const nextDurationSeconds = DURATION_SLIDER_PRESET_SECONDS[nextIndex];

      setCustomDurationSelected(false);
      setPreviewDurationSeconds(nextDurationSeconds);
      setPreviewCustomSelected(false);
      if (nextDurationSeconds !== durationSeconds) {
        onDurationChange(nextDurationSeconds);
      }
    }

    onInteractionChange(false);
  }

  function handleCustomDurationChange(value: string) {
    const sanitizedValue = value.replace(",", ".").replace(/[^0-9.]/g, "");
    const firstDotIndex = sanitizedValue.indexOf(".");
    const nextValue =
      firstDotIndex === -1
        ? sanitizedValue
        : `${sanitizedValue.slice(0, firstDotIndex + 1)}${sanitizedValue
            .slice(firstDotIndex + 1)
            .replace(/\./g, "")}`;
    const numericValue = Number(nextValue);

    setCustomDurationValue(nextValue);

    if (Number.isFinite(numericValue) && numericValue > 0) {
      const multiplier = customDurationUnit === "hours" ? 60 * 60 : 60;
      onDurationChange(
        Math.max(DURATION_SLIDER_MAX_SECONDS, Math.round(numericValue * multiplier)),
      );
    }
  }

  function handleCustomDurationBlur() {
    setCustomDurationFocused(false);
    setCustomDurationValue(formatCustomDurationValue(durationSeconds, customDurationUnit));
  }

  function handleCustomUnitChange(nextUnit: "minutes" | "hours") {
    setCustomDurationUnit(nextUnit);
    setCustomDurationValue(formatCustomDurationValue(durationSeconds, nextUnit));
  }

  return (
    <View style={styles.durationSliderEditor}>
      <View style={styles.durationSliderHeader}>
        <Text style={[styles.durationEditorValue, { color: palette.text }]}>
          {durationDisplay}
        </Text>
      </View>
      <View
        onTouchCancel={(event) => {
          event.stopPropagation();
          handleSliderInteractionEnd();
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          handleSliderInteractionEnd();
        }}
        onTouchMove={(event) => {
          event.stopPropagation();
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          sliderDraggingRef.current = true;
          setPreviewDurationSeconds(durationSeconds);
          setPreviewCustomSelected(customDurationSelected);
          onInteractionChange(true);
        }}
        style={styles.durationSliderHost}
      >
        <Host style={styles.durationSliderNativeHost}>
          <Slider
            color={palette.primaryGradientStart}
            max={DURATION_SLIDER_CUSTOM_INDEX}
            min={0}
            onValueChange={handleSliderValueChange}
            steps={0}
            value={sliderValue}
          />
        </Host>
      </View>
      {customDurationMounted ? (
        <Animated.View
          style={[
            styles.customDurationAnimatedWrap,
            {
              maxHeight: customDurationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 52],
              }),
              marginTop: customDurationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, spacing.xs],
              }),
              opacity: customDurationAnimation,
              transform: [
                {
                  translateY: customDurationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.customDurationRow}>
            <SquircleView
              style={[
                styles.customDurationInputShell,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                },
              ]}
            >
              <TextInput
                keyboardType="decimal-pad"
                onBlur={handleCustomDurationBlur}
                onChangeText={handleCustomDurationChange}
                onFocus={() => setCustomDurationFocused(true)}
                placeholderTextColor={palette.textMuted}
                style={[styles.customDurationInput, { color: palette.text }]}
                value={customDurationValue}
              />
            </SquircleView>
            <View style={styles.customDurationUnits}>
              <DurationUnitButton
                active={customDurationUnit === "minutes"}
                label="min"
                onPress={() => handleCustomUnitChange("minutes")}
              />
              <DurationUnitButton
                active={customDurationUnit === "hours"}
                label="h"
                onPress={() => handleCustomUnitChange("hours")}
              />
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function DurationUnitButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const palette = useThemePalette();

  return (
    <SquircleButton
      onPress={onPress}
      style={[
        styles.durationUnitButton,
        {
          backgroundColor: active ? palette.primaryGradientStart : palette.surfaceMuted,
          borderColor: active ? palette.primaryGradientStart : palette.border,
        },
      ]}
    >
      <Text
        style={[
          styles.durationUnitButtonLabel,
          { color: active ? palette.primaryForeground : palette.text },
        ]}
      >
        {label}
      </Text>
    </SquircleButton>
  );
}

function ExerciseTypeButton({
  onPress,
  type,
}: {
  onPress: () => void;
  type: StepType;
}) {
  const palette = useThemePalette();
  const exercise = getExerciseById(type);

  return (
    <View style={styles.exerciseTypeField}>
      <SquircleButton
        onPress={onPress}
        style={[
          styles.exerciseTypeButton,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
          },
        ]}
      >
        {exercise ? (
          <Image
            source={exercise.iconSource}
            style={[styles.exerciseTypeIcon, { tintColor: palette.text }]}
          />
        ) : (
          <Ionicons
            color={palette.text}
            name={type === "walk" ? "walk-outline" : "flash-outline"}
            size={28}
          />
        )}
        <Text numberOfLines={1} style={[styles.exerciseTypeName, { color: palette.text }]}>
          {exercise?.nom ?? (type === "walk" ? "Walk" : "Run")}
        </Text>
        <Ionicons color={palette.textMuted} name="chevron-down" size={20} />
      </SquircleButton>
    </View>
  );
}

function RepeatingIconButton({
  label,
  onStep,
}: {
  label: string;
  onStep: () => void;
}) {
  const palette = useThemePalette();
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
      style={[
        styles.miniIconButton,
        {
          backgroundColor: palette.surfaceMuted,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.miniIconLabel, { color: palette.text }]}>{label}</Text>
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
  swipeDisabled = false,
}: {
  animateIn?: boolean;
  children: ReactNode;
  onDelete: () => void;
  onSwipeStateChange: (isSwiping: boolean) => void;
  swipeDisabled?: boolean;
}) {
  const palette = useThemePalette();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteFade = useRef(new Animated.Value(1)).current;
  const enterOpacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const enterTranslateY = useRef(new Animated.Value(animateIn ? 18 : 0)).current;
  const enterScale = useRef(new Animated.Value(animateIn ? 0.96 : 1)).current;
  const offsetRef = useRef(0);
  const isSwipeActiveRef = useRef(false);
  const isDeletingRef = useRef(false);
  const swipeDisabledRef = useRef(swipeDisabled);
  const previousSwipeDisabledRef = useRef(swipeDisabled);
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
    const wasSwipeDisabled = previousSwipeDisabledRef.current;

    swipeDisabledRef.current = swipeDisabled;
    previousSwipeDisabledRef.current = swipeDisabled;

    if (swipeDisabled && !wasSwipeDisabled) {
      animateTo(0);
      setSwipeActive(false);
    }
  });

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
        !swipeDisabledRef.current &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1 &&
        Math.abs(gestureState.dx) > 6,
      onPanResponderGrant: () => {
        if (swipeDisabledRef.current) {
          return;
        }

        translateX.stopAnimation((value) => {
          offsetRef.current = value;
        });
      },
      onPanResponderStart: () => {
        if (swipeDisabledRef.current) {
          return;
        }

        setSwipeActive(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipeDisabledRef.current) {
          return;
        }

        setSwipeActive(true);
        const nextValue = clamp(offsetRef.current + gestureState.dx, -DELETE_MAX_SWIPE, 0);
        translateX.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipeDisabledRef.current) {
          animateTo(0);
          setSwipeActive(false);
          return;
        }

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
      onShouldBlockNativeResponder: () => !swipeDisabledRef.current,
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
        <SquircleButton
          onPress={triggerDelete}
          style={[styles.deleteAction, { backgroundColor: "#D96B6B" }]}
        >
          <Ionicons color={palette.primaryForeground} name="trash" size={28} />
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
            createDraftStep(first.type, first.durationSeconds),
            createDraftStep(second.type, second.durationSeconds),
          ],
        });
        index += repeatCount * 2;
        continue;
      }
    }

    items.push({
      id: createBuilderId("step"),
      kind: "step",
      step: createDraftStep(first.type, first.durationSeconds),
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
              durationSeconds: item.step.durationSeconds,
              type: item.step.type,
            },
          }
        : {
            kind: item.kind,
            repeatCount: item.repeatCount,
            steps: item.steps.map((step) => ({
              durationSeconds: step.durationSeconds,
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
    step: createDraftStep("pompes", 60),
  };
}

function createLoopItem(index: number): BuilderItem {
  return {
    id: createBuilderId(`loop-item-${index}`),
    kind: "loop",
    repeatCount: 3,
    steps: [createDraftStep("squats", 60), createDraftStep("pompes", 60)],
  };
}

function createBuilderId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDraftStep(type: StepType, durationSeconds: number): DraftStep {
  return {
    durationSeconds: normalizeDurationSeconds(durationSeconds),
    id: createBuilderId(`draft-${type}`),
    type,
  };
}

function normalizeDurationSeconds(durationSeconds: number) {
  const roundedDuration = Math.max(5, Math.round(durationSeconds));

  if (roundedDuration < 60) {
    return (
      DURATION_SLIDER_PRESET_SECONDS.filter((value) => value < 60).reduce((closest, value) =>
        Math.abs(value - roundedDuration) < Math.abs(closest - roundedDuration) ? value : closest,
      ) ?? 5
    );
  }

  return Math.max(60, Math.round(roundedDuration / 60) * 60);
}

function formatBuilderDuration(durationSeconds: number) {
  if (durationSeconds < 60) {
    return `${durationSeconds} sec`;
  }

  if (durationSeconds >= 60 * 60) {
    const hours = Math.floor(durationSeconds / (60 * 60));
    const remainingMinutes = Math.floor((durationSeconds % (60 * 60)) / 60);

    return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds}s`;
}

function getClosestDurationSliderIndex(durationSeconds: number) {
  if (durationSeconds >= DURATION_SLIDER_MAX_SECONDS) {
    return DURATION_SLIDER_PRESET_SECONDS.length - 1;
  }

  return DURATION_SLIDER_PRESET_SECONDS.reduce((closestIndex, value, index) => {
    const closestValue = DURATION_SLIDER_PRESET_SECONDS[closestIndex];

    return Math.abs(value - durationSeconds) < Math.abs(closestValue - durationSeconds)
      ? index
      : closestIndex;
  }, 0);
}

function formatCustomDurationValue(
  durationSeconds: number,
  unit: "minutes" | "hours",
) {
  const value = unit === "hours" ? durationSeconds / (60 * 60) : durationSeconds / 60;
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(/0+$/, "").replace(/\.$/, "");
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

async function triggerDurationStepHaptic() {
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

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");

  if (sanitized.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function mixHexColors(baseHex: string, mixHex: string, amount: number) {
  const base = parseHexColor(baseHex);
  const mix = parseHexColor(mixHex);

  if (!base || !mix) {
    return baseHex;
  }

  const clampedAmount = Math.min(Math.max(amount, 0), 1);
  const red = Math.round(base.red + (mix.red - base.red) * clampedAmount);
  const green = Math.round(base.green + (mix.green - base.green) * clampedAmount);
  const blue = Math.round(base.blue + (mix.blue - base.blue) * clampedAmount);

  return rgbToHex(red, green, blue);
}

function parseHexColor(hex: string) {
  const sanitized = hex.replace("#", "");

  if (sanitized.length !== 6) {
    return null;
  }

  return {
    blue: Number.parseInt(sanitized.slice(4, 6), 16),
    green: Number.parseInt(sanitized.slice(2, 4), 16),
    red: Number.parseInt(sanitized.slice(0, 2), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
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
  },
  heroDismissArea: {
    borderRadius: CARD_RADIUS,
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
    marginTop: spacing.md,
    textAlign: "center",
  },
  closeCourseButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: spacing.xxl,
    top: spacing.sm,
    width: 48,
    zIndex: 40,
  },
  builderArea: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 140,
    paddingHorizontal: spacing.xl,
  },
  emptyCopy: {
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 360,
  },
  emptyText: {
    fontSize: 21,
    fontWeight: "400",
    lineHeight: 28,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  itemsContent: {
    flexGrow: 1,
    gap: spacing.xs,
    paddingBottom: 240,
  },
  itemsDismissArea: {
    flex: 1,
    minHeight: 140,
  },
  swipeRow: {
    overflow: "visible",
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
    borderRadius: 28,
    height: "100%",
    justifyContent: "center",
    width: DELETE_ACTION_WIDTH - 6,
  },
  stepCard: {
    alignItems: "stretch",
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
  stepExerciseIcon: {
    height: 38,
    resizeMode: "contain",
    width: 38,
  },
  stepMeta: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  stepTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepDuration: {
    fontSize: 18,
    fontWeight: "500",
  },
  stepEditor: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  stepEditorSeparator: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  exerciseTypeField: {
    gap: spacing.xs,
  },
  exerciseTypeButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  exerciseTypeIcon: {
    height: 34,
    resizeMode: "contain",
    width: 42,
  },
  exerciseTypeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 0,
  },
  durationEditorRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationSliderEditor: {
    gap: 0,
  },
  durationSliderHeader: {
    alignItems: "center",
    minHeight: 24,
  },
  durationSliderHost: {
    minHeight: 44,
  },
  durationSliderNativeHost: {
    minHeight: 44,
  },
  customDurationAnimatedWrap: {
    overflow: "hidden",
  },
  customDurationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  customDurationInputShell: {
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
  },
  customDurationInput: {
    fontSize: 16,
    fontWeight: "600",
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  customDurationUnits: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  durationUnitButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    minWidth: 52,
    paddingHorizontal: spacing.sm,
  },
  durationUnitButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  miniIconButton: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 52,
  },
  miniIconLabel: {
    fontSize: 26,
    lineHeight: 26,
  },
  durationEditorValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  duplicateButton: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  duplicateButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  loopCard: {
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: "500",
  },
  loopRepeatValueWrap: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    minWidth: 58,
    // paddingHorizontal: spacing.sm,
  },
  loopRepeatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  innerAddButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  innerAddLabel: {
    fontSize: 28,
    lineHeight: 28,
  },
  footer: {
    bottom: spacing.sm,
    alignItems: "flex-end",
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
  menuBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  menuBlurTint: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingChoices: {
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 8,
  },
  floatingChoiceButton: {
    alignItems: "center",
    borderRadius: 13,
    flexDirection: "row",
    gap: spacing.sm,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: 144,
  },
  floatingChoiceLabel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "500",
  },
  floatingActionsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  floatingIconButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    width: 52,
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
