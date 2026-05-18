import SwiftUI

struct WatchEllipsisBadge: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 4) {
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
    }
    .foregroundStyle(palette.primaryText)
    .frame(width: 44, height: 44)
    .background(palette.badgeBackground)
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}
