import SwiftUI

private enum WatchRoute: Hashable {
  case chrono
  case programs
  case history
  case raceDetail
}

private struct WatchProgram: Identifiable {
  let id: String
  let name: String
  let progressLabel: String
  let isSelected: Bool
}

private struct WatchHistoryItem: Identifiable {
  let id: String
  let title: String
  let subtitle: String
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
  private let programs = [
    WatchProgram(id: "marathon", name: "Marathon", progressLabel: "12/37", isSelected: true),
    WatchProgram(id: "semi", name: "Semi", progressLabel: "12/12", isSelected: false),
    WatchProgram(id: "remise-en-forme", name: "Remise en forme", progressLabel: "25/25", isSelected: false),
  ]

  var body: some View {
    WatchScreenShell(title: "Programmes") {
      VStack(spacing: 10) {
        ForEach(programs) { program in
          WatchProgramCard(program: program)
        }
      }
      .frame(maxWidth: .infinity, alignment: .top)
    }
  }
}

private struct WatchHistoryView: View {
  private let items = [
    WatchHistoryItem(id: "course-12", title: "Course 12", subtitle: "de Marathon"),
    WatchHistoryItem(id: "course-11", title: "Course 11", subtitle: "de Marathon"),
    WatchHistoryItem(id: "course-10", title: "Course 10", subtitle: "de Marathon"),
    WatchHistoryItem(id: "course-9", title: "Course 9", subtitle: "de Marathon"),
  ]

  var body: some View {
    WatchScreenShell(title: "Historique") {
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

private struct WatchRaceDetailView: View {
  var body: some View {
    WatchPlaceholderScreen(title: "Course")
  }
}

private struct WatchScreenShell<Content: View>: View {
  @Environment(\.dismiss) private var dismiss

  let title: String
  let content: Content

  init(title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  var body: some View {
    ZStack {
      Color.black
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
        VStack(alignment: .leading, spacing: 10) {
          HStack(spacing: 12) {
            Button {
              dismiss()
            } label: {
              Image(systemName: "arrow.left")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.black)
                .frame(width: 34, height: 34)
                .background(Color.white)
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Text(title)
              .font(.system(size: 20, weight: .bold))
              .foregroundStyle(.white)
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
  let program: WatchProgram

  var body: some View {
    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(program.name)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(.white)
          .lineLimit(2)

        Text(program.progressLabel)
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(.white.opacity(0.55))
      }

      Spacer(minLength: 0)

      if program.isSelected {
        WatchIconBadge(systemName: "bookmark.fill")
      }
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(Color.white.opacity(0.26))
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchHistoryCard: View {
  let item: WatchHistoryItem

  var body: some View {
    HStack(spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        Text(item.title)
          .font(.system(size: 16, weight: .medium))
          .foregroundStyle(.white)
          .lineLimit(1)

        Text(item.subtitle)
          .font(.system(size: 10, weight: .regular))
          .foregroundStyle(.white.opacity(0.55))
          .lineLimit(1)
      }

      Spacer(minLength: 0)

      WatchEllipsisBadge()
    }
    .padding(.horizontal, 14)
    .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
    .background(Color.white.opacity(0.26))
    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

private struct WatchIconBadge: View {
  let systemName: String

  var body: some View {
    Image(systemName: systemName)
      .font(.system(size: 18, weight: .semibold))
      .foregroundStyle(.white)
      .frame(width: 44, height: 44)
      .background(Color.white.opacity(0.2))
      .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}

private struct WatchEllipsisBadge: View {
  var body: some View {
    HStack(spacing: 4) {
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
      Circle()
        .frame(width: 5, height: 5)
    }
    .foregroundStyle(.white)
    .frame(width: 44, height: 44)
    .background(Color.white.opacity(0.2))
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }
}
