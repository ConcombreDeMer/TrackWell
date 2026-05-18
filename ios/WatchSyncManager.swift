import Foundation
import WatchConnectivity

final class WatchSyncManager: NSObject, WCSessionDelegate {
  static let shared = WatchSyncManager()

  var onCommand: (([String: Any]) -> Void)?

  private let session: WCSession?

  private override init() {
    session = WCSession.isSupported() ? WCSession.default : nil
    super.init()
    activate()
  }

  func activate() {
    guard let session else {
      return
    }

    session.delegate = self
    session.activate()
  }

  func publishSession(_ payload: [String: Any]) {
    guard let session else {
      return
    }

    let message: [String: Any] = ["type": "session", "payload": payload]

    do {
      try session.updateApplicationContext(["session": payload])
    } catch {
      NSLog("WatchSyncManager updateApplicationContext failed: \(error.localizedDescription)")
    }

    guard session.isReachable else {
      return
    }

    session.sendMessage(message, replyHandler: nil) { error in
      NSLog("WatchSyncManager sendMessage failed: \(error.localizedDescription)")
    }
  }

  func sendCommand(_ payload: [String: Any]) {
    guard let session else {
      return
    }

    let message: [String: Any] = ["type": "command", "payload": payload]

    if session.isReachable {
      session.sendMessage(message, replyHandler: nil) { error in
        NSLog("WatchSyncManager command sendMessage failed: \(error.localizedDescription)")
      }
      return
    }

    do {
      try session.updateApplicationContext(["command": payload])
    } catch {
      NSLog("WatchSyncManager command updateApplicationContext failed: \(error.localizedDescription)")
    }
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if let error {
      NSLog("WatchSyncManager activation failed: \(error.localizedDescription)")
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    handleIncomingPayload(message)
  }

  func session(
    _ session: WCSession,
    didReceiveApplicationContext applicationContext: [String: Any]
  ) {
    handleIncomingPayload(applicationContext)
  }

  private func handleIncomingPayload(_ payload: [String: Any]) {
    if let command = payload["command"] as? [String: Any] {
      onCommand?(command)
      return
    }

    if let type = payload["type"] as? String,
       type == "command",
       let command = payload["payload"] as? [String: Any] {
      onCommand?(command)
    }
  }
}
