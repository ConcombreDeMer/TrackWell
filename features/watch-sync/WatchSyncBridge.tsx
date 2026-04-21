import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";

import {
  getCourseDurationSeconds,
  getNextCourse,
  useProgramsStore,
} from "../programs";
import { buildWatchHistorySnapshot, buildWatchProgramsSnapshot } from "./watch-payload";
import { addWatchCommandListener, publishWatchSession } from "./watch-sync";
import { WatchWorkoutSnapshot } from "./types";

export function WatchSyncBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const { getSelectedProgram, programs, selectedProgramId } = useProgramsStore();
  const selectedProgram = getSelectedProgram();
  const nextCourse = selectedProgram ? getNextCourse(selectedProgram) : undefined;
  const programsSnapshot = useMemo(
    () => buildWatchProgramsSnapshot(programs, selectedProgramId),
    [programs, selectedProgramId],
  );
  const historySnapshot = useMemo(() => buildWatchHistorySnapshot(programs), [programs]);

  const previewSnapshot = useMemo<WatchWorkoutSnapshot | null>(() => {
    if (!selectedProgram) {
      return {
        countdownValue: 0,
        context: "empty",
        courseId: "",
        courseName: "",
        currentStepIndex: 0,
        elapsedSeconds: 0,
        programId: "",
        programName: "",
        progressPercent: 0,
        remainingSeconds: 0,
        state: "scheduled",
        steps: [],
        stepDurationSeconds: 0,
        stepLabel: "",
        stepType: "run",
        totalDurationSeconds: 0,
        totalSteps: 0,
        updatedAt: new Date().toISOString(),
        weekIndex: 0,
        history: historySnapshot,
        programs: programsSnapshot,
      };
    }

    if (!nextCourse) {
      return {
        countdownValue: 0,
        context: "empty",
        courseId: "",
        courseName: "",
        currentStepIndex: 0,
        elapsedSeconds: 0,
        programId: selectedProgram.id,
        programName: selectedProgram.name,
        progressPercent: 0,
        remainingSeconds: 0,
        state: "scheduled",
        steps: [],
        stepDurationSeconds: 0,
        stepLabel: "",
        stepType: "run",
        totalDurationSeconds: 0,
        totalSteps: 0,
        updatedAt: new Date().toISOString(),
        weekIndex: 0,
        history: historySnapshot,
        programs: programsSnapshot,
      };
    }

    const totalDurationSeconds = getCourseDurationSeconds(nextCourse.course);
    const firstStep = nextCourse.course.steps[0];

    if (!firstStep) {
      return null;
    }

    return {
      countdownValue: 0,
      context: "preview",
      courseId: nextCourse.course.id,
      courseName: nextCourse.course.name,
      currentStepIndex: 0,
      elapsedSeconds: 0,
      programId: selectedProgram.id,
      programName: selectedProgram.name,
      progressPercent: 0,
      remainingSeconds: totalDurationSeconds,
      state: "scheduled",
      steps: nextCourse.course.steps,
      stepDurationSeconds: firstStep.durationSeconds,
      stepLabel: nextCourse.course.name,
      stepType: firstStep.type,
      totalDurationSeconds,
      totalSteps: nextCourse.course.steps.length,
      updatedAt: new Date().toISOString(),
      weekIndex: nextCourse.weekIndex,
      history: historySnapshot,
      programs: programsSnapshot,
    };
  }, [historySnapshot, nextCourse, programsSnapshot, selectedProgram]);

  useEffect(() => {
    if (pathname === "/chrono") {
      return;
    }

    publishWatchSession(previewSnapshot);
  }, [pathname, previewSnapshot]);

  useEffect(() => {
    return addWatchCommandListener((command) => {
      if (command.action !== "startWorkout") {
        return;
      }

      if (!selectedProgram || !nextCourse || pathname === "/chrono") {
        return;
      }

      router.push({
        pathname: "/chrono",
        params: {
          autoStart: "true",
          courseId: nextCourse.course.id,
          programId: selectedProgram.id,
          weekIndex: String(nextCourse.weekIndex),
        },
      });
    });
  }, [nextCourse, pathname, router, selectedProgram]);

  return null;
}
