import SwiftUI

struct WatchProgramsView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared

  var body: some View {
    let programs = connectivity.snapshot?.programs ?? []

    WatchScreenShell(title: "Programmes") {
      if programs.isEmpty {
        WatchEmptyState(
          systemName: "bookmark",
          title: "Aucun programme",
          message: "Ouvrez TrackWell sur iPhone pour synchroniser."
        )
      } else {
        VStack(spacing: 10) {
          ForEach(programs) { program in
            WatchProgramCard(program: program)
          }
        }
        .frame(maxWidth: .infinity, alignment: .top)
      }
    }
  }
}
