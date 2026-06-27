import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../theme/tokens';
import { GameModal } from '../ui/GameModal';
import { Button } from '../ui/Button';
import { useGameStore } from '../../store/gameStore';
import { formatNumber, formatDuration } from '../../utils/formatNumber';
import { AdService } from '../../services/AdService';

interface Props {
  visible: boolean;
  coins: number;
  timeAway: number;
  onClose: () => void;
}

export const OfflineGainsModal: React.FC<Props> = ({ visible, coins, timeAway, onClose }) => {
  const { applyOfflineGains, dismissOfflineGains } = useGameStore();
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(0.8),
        withSpring(1.08, { damping: 10 }),
        withSpring(1, { damping: 16 })
      );
    }
  }, [visible]);

  const coinAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCollect = () => {
    applyOfflineGains(1);
    onClose();
  };

  const handleDouble = async () => {
    const rewarded = await AdService.showRewardedAd();
    if (rewarded) {
      applyOfflineGains(2);
    } else {
      applyOfflineGains(1);
    }
    onClose();
  };

  return (
    <GameModal visible={visible} onClose={onClose} dismissOnBackdrop={false}>
      <View style={styles.content}>
        <Text style={styles.moon}>🌙</Text>
        <Text style={[typography.h1, styles.title]}>Pendant ton absence...</Text>
        <Text style={[typography.body, styles.sub]}>
          {formatDuration(timeAway)} de production accumulée
        </Text>
        <Animated.Text style={[typography.display, styles.amount, coinAnim]}>
          +{formatNumber(coins)} 🪙
        </Animated.Text>
        <View style={styles.buttons}>
          <Button
            variant="secondary"
            label="Récupérer"
            onPress={handleCollect}
            style={styles.btnHalf}
          />
          <Button
            variant="primary"
            label="Récupérer x2 📺"
            onPress={handleDouble}
            style={styles.btnHalf}
          />
        </View>
      </View>
    </GameModal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  moon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
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
  amount: {
    color: colors.coin.dark,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  btnHalf: {
    flex: 1,
  },
});
