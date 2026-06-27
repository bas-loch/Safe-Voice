import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, typography } from '../../theme/tokens';
import { formatNumber } from '../../utils/formatNumber';

interface Props {
  amount: number;
  x: number;
  y: number;
  onDone: () => void;
}

const JITTER = 10;

export const FloatingNumber: React.FC<Props> = ({ amount, x, y, onDone }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const jitter = useRef((Math.random() - 0.5) * JITTER * 2).current;

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 230, easing: Easing.out(Easing.quad) })
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 100 }),
      withTiming(0.8, { duration: 500 })
    );
    translateY.value = withTiming(-56, {
      duration: 750,
      easing: Easing.out(Easing.quad),
    });
    const timer = setTimeout(onDone, 780);
    return () => clearTimeout(timer);
  }, []);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: jitter },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    // pointerEvents="none" sur la View (prop RN, pas dans style)
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { left: x - 30, top: y - 10 }, anim]}
    >
      <Text style={styles.text}>+{formatNumber(amount)} 🪙</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  text: {
    ...typography.h2,
    color: colors.coin.dark,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
