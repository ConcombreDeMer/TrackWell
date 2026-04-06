import {
  SquircleButton as ExpoSquircleButton,
  SquircleButtonProps,
  SquircleView as ExpoSquircleView,
  SquircleViewProps,
} from "expo-squircle-view";

const DEFAULT_CORNER_SMOOTHING = 100;

export function SquircleView(props: SquircleViewProps) {
  return (
    <ExpoSquircleView
      cornerSmoothing={DEFAULT_CORNER_SMOOTHING}
      preserveSmoothing
      {...props}
    />
  );
}

export function SquircleButton(props: SquircleButtonProps) {
  return (
    <ExpoSquircleButton
      activeOpacity={0.9}
      cornerSmoothing={DEFAULT_CORNER_SMOOTHING}
      preserveSmoothing
      {...props}
    />
  );
}
