import { AnimatedCircularProgress } from "react-native-circular-progress";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { colors } from "../../theme";

type WorkoutVisualState = "idle" | "running" | "paused";

type ChronoProgressRingProps = {
  progressPercent: number;
  secondaryLabel: string;
  timeLabel: string;
  visualState: WorkoutVisualState;
};

export function ChronoProgressRing({
  progressPercent,
  secondaryLabel,
  timeLabel,
  visualState,
}: ChronoProgressRingProps) {
  const pauseProgress = useRef(new Animated.Value(visualState === "paused" ? 1 : 0)).current;
  const inActiveStrokeColor =
    visualState === "paused" ? "rgba(180, 180, 180, 0.45)" : "rgba(213, 213, 213, 0.45)";

  useEffect(() => {
    Animated.timing(pauseProgress, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: visualState === "paused" ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [pauseProgress, visualState]);

  const overlayTone = visualState === "paused" ? "#202020" : colors.text;
  const centerBackgroundOpacity = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const pauseIconOpacity = pauseProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.15, 1],
  });
  const pauseIconTranslateY = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const timeTranslateY = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 22],
  });
  const timeScale = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.76],
  });
  const secondaryTranslateY = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });
  const secondaryOpacity = pauseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View pointerEvents="none" style={styles.ringWrap}>
        <AnimatedCircularProgress
          backgroundColor={inActiveStrokeColor}
          backgroundWidth={10}
          childrenContainerStyle={styles.progressChildren}
          fill={progressPercent}
          lineCap="round"
          padding={16}
          rotation={0}
          size={324}
          tintColor="rgba(94, 94, 94, 0.92)"
          width={16}
          duration={1000}
          easing={Easing.inOut(Easing.linear)}
        >
          {() => (
            <View pointerEvents="none" style={styles.centerContent}>
              <Animated.View
                style={[
                  styles.centerPauseBackdrop,
                  {
                    backgroundColor: "transparent",
                    opacity: centerBackgroundOpacity,
                    transform: [
                      {
                        scale: pauseProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.92, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.pauseIconRow,
                  {
                    opacity: pauseIconOpacity,
                    transform: [{ translateY: pauseIconTranslateY }],
                  },
                ]}
              >
                <View style={[styles.pauseBar, { backgroundColor: overlayTone }]} />
                <View style={[styles.pauseBar, { backgroundColor: overlayTone }]} />
              </Animated.View>

              {visualState === "idle" ? <View style={styles.playIcon} /> : null}

              <Animated.Text
                style={[
                  styles.timeLabel,
                  {
                    transform: [{ translateY: timeTranslateY }, { scale: timeScale }],
                  },
                ]}
              >
                {timeLabel}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.secondaryLabel,
                  {
                    opacity: secondaryOpacity,
                    transform: [{ translateY: secondaryTranslateY }],
                  },
                ]}
              >
                {secondaryLabel}
              </Animated.Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: "100%",
  },
  ringWrap: {
    alignItems: "center",
    height: 380,
    justifyContent: "center",
    width: 380,
  },
  centerContent: {
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minHeight: 236,
    minWidth: 236,
  },
  progressChildren: {
    overflow: "visible",
  },
  centerPauseBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
  },
  pauseIconRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: -4,
  },
  pauseBar: {
    borderRadius: 4,
    height: 82,
    width: 20,
  },
  playIcon: {
    borderBottomWidth: 28,
    borderLeftWidth: 48,
    borderRightWidth: 0,
    borderStyle: "solid",
    borderTopWidth: 28,
    borderBottomColor: "transparent",
    borderLeftColor: colors.text,
    borderTopColor: "transparent",
    height: 0,
    marginLeft: 8,
    width: 0,
  },
  timeLabel: {
    color: colors.text,
    fontSize: 88,
    fontWeight: "800",
    letterSpacing: -4.8,
    lineHeight: 94,
  },
  secondaryLabel: {
    color: "#8A8A8A",
    fontSize: 20,
    fontWeight: "500",
  },
});
