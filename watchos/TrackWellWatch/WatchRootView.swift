import SwiftUI

private enum WatchRoute: Hashable {
  case chrono
  case programs
  case history
  case settings
  case raceDetail
}

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

private struct WatchHomeView: View {
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

        NavigationLink(value: WatchRoute.programs) {
          WatchHomeActionCard(title: "Programmes")
        }
        .buttonStyle(.plain)

        NavigationLink(value: WatchRoute.history) {
          WatchHomeActionCard(title: "Historique")
        }
        .buttonStyle(.plain)

        NavigationLink(value: WatchRoute.settings) {
          WatchHomeActionCard(title: "Settings")
        }
        .buttonStyle(.plain)

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
    .toolbar(.hidden, for: .navigationBar)
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

private struct WatchPlaceholderScreen: View {
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

private struct WatchChronoView: View {
  var body: some View {
    WorkoutView()
  }
}

private struct WatchProgramsView: View {
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

private struct WatchHistoryView: View {
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

private struct WatchRaceDetailView: View {
  var body: some View {
    WatchPlaceholderScreen(title: "Course")
  }
}

private struct WatchSettingsView: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  private var darkModeBinding: Binding<Bool> {
    Binding(
      get: { themeSettings.mode == .dark },
      set: { themeSettings.mode = $0 ? .dark : .light }
    )
  }

  var body: some View {
    let palette = themeSettings.palette

    WatchScreenShell(title: "Settings") {
      VStack(alignment: .leading, spacing: 10) {
        VStack(alignment: .leading, spacing: 2) {
          Text("Appearance")
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(palette.primaryText)

          Text("Choisissez le theme de la montre.")
            .font(.system(size: 11, weight: .regular))
            .foregroundStyle(palette.secondaryText)
        }

        Toggle(isOn: darkModeBinding) {
          VStack(alignment: .leading, spacing: 2) {
            Text("Dark mode")
              .font(.system(size: 14, weight: .semibold))
              .foregroundStyle(palette.primaryText)

            Text(themeSettings.mode == .dark ? "Active" : "Inactive")
              .font(.system(size: 10, weight: .regular))
              .foregroundStyle(palette.secondaryText)
          }
        }
        .toggleStyle(.switch)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(palette.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
      }
      .frame(maxWidth: .infinity, alignment: .topLeading)
    }
  }
}

private struct WatchScreenShell<Content: View>: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let title: String
  let content: Content

  init(title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  var body: some View {
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
        VStack(alignment: .leading, spacing: 10) {
          HStack(spacing: 12) {
            Button {
              dismiss()
            } label: {
              Image(systemName: "arrow.left")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(palette.buttonForeground)
                .frame(width: 34, height: 34)
                .background(palette.buttonBackground)
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Text(title)
              .font(.system(size: 20, weight: .bold))
              .foregroundStyle(palette.primaryText)
              .lineLimit(1)
              .minimumScaleFactor(0.85)

            Spacer(minLength: 0)
          }

          content
        }
        .padding(.horizontal, 8)
        .padding(.top, 4)
        .padding(.bottom, 10)
      }
    }
    .toolbar(.hidden, for: .navigationBar)
  }
}

private struct WatchProgramCard: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let program: WatchProgramSummarySnapshot

  var body: some View {
    let palette = themeSettings.palette
    let progressLabel = "\(program.completedCourses)/\(program.totalCourses)"

    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(program.name)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(palette.primaryText)
          .lineLimit(2)

        Text(progressLabel)
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(palette.secondaryText)
      }

      Spacer(minLength: 0)

      if program.isSelected {
        WatchIconBadge(systemName: "bookmark.fill")
      }
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchHistoryCard: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let item: WatchHistoryEntrySnapshot

  var body: some View {
    let palette = themeSettings.palette
    let statusLabel = item.status == "done" ? "Terminee" : "Partielle"

    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(item.courseName)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(palette.primaryText)
          .lineLimit(1)

        Text("\(item.programName) - Semaine \(item.weekIndex) - \(statusLabel)")
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(palette.secondaryText)
          .lineLimit(1)
      }

      Spacer(minLength: 0)

      WatchEllipsisBadge()
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchEmptyState: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let systemName: String
  let title: String
  let message: String

  var body: some View {
    let palette = themeSettings.palette

    VStack(spacing: 8) {
      Image(systemName: systemName)
        .font(.system(size: 26, weight: .semibold))
        .foregroundStyle(palette.primaryText)

      Text(title)
        .font(.system(size: 15, weight: .semibold))
        .foregroundStyle(palette.primaryText)
        .multilineTextAlignment(.center)

      Text(message)
        .font(.system(size: 10, weight: .regular))
        .foregroundStyle(palette.secondaryText)
        .multilineTextAlignment(.center)
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 16)
    .frame(maxWidth: .infinity)
    .background(palette.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchIconBadge: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let systemName: String

  var body: some View {
    let palette = themeSettings.palette

    Image(systemName: systemName)
      .font(.system(size: 18, weight: .semibold))
      .foregroundStyle(palette.primaryText)
      .frame(width: 44, height: 44)
      .background(palette.badgeBackground)
      .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}

private struct WatchEllipsisBadge: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  var body: some View {
    let palette = themeSettings.palette

    HStack(spacing: 4) {
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
    }
    .foregroundStyle(palette.primaryText)
    .frame(width: 44, height: 44)
    .background(palette.badgeBackground)
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}
