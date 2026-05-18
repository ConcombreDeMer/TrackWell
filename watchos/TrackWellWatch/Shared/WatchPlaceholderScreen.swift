import SwiftUI

struct WatchPlaceholderScreen: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let title: String

  var body: some View {
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()
    }
    .navigationTitle(title)
  }
}
