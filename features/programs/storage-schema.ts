import {
  CourseFeedback,
  CourseProgress,
  DayOfWeek,
  DifficultyLevel,
  PainLevel,
  StepTarget,
  StepType,
} from "./types";

export type DatabaseId = string;
export type ISODateTimeString = string;

export interface ProgramRow {
  id: DatabaseId;
  name: string;
  description: string;
  numberOfWeeks: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface WeekRow {
  id: DatabaseId;
  programId: DatabaseId;
  index: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CourseRow {
  id: DatabaseId;
  programId: DatabaseId;
  weekId: DatabaseId;
  name: string;
  dayOfWeek: DayOfWeek;
  completed: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface StepRow {
  id: DatabaseId;
  courseId: DatabaseId;
  position: number;
  type: StepType;
  durationSeconds: number;
  target?: StepTarget;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CourseFeedbackRow {
  id: DatabaseId;
  courseId: DatabaseId;
  completedAt: ISODateTimeString;
  difficulty: DifficultyLevel;
  pain: PainLevel;
  feeling: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CourseProgressRow {
  id: DatabaseId;
  courseId: DatabaseId;
  currentStepIndex: number;
  remainingSeconds: number;
  savedAt: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ProgramsDatabaseSchema {
  programs: ProgramRow;
  weeks: WeekRow;
  courses: CourseRow;
  steps: StepRow;
  courseFeedback: CourseFeedbackRow;
  courseProgress: CourseProgressRow;
}

export interface CourseAggregateRecord {
  course: CourseRow;
  feedback?: CourseFeedbackRow;
  progress?: CourseProgressRow;
  steps: StepRow[];
}

export interface ProgramAggregateRecord {
  program: ProgramRow;
  weeks: Array<{
    week: WeekRow;
    courses: CourseAggregateRecord[];
  }>;
}

export type RemoteDatabaseTables = keyof ProgramsDatabaseSchema;

export type CourseFeedbackDocument = CourseFeedback;
export type CourseProgressDocument = CourseProgress;
