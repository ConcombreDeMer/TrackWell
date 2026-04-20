import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";

import {
  getCourseDurationSeconds,
  getNextCourse,
  useProgramsStore,
} from "../programs";
import { addWatchCommandListener, publishWatchSession } from "./watch-sync";
import { WatchWorkoutSnapshot } from "./types";

export function WatchSyncBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const { getSelectedProgram } = useProgramsStore();
  const selectedProgram = getSelectedProgram();
  const nextCourse = selectedProgram ? getNextCourse(selectedProgram) : undefined;

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
    };
  }, [nextCourse, selectedProgram]);

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
