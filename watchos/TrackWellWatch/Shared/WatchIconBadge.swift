import SwiftUI

struct WatchIconBadge: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let systemName: String

  var body: some View {
    let palette = themeSettings.palette

    Image(systemName: systemName)
      .font(.system(size: 18, weight: .semibold))
      .foregroundStyle(palette.primaryText)
      .frame(width: 44, height: 44)
      .background(palette.badgeBackground)
      .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}
