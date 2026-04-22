import SwiftUI

enum WatchThemeMode: String {
  case light
  case dark

  var colorScheme: ColorScheme {
    self == .dark ? .dark : .light
  }
}

struct WatchPalette {
  let background: Color
  let primaryText: Color
  let secondaryText: Color
  let cardBackground: Color
  let badgeBackground: Color
  let buttonBackground: Color
  let buttonForeground: Color

  static let light = WatchPalette(
    background: Color.white,
    primaryText: Color.black,
    secondaryText: Color.black.opacity(0.6),
    cardBackground: Color.black.opacity(0.08),
    badgeBackground: Color.black.opacity(0.1),
    buttonBackground: Color.black,
    buttonForeground: Color.white
  )

  static let dark = WatchPalette(
    background: Color.black,
    primaryText: Color.white,
    secondaryText: Color.white.opacity(0.65),
    cardBackground: Color.white.opacity(0.22),
    badgeBackground: Color.white.opacity(0.2),
    buttonBackground: Color.white,
    buttonForeground: Color.black
  )
}

final class WatchThemeSettings: ObservableObject {
  private static let storageKey = "trackwell.watch.theme-mode"

  @Published var mode: WatchThemeMode {
    didSet {
      UserDefaults.standard.set(mode.rawValue, forKey: Self.storageKey)
    }
  }

  init() {
    let rawValue = UserDefaults.standard.string(forKey: Self.storageKey)
    mode = WatchThemeMode(rawValue: rawValue ?? "") ?? .light
  }

  var palette: WatchPalette {
    mode == .dark ? .dark : .light
  }
}
