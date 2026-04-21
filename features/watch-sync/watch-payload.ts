import {
  getChronologicalCourses,
  getProgramCompletedCourseCount,
  getProgramCourseCount,
} from "../programs";
import type { Program } from "../programs";
import type {
  WatchHistoryEntrySnapshot,
  WatchProgramSummarySnapshot,
} from "./types";

export function buildWatchProgramsSnapshot(
  programs: Program[],
  selectedProgramId?: string,
): WatchProgramSummarySnapshot[] {
  return programs.map((program) => ({
    completedCourses: getProgramCompletedCourseCount(program),
    id: program.id,
    isSelected: program.id === selectedProgramId,
    name: program.name,
    totalCourses: getProgramCourseCount(program),
  }));
}

export function buildWatchHistorySnapshot(programs: Program[]): WatchHistoryEntrySnapshot[] {
  return programs
    .flatMap((program) =>
      getChronologicalCourses(program).map(({ course, weekIndex }, chronologicalIndex) => ({
        course,
        chronologicalIndex,
        program,
        updatedAt: course.feedback?.completedAt ?? course.progress?.savedAt,
        weekIndex,
      })),
    )
    .filter(({ course }) => course.completed || !!course.feedback || !!course.progress)
    .sort((first, second) => {
      if (first.updatedAt && second.updatedAt && first.updatedAt !== second.updatedAt) {
        return second.updatedAt.localeCompare(first.updatedAt);
      }

      if (first.updatedAt && !second.updatedAt) {
        return -1;
      }

      if (!first.updatedAt && second.updatedAt) {
        return 1;
      }

      if (first.weekIndex !== second.weekIndex) {
        return second.weekIndex - first.weekIndex;
      }

      return second.chronologicalIndex - first.chronologicalIndex;
    })
    .map(({ course, program, updatedAt, weekIndex }) => ({
      courseId: course.id,
      courseName: course.name,
      id: `${program.id}:${course.id}`,
      programId: program.id,
      programName: program.name,
      status: course.completed ? "done" : "partial",
      updatedAt,
      weekIndex,
    }));
}
