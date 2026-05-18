import SwiftUI

struct WatchProgramsView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  var body: some View {
    let programs = connectivity.snapshot?.programs ?? []
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
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
      .contentMargins(.horizontal, 8, for: .scrollContent)
      .contentMargins(.vertical, 10, for: .scrollContent)
    }
    .navigationTitle("Programmes")
  }
}
