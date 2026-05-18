# TrackWell watchOS MVP

This folder contains the first SwiftUI files for the Apple Watch MVP.

Current scope:
- receive the live chrono snapshot from the iPhone app
- display the current step and remaining time
- send `start`, `play/pause`, `skip`, and `reset` commands back to the iPhone

Source layout:
- `App`: app entry point, root navigation, and routes
- `Features`: screens grouped by watch feature
- `Shared`: reusable SwiftUI building blocks
- `Models`, `Services`, and `Theme`: data contracts, sync, and appearance settings
