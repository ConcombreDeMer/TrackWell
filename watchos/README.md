# TrackWell watchOS MVP

This folder contains the first SwiftUI files for the Apple Watch MVP.

Current scope:
- receive the live chrono snapshot from the iPhone app
- display the current step and remaining time
- send `start`, `play/pause`, `skip`, and `reset` commands back to the iPhone

Before it can run in Xcode, these files still need to be added to a real `watchOS` target:
- create a new `watchOS App` target in Xcode
- add the files from `watchos/TrackWellWatch`
- keep the iPhone app target as the `WatchConnectivity` host
