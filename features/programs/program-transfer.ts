import { DayOfWeek, Program, StepTarget, StepType } from "./types";

const PROGRAM_EXPORT_MIME_TYPE = "application/json";
const PROGRAM_EXPORT_UTI = "public.json";
const PROGRAM_TRANSFER_VERSION = 1;

type SharedProgramStep = {
  durationSeconds: number;
  target?: StepTarget;
  type: StepType;
};

type SharedProgramCourse = {
  dayOfWeek: DayOfWeek;
  name: string;
  steps: SharedProgramStep[];
};

type SharedProgramWeek = {
  courses: SharedProgramCourse[];
  index: number;
};

type SharedProgram = {
  description: string;
  name: string;
  numberOfWeeks: number;
  weeks: SharedProgramWeek[];
};

export type ProgramTransferDocument = {
  exportedAt: string;
  program: SharedProgram;
  type: "trackwell-program";
  version: typeof PROGRAM_TRANSFER_VERSION;
};
export type { SharedProgram };

export async function exportProgramToFile(program: Program) {
  const { File, Paths } = await loadFileSystemModule();
  const fileName = `${sanitizeFileName(program.name || "program")}.trackwell-program.json`;
  const file = new File(Paths.cache, fileName);

  file.create({
    intermediates: true,
    overwrite: true,
  });
  file.write(JSON.stringify(createProgramTransferDocument(program), null, 2));

  return file;
}

export async function shareProgramFile(program: Program) {
  const Sharing = await loadSharingModule();
  const isSharingAvailable = await Sharing.isAvailableAsync();

  if (!isSharingAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  const file = await exportProgramToFile(program);

  await Sharing.shareAsync(file.uri, {
    dialogTitle: `Export ${program.name}`,
    mimeType: PROGRAM_EXPORT_MIME_TYPE,
    UTI: PROGRAM_EXPORT_UTI,
  });
}

export async function pickAndParseProgramImport() {
  const DocumentPicker = await loadDocumentPickerModule();
  const { File } = await loadFileSystemModule();
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: PROGRAM_EXPORT_MIME_TYPE,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const [asset] = result.assets;
  const file = new File(asset.uri);
  const content = await file.text();

  return parseProgramTransferDocument(content);
}

async function loadFileSystemModule() {
  try {
    return await import("expo-file-system");
  } catch {
    throw new Error("File export is unavailable in this build of TrackWell.");
  }
}

async function loadDocumentPickerModule() {
  try {
    return await import("expo-document-picker");
  } catch {
    throw new Error(
      "Program import is unavailable in this build. Rebuild the app after installing native modules.",
    );
  }
}

async function loadSharingModule() {
  try {
    return await import("expo-sharing");
  } catch {
    throw new Error(
      "Program export is unavailable in this build. Rebuild the app after installing native modules.",
    );
  }
}

export function createProgramTransferDocument(program: Program): ProgramTransferDocument {
  return {
    exportedAt: new Date().toISOString(),
    program: {
      description: program.description,
      name: program.name,
      numberOfWeeks: program.numberOfWeeks,
      weeks: program.weeks
        .map((week) => ({
          courses: week.courses
            .map((course) => ({
              dayOfWeek: course.dayOfWeek,
              name: course.name,
              steps: course.steps.map((step) => ({
                durationSeconds: step.durationSeconds,
                target: step.target,
                type: step.type,
              })),
            }))
            .sort((first, second) => first.dayOfWeek - second.dayOfWeek),
          index: week.index,
        }))
        .sort((first, second) => first.index - second.index),
    },
    type: "trackwell-program",
    version: PROGRAM_TRANSFER_VERSION,
  };
}

export function parseProgramTransferDocument(value: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("This file is not a valid JSON program export.");
  }

  if (!isProgramTransferDocument(parsed)) {
    throw new Error("This file does not contain a valid TrackWell program.");
  }

  return parsed;
}

function isProgramTransferDocument(value: unknown): value is ProgramTransferDocument {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "trackwell-program" &&
    value.version === PROGRAM_TRANSFER_VERSION &&
    typeof value.exportedAt === "string" &&
    isSharedProgram(value.program)
  );
}

function isSharedProgram(value: unknown): value is SharedProgram {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.numberOfWeeks === "number" &&
    Number.isInteger(value.numberOfWeeks) &&
    value.numberOfWeeks > 0 &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isSharedProgramWeek)
  );
}

function isSharedProgramWeek(value: unknown): value is SharedProgramWeek {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.index === "number" &&
    Number.isInteger(value.index) &&
    value.index > 0 &&
    Array.isArray(value.courses) &&
    value.courses.every(isSharedProgramCourse)
  );
}

function isSharedProgramCourse(value: unknown): value is SharedProgramCourse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    isDayOfWeek(value.dayOfWeek) &&
    Array.isArray(value.steps) &&
    value.steps.length > 0 &&
    value.steps.every(isSharedProgramStep)
  );
}

function isSharedProgramStep(value: unknown): value is SharedProgramStep {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.type === "string" &&
    typeof value.durationSeconds === "number" &&
    Number.isFinite(value.durationSeconds) &&
    value.durationSeconds > 0 &&
    (value.target === undefined || isStepTarget(value.target))
  );
}

function isStepTarget(value: unknown): value is StepTarget {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.unit === "duration" || value.unit === "repetitions" || value.unit === "kilometers") &&
    typeof value.value === "number" &&
    Number.isFinite(value.value) &&
    value.value > 0
  );
}

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeFileName(value: string) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "program";
}
