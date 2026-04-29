import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Host, Picker } from "@expo/ui/swift-ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  exercises,
  exercisesByCategory,
  getExerciseById,
  publishExerciseSelection,
  type ExerciseCategoryId,
  type ExerciseLevel,
  type ExerciseWithIcon,
  runningExercisesByCategory,
} from "../features/exercises";
import { radius, spacing, useThemePalette } from "../theme";
import { SquircleButton } from "../ui/Squircle";

const EXERCISE_LISTS = [
  { id: "bodyweight", label: "Poids du corps" },
  { id: "running", label: "Running" },
  { id: "weighted", label: "Avec poids" },
] as const;

type ExerciseListId = (typeof EXERCISE_LISTS)[number]["id"];

type ExerciseSection = {
  id: string;
  exercises: ExerciseWithIcon[];
  title: string;
};

const EMPTY_EXERCISE_SECTIONS: ExerciseSection[] = [];
const EXERCISE_LIST_STORAGE_KEY = "trackwell/exercise-picker-list-id";

export default function ExercisePickerScreen() {
  const router = useRouter();
  const palette = useThemePalette();
  const { width } = useWindowDimensions();
  const { selectedType, targetId } = useLocalSearchParams<{
    selectedType?: string;
    targetId?: string;
  }>();
  const activeType = getPickerExerciseById(selectedType ?? "")?.id ?? exercises[0]?.id ?? "pompes";
  const [selectedListIndex, setSelectedListIndex] = useState(0);
  const directionRef = useRef(1);
  const listTranslateX = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const isTransitioningRef = useRef(false);
  const selectedListId = EXERCISE_LISTS[selectedListIndex]?.id ?? "bodyweight";
  const selectedSections = getExerciseSections(selectedListId);

  useEffect(() => {
    let mounted = true;

    async function hydrateSelectedList() {
      try {
        const storedListId = await AsyncStorage.getItem(EXERCISE_LIST_STORAGE_KEY);
        const storedIndex = EXERCISE_LISTS.findIndex((list) => list.id === storedListId);

        if (mounted && storedIndex >= 0) {
          setSelectedListIndex(storedIndex);
        }
      } catch {
        // Reading the UI preference is best-effort.
      }
    }

    hydrateSelectedList();

    return () => {
      mounted = false;
    };
  }, []);

  function handleSelectExercise(type: string) {
    if (targetId) {
      publishExerciseSelection({
        targetId,
        type,
      });
    }

    router.back();
  }

  function handleSelectList(index: number) {
    if (index === selectedListIndex || isTransitioningRef.current) {
      return;
    }

    AsyncStorage.setItem(EXERCISE_LIST_STORAGE_KEY, EXERCISE_LISTS[index].id).catch(() => {
      // Persisting the UI preference is best-effort.
    });

    directionRef.current = index > selectedListIndex ? 1 : -1;
    isTransitioningRef.current = true;
    listTranslateX.stopAnimation();
    listOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(listTranslateX, {
        duration: 140,
        easing: Easing.in(Easing.cubic),
        toValue: -directionRef.current * width,
        useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        duration: 120,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        isTransitioningRef.current = false;
        return;
      }

      setSelectedListIndex(index);
      listTranslateX.setValue(directionRef.current * width);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(listTranslateX, {
            duration: 210,
            easing: Easing.out(Easing.cubic),
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(listOpacity, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isTransitioningRef.current = false;
        });
      });
    });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={styles.sheet}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: palette.text }]}>Choisir un exercice</Text>
          </View>
          <SquircleButton
            onPress={() => router.back()}
            style={[styles.closeButton, { backgroundColor: palette.surface }]}
          >
            <Ionicons color={palette.text} name="close" size={24} />
          </SquircleButton>
        </View>

        <ExerciseListPicker
          onSelectIndex={handleSelectList}
          selectedIndex={selectedListIndex}
        />

        <View style={styles.listViewport}>
          <Animated.View
            style={[
              styles.listPanel,
              {
                opacity: listOpacity,
                transform: [{ translateX: listTranslateX }],
              },
            ]}
          >
            <ExerciseSectionsList
              activeType={activeType}
              onSelectExercise={handleSelectExercise}
              sections={selectedSections}
            />
          </Animated.View>
        </View>
      </View>

    </SafeAreaView>
  );
}

function ExerciseListPicker({
  onSelectIndex,
  selectedIndex,
}: {
  onSelectIndex: (index: number) => void;
  selectedIndex: number;
}) {
  const palette = useThemePalette();

  if (Platform.OS === "ios") {
    return (
      <View style={styles.segmentedNativeWrap}>
        <Host matchContents>
          <Picker
            onOptionSelected={({ nativeEvent }) => onSelectIndex(nativeEvent.index)}
            options={EXERCISE_LISTS.map((list) => list.label)}
            selectedIndex={selectedIndex}
            variant="segmented"
          />
        </Host>
      </View>
    );
  }

  return (
    <View style={[styles.segmentedFallback, { backgroundColor: palette.surfaceMuted }]}>
      {EXERCISE_LISTS.map((list, index) => {
        const active = selectedIndex === index;

        return (
          <SquircleButton
            key={list.id}
            onPress={() => onSelectIndex(index)}
            style={[
              styles.segmentedFallbackOption,
              {
                backgroundColor: active ? palette.surface : "transparent",
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedFallbackLabel,
                { color: active ? palette.text : palette.textMuted },
              ]}
            >
              {list.label}
            </Text>
          </SquircleButton>
        );
      })}
    </View>
  );
}

function ExerciseSectionsList({
  activeType,
  onSelectExercise,
  sections,
}: {
  activeType: string;
  onSelectExercise: (type: string) => void;
  sections: ExerciseSection[];
}) {
  const palette = useThemePalette();

  if (sections.length === 0) {
    return (
      <View style={styles.emptyListState}>
        <Ionicons color={palette.textMuted} name="barbell-outline" size={44} />
        <Text style={[styles.emptyListTitle, { color: palette.text }]}>Liste vide</Text>
        <Text style={[styles.emptyListText, { color: palette.textMuted }]}>
          Les exercices seront ajoutés ici plus tard.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCount, { backgroundColor: palette.surfaceMuted }]}>
              <Text style={[styles.sectionCountText, { color: palette.textMuted }]}>
                {section.exercises.length}
              </Text>
            </View>
          </View>
          <View style={styles.sectionList}>
            {section.exercises.map((exercise) => (
              <ExerciseOption
                active={activeType === exercise.id}
                exercise={exercise}
                key={exercise.id}
                onPress={() => onSelectExercise(exercise.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ExerciseOption({
  active,
  exercise,
  onPress,
}: {
  active: boolean;
  exercise: ExerciseWithIcon;
  onPress: () => void;
}) {
  const palette = useThemePalette();
  const levelColors = getExerciseLevelColors(exercise.niveau);

  return (
    <SquircleButton
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: active ? palette.primaryGradientStart : palette.surface,
          borderColor: active ? palette.primaryGradientStart : palette.border,
        },
      ]}
    >
      <Image
        source={exercise.iconSource}
        style={[
          styles.optionIcon,
          { tintColor: active ? palette.primaryForeground : palette.text },
        ]}
      />
      <View style={styles.optionText}>
        <Text
          numberOfLines={1}
          style={[
            styles.optionName,
            { color: active ? palette.primaryForeground : palette.text },
          ]}
        >
          {exercise.nom}
        </Text>
      </View>
      <View style={[styles.levelTag, { backgroundColor: levelColors.background }]}>
        <Text style={[styles.levelTagText, { color: levelColors.text }]}>
          {getExerciseLevelLabel(exercise.niveau)}
        </Text>
      </View>
      {active ? (
        <Ionicons color={palette.primaryForeground} name="checkmark-circle" size={22} />
      ) : null}
    </SquircleButton>
  );
}

function getExerciseSections(listId: ExerciseListId): ExerciseSection[] {
  if (listId === "running") {
    return Object.entries(runningExercisesByCategory).map(([categoryId, categoryExercises]) => ({
      id: categoryId,
      title: formatCategoryLabel(categoryId),
      exercises: categoryExercises.map((exercise) => ({
        ...exercise,
        categoryId,
        iconSource: getExerciseById(exercise.id)!.iconSource,
      })),
    }));
  }

  if (listId !== "bodyweight") {
    return EMPTY_EXERCISE_SECTIONS;
  }

  return Object.entries(exercisesByCategory).map(([categoryId, categoryExercises]) => ({
    id: categoryId,
    title: formatCategoryLabel(categoryId),
    exercises: categoryExercises.map((exercise) => ({
      ...exercise,
      categoryId: categoryId as ExerciseCategoryId,
      iconSource: getExerciseById(exercise.id)!.iconSource,
    })),
  }));
}

function getPickerExerciseById(id: string): ExerciseWithIcon | undefined {
  return getExerciseById(id);
}

function formatCategoryLabel(categoryId: string) {
  switch (categoryId) {
    case "haut_du_corps":
      return "Haut du corps";
    case "dos_tirage":
      return "Dos et tirage";
    case "jambes_fessiers":
      return "Jambes et fessiers";
    case "abdos_gainage":
      return "Abdos et gainage";
    case "cardio_explosivite":
      return "Cardio et explosivité";
    case "mobilite_coordination":
      return "Mobilité et coordination";
    case "endurance_recuperation":
      return "Endurance et récupération";
    case "allure_cardio":
      return "Allure et cardio";
    case "vitesse_explosivite":
      return "Vitesse et explosivité";
    case "technique_coordination":
      return "Technique et coordination";
    case "renforcement_dynamique":
      return "Renforcement dynamique";
    default:
      return categoryId
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function getExerciseLevelLabel(level: ExerciseLevel) {
  switch (level) {
    case "débutant":
      return "Débutant";
    case "intermédiaire":
      return "Inter.";
    case "avancé":
      return "Avancé";
  }
}

function getExerciseLevelColors(level: ExerciseLevel) {
  switch (level) {
    case "débutant":
      return {
        background: "#DDEFD7",
        text: "#2F6B3A",
      };
    case "intermédiaire":
      return {
        background: "#F3E0BF",
        text: "#8A5A1F",
      };
    case "avancé":
      return {
        background: "#F1D3D3",
        text: "#9B3F3F",
      };
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    borderRadius: radius.pill,
    height: 6,
    marginBottom: spacing.lg,
    width: 42,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 52,
  },
  segmentedNativeWrap: {
    alignSelf: "stretch",
    marginBottom: spacing.lg,
  },
  segmentedFallback: {
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 2,
    marginBottom: spacing.lg,
    padding: 3,
  },
  segmentedFallbackOption: {
    alignItems: "center",
    borderRadius: radius.sm,
    flex: 1,
    height: 36,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: spacing.xs,
  },
  segmentedFallbackLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  listViewport: {
    flex: 1,
    marginHorizontal: -spacing.xl,
    overflow: "hidden",
  },
  listPanel: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyListState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 96,
    paddingHorizontal: spacing.xl,
  },
  emptyListTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  emptyListText: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    opacity: 0.6,
  },
  sectionCount: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    minWidth: 34,
    paddingHorizontal: spacing.xs,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: "800",
  },
  sectionList: {
    gap: spacing.sm,
  },
  option: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionIcon: {
    height: 48,
    resizeMode: "contain",
    width: 56,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionName: {
    fontSize: 17,
    fontWeight: "400",
  },
  levelTag: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    minWidth: 72,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  levelTagText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
