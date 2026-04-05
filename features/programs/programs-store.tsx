import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

import { CourseFeedback, CreateCourseInput, Program, ProgramDraft } from "./types";
import {
  createCourse,
  createDraftFromProgram,
  createInitialProgramDraft,
  createProgramFromDraft,
  resizeWeeks,
} from "./utils";

type ProgramsStoreValue = {
  programs: Program[];
  selectedProgramId?: string;
  programDraft: ProgramDraft;
  updateProgramDraft: (updates: Partial<Pick<ProgramDraft, "name" | "description">>) => void;
  setDraftNumberOfWeeks: (numberOfWeeks: number) => void;
  addCourseToDraft: (input: CreateCourseInput) => void;
  updateCourseInDraft: (input: CreateCourseInput & { courseId: string }) => void;
  deleteCourseFromDraft: (weekIndex: number, courseId: string) => void;
  resetProgramDraft: () => void;
  startEditingProgram: (programId: string) => Program | undefined;
  saveProgramDraft: () => Program;
  deleteProgram: (programId: string) => void;
  selectProgram: (programId: string) => void;
  setCourseCompleted: (
    programId: string,
    weekIndex: number,
    courseId: string,
    completed: boolean,
  ) => void;
  saveCourseFeedback: (
    programId: string,
    weekIndex: number,
    courseId: string,
    feedback: CourseFeedback,
  ) => void;
  updateCourseInProgram: (programId: string, input: CreateCourseInput & { courseId: string }) => void;
  deleteCourseFromProgram: (programId: string, weekIndex: number, courseId: string) => void;
  getProgramById: (programId: string) => Program | undefined;
  getSelectedProgram: () => Program | undefined;
};

const ProgramsStoreContext = createContext<ProgramsStoreValue | null>(null);

export function ProgramsStoreProvider({ children }: PropsWithChildren) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined);
  const [programDraft, setProgramDraft] = useState<ProgramDraft>(createInitialProgramDraft);

  function setCourseCompletedInPrograms(
    programId: string,
    weekIndex: number,
    courseId: string,
    completed: boolean,
  ) {
    setPrograms((current) =>
      current.map((program) =>
        program.id === programId
          ? {
              ...program,
              weeks: program.weeks.map((week) =>
                week.index === weekIndex
                  ? {
                      ...week,
                      courses: week.courses.map((course) =>
                        course.id === courseId
                          ? {
                              ...course,
                              completed,
                              feedback: completed ? course.feedback : undefined,
                            }
                          : course,
                      ),
                    }
                  : week,
              ),
            }
          : program,
      ),
    );
  }

  function saveCourseFeedbackInPrograms(
    programId: string,
    weekIndex: number,
    courseId: string,
    feedback: CourseFeedback,
  ) {
    setPrograms((current) =>
      current.map((program) =>
        program.id === programId
          ? {
              ...program,
              weeks: program.weeks.map((week) =>
                week.index === weekIndex
                  ? {
                      ...week,
                      courses: week.courses.map((course) =>
                        course.id === courseId
                          ? { ...course, completed: true, feedback }
                          : course,
                      ),
                    }
                  : week,
              ),
            }
          : program,
      ),
    );
  }

  const value = useMemo<ProgramsStoreValue>(() => {
    return {
      programs,
      selectedProgramId,
      programDraft,
      updateProgramDraft(updates) {
        setProgramDraft((current) => ({
          ...current,
          ...updates,
        }));
      },
      setDraftNumberOfWeeks(numberOfWeeks) {
        setProgramDraft((current) => ({
          ...current,
          numberOfWeeks,
          weeks: resizeWeeks(current.weeks, numberOfWeeks),
        }));
      },
      addCourseToDraft(input) {
        setProgramDraft((current) => ({
          ...current,
          weeks: current.weeks.map((week, weekArrayIndex) => {
            if (week.index !== input.weekIndex) {
              return week;
            }

            const courseCountBeforeWeek = current.weeks
              .slice(0, weekArrayIndex)
              .reduce((total, item) => total + item.courses.length, 0);
            const existingCourse = week.courses.find(
              (course) => course.dayOfWeek === input.dayOfWeek,
            );
            const baseCourse = createCourse(input);
            const nextCourse = {
              ...baseCourse,
              completed: existingCourse?.completed ?? baseCourse.completed,
              feedback: existingCourse?.feedback,
              id: existingCourse?.id ?? baseCourse.id,
              name:
                existingCourse?.name ??
                `Course ${courseCountBeforeWeek + week.courses.length + 1}`,
            };
            const nextCourses = week.courses.filter(
              (course) => course.dayOfWeek !== input.dayOfWeek,
            );

            return {
              ...week,
              courses: [...nextCourses, nextCourse].sort(
                (first, second) => first.dayOfWeek - second.dayOfWeek,
              ),
            };
          }),
        }));
      },
      updateCourseInDraft(input) {
        setProgramDraft((current) => ({
          ...current,
          weeks: current.weeks.map((week) => {
            if (week.index !== input.weekIndex) {
              return week;
            }

            const existingCourse = week.courses.find((course) => course.id === input.courseId);

            if (!existingCourse) {
              return week;
            }

            const baseCourse = createCourse(input);
            const nextCourse = {
              ...baseCourse,
              completed: existingCourse.completed,
              feedback: existingCourse.feedback,
              id: existingCourse.id,
              name: existingCourse.name,
            };

            return {
              ...week,
              courses: week.courses
                .filter((course) => course.id !== input.courseId && course.dayOfWeek !== input.dayOfWeek)
                .concat(nextCourse)
                .sort((first, second) => first.dayOfWeek - second.dayOfWeek),
            };
          }),
        }));
      },
      deleteCourseFromDraft(weekIndex, courseId) {
        setProgramDraft((current) => ({
          ...current,
          weeks: current.weeks.map((week) =>
            week.index === weekIndex
              ? {
                  ...week,
                  courses: week.courses.filter((course) => course.id !== courseId),
                }
              : week,
          ),
        }));
      },
      resetProgramDraft() {
        setProgramDraft(createInitialProgramDraft());
      },
      startEditingProgram(programId) {
        const program = programs.find((item) => item.id === programId);

        if (!program) {
          return undefined;
        }

        setProgramDraft(createDraftFromProgram(program));
        return program;
      },
      saveProgramDraft() {
        const nextProgram = createProgramFromDraft(programDraft);

        setPrograms((current) => {
          if (programDraft.editingProgramId) {
            return current.map((program) =>
              program.id === programDraft.editingProgramId ? nextProgram : program,
            );
          }

          return [nextProgram, ...current];
        });

        setProgramDraft(createInitialProgramDraft());
        return nextProgram;
      },
      deleteProgram(programId) {
        setPrograms((current) => current.filter((program) => program.id !== programId));
        setSelectedProgramId((current) => (current === programId ? undefined : current));
      },
      selectProgram(programId) {
        setSelectedProgramId(programId);
      },
      setCourseCompleted(programId, weekIndex, courseId, completed) {
        setCourseCompletedInPrograms(programId, weekIndex, courseId, completed);
      },
      saveCourseFeedback(programId, weekIndex, courseId, feedback) {
        saveCourseFeedbackInPrograms(programId, weekIndex, courseId, feedback);
      },
      updateCourseInProgram(programId, input) {
        setPrograms((current) =>
          current.map((program) => {
            if (program.id !== programId) {
              return program;
            }

            return {
              ...program,
              weeks: program.weeks.map((week) => {
                if (week.index !== input.weekIndex) {
                  return week;
                }

                const existingCourse = week.courses.find((course) => course.id === input.courseId);

                if (!existingCourse) {
                  return week;
                }

                const baseCourse = createCourse(input);
                const nextCourse = {
                  ...baseCourse,
                  completed: existingCourse.completed,
                  feedback: existingCourse.feedback,
                  id: existingCourse.id,
                  name: existingCourse.name,
                };

                return {
                  ...week,
                  courses: week.courses
                    .filter((course) => course.id !== input.courseId && course.dayOfWeek !== input.dayOfWeek)
                    .concat(nextCourse)
                    .sort((first, second) => first.dayOfWeek - second.dayOfWeek),
                };
              }),
            };
          }),
        );
      },
      deleteCourseFromProgram(programId, weekIndex, courseId) {
        setPrograms((current) =>
          current.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  weeks: program.weeks.map((week) =>
                    week.index === weekIndex
                      ? {
                          ...week,
                          courses: week.courses.filter((course) => course.id !== courseId),
                        }
                      : week,
                  ),
                }
              : program,
          ),
        );
      },
      getProgramById(programId) {
        return programs.find((program) => program.id === programId);
      },
      getSelectedProgram() {
        return selectedProgramId
          ? programs.find((program) => program.id === selectedProgramId)
          : undefined;
      },
    };
  }, [programDraft, programs, selectedProgramId]);

  return <ProgramsStoreContext.Provider value={value}>{children}</ProgramsStoreContext.Provider>;
}

export function useProgramsStore() {
  const context = useContext(ProgramsStoreContext);

  if (!context) {
    throw new Error("useProgramsStore must be used within ProgramsStoreProvider");
  }

  return context;
}
