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
  | "resetWorkout";

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
    type: "walk" | "run";
  }>;
  stepDurationSeconds: number;
  stepLabel: string;
  stepType: "walk" | "run";
  totalDurationSeconds: number;
  totalSteps: number;
  weekIndex: number;
};

export type WatchCommand = {
  action: WatchCommandAction;
  courseId?: string;
  receivedAt?: string;
};
