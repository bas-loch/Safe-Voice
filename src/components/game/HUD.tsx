import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme/tokens';
import { ZelligePattern } from '../ui/ZelligePattern';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/formatNumber';

interface Props {
  onSettingsPress?: () => void;
}

const AnimatedCoin: React.FC<{ value: number }> = ({ value }) => {
  const scale = useSharedValue(1);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
    }
    prevValue.current = value;
  }, [value]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[typography.bodyL, styles.coinText, anim]}>
      {formatNumber(value)}
    </Animated.Text>
  );
};

export const HUD: React.FC<Props> = ({ onSettingsPress }) => {
  const { coins, gems, restaurantName } = useGameStore();

  return (
    <View style={[styles.hud, shadows.e1]}>
      <ZelligePattern width={400} height={64} opacity={0.045} />

      {/* Coins pill */}
      <View style={[styles.pill, { backgroundColor: colors.coin.tint }]}>
        <Text style={styles.pillIcon}>🪙</Text>
        <AnimatedCoin value={coins} />
      </View>

      {/* Restaurant name */}
      <Text style={[typography.h2, styles.name]} numberOfLines={1}>
        {restaurantName}
      </Text>

      {/* Right: gems + settings */}
      <View style={styles.rightGroup}>
        <View style={[styles.pill, { backgroundColor: colors.gem.tint }]}>
          <Text style={styles.pillIcon}>💎</Text>
          <Text style={[typography.bodyL, styles.gemText]}>{formatNumber(gems)}</Text>
        </View>
        <TouchableOpacity onPress={onSettingsPress} style={styles.gear}>
          <Ionicons name="settings-outline" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hud: {
    height: 64,
    backgroundColor: colors.surface.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  pillIcon: {
    fontSize: 16,
  },
  coinText: {
    color: colors.text.onCoin,
    fontFamily: 'Baloo2_700Bold',
  },
  gemText: {
    color: colors.gem.dark,
    fontFamily: 'Baloo2_700Bold',
  },
  name: {
    flex: 1,
    textAlign: 'center',
    color: colors.text.primary,
    marginHorizontal: spacing.sm,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gear: {
    padding: 2,
  },
});
