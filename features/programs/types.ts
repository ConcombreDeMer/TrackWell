export type StepType = "walk" | "run";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Step {
  id: string;
  type: StepType;
  durationSeconds: number;
}

export interface Course {
  id: string;
  name: string;
  completed: boolean;
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
