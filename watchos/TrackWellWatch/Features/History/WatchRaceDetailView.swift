import SwiftUI

struct WatchRaceDetailView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let historyEntryId: String

  private var item: WatchHistoryEntrySnapshot? {
    connectivity.snapshot?.history?.first { $0.id == historyEntryId }
  }

  var body: some View {
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      if let item {
        WatchRaceDetailContent(item: item)
      } else {
        WatchEmptyState(
          systemName: "exclamationmark.circle",
          title: "Course introuvable",
          message: "Synchronise l'iPhone pour revoir les details."
        )
      }
    }
    .navigationTitle("Course")
  }
}

private struct WatchRaceDetailContent: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let item: WatchHistoryEntrySnapshot

  private var steps: [WatchStepSnapshot] {
    item.steps ?? []
  }

  private var groups: [WatchCourseStepGroup] {
    groupWatchCourseSteps(steps)
  }

  var body: some View {
    let palette = themeSettings.palette
    let statusTone = WatchRaceStatusTone(status: item.status)

    ScrollView(.vertical, showsIndicators: false) {
      VStack(alignment: .leading, spacing: 10) {
        VStack(alignment: .leading, spacing: 7) {
          HStack(alignment: .top, spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
              Text(item.courseName)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(palette.primaryText)
                .lineLimit(2)
                .minimumScaleFactor(0.72)

              Text("\(item.programName) - Semaine \(item.weekIndex)")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(palette.secondaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            }

            Spacer(minLength: 0)

            WatchStatusBadge(tone: statusTone)
          }

          HStack(spacing: 7) {
            WatchMetricTile(
              title: "Duree",
              value: formatWatchDuration(item.totalDurationSeconds ?? totalStepDuration(steps))
            )

            WatchMetricTile(
              title: "Etapes",
              value: "\(steps.count)"
            )
          }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

        if let feedback = item.feedback {
          WatchFeedbackPanel(feedback: feedback)
        } else if let updatedAt = item.updatedAt {
          WatchSavedProgressPanel(updatedAt: updatedAt)
        }

        VStack(alignment: .leading, spacing: 8) {
          Text("Deroule")
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(palette.primaryText)

          if groups.isEmpty {
            Text("Aucune etape synchronisee.")
              .font(.system(size: 11, weight: .medium))
              .foregroundStyle(palette.secondaryText)
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(12)
              .background(palette.cardBackground)
              .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
          } else {
            VStack(spacing: 8) {
              ForEach(groups) { group in
                WatchCourseStepGroupView(group: group)
              }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .frame(maxWidth: .infinity, alignment: .topLeading)
    }
    .contentMargins(.horizontal, 8, for: .scrollContent)
    .contentMargins(.vertical, 10, for: .scrollContent)
  }
}

private struct WatchMetricTile: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let title: String
  let value: String

  var body: some View {
    let palette = themeSettings.palette

    VStack(alignment: .leading, spacing: 1) {
      Text(title)
        .font(.system(size: 9, weight: .semibold))
        .foregroundStyle(palette.secondaryText)
        .lineLimit(1)

      Text(value)
        .font(.system(size: 16, weight: .bold, design: .rounded))
        .foregroundStyle(palette.primaryText)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 8)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(palette.badgeBackground)
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}

private struct WatchStatusBadge: View {
  let tone: WatchRaceStatusTone

  var body: some View {
    HStack(spacing: 4) {
      Image(systemName: tone.icon)
        .font(.system(size: 10, weight: .bold))

      Text(tone.label)
        .font(.system(size: 10, weight: .bold))
        .lineLimit(1)
    }
    .foregroundStyle(tone.foreground)
    .padding(.horizontal, 8)
    .padding(.vertical, 6)
    .background(tone.background)
    .clipShape(Capsule())
  }
}

private struct WatchFeedbackPanel: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let feedback: WatchCourseFeedbackSnapshot

  var body: some View {
    let palette = themeSettings.palette

    VStack(alignment: .leading, spacing: 8) {
      WatchFeedbackRow(label: "Date", value: formatWatchFeedbackDate(feedback.completedAt))
      WatchFeedbackRow(label: "Difficulte", value: formatWatchDifficulty(feedback.difficulty), tone: feedbackTone(for: feedback.difficulty))
      WatchFeedbackRow(label: "Douleur", value: formatWatchPain(feedback.pain), tone: painTone(for: feedback.pain))

      if !feedback.feeling.isEmpty {
        VStack(alignment: .leading, spacing: 3) {
          Text("Ressenti")
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(palette.primaryText)

          Text(feedback.feeling)
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(palette.secondaryText)
            .lineLimit(4)
            .minimumScaleFactor(0.78)
        }
        .padding(.top, 2)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchSavedProgressPanel: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let updatedAt: String

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 8) {
      Image(systemName: "clock.arrow.circlepath")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(palette.primaryText)

      VStack(alignment: .leading, spacing: 2) {
        Text("Progression sauvegardee")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(palette.primaryText)

        Text(formatWatchFeedbackDate(updatedAt))
          .font(.system(size: 10, weight: .medium))
          .foregroundStyle(palette.secondaryText)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchFeedbackRow: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let label: String
  let value: String
  var tone: WatchFeedbackTone?

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 8) {
      Text(label)
        .font(.system(size: 11, weight: .bold))
        .foregroundStyle(palette.primaryText)

      Spacer(minLength: 0)

      if let tone {
        Text(value)
          .font(.system(size: 10, weight: .bold))
          .foregroundStyle(tone.foreground)
          .lineLimit(1)
          .minimumScaleFactor(0.72)
          .padding(.horizontal, 8)
          .padding(.vertical, 5)
          .background(tone.background)
          .clipShape(Capsule())
      } else {
        Text(value)
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(palette.secondaryText)
          .lineLimit(1)
          .minimumScaleFactor(0.72)
      }
    }
  }
}

private struct WatchCourseStepGroupView: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let group: WatchCourseStepGroup

  var body: some View {
    let palette = themeSettings.palette

    switch group {
    case .single(_, let step):
      WatchCourseStepRow(step: step)
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    case .pairRepeat(_, let repeatCount, let steps):
      VStack(alignment: .leading, spacing: 7) {
        HStack {
          Text("x\(repeatCount)")
            .font(.system(size: 15, weight: .bold, design: .rounded))
            .foregroundStyle(palette.primaryText)

          Spacer(minLength: 0)

          Text("sequence")
            .font(.system(size: 9, weight: .semibold))
            .foregroundStyle(palette.secondaryText)
        }

        WatchCourseStepRow(step: steps.0)
        WatchCourseStepRow(step: steps.1)
      }
      .padding(10)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(palette.cardBackground)
      .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
  }
}

private struct WatchCourseStepRow: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let step: WatchStepSnapshot

  private var label: String {
    guard let label = step.label, !label.isEmpty else {
      return step.type == "walk" ? "Marche" : "Course"
    }

    return label
  }

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 8) {
      Image(systemName: step.type == "walk" ? "figure.walk" : "figure.run")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(palette.primaryText)
        .frame(width: 18)

      VStack(alignment: .leading, spacing: 1) {
        Text(label)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(palette.primaryText)
          .lineLimit(1)
          .minimumScaleFactor(0.76)

        Text(formatWatchStepTargetLabel(step))
          .font(.system(size: 10, weight: .semibold))
          .foregroundStyle(palette.secondaryText)
          .lineLimit(1)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

private enum WatchCourseStepGroup: Identifiable {
  case single(String, WatchStepSnapshot)
  case pairRepeat(String, Int, (WatchStepSnapshot, WatchStepSnapshot))

  var id: String {
    switch self {
    case .single(let id, _), .pairRepeat(let id, _, _):
      return id
    }
  }
}

private struct WatchRaceStatusTone {
  let background: Color
  let foreground: Color
  let icon: String
  let label: String

  init(status: String) {
    if status == "done" {
      background = Color.green.opacity(0.9)
      foreground = Color.white
      icon = "checkmark"
      label = "Terminee"
    } else {
      background = Color.yellow.opacity(0.9)
      foreground = Color.black
      icon = "minus.circle"
      label = "Partielle"
    }
  }
}

private struct WatchFeedbackTone {
  let background: Color
  let foreground: Color
}

private func groupWatchCourseSteps(_ steps: [WatchStepSnapshot]) -> [WatchCourseStepGroup] {
  var groups: [WatchCourseStepGroup] = []
  var index = 0

  while index < steps.count {
    let first = steps[index]

    if index + 1 < steps.count {
      let second = steps[index + 1]
      var repeatCount = 1
      var cursor = index + 2

      while cursor + 1 < steps.count {
        let nextFirst = steps[cursor]
        let nextSecond = steps[cursor + 1]

        if watchStepsMatch(nextFirst, first) && watchStepsMatch(nextSecond, second) {
          repeatCount += 1
          cursor += 2
        } else {
          break
        }
      }

      if repeatCount > 1 {
        groups.append(.pairRepeat("repeat-\(index)", repeatCount, (first, second)))
        index += repeatCount * 2
        continue
      }
    }

    groups.append(.single("single-\(first.id)", first))
    index += 1
  }

  return groups
}

private func watchStepsMatch(_ first: WatchStepSnapshot, _ second: WatchStepSnapshot) -> Bool {
  first.type == second.type &&
    first.durationSeconds == second.durationSeconds &&
    watchStepTargetsMatch(first.target, second.target)
}

private func watchStepTargetsMatch(_ first: WatchStepTargetSnapshot?, _ second: WatchStepTargetSnapshot?) -> Bool {
  let firstTarget = first ?? WatchStepTargetSnapshot(unit: "duration", value: 0)
  let secondTarget = second ?? WatchStepTargetSnapshot(unit: "duration", value: 0)
  return firstTarget.unit == secondTarget.unit && firstTarget.value == secondTarget.value
}

private func totalStepDuration(_ steps: [WatchStepSnapshot]) -> Int {
  steps.reduce(0) { total, step in total + step.durationSeconds }
}

private func formatWatchDuration(_ seconds: Int) -> String {
  let minutes = seconds / 60
  let remainingSeconds = seconds % 60

  if remainingSeconds == 0 {
    return "\(minutes) min"
  }

  return "\(minutes)m \(remainingSeconds)s"
}

private func formatWatchStepTargetLabel(_ step: WatchStepSnapshot) -> String {
  guard let target = step.target else {
    return formatWatchDuration(step.durationSeconds)
  }

  if target.unit == "duration" {
    return formatWatchDuration(Int(target.value.rounded()))
  }

  if target.unit == "repetitions" {
    let repetitions = Int(target.value.rounded())
    return "\(repetitions) \(repetitions == 1 ? "rep" : "reps")"
  }

  if target.unit == "kilometers" {
    return "\(formatWatchDetailDecimal(target.value)) km"
  }

  return formatWatchDuration(step.durationSeconds)
}

private func formatWatchDetailDecimal(_ value: Double) -> String {
  if value.rounded() == value {
    return String(Int(value))
  }

  return String(format: "%.1f", value)
}

private func formatWatchFeedbackDate(_ value: String) -> String {
  guard let date = parseWatchISODate(value) else {
    return value
  }

  let formatter = DateFormatter()
  formatter.dateFormat = "dd/MM/yy"
  return formatter.string(from: date)
}

private func parseWatchISODate(_ value: String) -> Date? {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

  if let date = formatter.date(from: value) {
    return date
  }

  formatter.formatOptions = [.withInternetDateTime]
  return formatter.date(from: value)
}

private func formatWatchDifficulty(_ value: String) -> String {
  switch value {
  case "easy":
    return "Easy"
  case "medium":
    return "Medium"
  case "hard":
    return "Hard"
  case "extra-hard":
    return "Extra hard"
  default:
    return value
  }
}

private func formatWatchPain(_ value: String) -> String {
  switch value {
  case "none":
    return "None"
  case "medium":
    return "Medium"
  case "high":
    return "High"
  case "very-high":
    return "Very high"
  default:
    return value
  }
}

private func feedbackTone(for value: String) -> WatchFeedbackTone {
  switch value {
  case "easy":
    return WatchFeedbackTone(background: Color.green.opacity(0.9), foreground: Color.white)
  case "medium":
    return WatchFeedbackTone(background: Color.yellow.opacity(0.9), foreground: Color.black)
  case "hard":
    return WatchFeedbackTone(background: Color.orange.opacity(0.9), foreground: Color.white)
  case "extra-hard":
    return WatchFeedbackTone(background: Color.red.opacity(0.9), foreground: Color.white)
  default:
    return WatchFeedbackTone(background: Color.gray.opacity(0.35), foreground: Color.white)
  }
}

private func painTone(for value: String) -> WatchFeedbackTone {
  switch value {
  case "none":
    return WatchFeedbackTone(background: Color.green.opacity(0.9), foreground: Color.white)
  case "medium":
    return WatchFeedbackTone(background: Color.yellow.opacity(0.9), foreground: Color.black)
  case "high":
    return WatchFeedbackTone(background: Color.orange.opacity(0.9), foreground: Color.white)
  case "very-high":
    return WatchFeedbackTone(background: Color.red.opacity(0.9), foreground: Color.white)
  default:
    return WatchFeedbackTone(background: Color.gray.opacity(0.35), foreground: Color.white)
  }
}
