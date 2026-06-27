import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, shadows } from '../../theme/tokens';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/formatNumber';
import { SoundService } from '../../services/SoundService';

interface Props {
  reward: number;
  side: 'left' | 'right';
  onCollect: () => void;
}

const EMOJIS = ['🙋', '🧑', '👒', '🧕', '👨‍🍳', '🤵'];

export const LuckyCustomer: React.FC<Props> = ({ reward, side, onCollect }) => {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const translateX = useSharedValue(side === 'left' ? -80 : 80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    translateX.value = withSpring(0, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });

    // Auto-disappear after 6 seconds
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
      translateX.value = withTiming(side === 'left' ? -80 : 80, {
        duration: 400,
        easing: Easing.in(Easing.quad),
      });
      setTimeout(onCollect, 450);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleTap = useCallback(async () => {
    await SoundService.playLuckyCustomer();
    // Burst scale
    scale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
    );
    opacity.value = withTiming(0, { duration: 300 });
    setTimeout(onCollect, 320);
  }, [onCollect]);

  const posStyle = {
    [side]: 16,
    bottom: 160,
  };

  return (
    <Animated.View style={[styles.container, posStyle, shadows.e2, containerAnim]}>
      <TouchableOpacity onPress={handleTap} activeOpacity={0.8} style={styles.inner}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[typography.label, styles.reward]}>+{formatNumber(reward)} 🪙</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 200,
  },
  inner: {
    backgroundColor: colors.surface.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.coin.DEFAULT,
  },
  emoji: {
    fontSize: 26,
  },
  reward: {
    color: colors.coin.dark,
    marginTop: 2,
  },
});
