import Foundation
import React

@objc(WatchSyncModule)
final class WatchSyncModule: RCTEventEmitter {
  private var hasListeners = false
  private var pendingCommand: [String: Any]?

  override init() {
    super.init()

    WatchSyncManager.shared.onCommand = { [weak self] payload in
      DispatchQueue.main.async {
        guard let self else {
          return
        }

        guard self.hasListeners else {
          self.pendingCommand = payload
          return
        }

        self.sendEvent(withName: "watchCommand", body: payload)
      }
    }
  }

  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String]! {
    ["watchCommand"]
  }

  override func startObserving() {
    hasListeners = true

    if let pendingCommand {
      sendEvent(withName: "watchCommand", body: pendingCommand)
      self.pendingCommand = nil
    }
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(publishSession:)
  func publishSession(_ payload: NSDictionary) {
    WatchSyncManager.shared.publishSession(payload as? [String: Any] ?? [:])
  }

  @objc(sendCommand:)
  func sendCommand(_ payload: NSDictionary) {
    WatchSyncManager.shared.sendCommand(payload as? [String: Any] ?? [:])
  }
}
