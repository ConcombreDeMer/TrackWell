import SwiftUI

struct WatchEmptyState: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let systemName: String
  let title: String
  let message: String

  var body: some View {
    let palette = themeSettings.palette

    VStack(spacing: 8) {
      Image(systemName: systemName)
        .font(.system(size: 26, weight: .semibold))
        .foregroundStyle(palette.primaryText)

      Text(title)
        .font(.system(size: 15, weight: .semibold))
        .foregroundStyle(palette.primaryText)
        .multilineTextAlignment(.center)

      Text(message)
        .font(.system(size: 10, weight: .regular))
        .foregroundStyle(palette.secondaryText)
        .multilineTextAlignment(.center)
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 16)
    .frame(maxWidth: .infinity)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}
