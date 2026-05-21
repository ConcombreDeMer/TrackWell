import SwiftUI
import WatchKit

struct WorkoutView: View {
  @StateObject private var connectivity = WatchConnectivityProvider.shared

  let onLeaveWorkout: () -> Void

  init(onLeaveWorkout: @escaping () -> Void = {}) {
    self.onLeaveWorkout = onLeaveWorkout
  }

  var body: some View {
    Group {
      if let snapshot = connectivity.snapshot {
        WatchWorkoutContent(
          snapshot: snapshot,
          connectivity: connectivity,
          onLeaveWorkout: onLeaveWorkout
        )
      } else {
        WatchNoWorkoutView(status: connectivity.debugStatus)
      }
    }
    .toolbar(.hidden, for: .navigationBar)
  }
}

private func playWorkoutHaptic(_ type: WKHapticType) {
  WKInterfaceDevice.current().play(type)
}

private enum WatchWorkoutTransitionState: Equatable {
  case none
  case starting
  case leaving
}

private struct WatchWorkoutContent: View {
  let snapshot: WatchWorkoutSnapshot
  let connectivity: WatchConnectivityProvider
  let onLeaveWorkout: () -> Void

  @State private var transitionState: WatchWorkoutTransitionState = .none

  var body: some View {
    ZStack {
      Color.black
        .ignoresSafeArea()

      if transitionState == .leaving {
        WatchLeavingWorkoutView()
      } else if transitionState == .starting && snapshot.state != "countdown" && snapshot.state != "running" {
        WatchCountdownWorkoutView(countdownValue: 3)
      } else if snapshot.context == "empty" {
        WatchEmptyWorkoutView(snapshot: snapshot)
      } else if snapshot.context == "preview" {
        WatchPreviewWorkoutView(snapshot: snapshot, onStartWorkout: startWorkout)
      } else if snapshot.state == "finished" {
        WatchFinishedWorkoutView(snapshot: snapshot, onTap: onLeaveWorkout)
      } else if snapshot.state == "countdown" {
        WatchCountdownWorkoutView(countdownValue: snapshot.countdownValue)
      } else {
        TabView {
          WatchChronoHero(
            snapshot: snapshot,
            connectivity: connectivity,
            onStartWorkout: startWorkout,
            onConfirmLeaveWorkout: leaveWorkout
          )

          WatchStepsTabPage(snapshot: snapshot)
        }
        .tabViewStyle(.verticalPage)
      }
    }
    .animation(.easeInOut(duration: 0.16), value: snapshot.state)
    .animation(.easeInOut(duration: 0.16), value: transitionState)
    .onChange(of: snapshot.state) { newState in
      if transitionState == .starting && (newState == "countdown" || newState == "running") {
        transitionState = .none
      }
    }
  }

  private func startWorkout() {
    transitionState = .starting
    playWorkoutHaptic(.start)
    connectivity.send(.startWorkout)
  }

  private func leaveWorkout() {
    transitionState = .leaving
    playWorkoutHaptic(.stop)
    connectivity.send(.resetWorkout)

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
      onLeaveWorkout()
      transitionState = .none
    }
  }
}

private struct WatchChronoHero: View {
  let snapshot: WatchWorkoutSnapshot
  let connectivity: WatchConnectivityProvider
  let onStartWorkout: () -> Void
  let onConfirmLeaveWorkout: () -> Void
  @State private var shouldResumeAfterExitAlert = false
  @State private var isExitAlertPresented = false

  private var progress: Double {
    if snapshot.state == "countdown" {
      return max(0, min(Double(4 - snapshot.countdownValue) / 3, 1))
    }

    return max(0, min(snapshot.progressPercent / 100, 1))
  }

  private var metricValueLabel: String {
    if snapshot.state == "countdown" {
      return "\(snapshot.countdownValue)"
    }

    guard let target = snapshot.activeStepTarget else {
      return formatWorkoutClock(snapshot.remainingSeconds)
    }

    if target.unit == "duration" {
      return formatWorkoutClock(snapshot.remainingSeconds)
    }

    if target.unit == "repetitions" {
      return String(Int(target.value.rounded()))
    }

    if target.unit == "kilometers" {
      let completedKilometers = min((snapshot.stepDistanceMeters ?? 0) / 1000, target.value)
      return formatWatchDistanceMetricValue(completedKilometers)
    }

    return nonEmpty(snapshot.primaryProgressLabel) ?? formatWorkoutClock(snapshot.remainingSeconds)
  }

  private var metricUnitLabel: String? {
    guard snapshot.state != "countdown", let target = snapshot.activeStepTarget else {
      return nil
    }

    if target.unit == "repetitions" {
      return Int(target.value.rounded()) == 1 ? "rep" : "reps"
    }

    if target.unit == "kilometers" {
      return "km"
    }

    return nil
  }

  private var metricDetailLabel: String? {
    guard snapshot.state != "countdown", snapshot.activeStepTarget?.unit == "kilometers" else {
      return nil
    }

    return nonEmpty(snapshot.primaryProgressLabel)
  }

  private var targetLabel: String {
    let stepCount = "Step \(min(snapshot.currentStepIndex + 1, max(snapshot.totalSteps, 1)))/\(max(snapshot.totalSteps, 1))"

    guard let activeStepTargetLabel = nonEmpty(snapshot.activeStepTargetLabel) else {
      return stepCount
    }

    return "\(stepCount) - \(activeStepTargetLabel)"
  }

  private var stepLabel: String {
    snapshot.stepLabel.isEmpty ? (snapshot.stepType == "walk" ? "Walk" : "Run") : snapshot.stepLabel
  }

  private var stepIcon: String {
    snapshot.stepType == "walk" ? "figure.walk" : "figure.run"
  }

  var body: some View {
    VStack(spacing: 0) {
      Spacer(minLength: 0)

      ZStack {
        WatchStepProgressRing(progress: progress, isPaused: snapshot.state == "paused")
          .frame(width: 136, height: 136)

        VStack(spacing: 3) {
          if snapshot.state != "countdown" {
            Label(stepLabel, systemImage: stepIcon)
              .font(.system(size: 11, weight: .semibold))
              .foregroundStyle(.white)
              .labelStyle(.titleAndIcon)
              .lineLimit(1)
              .minimumScaleFactor(0.75)
          }

          VStack(spacing: 0) {
            HStack(alignment: .lastTextBaseline, spacing: 4) {
              Text(metricValueLabel)
                .font(.system(size: snapshot.state == "countdown" ? 56 : 43, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.58)

              if let metricUnitLabel {
                Text(metricUnitLabel)
                  .font(.system(size: 17, weight: .bold, design: .rounded))
                  .foregroundStyle(.white.opacity(0.72))
                  .lineLimit(1)
                  .minimumScaleFactor(0.7)
              }
            }

            if let metricDetailLabel {
              Text(metricDetailLabel)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(.white.opacity(0.48))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.top, -2)
            }
          }

          if snapshot.state != "countdown" {
            Text(targetLabel)
              .font(.system(size: 10, weight: .medium))
              .foregroundStyle(.white.opacity(0.45))
              .lineLimit(1)
              .minimumScaleFactor(0.75)
          }
        }
        .padding(.horizontal, 18)
      }

      Spacer(minLength: 14)

      if snapshot.state == "countdown" {
        Text("Preparation")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(.white.opacity(0.55))
      } else {
        WatchChronoControls(
          snapshot: snapshot,
          onRequestExit: presentExitAlert,
          onTogglePlayback: {
            if snapshot.state == "idle" {
              onStartWorkout()
            } else {
              connectivity.send(.togglePlayback)
            }
          },
          onSkipStep: {
            connectivity.send(.skipStep)
          },
          onValidateRepetitions: {
            connectivity.send(.validateRepetitions)
          }
        )
      }

      Image(systemName: "chevron.up")
        .font(.system(size: 17, weight: .bold))
        .foregroundStyle(.white.opacity(0.9))
        .padding(.top, 10)
        .padding(.bottom, 2)
    }
    .padding(.horizontal, 10)
    .alert("Leave workout?", isPresented: $isExitAlertPresented) {
      Button("Leave workout", role: .destructive) {
        shouldResumeAfterExitAlert = false
        onConfirmLeaveWorkout()
      }

      Button("Keep going", role: .cancel) {
        if shouldResumeAfterExitAlert {
          connectivity.send(.togglePlayback)
        }

        shouldResumeAfterExitAlert = false
      }
    } message: {
      Text("You are about to leave this workout. Do you want to leave or continue the timer?")
    }
  }

  private func presentExitAlert() {
    shouldResumeAfterExitAlert = snapshot.state == "running"

    if snapshot.state == "running" {
      connectivity.send(.togglePlayback)
    }

    isExitAlertPresented = true
  }
}

private struct WatchStepProgressRing: View {
  let progress: Double
  let isPaused: Bool

  var body: some View {
    GeometryReader { proxy in
      let diameter = min(proxy.size.width, proxy.size.height)
      let dotSize = max(diameter * 0.09, 13)
      let lineWidth = max(diameter * 0.04, 6)

      ZStack {
        Circle()
          .stroke(.white.opacity(0.18), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

        Circle()
          .trim(from: 0, to: progress)
          .stroke(
            isPaused ? .white.opacity(0.55) : .white,
            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
          )
          .rotationEffect(.degrees(-90))
          .animation(.easeInOut(duration: 0.35), value: progress)

        Circle()
          .fill(.white)
          .frame(width: dotSize, height: dotSize)
          .offset(y: -diameter / 2)
          .rotationEffect(.degrees(progress * 360))
          .opacity(progress > 0 && progress < 1 ? 1 : 0)
          .animation(.easeInOut(duration: 0.35), value: progress)
      }
      .frame(width: diameter, height: diameter)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

private struct WatchChronoControls: View {
  let snapshot: WatchWorkoutSnapshot
  let onRequestExit: () -> Void
  let onTogglePlayback: () -> Void
  let onSkipStep: () -> Void
  let onValidateRepetitions: () -> Void

  private var playbackIcon: String {
    snapshot.state == "running" ? "pause.fill" : "play.fill"
  }

  private var shouldShowValidateButton: Bool {
    snapshot.activeStepTarget?.unit == "repetitions" && snapshot.state != "idle"
  }

  var body: some View {
    HStack(spacing: 10) {
      Button {
        playWorkoutHaptic(.click)
        onRequestExit()
      } label: {
        Image(systemName: "stop.fill")
          .font(.system(size: 15, weight: .bold))
          .frame(maxWidth: .infinity)
          .frame(height: 40)
      }
      .buttonStyle(.plain)
      .foregroundStyle(.white)
      .background(.white.opacity(0.22))
      .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))

      Button {
        playWorkoutHaptic(snapshot.state == "running" ? .click : .start)
        onTogglePlayback()
      } label: {
        Image(systemName: playbackIcon)
          .font(.system(size: 21, weight: .bold))
          .frame(maxWidth: .infinity)
          .frame(height: 40)
      }
      .buttonStyle(.plain)
      .foregroundStyle(.white)
      .background(.white.opacity(0.22))
      .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))

      if shouldShowValidateButton {
        Button {
          playWorkoutHaptic(.success)
          onValidateRepetitions()
        } label: {
          Image(systemName: "checkmark")
            .font(.system(size: 18, weight: .bold))
            .frame(maxWidth: .infinity)
            .frame(height: 40)
        }
        .buttonStyle(.plain)
        .foregroundStyle(.black)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
      }

      Button {
        playWorkoutHaptic(.directionUp)
        onSkipStep()
      } label: {
        Image(systemName: "forward.fill")
          .font(.system(size: 18, weight: .bold))
          .frame(maxWidth: .infinity)
          .frame(height: 40)
      }
      .buttonStyle(.plain)
      .foregroundStyle(.white)
      .background(.white.opacity(0.22))
      .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
    }
  }
}

private struct WatchStepsTabPage: View {
  let snapshot: WatchWorkoutSnapshot

  var body: some View {
    ScrollView(.vertical, showsIndicators: true) {
      VStack(alignment: .leading, spacing: 8) {
        HStack(alignment: .firstTextBaseline) {
          Text("Steps")
            .font(.system(size: 17, weight: .bold))
            .foregroundStyle(.white)

          Spacer(minLength: 6)

          Text("\(min(snapshot.currentStepIndex + 1, max(snapshot.totalSteps, 1)))/\(max(snapshot.totalSteps, 1))")
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.white.opacity(0.55))
        }
        .padding(.horizontal, 4)

        ForEach(Array(snapshot.steps.enumerated()), id: \.element.id) { index, step in
          WatchStepRow(
            index: index,
            progress: snapshot.progressPercent / 100,
            snapshot: snapshot,
            step: step
          )
        }
      }
      .padding(.horizontal, 10)
      .padding(.top, 8)
      .padding(.bottom, 12)
    }
    .background(Color.black)
  }
}

private struct WatchStepRow: View {
  let index: Int
  let progress: Double
  let snapshot: WatchWorkoutSnapshot
  let step: WatchStepSnapshot

  private var isCurrent: Bool {
    index == snapshot.currentStepIndex
  }

  private var isDone: Bool {
    index < snapshot.currentStepIndex
  }

  private var label: String {
    step.label ?? (step.type == "walk" ? "Walk" : "Run")
  }

  private var icon: String {
    isDone ? "checkmark" : step.type == "walk" ? "figure.walk" : "figure.run"
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 8) {
        Image(systemName: icon)
          .font(.system(size: 13, weight: .bold))
          .foregroundStyle(isCurrent ? .black : .white)
          .frame(width: 25, height: 25)
          .background(isCurrent ? .white : .white.opacity(isDone ? 0.3 : 0.12))
          .clipShape(Circle())

        VStack(alignment: .leading, spacing: 2) {
          Text(label)
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(.white)
            .lineLimit(1)
            .minimumScaleFactor(0.75)

          Text("Step \(index + 1) - \(formatWatchStepTarget(step))")
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.white.opacity(0.52))
        }

        Spacer(minLength: 0)
      }

      if isCurrent {
        ProgressView(value: max(0, min(progress, 1)))
          .tint(.white)
          .background(.white.opacity(0.14))
          .clipShape(Capsule())
      }
    }
    .padding(10)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(isCurrent ? .white.opacity(0.2) : .white.opacity(0.08))
    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
  }
}

private struct WatchPreviewWorkoutView: View {
  let snapshot: WatchWorkoutSnapshot
  let onStartWorkout: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      Spacer(minLength: 0)

      Button {
        onStartWorkout()
      } label: {
        Image(systemName: "play.fill")
          .font(.system(size: 62, weight: .bold))
          .foregroundStyle(.white)
          .frame(width: 150, height: 150)
          .background(.white.opacity(0.22))
          .clipShape(Circle())
      }
      .buttonStyle(.plain)

      Spacer(minLength: 8)

      Image(systemName: "chevron.up")
        .font(.system(size: 17, weight: .bold))
        .foregroundStyle(.white.opacity(0.9))
        .padding(.bottom, 4)
    }
    .padding(.horizontal, 10)
  }
}

private struct WatchCountdownWorkoutView: View {
  let countdownValue: Int

  var body: some View {
    VStack(spacing: 0) {
      Spacer(minLength: 0)

      WatchStepProgressRing(progress: countdownProgress, isPaused: false)
        .frame(width: 136, height: 136)
        .overlay {
          Text("\(safeCountdownValue)")
            .font(.system(size: 58, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(.white)
        }

      Spacer(minLength: 14)

      Text("Preparation")
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(.white.opacity(0.55))
        .padding(.bottom, 28)
    }
    .padding(.horizontal, 10)
  }

  private var safeCountdownValue: Int {
    max(countdownValue, 1)
  }

  private var countdownProgress: Double {
    max(0, min(Double(4 - safeCountdownValue) / 3, 1))
  }
}

private struct WatchLeavingWorkoutView: View {
  var body: some View {
    Color.black
      .ignoresSafeArea()
  }
}

private struct WatchFinishedWorkoutView: View {
  let snapshot: WatchWorkoutSnapshot
  let onTap: () -> Void

  var body: some View {
    VStack(spacing: 10) {
      WatchStepProgressRing(progress: 1, isPaused: false)
        .frame(width: 120, height: 120)
        .overlay {
          Image(systemName: "checkmark")
            .font(.system(size: 38, weight: .bold))
            .foregroundStyle(.white)
        }

      Text("Course terminee")
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(.white.opacity(0.55))

      Text(snapshot.courseName)
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(.white)
        .multilineTextAlignment(.center)
        .lineLimit(2)
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .contentShape(Rectangle())
    .onTapGesture {
      onTap()
    }
  }
}

private struct WatchEmptyWorkoutView: View {
  let snapshot: WatchWorkoutSnapshot

  var body: some View {
    VStack(spacing: 10) {
      Image(systemName: "checkmark.circle")
        .font(.system(size: 38, weight: .semibold))
        .foregroundStyle(.white)

      Text(snapshot.programName.isEmpty ? "TrackWell" : snapshot.programName)
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(.white)
        .multilineTextAlignment(.center)
        .lineLimit(2)

      Text("Aucune prochaine course.")
        .font(.system(size: 11, weight: .medium))
        .multilineTextAlignment(.center)
        .foregroundStyle(.white.opacity(0.55))
    }
    .padding()
  }
}

private struct WatchNoWorkoutView: View {
  let status: String

  var body: some View {
    ZStack {
      Color.black
        .ignoresSafeArea()

      VStack(spacing: 8) {
        Text("TrackWell")
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(.white)

        Text("Open the workout on iPhone to sync the timer.")
          .font(.system(size: 11, weight: .medium))
          .multilineTextAlignment(.center)
          .foregroundStyle(.white.opacity(0.55))

        Text(status)
          .font(.system(size: 9, weight: .regular))
          .multilineTextAlignment(.center)
          .foregroundStyle(.white.opacity(0.4))
      }
      .padding()
    }
  }
}

func formatWorkoutClock(_ seconds: Int) -> String {
  let minutes = seconds / 60
  let remainingSeconds = seconds % 60
  return "\(minutes):\(String(format: "%02d", remainingSeconds))"
}

private func nonEmpty(_ value: String?) -> String? {
  guard let value, !value.isEmpty else {
    return nil
  }

  return value
}

private func formatWatchStepTarget(_ step: WatchStepSnapshot) -> String {
  guard let target = step.target else {
    return formatWorkoutClock(step.durationSeconds)
  }

  if target.unit == "duration" {
    return formatWorkoutClock(Int(target.value.rounded()))
  }

  if target.unit == "repetitions" {
    let repetitions = Int(target.value.rounded())
    return "\(repetitions) \(repetitions == 1 ? "rep" : "reps")"
  }

  if target.unit == "kilometers" {
    return "\(formatWatchDecimal(target.value)) km"
  }

  return formatWorkoutClock(step.durationSeconds)
}

private func formatWatchDecimal(_ value: Double) -> String {
  if value.rounded() == value {
    return String(Int(value))
  }

  return String(format: "%.1f", value)
}

private func formatWatchDistanceMetricValue(_ value: Double) -> String {
  if value == 0 {
    return "0.00"
  }

  if value < 10 {
    let formattedValue = String(format: "%.2f", value)
    return formattedValue
      .replacingOccurrences(of: "0+$", with: "", options: .regularExpression)
      .replacingOccurrences(of: "\\.$", with: "", options: .regularExpression)
  }

  return formatWatchDecimal(value)
}
