import type { DifficultyLevel, PainLevel, StepType } from "../programs";

export type WatchWorkoutState =
  | "scheduled"
  | "idle"
  | "countdown"
  | "running"
  | "paused"
  | "finished";

export type WatchCommandAction =
  | "startWorkout"
  | "togglePlayback"
  | "skipStep"
  | "resetWorkout"
  | "saveProgress"
  | "validateRepetitions";

export type WatchStepTargetSnapshot = {
  unit: "duration" | "repetitions" | "kilometers";
  value: number;
};

export type WatchProgramSummarySnapshot = {
  id: string;
  name: string;
  completedCourses: number;
  totalCourses: number;
  isSelected: boolean;
};

export type WatchCourseFeedbackSnapshot = {
  completedAt: string;
  difficulty: DifficultyLevel;
  pain: PainLevel;
  feeling: string;
};

export type WatchHistoryEntrySnapshot = {
  id: string;
  courseId: string;
  courseName: string;
  feedback?: WatchCourseFeedbackSnapshot;
  programId: string;
  programName: string;
  steps: Array<{
    durationSeconds: number;
    id: string;
    label: string;
    target?: WatchStepTargetSnapshot;
    type: StepType;
  }>;
  weekIndex: number;
  status: "partial" | "done";
  totalDurationSeconds: number;
  updatedAt?: string;
};

export type WatchWorkoutSnapshot = {
  countdownValue: number;
  context: "empty" | "preview" | "workout";
  courseName: string;
  state: WatchWorkoutState;
  updatedAt: string;
  courseId: string;
  currentStepIndex: number;
  elapsedSeconds: number;
  programId: string;
  programName: string;
  progressPercent: number;
  remainingSeconds: number;
  steps: Array<{
    durationSeconds: number;
    id: string;
    label: string;
    target?: WatchStepTargetSnapshot;
    type: StepType;
  }>;
  activeStepTarget?: WatchStepTargetSnapshot;
  activeStepTargetLabel?: string;
  primaryProgressLabel?: string;
  stepDistanceMeters: number;
  stepDurationSeconds: number;
  stepLabel: string;
  stepType: StepType;
  totalDurationSeconds: number;
  totalSteps: number;
  weekIndex: number;
  programs: WatchProgramSummarySnapshot[];
  history: WatchHistoryEntrySnapshot[];
};

export type WatchCommand = {
  action: WatchCommandAction;
  courseId?: string;
  receivedAt?: string;
};
