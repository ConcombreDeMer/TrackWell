import SwiftUI

struct WatchChronoView: View {
  let onLeaveWorkout: () -> Void

  init(onLeaveWorkout: @escaping () -> Void = {}) {
    self.onLeaveWorkout = onLeaveWorkout
  }

  var body: some View {
    WorkoutView(onLeaveWorkout: onLeaveWorkout)
  }
}
