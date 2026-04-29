import AsyncStorage from "@react-native-async-storage/async-storage";

import { Program, ProgramDraft } from "./types";

const PROGRAMS_STORAGE_KEY = "trackwell/programs-store";
const PROGRAMS_STORAGE_VERSION = 1;

export type LocalProgramsStorageSnapshot = {
  version: typeof PROGRAMS_STORAGE_VERSION;
  savedAt: string;
  programs: Program[];
  selectedProgramId?: string;
  programDraft: ProgramDraft;
};

export async function loadProgramsStorageSnapshot() {
  const rawValue = await AsyncStorage.getItem(PROGRAMS_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isLocalProgramsStorageSnapshot(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveProgramsStorageSnapshot(snapshot: LocalProgramsStorageSnapshot) {
  await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(snapshot));
}

function isLocalProgramsStorageSnapshot(
  value: unknown,
): value is LocalProgramsStorageSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === PROGRAMS_STORAGE_VERSION &&
    typeof value.savedAt === "string" &&
    Array.isArray(value.programs) &&
    value.programs.every(isProgram) &&
    (typeof value.selectedProgramId === "string" || typeof value.selectedProgramId === "undefined") &&
    isProgramDraft(value.programDraft)
  );
}

function isProgramDraft(value: unknown): value is ProgramDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (typeof value.editingProgramId === "string" || typeof value.editingProgramId === "undefined") &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.numberOfWeeks === "number" &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isWeek)
  );
}

function isProgram(value: unknown): value is Program {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.numberOfWeeks === "number" &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isWeek)
  );
}

function isWeek(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.index === "number" &&
    Array.isArray(value.courses) &&
    value.courses.every(isCourse)
  );
}

function isCourse(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.completed === "boolean" &&
    isDayOfWeek(value.dayOfWeek) &&
    Array.isArray(value.steps) &&
    value.steps.every(isStep) &&
    (typeof value.feedback === "undefined" || isCourseFeedback(value.feedback)) &&
    (typeof value.progress === "undefined" || isCourseProgress(value.progress))
  );
}

function isCourseFeedback(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.completedAt === "string" &&
    isDifficultyLevel(value.difficulty) &&
    isPainLevel(value.pain) &&
    typeof value.feeling === "string"
  );
}

function isCourseProgress(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.currentStepIndex === "number" &&
    typeof value.remainingSeconds === "number" &&
    typeof value.savedAt === "string"
  );
}

function isStep(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.durationSeconds === "number"
  );
}

function isDayOfWeek(value: unknown) {
  return (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  );
}

function isDifficultyLevel(value: unknown) {
  return value === "easy" || value === "medium" || value === "hard" || value === "extra-hard";
}

function isPainLevel(value: unknown) {
  return value === "none" || value === "medium" || value === "high" || value === "very-high";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
