import { useRef } from "react";
import { Animated, GestureResponderEvent } from "react-native";
import {
  SquircleButton as ExpoSquircleButton,
  SquircleButtonProps,
  SquircleView as ExpoSquircleView,
  SquircleViewProps,
} from "expo-squircle-view";

const DEFAULT_CORNER_SMOOTHING = 100;
const DEFAULT_PRESS_SCALE = 0.965;
const AnimatedExpoSquircleButton = Animated.createAnimatedComponent(ExpoSquircleButton);

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
  const scale = useRef(new Animated.Value(1)).current;
  const { onPressIn, onPressOut, style, ...restProps } = props;

  function animateScale(toValue: number) {
    Animated.spring(scale, {
      damping: 18,
      mass: 0.5,
      stiffness: 420,
      toValue,
      useNativeDriver: true,
    }).start();
  }

  function handlePressIn(event: GestureResponderEvent) {
    animateScale(DEFAULT_PRESS_SCALE);
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    animateScale(1);
    onPressOut?.(event);
  }

  return (
    <AnimatedExpoSquircleButton
      activeOpacity={1}
      cornerSmoothing={DEFAULT_CORNER_SMOOTHING}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      preserveSmoothing
      style={[style, { transform: [{ scale }] }]}
      {...restProps}
    />
  );
}
