import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { SHOP_GEM_PACKS } from '../constants/balance';
import { IAPService } from '../services/IAPService';
import { AdService } from '../services/AdService';

const BOOST_ITEMS = [
  { id: 'boost_2x', emoji: '⚡', name: 'Rush Hour Instantané', desc: 'Active un Rush Hour x2 maintenant', cost: 10, costType: 'gems' as const },
  { id: 'boost_coins', emoji: '💰', name: 'Pluie de Pièces', desc: '+500 pièces instantanément', cost: 5, costType: 'gems' as const },
  { id: 'boost_offline', emoji: '🌙', name: 'Repos Prolongé', desc: 'Double les gains hors-ligne pendant 8h', cost: 20, costType: 'gems' as const },
];

const SKIN_ITEMS = [
  { id: 'skin_blue', emoji: '🔷', name: 'Sidi Bou Saïd', desc: 'Thème bleu et blanc', cost: 50, costType: 'gems' as const },
  { id: 'skin_gold', emoji: '✨', name: 'Or Tunisien', desc: 'Thème doré prestige', cost: 100, costType: 'gems' as const },
  { id: 'skin_green', emoji: '🌿', name: 'Oasis', desc: 'Thème vert naturel', cost: 75, costType: 'gems' as const },
];

export const ShopScreen: React.FC = () => {
  const { gems, spendGems, addCoins, activateRushHour } = useGameStore();

  const handleGemPurchase = async (productId: string) => {
    const ok = await IAPService.purchase(productId);
    if (ok) {
      Alert.alert('Achat réussi !', 'Vos gemmes ont été ajoutées. (stub)');
    }
  };

  const handleBoost = async (id: string, cost: number) => {
    if (!spendGems(cost)) {
      Alert.alert('Gemmes insuffisantes', 'Vous n\'avez pas assez de gemmes.');
      return;
    }
    if (id === 'boost_2x') {
      activateRushHour();
      Alert.alert('Rush Hour !', 'Production x2 pendant 60 secondes !');
    } else if (id === 'boost_coins') {
      addCoins(500);
      Alert.alert('Pluie de pièces !', '+500 🪙 ajoutées !');
    } else {
      Alert.alert('Boost activé !', 'Effet appliqué (stub).');
    }
  };

  const handleWatchAd = async () => {
    const ok = await AdService.showRewardedAd();
    if (ok) {
      addCoins(100);
      Alert.alert('Récompense pub !', '+100 🪙 pour avoir regardé la pub !');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[typography.h1, styles.sectionTitle]}>🛍️ Boutique</Text>

      {/* Ad button */}
      <View style={[styles.adBanner, shadows.e1]}>
        <Text style={styles.adEmoji}>📺</Text>
        <View style={styles.adInfo}>
          <Text style={[typography.bodyL, { color: colors.text.primary }]}>Regarder une pub</Text>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Gagnez 100 🪙 gratuitement</Text>
        </View>
        <Button variant="secondary" size="small" label="Voir" onPress={handleWatchAd} />
      </View>

      {/* Gem packs */}
      <SectionHeader title="💎 Packs de Gemmes" subtitle="Achat unique, pas d'abonnement" />
      <View style={styles.gemGrid}>
        {SHOP_GEM_PACKS.map((pack) => (
          <View key={pack.id} style={[styles.gemCard, shadows.e1]}>
            <Text style={styles.gemEmoji}>💎</Text>
            <Text style={[typography.h2, { color: colors.gem.dark }]}>{pack.gems}</Text>
            {pack.bonus ? (
              <Text style={[typography.micro, { color: colors.success }]}>{pack.bonus}</Text>
            ) : null}
            <Button
              variant="premium"
              size="small"
              label={pack.price}
              onPress={() => handleGemPurchase(pack.id)}
              style={{ marginTop: spacing.sm, width: '100%' }}
            />
          </View>
        ))}
      </View>

      {/* No Ads */}
      <SectionHeader title="🚫 Sans Pub" />
      <View style={[styles.noAdsCard, shadows.e1]}>
        <Text style={styles.noAdsEmoji}>🎯</Text>
        <View style={styles.noAdsInfo}>
          <Text style={[typography.bodyL, { color: colors.text.primary }]}>Retirer les pubs</Text>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Profitez du jeu sans interruption</Text>
        </View>
        <Button
          variant="premium"
          size="small"
          label="4.99€"
          onPress={() => IAPService.removeAds()}
        />
      </View>

      {/* Boosts */}
      <SectionHeader title="⚡ Boosts" subtitle="Payés avec des gemmes" />
      {BOOST_ITEMS.map((item) => (
        <View key={item.id} style={[styles.boostCard, shadows.e1]}>
          <Text style={styles.boostEmoji}>{item.emoji}</Text>
          <View style={styles.boostInfo}>
            <Text style={[typography.bodyL, { color: colors.text.primary }]}>{item.name}</Text>
            <Text style={[typography.body, { color: colors.text.secondary }]}>{item.desc}</Text>
          </View>
          <Button
            variant={gems >= item.cost ? 'premium' : 'disabled'}
            size="small"
            label={`${item.cost} 💎`}
            onPress={() => handleBoost(item.id, item.cost)}
            disabled={gems < item.cost}
          />
        </View>
      ))}

      {/* Skins */}
      <SectionHeader title="🎨 Skins du Restaurant" />
      {SKIN_ITEMS.map((item) => (
        <View key={item.id} style={[styles.boostCard, shadows.e1]}>
          <Text style={styles.boostEmoji}>{item.emoji}</Text>
          <View style={styles.boostInfo}>
            <Text style={[typography.bodyL, { color: colors.text.primary }]}>{item.name}</Text>
            <Text style={[typography.body, { color: colors.text.secondary }]}>{item.desc}</Text>
          </View>
          <Button
            variant={gems >= item.cost ? 'premium' : 'disabled'}
            size="small"
            label={`${item.cost} 💎`}
            onPress={() => Alert.alert('Skin', `${item.name} appliqué ! (stub)`)}
            disabled={gems < item.cost}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={[typography.h2, { color: colors.text.primary }]}>{title}</Text>
    {subtitle && <Text style={[typography.body, { color: colors.text.secondary }]}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing['4xl'] },
  sectionTitle: {
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  adBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  adEmoji: { fontSize: 32 },
  adInfo: { flex: 1 },
  gemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gemCard: {
    flex: 1,
    minWidth: '42%',
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  gemEmoji: { fontSize: 32 },
  noAdsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  noAdsEmoji: { fontSize: 32 },
  noAdsInfo: { flex: 1 },
  boostCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  boostEmoji: { fontSize: 28 },
  boostInfo: { flex: 1 },
});
