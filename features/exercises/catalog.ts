import type { ImageSourcePropType } from "react-native";

import exercisesJson from "../../jsons/exercices-muscu.json";
import runningExercisesJson from "../../jsons/exercices-running.json";
import { exerciseIconSources, type ExerciseIconId } from "./exercise-icons";

export type ExerciseLevel = "débutant" | "intermédiaire" | "avancé";
export type ExerciseCategoryId = keyof typeof exercisesJson;
export type RunningExerciseCategoryId = keyof typeof runningExercisesJson;

export type Exercise = {
  id: string;
  nom: string;
  niveau: ExerciseLevel;
  icone: ExerciseIconId;
  iconPath: string;
};

export type ExerciseId = Exercise["id"];

export type ExerciseWithIcon = Exercise & {
  categoryId: string;
  iconSource: ImageSourcePropType;
};

export const exercisesByCategory = exercisesJson as Record<ExerciseCategoryId, Exercise[]>;
export const runningExercisesByCategory = runningExercisesJson as Record<RunningExerciseCategoryId, Exercise[]>;

export const bodyweightExercises = Object.entries(exercisesByCategory).flatMap(([categoryId, categoryExercises]) =>
  categoryExercises.map((exercise) => ({
    ...exercise,
    categoryId: categoryId as ExerciseCategoryId,
    icone: exercise.icone as ExerciseIconId,
    iconSource: exerciseIconSources[exercise.icone as ExerciseIconId],
  })),
) satisfies ExerciseWithIcon[];

export const runningExercises = Object.entries(runningExercisesByCategory).flatMap(([categoryId, categoryExercises]) =>
  categoryExercises.map((exercise) => ({
    ...exercise,
    categoryId: categoryId as RunningExerciseCategoryId,
    icone: exercise.icone as ExerciseIconId,
    iconSource: exerciseIconSources[exercise.icone as ExerciseIconId],
  })),
) satisfies ExerciseWithIcon[];

export const exercises = [...bodyweightExercises, ...runningExercises] satisfies ExerciseWithIcon[];

export function getExerciseById(id: string): ExerciseWithIcon | undefined {
  return exercises.find((exercise) => exercise.id === id);
}

export function getExerciseName(id: string): string {
  return getExerciseById(id)?.nom ?? (id === "walk" ? "Walk" : id === "run" ? "Run" : id);
}

export function getExerciseIconSource(iconId: ExerciseIconId): ImageSourcePropType {
  return exerciseIconSources[iconId];
}
