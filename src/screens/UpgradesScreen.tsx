import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { useGameStore } from '../store/gameStore';
import {
  STATION_CONFIGS,
  getUpgradeCost,
  getCycleMs,
  getCoinsPerCycle,
} from '../constants/balance';
import { formatNumber, formatTime } from '../utils/formatNumber';

export const UpgradesScreen: React.FC = () => {
  const { stations, coins, upgradeStation, unlockStation } = useGameStore();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[typography.h1, styles.sectionTitle]}>🔧 Améliorations</Text>

      {STATION_CONFIGS.map((config, idx) => {
        const station = stations[idx];
        const isLocked = station.level === 0;
        const cycleMs = isLocked ? config.baseCycleMs : getCycleMs(config, station.level, station.hasChef);
        const coinsPerCycle = isLocked
          ? config.baseCoinPerCycle
          : getCoinsPerCycle(config, station.level, station.hasManager);
        const upgradeCost = getUpgradeCost(idx, station.level);
        const canAfford = coins >= (isLocked ? config.unlockCost : upgradeCost);

        return (
          <View key={config.id} style={[styles.card, shadows.e1]}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
                <Text style={styles.emoji}>{config.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[typography.h2, { color: colors.text.primary }]}>{config.name}</Text>
                {!isLocked && (
                  <Pill
                    label={`Niveau ${station.level}`}
                    bg={colors.olive.tint}
                    textColor={colors.olive.dark}
                  />
                )}
              </View>
            </View>

            {isLocked ? (
              <View style={styles.lockedBanner}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>
                  🔒 Station non débloquée
                </Text>
                <Button
                  variant={canAfford ? 'primary' : 'disabled'}
                  size="small"
                  label={`Débloquer · ${formatNumber(config.unlockCost)} 🪙`}
                  onPress={() => unlockStation(config.id)}
                  disabled={!canAfford}
                />
              </View>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <StatBadge icon="🪙" label="Par cycle" value={formatNumber(coinsPerCycle)} color={colors.coin.dark} />
                  <StatBadge icon="⏱" label="Durée" value={formatTime(cycleMs)} color={colors.blue.dark} />
                  <StatBadge
                    icon="📈"
                    label="Niv. suivant"
                    value={`+${Math.round((getCoinsPerCycle(config, station.level + 1, station.hasManager) - coinsPerCycle) / coinsPerCycle * 100)}%`}
                    color={colors.olive.dark}
                  />
                </View>

                <Button
                  variant={canAfford ? 'secondary' : 'disabled'}
                  label={`Améliorer → Niv.${station.level + 1}  ·  ${formatNumber(upgradeCost)} 🪙`}
                  onPress={() => upgradeStation(config.id)}
                  disabled={!canAfford}
                  style={styles.upgradeBtn}
                />
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const StatBadge: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View style={styles.stat}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[typography.micro, { color: colors.text.tertiary }]}>{label}</Text>
    <Text style={[typography.label, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  sectionTitle: {
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  lockedBanner: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface.raised,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    fontSize: 18,
  },
  upgradeBtn: {
    width: '100%',
  },
});
