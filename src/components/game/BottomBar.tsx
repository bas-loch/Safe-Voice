import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, shadows } from '../../theme/tokens';
import { useGameStore } from '../../store/gameStore';
import { MYSTERY_BOX_COOLDOWN_MS } from '../../constants/balance';

export type TabId = 'upgrades' | 'staff' | 'shop' | 'caisse';

interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { id: 'upgrades', label: 'Amélios', icon: '🔧' },
  { id: 'staff', label: 'Personnel', icon: '👨‍🍳' },
  { id: 'shop', label: 'Boutique', icon: '🛍️' },
  { id: 'caisse', label: 'Caisse', icon: '🎁' },
];

interface Props {
  activeTab: TabId | null;
  onTabPress: (tab: TabId) => void;
}

const PulsingDot: React.FC = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1
    );
  }, []);

  const dotAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dot, dotAnim]} />
  );
};

export const BottomBar: React.FC<Props> = ({ activeTab, onTabPress }) => {
  const { mysteryBoxLastOpened } = useGameStore();
  const boxReady = Date.now() - mysteryBoxLastOpened >= MYSTERY_BOX_COOLDOWN_MS;

  return (
    <View style={[styles.bar, shadows.e2]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCaisse = tab.id === 'caisse';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
              {isCaisse && boxReady && (
                <View style={styles.badgeWrap}>
                  <PulsingDot />
                  <View style={styles.badge} />
                </View>
              )}
              {isActive && <View style={styles.indicator} />}
            </View>
            <Text
              style={[
                typography.caption,
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 76,
    backgroundColor: colors.surface.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  icon: {
    fontSize: 26,
    opacity: 0.55,
  },
  iconActive: {
    opacity: 1,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.terracotta.DEFAULT,
    marginTop: 2,
  },
  label: {
    color: colors.text.tertiary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.terracotta.DEFAULT,
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger + '55',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
