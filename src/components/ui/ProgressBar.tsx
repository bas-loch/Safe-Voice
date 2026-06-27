import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '../../theme/tokens';

interface Props {
  progress: number; // 0 to 1 (static, used as target)
  duration?: number; // ms to animate to 1
  color?: string;
  height?: number;
  animateToFull?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  progress,
  duration = 0,
  color = colors.terracotta.DEFAULT,
  height = 7,
  animateToFull = false,
}) => {
  const fillW = useSharedValue(progress);

  useEffect(() => {
    if (animateToFull && duration > 0) {
      fillW.value = progress;
      fillW.value = withTiming(1, {
        duration: duration,
        easing: Easing.linear,
      });
    } else {
      fillW.value = withTiming(progress, { duration: 200, easing: Easing.out(Easing.quad) });
    }
  }, [progress, duration, animateToFull]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${Math.min(fillW.value, 1) * 100}%` as any,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: radius.pill }]}>
      <Animated.View
        style={[styles.fill, animStyle, { backgroundColor: color, borderRadius: radius.pill }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface.sunken,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
