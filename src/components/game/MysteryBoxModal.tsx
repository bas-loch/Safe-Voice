import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableWithoutFeedback, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';
import { colors, typography, spacing, radius, shadows } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { useGameStore, MysteryReward } from '../../store/gameStore';
import { formatNumber } from '../../utils/formatNumber';
import { AdService } from '../../services/AdService';

const { width: SW } = Dimensions.get('window');

const RARITY_COLORS = {
  common: colors.rarity.common,
  rare: colors.rarity.rare,
  epic: colors.rarity.epic,
  legendary: colors.rarity.legendary,
};

const RARITY_LABELS = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: '✨ LÉGENDAIRE ✨',
};

// SVG Chest component
const Chest: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <Svg width={120} height={110} viewBox="0 0 120 110">
    {/* Body */}
    <Rect x={10} y={45} width={100} height={55} rx={8} fill="#8B5E3C" />
    <Rect x={10} y={45} width={100} height={55} rx={8} fill="url(#grad)" opacity={0.3} />
    {/* Metal band */}
    <Rect x={10} y={68} width={100} height={8} fill="#C8941F" />
    {/* Lock */}
    <Rect x={50} y={62} width={20} height={16} rx={4} fill={colors.coin.DEFAULT} />
    <Circle cx={60} cy={68} r={4} fill={colors.coin.dark} />
    {/* Lid */}
    <G transform={isOpen ? 'rotate(-35, 10, 45)' : ''}>
      <Rect x={10} y={18} width={100} height={30} rx={8} fill="#A67044" />
      <Rect x={10} y={18} width={100} height={30} rx={8} fill="#C8941F" opacity={0.2} />
      <Rect x={10} y={42} width={100} height={6} fill="#C8941F" />
    </G>
    {/* Hinges */}
    <Rect x={22} y={43} width={8} height={6} rx={2} fill={colors.coin.DEFAULT} />
    <Rect x={90} y={43} width={8} height={6} rx={2} fill={colors.coin.DEFAULT} />
  </Svg>
);


interface Props {
  visible: boolean;
  onClose: () => void;
  isCooldown?: boolean;
  cooldownRemaining?: number;
}

export const MysteryBoxModal: React.FC<Props> = ({
  visible,
  onClose,
  isCooldown = false,
  cooldownRemaining = 0,
}) => {
  const { openMysteryBox } = useGameStore();
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'burst' | 'reveal'>('idle');
  const [reward, setReward] = useState<MysteryReward | null>(null);
  const [particles, setParticles] = useState<{ id: string; color: string; tx: number; ty: number }[]>([]);

  const chestRotation = useSharedValue(0);
  const chestScale = useSharedValue(1);
  const rewardY = useSharedValue(60);
  const rewardOpacity = useSharedValue(0);
  const legendaryGlow = useSharedValue(0);
  const isOpen = phase === 'burst' || phase === 'reveal';

  useEffect(() => {
    if (!visible) {
      setPhase('idle');
      setReward(null);
      setParticles([]);
      chestRotation.value = 0;
      chestScale.value = 1;
      rewardY.value = 60;
      rewardOpacity.value = 0;
      legendaryGlow.value = 0;
    }
  }, [visible]);

  const handleTapChest = useCallback(() => {
    if (phase !== 'idle' || isCooldown) return;
    setPhase('shaking');

    // Shake animation
    chestRotation.value = withSequence(
      withTiming(6, { duration: 80 }),
      withTiming(-6, { duration: 80 }),
      withTiming(6, { duration: 80 }),
      withTiming(-6, { duration: 80 }),
      withTiming(0, { duration: 80 })
    );
    chestScale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );

    setTimeout(() => {
      const r = openMysteryBox();
      if (!r) return;
      setReward(r);
      setPhase('burst');

      // Spawn particles
      const rarityColor = RARITY_COLORS[r.rarity];
      const pts = Array.from({ length: 12 }, (_, i) => ({
        id: `p-${i}`,
        color: i % 2 === 0 ? rarityColor : colors.coin.DEFAULT,
        tx: Math.cos((i / 12) * Math.PI * 2) * 80,
        ty: Math.sin((i / 12) * Math.PI * 2) * 80 - 20,
      }));
      setParticles(pts);

      setTimeout(() => {
        setPhase('reveal');
        rewardOpacity.value = withTiming(1, { duration: 300 });
        rewardY.value = withSpring(0, { damping: 14, stiffness: 180 });
        if (r.rarity === 'legendary') {
          legendaryGlow.value = withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.4, { duration: 400 }),
            withTiming(1, { duration: 400 }),
            withTiming(0.6, { duration: 600 })
          );
        }
      }, 500);
    }, 500);
  }, [phase, isCooldown, openMysteryBox]);

  const chestAnim = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${chestRotation.value}deg` },
      { scale: chestScale.value },
    ],
  }));

  const rewardAnim = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ translateY: rewardY.value }],
  }));

  const glowAnim = useAnimatedStyle(() => ({
    opacity: legendaryGlow.value,
  }));

  const rarityColor = reward ? RARITY_COLORS[reward.rarity] : colors.border.subtle;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, shadows.e3]}>
          <Text style={[typography.h1, styles.title]}>🎁 Caisse Mystère</Text>

          {/* Chest area */}
          <View style={styles.chestArea}>
            {reward?.rarity === 'legendary' && (
              <Animated.View style={[styles.glow, { shadowColor: colors.rarity.legendary }, glowAnim]} />
            )}
            <TouchableWithoutFeedback onPress={handleTapChest} disabled={phase !== 'idle' || isCooldown}>
              <Animated.View style={chestAnim}>
                <Chest isOpen={isOpen} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>

          {/* Phase-specific content */}
          {phase === 'idle' && !isCooldown && (
            <Text style={[typography.bodyL, styles.hint]}>Tape le coffre pour l'ouvrir !</Text>
          )}

          {phase === 'idle' && isCooldown && (
            <View style={styles.cooldownInfo}>
              <Text style={[typography.bodyL, styles.hint]}>⏳ Prochain coffre dans</Text>
              <Text style={[typography.h2, { color: colors.terracotta.DEFAULT }]}>
                {Math.ceil(cooldownRemaining / 60000)} min
              </Text>
              <Button
                variant="primary"
                label="Ouvrir maintenant 📺"
                onPress={async () => {
                  const ok = await AdService.showRewardedAd();
                  if (ok) {
                    // Force bypass cooldown
                    const r = openMysteryBox();
                    if (r) {
                      setReward(r);
                      setPhase('reveal');
                      rewardOpacity.value = withTiming(1, { duration: 300 });
                      rewardY.value = withSpring(0, { damping: 14 });
                    }
                  }
                }}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}

          {/* Particles */}
          {phase === 'burst' &&
            particles.map((p, i) => (
              <ParticleView key={p.id} index={i} color={p.color} tx={p.tx} ty={p.ty} />
            ))}

          {/* Reward card */}
          {phase === 'reveal' && reward && (
            <Animated.View
              style={[styles.rewardCard, { borderColor: rarityColor }, rewardAnim]}
            >
              <Text style={[typography.label, { color: rarityColor, marginBottom: spacing.xs }]}>
                {RARITY_LABELS[reward.rarity]}
              </Text>
              <Text style={[typography.display, { color: colors.coin.dark }]}>
                +{formatNumber(reward.coins)} 🪙
              </Text>
              {reward.gems > 0 && (
                <Text style={[typography.h2, { color: colors.gem.dark, marginTop: spacing.xs }]}>
                  +{reward.gems} 💎
                </Text>
              )}
            </Animated.View>
          )}

          <View style={styles.footer}>
            {phase === 'reveal' ? (
              <Button variant="primary" label="Super !" onPress={onClose} />
            ) : (
              <Button variant="ghost" label="Fermer" onPress={onClose} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ParticleView: React.FC<{ index: number; color: string; tx: number; ty: number }> = ({
  index,
  color,
  tx,
  ty,
}) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const op = useSharedValue(1);

  useEffect(() => {
    x.value = withDelay(index * 20, withTiming(tx, { duration: 600, easing: Easing.out(Easing.quad) }));
    y.value = withDelay(index * 20, withTiming(ty, { duration: 600, easing: Easing.out(Easing.quad) }));
    op.value = withDelay(300, withTiming(0, { duration: 400 }));
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: color }, anim]}
    />
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  container: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  chestArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: spacing.md,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  hint: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cooldownInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rewardCard: {
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface.raised,
  },
  footer: {
    width: '100%',
  },
});
