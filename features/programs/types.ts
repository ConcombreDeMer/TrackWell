export type StepType = string;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DifficultyLevel = "easy" | "medium" | "hard" | "extra-hard";
export type PainLevel = "none" | "medium" | "high" | "very-high";

export interface CourseFeedback {
  completedAt: string;
  difficulty: DifficultyLevel;
  pain: PainLevel;
  feeling: string;
}

export interface CourseProgress {
  currentStepIndex: number;
  remainingSeconds: number;
  savedAt: string;
}

export interface Step {
  id: string;
  type: StepType;
  durationSeconds: number;
}

export interface Course {
  id: string;
  name: string;
  completed: boolean;
  feedback?: CourseFeedback;
  progress?: CourseProgress;
  dayOfWeek: DayOfWeek;
  steps: Step[];
}

export interface Week {
  id: string;
  index: number;
  courses: Course[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  numberOfWeeks: number;
  weeks: Week[];
}

export interface ProgramDraft {
  editingProgramId?: string;
  name: string;
  description: string;
  numberOfWeeks: number;
  weeks: Week[];
}

export type CreateProgramInput = {
  name: string;
  description: string;
  numberOfWeeks: number;
};

export type CreateCourseInput = {
  weekIndex: number;
  dayOfWeek: DayOfWeek;
  steps: Array<{
    type: StepType;
    durationSeconds: number;
  }>;
};
