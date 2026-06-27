import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { RUSH_HOUR_DURATION_MS } from '../../constants/balance';

const { width: SW } = Dimensions.get('window');
const CIRCLE_R = 18;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

interface Props {
  visible: boolean;
  endsAt: number;
}

export const RushHourBanner: React.FC<Props> = ({ visible, endsAt }) => {
  const translateY = useSharedValue(-120);
  const pulse = useSharedValue(1);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
      const remaining = endsAt - Date.now();
      progress.value = remaining / RUSH_HOUR_DURATION_MS;
      progress.value = withTiming(0, { duration: remaining, easing: Easing.linear });
    } else {
      translateY.value = withTiming(-120, { duration: 300 });
      pulse.value = 1;
    }
  }, [visible, endsAt]);

  const bannerAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: pulse.value }],
  }));

  const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const dashOffset = CIRCUMFERENCE * (1 - progress.value);

  return (
    <Animated.View style={[styles.banner, bannerAnim]} pointerEvents="none">
      <Text style={[typography.label, styles.label]}>⚡ RUSH HOUR · x2</Text>
      <View style={styles.timerWrap}>
        <Svg width={44} height={44} viewBox="0 0 44 44">
          <Circle
            cx={22}
            cy={22}
            r={CIRCLE_R}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={3}
            fill="transparent"
          />
          <Circle
            cx={22}
            cy={22}
            r={CIRCLE_R}
            stroke="white"
            strokeWidth={3}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - CIRCUMFERENCE * ((endsAt - Date.now()) / RUSH_HOUR_DURATION_MS)}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
          />
        </Svg>
        <Text style={styles.timer}>{remaining}s</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 68,
    left: spacing.lg,
    right: spacing.lg,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.terracotta.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 100,
    overflow: 'hidden',
  },
  label: {
    color: colors.text.onColor,
    letterSpacing: 1,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    position: 'absolute',
    ...typography.micro,
    color: colors.text.onColor,
    fontFamily: 'Baloo2_700Bold',
  },
});
