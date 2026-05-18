import SwiftUI

struct WorkoutStepsView: View {
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
          let stepLabel = step.label ?? (step.type == "walk" ? "Walk" : "Run")

          VStack(alignment: .leading, spacing: 6) {
            HStack {
              Label(stepLabel, systemImage: step.type == "walk" ? "figure.walk" : "bolt")
                .font(.system(size: 14, weight: .semibold))
              Spacer()
              Text("Step \(index + 1)")
                .font(.caption2)
                .foregroundStyle(isCurrent ? .white.opacity(0.8) : .secondary)
            }

            Text(formatWorkoutClock(step.durationSeconds))
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
