import SwiftUI

private enum WatchRoute: Hashable {
  case chrono
  case programs
  case history
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
          case .raceDetail:
            WatchRaceDetailView()
          }
        }
    }
  }
}

private struct WatchHomeView: View {
  var body: some View {
    ZStack {
      Color.black
        .ignoresSafeArea()

      VStack(alignment: .leading, spacing: 12) {
        VStack(alignment: .leading, spacing: 2) {
          Text("Programme selectionne")
            .font(.system(size: 9, weight: .regular))
            .foregroundStyle(.white.opacity(0.65))

          Text("Marathon")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(.white)
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

        Spacer(minLength: 0)

        NavigationLink(value: WatchRoute.chrono) {
          HStack(spacing: 10) {
            Image(systemName: "figure.run")
              .font(.system(size: 20, weight: .semibold))
              .foregroundStyle(.black)

            Text("Next race")
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(.black)
              .lineLimit(1)
              .minimumScaleFactor(0.9)

            Spacer(minLength: 0)
          }
          .padding(.horizontal, 16)
          .frame(maxWidth: .infinity)
          .frame(height: 48)
          .background(Color.white)
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
  let title: String

  var body: some View {
    HStack {
      Text(title)
        .font(.system(size: 14, weight: .regular))
        .foregroundStyle(.white)

      Spacer(minLength: 0)
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity)
    .frame(height: 42)
    .background(Color.white.opacity(0.22))
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
  }
}

private struct WatchPlaceholderScreen: View {
  let title: String

  var body: some View {
    ZStack {
      Color.black
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
  var body: some View {
    WatchPlaceholderScreen(title: "Programmes")
  }
}

private struct WatchHistoryView: View {
  var body: some View {
    WatchPlaceholderScreen(title: "Historique")
  }
}

private struct WatchRaceDetailView: View {
  var body: some View {
    WatchPlaceholderScreen(title: "Course")
  }
}
