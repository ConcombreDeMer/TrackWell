import SwiftUI

struct WatchHistoryView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared

  var body: some View {
    let items = connectivity.snapshot?.history ?? []

    WatchScreenShell(title: "Historique") {
      if items.isEmpty {
        WatchEmptyState(
          systemName: "clock.arrow.circlepath",
          title: "Aucun historique",
          message: "Les courses terminees ou partielles apparaitront ici."
        )
      } else {
        VStack(spacing: 10) {
          ForEach(items) { item in
            NavigationLink(value: WatchRoute.raceDetail) {
              WatchHistoryCard(item: item)
            }
            .buttonStyle(.plain)
          }
        }
        .frame(maxWidth: .infinity, alignment: .top)
      }
    }
  }
}
