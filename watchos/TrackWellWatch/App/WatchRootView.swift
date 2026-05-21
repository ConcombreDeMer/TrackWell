import SwiftUI

struct WatchRootView: View {
  @State private var path: [WatchRoute] = []

  var body: some View {
    NavigationStack(path: $path) {
      WatchHomeView()
        .navigationDestination(for: WatchRoute.self) { route in
          switch route {
          case .chrono:
            WatchChronoView {
              path.removeAll()
            }
          case .programs:
            WatchProgramsView()
          case .history:
            WatchHistoryView()
          case .settings:
            WatchSettingsView()
          case .raceDetail(let historyEntryId):
            WatchRaceDetailView(historyEntryId: historyEntryId)
          }
        }
    }
  }
}
