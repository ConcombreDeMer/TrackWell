import {
  Course,
  CreateCourseInput,
  CreateProgramInput,
  DayOfWeek,
  Program,
  ProgramDraft,
  Step,
  StepType,
  Week,
} from "./types";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const weekDayLabels = ["L", "M", "M", "J", "V", "S", "D"] as const;
export const weekDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function createEmptyWeeks(numberOfWeeks: number): Week[] {
  return Array.from({ length: numberOfWeeks }, (_, index) => ({
    id: createId("week"),
    index: index + 1,
    courses: [],
  }));
}

export function createInitialProgramDraft(): ProgramDraft {
  return {
    editingProgramId: undefined,
    name: "",
    description: "",
    numberOfWeeks: 4,
    weeks: createEmptyWeeks(4),
  };
}

export function resizeWeeks(weeks: Week[], numberOfWeeks: number): Week[] {
  const trimmed = weeks
    .filter((week) => week.index <= numberOfWeeks)
    .sort((first, second) => first.index - second.index);

  if (trimmed.length === numberOfWeeks) {
    return trimmed;
  }

  const nextWeeks = [...trimmed];

  for (let index = trimmed.length + 1; index <= numberOfWeeks; index += 1) {
    nextWeeks.push({
      id: createId("week"),
      index,
      courses: [],
    });
  }

  return nextWeeks;
}

export function createProgramFromDraft(draft: ProgramDraft): Program {
  return {
    id: draft.editingProgramId ?? createId("program"),
    name: draft.name.trim(),
    description: draft.description.trim(),
    numberOfWeeks: draft.numberOfWeeks,
    weeks: draft.weeks.map((week) => ({
      ...week,
      courses: [...week.courses],
    })),
  };
}

export function createDraftFromProgram(program: Program): ProgramDraft {
  return {
    description: program.description,
    editingProgramId: program.id,
    name: program.name,
    numberOfWeeks: program.numberOfWeeks,
    weeks: program.weeks.map((week) => ({
      ...week,
      courses: week.courses.map((course) => ({
        ...course,
        steps: [...course.steps],
      })),
    })),
  };
}

export function createCourse(input: CreateCourseInput): Course {
  return {
    completed: false,
    id: createId(`course-${input.weekIndex}-${input.dayOfWeek}`),
    name: "",
    dayOfWeek: input.dayOfWeek,
    steps: input.steps.map((step) => createStep(step.type, step.durationSeconds)),
  };
}

export function createStep(type: StepType, durationSeconds: number): Step {
  return {
    id: createId(`step-${type}`),
    type,
    durationSeconds,
  };
}

export function getProgramCourseCount(program: Program) {
  return program.weeks.reduce((total, week) => total + week.courses.length, 0);
}

export function getProgramCompletedCourseCount(program: Program) {
  return program.weeks.reduce(
    (total, week) => total + week.courses.filter((course) => course.completed).length,
    0,
  );
}

export function getProgramCompletion(program: Program) {
  const courseCount = getProgramCourseCount(program);

  if (courseCount === 0) {
    return 0;
  }

  return Math.round((getProgramCompletedCourseCount(program) / courseCount) * 100);
}

export function getCourseDurationSeconds(course: Course) {
  return course.steps.reduce((total, step) => total + step.durationSeconds, 0);
}

export function formatDurationFromSeconds(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds}s`;
}

export function getCoursesForDay(week: Week, dayOfWeek: DayOfWeek) {
  return week.courses.filter((course) => course.dayOfWeek === dayOfWeek);
}

export function getCourseForDay(week: Week, dayOfWeek: DayOfWeek) {
  return week.courses.find((course) => course.dayOfWeek === dayOfWeek);
}

export function getDayName(dayOfWeek: DayOfWeek) {
  return weekDayNames[dayOfWeek];
}

export function getChronologicalCourses(program: Program) {
  return program.weeks
    .flatMap((week) =>
      week.courses.map((course) => ({
        course,
        weekIndex: week.index,
      })),
    )
    .sort((first, second) => {
      if (first.weekIndex !== second.weekIndex) {
        return first.weekIndex - second.weekIndex;
      }

      return first.course.dayOfWeek - second.course.dayOfWeek;
    });
}

export function getNextCourse(program: Program) {
  return getChronologicalCourses(program).find(({ course }) => !course.completed);
}
