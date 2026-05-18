import SwiftUI

@main
struct TrackWellWatchApp: App {
  @StateObject private var themeSettings = WatchThemeSettings()

  var body: some Scene {
    WindowGroup {
      WatchRootView()
        .environmentObject(themeSettings)
        .preferredColorScheme(themeSettings.mode.colorScheme)
    }
  }
}
