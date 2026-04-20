import Foundation
import Combine
import WatchConnectivity

@MainActor
final class WatchConnectivityProvider: NSObject, ObservableObject, WCSessionDelegate {
  @Published var snapshot: WatchWorkoutSnapshot?
  @Published var debugStatus = "Starting WatchConnectivity..."

  static let shared = WatchConnectivityProvider()

  private let decoder = JSONDecoder()
  private let encoder = JSONEncoder()
  private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil

  private override init() {
    super.init()
    activate()
  }

  func activate() {
    guard let session else {
      debugStatus = "WCSession unsupported"
      return
    }

    session.delegate = self
    session.activate()
    debugStatus = "Activating session..."
  }

  func send(_ action: WatchCommandAction) {
    guard let session else {
      return
    }

    let payload = WatchCommandPayload(
      action: action,
      courseId: snapshot?.courseId,
      receivedAt: ISO8601DateFormatter().string(from: Date())
    )

    guard
      let data = try? encoder.encode(payload),
      let command = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return
    }

    let message: [String: Any] = ["type": "command", "payload": command]

    if session.isReachable {
      session.sendMessage(message, replyHandler: nil, errorHandler: nil)
    } else {
      do {
        try session.updateApplicationContext(["command": command])
      } catch {
        NSLog("WatchConnectivityProvider updateApplicationContext failed: \(error.localizedDescription)")
      }
    }
  }

  nonisolated func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    Task { @MainActor in
      if let error {
        self.debugStatus = "Activation failed: \(error.localizedDescription)"
        return
      }

      self.debugStatus = "Activated: state=\(activationState.rawValue) reachable=\(session.isReachable)"
    }
  }

  nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    Task { @MainActor in
      self.handleIncomingPayload(message)
    }
  }

  nonisolated func session(
    _ session: WCSession,
    didReceiveApplicationContext applicationContext: [String: Any]
  ) {
    Task { @MainActor in
      self.handleIncomingPayload(applicationContext)
    }
  }

  private func handleIncomingPayload(_ payload: [String: Any]) {
    if let sessionPayload = payload["session"] as? [String: Any] {
      applySnapshot(sessionPayload)
      return
    }

    if let type = payload["type"] as? String,
       type == "session",
       let sessionPayload = payload["payload"] as? [String: Any] {
      applySnapshot(sessionPayload)
    }
  }

  private func applySnapshot(_ payload: [String: Any]) {
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let snapshot = try? decoder.decode(WatchWorkoutSnapshot.self, from: data)
    else {
      debugStatus = "Received payload but failed to decode"
      return
    }

    self.snapshot = snapshot
    debugStatus = "Snapshot received at \(snapshot.updatedAt)"
  }
}
