import SwiftUI

struct WatchHistoryView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  var body: some View {
    let items = connectivity.snapshot?.history ?? []
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
        if items.isEmpty {
          WatchEmptyState(
            systemName: "clock.arrow.circlepath",
            title: "Aucun historique",
            message: "Les courses terminees ou partielles apparaitront ici."
          )
        } else {
          VStack(spacing: 10) {
            ForEach(items) { item in
              NavigationLink(value: WatchRoute.raceDetail(item.id)) {
                WatchHistoryCard(item: item)
              }
              .buttonStyle(.plain)
            }
          }
          .frame(maxWidth: .infinity, alignment: .top)
        }
      }
      .contentMargins(.horizontal, 8, for: .scrollContent)
      .contentMargins(.vertical, 10, for: .scrollContent)
    }
    .navigationTitle("Historique")
  }
}
