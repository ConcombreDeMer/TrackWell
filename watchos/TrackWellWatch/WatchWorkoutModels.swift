import Foundation

struct WatchStepSnapshot: Codable, Identifiable {
  let durationSeconds: Int
  let id: String
  let label: String?
  let type: String
}

enum WatchCommandAction: String, Codable {
  case startWorkout
  case togglePlayback
  case skipStep
  case resetWorkout
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
  let stepDurationSeconds: Int
  let stepLabel: String
  let stepType: String
  let totalDurationSeconds: Int
  let totalSteps: Int
  let weekIndex: Int
}

struct WatchCommandPayload: Codable {
  let action: WatchCommandAction
  let courseId: String?
  let receivedAt: String
}
