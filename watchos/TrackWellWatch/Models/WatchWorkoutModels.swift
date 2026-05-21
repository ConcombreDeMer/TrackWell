import Foundation

struct WatchStepSnapshot: Codable, Identifiable {
  let durationSeconds: Int
  let id: String
  let label: String?
  let target: WatchStepTargetSnapshot?
  let type: String
}

enum WatchCommandAction: String, Codable {
  case startWorkout
  case togglePlayback
  case skipStep
  case resetWorkout
  case saveProgress
  case validateRepetitions
}

struct WatchStepTargetSnapshot: Codable {
  let unit: String
  let value: Double
}

struct WatchProgramSummarySnapshot: Codable, Identifiable {
  let id: String
  let name: String
  let completedCourses: Int
  let totalCourses: Int
  let isSelected: Bool
}

struct WatchCourseFeedbackSnapshot: Codable {
  let completedAt: String
  let difficulty: String
  let pain: String
  let feeling: String
}

struct WatchHistoryEntrySnapshot: Codable, Identifiable {
  let id: String
  let courseId: String
  let courseName: String
  let feedback: WatchCourseFeedbackSnapshot?
  let programId: String
  let programName: String
  let steps: [WatchStepSnapshot]?
  let weekIndex: Int
  let status: String
  let totalDurationSeconds: Int?
  let updatedAt: String?
}

struct WatchWorkoutSnapshot: Codable {
  let countdownValue: Int
  let context: String
  let courseName: String
  let state: String
  let updatedAt: String
  let courseId: String
  let currentStepIndex: Int
  let elapsedSeconds: Int
  let programId: String
  let programName: String
  let progressPercent: Double
  let remainingSeconds: Int
  let steps: [WatchStepSnapshot]
  let activeStepTarget: WatchStepTargetSnapshot?
  let activeStepTargetLabel: String?
  let primaryProgressLabel: String?
  let stepDistanceMeters: Double?
  let stepDurationSeconds: Int
  let stepLabel: String
  let stepType: String
  let totalDurationSeconds: Int
  let totalSteps: Int
  let weekIndex: Int
  let programs: [WatchProgramSummarySnapshot]?
  let history: [WatchHistoryEntrySnapshot]?
}

struct WatchCommandPayload: Codable {
  let action: WatchCommandAction
  let courseId: String?
  let receivedAt: String
}
