import SwiftUI

struct WatchRootView: View {
  var body: some View {
    NavigationStack {
      WatchHomeView()
        .navigationDestination(for: WatchRoute.self) { route in
          switch route {
          case .chrono:
            WatchChronoView()
          case .programs:
            WatchProgramsView()
          case .history:
            WatchHistoryView()
          case .settings:
            WatchSettingsView()
          case .raceDetail:
            WatchRaceDetailView()
          }
        }
    }
  }
}
