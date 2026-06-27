import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme/tokens';
import { GameModal } from '../ui/GameModal';
import { Button } from '../ui/Button';
import { useGameStore } from '../../store/gameStore';
import { DAILY_REWARD_AMOUNTS, DAILY_REWARD_GEMS } from '../../constants/balance';
import { formatNumber } from '../../utils/formatNumber';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<Props> = ({ visible, onClose }) => {
  const { dailyReward, claimDailyReward } = useGameStore();
  const currentDay = Math.min(dailyReward.streak, 7);

  const handleClaim = () => {
    claimDailyReward();
    onClose();
  };

  return (
    <GameModal visible={visible} onClose={onClose} dismissOnBackdrop={false}>
      <Text style={[typography.h1, styles.title]}>🎁 Récompense du Jour</Text>
      <Text style={[typography.body, styles.sub]}>
        Connecte-toi chaque jour pour des récompenses croissantes !
      </Text>
      <View style={styles.grid}>
        {DAILY_REWARD_AMOUNTS.map((coins, i) => {
          const day = i + 1;
          const isCurrent = day === currentDay || (currentDay === 0 && day === 1);
          const isClaimed = day < currentDay;
          const isFuture = !isCurrent && !isClaimed;
          const gems = DAILY_REWARD_GEMS[i];

          return (
            <View
              key={day}
              style={[
                styles.tile,
                shadows.e1,
                isCurrent && styles.tileCurrent,
                isClaimed && styles.tileClaimed,
                isFuture && styles.tileFuture,
              ]}
            >
              <Text style={styles.dayLabel}>J{day}</Text>
              <Text style={styles.tileEmoji}>{isClaimed ? '✓' : '🪙'}</Text>
              <Text style={[typography.micro, styles.tileAmount]}>
                {formatNumber(coins)}
              </Text>
              {gems > 0 && (
                <Text style={[typography.micro, { color: colors.gem.dark }]}>+{gems}💎</Text>
              )}
            </View>
          );
        })}
      </View>
      <Button
        variant="primary"
        label="Récupérer ma récompense"
        onPress={handleClaim}
        style={styles.claimBtn}
      />
    </GameModal>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  tile: {
    width: '13%',
    aspectRatio: 0.8,
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    minWidth: 40,
  },
  tileCurrent: {
    borderWidth: 2,
    borderColor: colors.terracotta.DEFAULT,
    backgroundColor: colors.terracotta.tint,
  },
  tileClaimed: {
    opacity: 0.5,
    backgroundColor: colors.surface.sunken,
  },
  tileFuture: {
    backgroundColor: colors.surface.sunken,
  },
  dayLabel: {
    ...typography.micro,
    color: colors.text.tertiary,
  },
  tileEmoji: {
    fontSize: 18,
    marginVertical: 2,
  },
  tileAmount: {
    color: colors.coin.dark,
  },
  claimBtn: {
    width: '100%',
  },
});
