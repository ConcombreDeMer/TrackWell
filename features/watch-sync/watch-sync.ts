import { NativeEventEmitter, NativeModules, Platform } from "react-native";

import { WatchCommand, WatchWorkoutSnapshot } from "./types";

type NativeWatchSyncModule = {
  publishSession: (payload: WatchWorkoutSnapshot) => void;
  sendCommand?: (payload: WatchCommand) => void;
};

const nativeModule = NativeModules.WatchSyncModule as NativeWatchSyncModule | undefined;
const isNativeWatchSyncAvailable = Platform.OS === "ios" && Boolean(nativeModule);
const nativeEmitter =
  isNativeWatchSyncAvailable && nativeModule ? new NativeEventEmitter(nativeModule as never) : null;

export function publishWatchSession(payload: WatchWorkoutSnapshot | null) {
  if (!payload || !isNativeWatchSyncAvailable || !nativeModule) {
    return;
  }

  nativeModule.publishSession(payload);
}

export function addWatchCommandListener(listener: (command: WatchCommand) => void) {
  if (!nativeEmitter) {
    return () => undefined;
  }

  const subscription = nativeEmitter.addListener("watchCommand", listener);
  return () => subscription.remove();
}

export function sendWatchCommand(payload: WatchCommand) {
  if (!isNativeWatchSyncAvailable || !nativeModule?.sendCommand) {
    return;
  }

  nativeModule.sendCommand(payload);
}

export function isWatchSyncAvailable() {
  return isNativeWatchSyncAvailable;
}
