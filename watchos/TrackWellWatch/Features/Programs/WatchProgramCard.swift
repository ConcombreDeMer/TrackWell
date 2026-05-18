import SwiftUI

struct WatchProgramCard: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let program: WatchProgramSummarySnapshot

  var body: some View {
    let palette = themeSettings.palette
    let progressLabel = "\(program.completedCourses)/\(program.totalCourses)"

    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(program.name)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(palette.primaryText)
          .lineLimit(2)

        Text(progressLabel)
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(palette.secondaryText)
      }

      Spacer(minLength: 0)

      if program.isSelected {
        WatchIconBadge(systemName: "bookmark.fill")
      }
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}
