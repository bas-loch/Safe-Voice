import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { STATION_CONFIGS, STAFF_TYPES } from '../constants/balance';
import { formatNumber } from '../utils/formatNumber';

export const StaffScreen: React.FC = () => {
  const { stations, gems, hireChef, hireManager } = useGameStore();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[typography.h1, styles.title]}>👨‍🍳 Personnel</Text>
      <Text style={[typography.body, styles.sub]}>
        Embauchez du personnel pour booster votre production !
      </Text>

      {STATION_CONFIGS.map((config, idx) => {
        const station = stations[idx];
        const isLocked = station.level === 0;
        const chefCost = config.staffCostGems;
        const managerCost = Math.floor(config.staffCostGems * 1.5);

        return (
          <View key={config.id} style={[styles.card, shadows.e1, isLocked && { opacity: 0.55 }]}>
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
                <Text style={styles.emoji}>{config.emoji}</Text>
              </View>
              <Text style={[typography.h2, { color: colors.text.primary }]}>{config.name}</Text>
              {isLocked && (
                <View style={styles.lockedBadge}>
                  <Text style={[typography.micro, { color: colors.text.tertiary }]}>🔒</Text>
                </View>
              )}
            </View>

            <View style={styles.staffRow}>
              {/* Chef */}
              <View style={styles.staffSlot}>
                <Text style={styles.staffEmoji}>{STAFF_TYPES.chef.emoji}</Text>
                <Text style={[typography.bodyL, { color: colors.text.primary }]}>
                  {STAFF_TYPES.chef.name}
                </Text>
                <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
                  {STAFF_TYPES.chef.description}
                </Text>
                {station.hasChef ? (
                  <View style={[styles.hired, { backgroundColor: colors.success + '22' }]}>
                    <Text style={[typography.label, { color: colors.success }]}>✓ En poste</Text>
                  </View>
                ) : (
                  <Button
                    variant={gems >= chefCost && !isLocked ? 'premium' : 'disabled'}
                    size="small"
                    label={`${chefCost} 💎`}
                    onPress={() => hireChef(config.id)}
                    disabled={gems < chefCost || isLocked}
                  />
                )}
              </View>

              <View style={styles.divider} />

              {/* Manager */}
              <View style={styles.staffSlot}>
                <Text style={styles.staffEmoji}>{STAFF_TYPES.manager.emoji}</Text>
                <Text style={[typography.bodyL, { color: colors.text.primary }]}>
                  {STAFF_TYPES.manager.name}
                </Text>
                <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
                  {STAFF_TYPES.manager.description}
                </Text>
                {station.hasManager ? (
                  <View style={[styles.hired, { backgroundColor: colors.success + '22' }]}>
                    <Text style={[typography.label, { color: colors.success }]}>✓ En poste</Text>
                  </View>
                ) : (
                  <Button
                    variant={gems >= managerCost && !isLocked ? 'premium' : 'disabled'}
                    size="small"
                    label={`${managerCost} 💎`}
                    onPress={() => hireManager(config.id)}
                    disabled={gems < managerCost || isLocked}
                  />
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingVertical: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  title: {
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.text.secondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  lockedBadge: {
    marginLeft: 'auto',
  },
  staffRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  staffSlot: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.raised,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  staffEmoji: {
    fontSize: 32,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    alignSelf: 'stretch',
  },
  hired: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
