import SwiftUI

struct WatchHistoryCard: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let item: WatchHistoryEntrySnapshot

  var body: some View {
    let palette = themeSettings.palette
    let statusLabel = item.status == "done" ? "Terminee" : "Partielle"

    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(item.courseName)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(palette.primaryText)
          .lineLimit(1)

        Text("\(item.programName) - Semaine \(item.weekIndex) - \(statusLabel)")
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(palette.secondaryText)
          .lineLimit(1)

        if let totalDurationSeconds = item.totalDurationSeconds {
          Text(formatWatchHistoryDuration(totalDurationSeconds))
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(palette.secondaryText)
            .lineLimit(1)
        }
      }

      Spacer(minLength: 0)

      WatchEllipsisBadge()
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private func formatWatchHistoryDuration(_ seconds: Int) -> String {
  let minutes = seconds / 60
  let remainingSeconds = seconds % 60

  if remainingSeconds == 0 {
    return "\(minutes) min"
  }

  return "\(minutes)m \(remainingSeconds)s"
}
