import Foundation

@objc(WatchSyncModule)
final class WatchSyncModule: RCTEventEmitter {
  private var hasListeners = false

  override init() {
    super.init()

    WatchSyncManager.shared.onCommand = { [weak self] payload in
      guard let self, self.hasListeners else {
        return
      }

      self.sendEvent(withName: "watchCommand", body: payload)
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
