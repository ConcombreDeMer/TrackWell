import type { StepType } from "../programs";

type ExerciseSelectionPayload = {
  targetId: string;
  type: StepType;
};

type ExerciseSelectionListener = (payload: ExerciseSelectionPayload) => void;

const listeners = new Set<ExerciseSelectionListener>();

export function addExerciseSelectionListener(listener: ExerciseSelectionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishExerciseSelection(payload: ExerciseSelectionPayload) {
  listeners.forEach((listener) => listener(payload));
}
