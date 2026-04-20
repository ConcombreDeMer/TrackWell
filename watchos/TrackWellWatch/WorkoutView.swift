import SwiftUI

struct WorkoutView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared
  @State private var isTimelinePresented = false

  var body: some View {
    Group {
      if let snapshot = connectivity.snapshot {
        if snapshot.context == "empty" {
          VStack(spacing: 10) {
            Image(systemName: "checkmark.circle")
              .font(.system(size: 34, weight: .semibold))

            Text(snapshot.programName.isEmpty ? "TrackWell" : snapshot.programName)
              .font(.headline)
              .multilineTextAlignment(.center)

            Text("Aucune prochaine course.")
              .font(.caption2)
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
          .padding()
        } else if snapshot.context == "preview" {
          VStack(spacing: 10) {
            Text("Prochaine course")
              .font(.caption2)
              .foregroundStyle(.secondary)

            Text(snapshot.courseName)
              .font(.headline)
              .multilineTextAlignment(.center)

            Text(snapshot.programName)
              .font(.caption2)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)

            Text("Semaine \(snapshot.weekIndex)")
              .font(.caption2)
              .foregroundStyle(.secondary)

            Text(formatClock(snapshot.totalDurationSeconds))
              .font(.system(size: 30, weight: .semibold, design: .rounded))
              .monospacedDigit()

            Button("Lancer") {
              connectivity.send(.startWorkout)
            }
            .buttonStyle(.borderedProminent)

            Text("Demarre la seance sur l'iPhone.")
              .font(.caption2)
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
          .padding()
        } else if snapshot.state == "finished" {
          VStack(spacing: 12) {
            Image(systemName: "sparkles")
              .font(.system(size: 36, weight: .semibold))

            Text("Course terminee")
              .font(.caption2)
              .foregroundStyle(.secondary)

            Text("Felicitations")
              .font(.title3.weight(.bold))
              .multilineTextAlignment(.center)

            Text(snapshot.courseName)
              .font(.caption2)
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
          .padding()
        } else if snapshot.state == "countdown" {
          VStack(spacing: 10) {
            Text(snapshot.courseName)
              .font(.headline)
              .multilineTextAlignment(.center)

            Text("\(snapshot.countdownValue)")
              .font(.system(size: 46, weight: .bold, design: .rounded))
              .monospacedDigit()

            Text("Preparation")
              .font(.caption2)
              .foregroundStyle(.secondary)
          }
          .padding()
        } else {
          VStack(spacing: 10) {
            Text(snapshot.stepLabel)
              .font(.headline)

            Text(formatClock(snapshot.remainingSeconds))
              .font(.system(size: 34, weight: .semibold, design: .rounded))
              .monospacedDigit()

            Text("Step \(snapshot.currentStepIndex + 1)/\(snapshot.totalSteps)")
              .font(.caption2)
              .foregroundStyle(.secondary)

            HStack(spacing: 8) {
              Button(snapshot.state == "running" ? "Pause" : snapshot.state == "idle" ? "Start" : "Play") {
                connectivity.send(snapshot.state == "idle" ? .startWorkout : .togglePlayback)
              }
              .buttonStyle(.borderedProminent)

              Button("Skip") {
                connectivity.send(.skipStep)
              }
              .buttonStyle(.bordered)
            }

            Button("Reset") {
              connectivity.send(.resetWorkout)
            }
            .buttonStyle(.plain)
            .font(.caption2)

            Text("Glisse vers le haut pour voir les steps")
              .font(.system(size: 10))
              .multilineTextAlignment(.center)
              .foregroundStyle(.secondary)
          }
          .padding()
          .contentShape(Rectangle())
          .gesture(
            DragGesture(minimumDistance: 12)
              .onEnded { value in
                if value.translation.height < -24 {
                  isTimelinePresented = true
                }
              }
          )
          .sheet(isPresented: $isTimelinePresented) {
            WorkoutStepsView(snapshot: snapshot)
          }
        }
      } else {
        VStack(spacing: 8) {
          Text("TrackWell")
            .font(.headline)
          Text("Open the workout on iPhone to sync the timer.")
            .font(.caption2)
            .multilineTextAlignment(.center)
            .foregroundStyle(.secondary)
          Text(connectivity.debugStatus)
            .font(.system(size: 10))
            .multilineTextAlignment(.center)
            .foregroundStyle(.secondary)
        }
        .padding()
      }
    }
  }
}

private func formatClock(_ seconds: Int) -> String {
  let minutes = seconds / 60
  let remainingSeconds = seconds % 60
  return "\(minutes):\(String(format: "%02d", remainingSeconds))"
}

private struct WorkoutStepsView: View {
  let snapshot: WatchWorkoutSnapshot

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 10) {
        HStack {
          Text("Steps")
            .font(.headline)
          Spacer()
          Text("\(min(snapshot.currentStepIndex + 1, snapshot.totalSteps))/\(snapshot.totalSteps)")
            .font(.caption2)
            .foregroundStyle(.secondary)
        }

        ForEach(Array(snapshot.steps.enumerated()), id: \.element.id) { index, step in
          let isCurrent = index == snapshot.currentStepIndex

          VStack(alignment: .leading, spacing: 6) {
            HStack {
              Label(step.type == "walk" ? "Walk" : "Run", systemImage: step.type == "walk" ? "figure.walk" : "bolt")
                .font(.system(size: 14, weight: .semibold))
              Spacer()
              Text("Step \(index + 1)")
                .font(.caption2)
                .foregroundStyle(isCurrent ? .white.opacity(0.8) : .secondary)
            }

            Text(formatClock(step.durationSeconds))
              .font(.caption2)
              .foregroundStyle(isCurrent ? .white.opacity(0.9) : .secondary)

            if isCurrent {
              ProgressView(value: max(min(snapshot.progressPercent / 100, 1), 0))
                .tint(.white)
            }
          }
          .padding(10)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(isCurrent ? Color.accentColor : Color.white.opacity(0.08))
          .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
      }
      .padding()
    }
  }
}
