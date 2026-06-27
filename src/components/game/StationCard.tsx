import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadows } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { Pill } from '../ui/Pill';
import { ProgressBar } from '../ui/ProgressBar';
import { FloatingNumber } from '../ui/FloatingNumber';
import {
  STATION_CONFIGS,
  getCycleMs,
  getCoinsPerCycle,
  getUpgradeCost,
} from '../../constants/balance';
import { useGameStore, StationState } from '../../store/gameStore';
import { formatNumber } from '../../utils/formatNumber';

interface FloatItem {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface Props {
  station: StationState;
  index: number;
  rushMultiplier: number;
}

export const StationCard: React.FC<Props> = ({ station, index, rushMultiplier }) => {
  const config = STATION_CONFIGS[index];
  const { upgradeStation, unlockStation, coins } = useGameStore();
  const [floaters, setFloaters] = useState<FloatItem[]>([]);
  const prevCycleCount = useRef(station.cycleCount);

  const isLocked = station.level === 0;
  const cycleMs = isLocked ? config.baseCycleMs : getCycleMs(config, station.level, station.hasChef);
  const coinsPerCycle = isLocked
    ? config.baseCoinPerCycle
    : getCoinsPerCycle(config, station.level, station.hasManager) * rushMultiplier;
  const upgradeCost = getUpgradeCost(index, station.level);
  const canAffordUpgrade = coins >= upgradeCost;
  const canAffordUnlock = coins >= config.unlockCost;

  // Elapsed at mount
  const initialProgress = isLocked
    ? 0
    : Math.min((Date.now() - station.lastCycleStart) / cycleMs, 1);
  const remainingMs = isLocked ? 0 : Math.max(cycleMs - (Date.now() - station.lastCycleStart), 0);

  // Badge breathe animation
  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  // Detect new cycle → show floating number
  useEffect(() => {
    if (station.cycleCount > prevCycleCount.current && !isLocked) {
      prevCycleCount.current = station.cycleCount;
      const earned = coinsPerCycle;
      const id = `${Date.now()}-${Math.random()}`;
      setFloaters((prev) => [...prev, { id, amount: earned, x: 80, y: 50 }]);
    }
  }, [station.cycleCount, coinsPerCycle, isLocked]);

  const badgeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const removeFloater = useCallback((id: string) => {
    setFloaters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleUpgrade = useCallback(() => {
    upgradeStation(config.id);
  }, [config.id, upgradeStation]);

  const handleUnlock = useCallback(() => {
    unlockStation(config.id);
  }, [config.id, unlockStation]);

  return (
    <View style={[styles.card, shadows.e1, isLocked && styles.cardLocked]}>
      {/* Badge */}
      <Animated.View style={[styles.badge, { backgroundColor: config.color + '22' }, badgeAnim]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        {isLocked && <View style={styles.lockOverlay}><Text style={styles.lock}>🔒</Text></View>}
      </Animated.View>

      {/* Center info */}
      <View style={styles.center}>
        <Text style={[typography.h2, { color: isLocked ? colors.text.tertiary : colors.text.primary }]} numberOfLines={1}>
          {config.name}
        </Text>
        {!isLocked && (
          <Pill
            label={`Niv. ${station.level}`}
            bg={colors.olive.tint}
            textColor={colors.olive.dark}
            style={styles.levelPill}
          />
        )}
        <View style={styles.barRow}>
          {!isLocked && (
            <ProgressBar
              key={station.lastCycleStart}
              progress={initialProgress}
              duration={remainingMs}
              animateToFull={initialProgress < 1}
              color={config.color}
            />
          )}
          {isLocked && (
            <View style={[styles.lockedBar, { backgroundColor: colors.border.subtle }]} />
          )}
        </View>
        <Text style={[typography.micro, { color: colors.text.tertiary, marginTop: 2 }]}>
          {formatNumber(coinsPerCycle)} 🪙 / cycle
        </Text>
      </View>

      {/* Right action */}
      <View style={styles.right}>
        {isLocked ? (
          <Button
            variant={canAffordUnlock ? 'primary' : 'disabled'}
            size="small"
            label={formatNumber(config.unlockCost)}
            icon={<Text style={styles.coinIcon}>🪙</Text>}
            onPress={handleUnlock}
            disabled={!canAffordUnlock}
          />
        ) : (
          <Button
            variant={canAffordUpgrade ? 'secondary' : 'disabled'}
            size="small"
            label={formatNumber(upgradeCost)}
            icon={<Text style={styles.coinIcon}>🪙</Text>}
            onPress={handleUpgrade}
            disabled={!canAffordUpgrade}
          />
        )}
      </View>

      {/* Floating numbers */}
      {floaters.map((f) => (
        <FloatingNumber
          key={f.id}
          amount={f.amount}
          x={f.x}
          y={f.y}
          onDone={() => removeFloater(f.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm - 2,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 104,
    overflow: 'visible',
  },
  cardLocked: {
    opacity: 0.72,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 30,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,245,234,0.65)',
    borderRadius: 30,
  },
  lock: {
    fontSize: 22,
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  levelPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  barRow: {
    marginTop: spacing.xs,
  },
  lockedBar: {
    height: 7,
    borderRadius: 999,
    width: '100%',
  },
  right: {
    alignItems: 'flex-end',
  },
  coinIcon: {
    fontSize: 12,
  },
});
