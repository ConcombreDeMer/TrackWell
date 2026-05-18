import SwiftUI

struct WatchHomeView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  var body: some View {
    let palette = themeSettings.palette
    let snapshot = connectivity.snapshot
    let selectedProgramName =
      snapshot?.programs?.first(where: { $0.isSelected })?.name
      ?? (snapshot?.programName.isEmpty == false ? snapshot?.programName : nil)
      ?? "TrackWell"
    let nextRaceLabel =
      snapshot?.context == "preview" || snapshot?.context == "workout"
      ? snapshot?.courseName
      : nil

    ZStack {
      palette.background
        .ignoresSafeArea()

      VStack(alignment: .leading, spacing: 12) {
        VStack(alignment: .leading, spacing: 2) {
          Text("Programme selectionne")
            .font(.system(size: 9, weight: .regular))
            .foregroundStyle(palette.secondaryText)

          Text(selectedProgramName)
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(palette.primaryText)
            .lineLimit(2)
        }
        .padding(.horizontal, 4)

        WatchHomeActionScroller()

        Spacer(minLength: 0)

        NavigationLink(value: WatchRoute.chrono) {
          HStack(spacing: 10) {
            Image(systemName: "figure.run")
              .font(.system(size: 20, weight: .semibold))
              .foregroundStyle(palette.buttonForeground)

            Text(nextRaceLabel ?? "Aucune course")
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(palette.buttonForeground)
              .lineLimit(1)
              .minimumScaleFactor(0.9)

            Spacer(minLength: 0)
          }
          .padding(.horizontal, 16)
          .frame(maxWidth: .infinity)
          .frame(height: 48)
          .background(palette.buttonBackground)
          .clipShape(Capsule())
        }
        .buttonStyle(.plain)
      }
      .padding(.horizontal, 10)
      .padding(.top, 6)
      .padding(.bottom, 6)
    }
  }
}

private struct WatchHomeActionScroller: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  private let actions: [(title: String, route: WatchRoute)] = [
    ("Programmes", .programs),
    ("Historique", .history),
    ("Settings", .settings),
  ]

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 8) {
      ScrollView(.vertical, showsIndicators: false) {
        LazyVStack(spacing: 8) {
          ForEach(actions, id: \.title) { action in
            NavigationLink(value: action.route) {
              WatchHomeActionCard(title: action.title)
            }
            .buttonStyle(.plain)
          }
        }
        .scrollTargetLayout()
      }
      .frame(height: 42)
      .scrollTargetBehavior(.viewAligned)

      Image(systemName: "chevron.up.chevron.down")
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(palette.secondaryText)
        .frame(width: 16, height: 42)
    }
  }
}

private struct WatchHomeActionCard: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let title: String

  var body: some View {
    let palette = themeSettings.palette

    HStack {
      Text(title)
        .font(.system(size: 14, weight: .regular))
        .foregroundStyle(palette.primaryText)

      Spacer(minLength: 0)
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity)
    .frame(height: 42)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
  }
}
