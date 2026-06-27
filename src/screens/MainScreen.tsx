import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, shadows } from '../theme/tokens';
import { HUD } from '../components/game/HUD';
import { BottomBar, TabId } from '../components/game/BottomBar';
import { StationCard } from '../components/game/StationCard';
import { RushHourBanner } from '../components/game/RushHourBanner';
import { LuckyCustomer } from '../components/game/LuckyCustomer';
import { OfflineGainsModal } from '../components/game/OfflineGainsModal';
import { DailyRewardModal } from '../components/game/DailyRewardModal';
import { MysteryBoxModal } from '../components/game/MysteryBoxModal';
import { UpgradesScreen } from './UpgradesScreen';
import { StaffScreen } from './StaffScreen';
import { ShopScreen } from './ShopScreen';
import { useGameStore } from '../store/gameStore';
import {
  STATION_CONFIGS,
  getCycleMs,
  getCoinsPerCycle,
  RUSH_HOUR_CHECK_INTERVAL_MS,
  RUSH_HOUR_CHANCE,
  LUCKY_CUSTOMER_CHECK_INTERVAL_MS,
  LUCKY_CUSTOMER_CHANCE,
  LUCKY_CUSTOMER_REWARD_MIN,
  LUCKY_CUSTOMER_REWARD_MAX,
  MYSTERY_BOX_COOLDOWN_MS,
} from '../constants/balance';
import { SoundService } from '../services/SoundService';

interface LuckyCustomerState {
  reward: number;
  side: 'left' | 'right';
}

const StaggerCard: React.FC<{ index: number; children: React.ReactNode }> = ({
  index,
  children,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(index * 50, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
  }, [index]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={anim}>{children}</Animated.View>;
};

export const MainScreen: React.FC = () => {
  const {
    stations,
    rushHour,
    pendingOfflineGains,
    pendingDailyReward,
    mysteryBoxLastOpened,
    calculateAndSetOfflineGains,
    applyOfflineGains,
    dismissOfflineGains,
    dismissDailyReward,
    endRushHour,
    activateRushHour,
    addCoins,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [showOfflineGains, setShowOfflineGains] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [luckyCustomer, setLuckyCustomer] = useState<LuckyCustomerState | null>(null);
  const [, forceUpdate] = useState(0); // for BottomBar badge refresh

  const rushMultiplier = rushHour.active && Date.now() < rushHour.endsAt ? 2 : 1;
  const boxReady = Date.now() - mysteryBoxLastOpened >= MYSTERY_BOX_COOLDOWN_MS;
  const cooldownRemaining = Math.max(0, MYSTERY_BOX_COOLDOWN_MS - (Date.now() - mysteryBoxLastOpened));

  // Show modals after load
  useEffect(() => {
    const t = setTimeout(() => {
      if (pendingOfflineGains && pendingOfflineGains.coins > 0) {
        setShowOfflineGains(true);
      } else if (pendingDailyReward) {
        setShowDailyReward(true);
      }
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Game loop — runs every 200ms, reads store directly (no React deps)
  useEffect(() => {
    const tick = setInterval(() => {
      const state = useGameStore.getState();
      const now = Date.now();
      const mult = state.rushHour.active && now < state.rushHour.endsAt ? 2 : 1;

      state.stations.forEach((station, idx) => {
        if (station.level === 0) return;
        const config = STATION_CONFIGS[idx];
        const cycleMs = getCycleMs(config, station.level, station.hasChef);
        const elapsed = now - station.lastCycleStart;
        if (elapsed >= cycleMs) {
          const coins = getCoinsPerCycle(config, station.level, station.hasManager);
          state.completeCycle(station.id, now, coins);
          SoundService.playCollect();
        }
      });

      // End rush hour if expired
      if (state.rushHour.active && now >= state.rushHour.endsAt) {
        state.endRushHour();
      }
    }, 200);

    return () => clearInterval(tick);
  }, []);

  // Rush Hour random trigger
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (!state.rushHour.active && Math.random() < RUSH_HOUR_CHANCE) {
        state.activateRushHour();
        SoundService.playRushHour();
      }
    }, RUSH_HOUR_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Lucky customer random trigger
  useEffect(() => {
    const interval = setInterval(() => {
      if (luckyCustomer) return;
      if (Math.random() < LUCKY_CUSTOMER_CHANCE) {
        const reward = Math.floor(
          LUCKY_CUSTOMER_REWARD_MIN +
            Math.random() * (LUCKY_CUSTOMER_REWARD_MAX - LUCKY_CUSTOMER_REWARD_MIN)
        );
        setLuckyCustomer({ reward, side: Math.random() > 0.5 ? 'left' : 'right' });
        SoundService.playLuckyCustomer();
      }
    }, LUCKY_CUSTOMER_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [luckyCustomer]);

  // Refresh BottomBar badge every 30s
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((v) => v + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabPress = useCallback((tab: TabId) => {
    if (tab === 'caisse') {
      setShowMysteryBox(true);
      return;
    }
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, []);

  const handleLuckyCollect = useCallback(() => {
    if (luckyCustomer) {
      addCoins(luckyCustomer.reward);
      setLuckyCustomer(null);
    }
  }, [luckyCustomer, addCoins]);

  const handleOfflineClose = useCallback(() => {
    setShowOfflineGains(false);
    if (pendingDailyReward) {
      setTimeout(() => setShowDailyReward(true), 300);
    }
  }, [pendingDailyReward]);

  const renderContent = () => {
    if (activeTab === 'upgrades') return <UpgradesScreen />;
    if (activeTab === 'staff') return <StaffScreen />;
    if (activeTab === 'shop') return <ShopScreen />;

    return (
      <ScrollView contentContainerStyle={styles.stationList} showsVerticalScrollIndicator={false}>
        {stations.map((station, idx) => (
          <StaggerCard key={station.id} index={idx}>
            <StationCard
              station={station}
              index={idx}
              rushMultiplier={rushMultiplier}
            />
          </StaggerCard>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={[colors.bg.gradientTop, colors.bg.gradientBottom]}
        style={styles.gradient}
      >
        <HUD />

        {/* Tab header */}
        {activeTab && (
          <View style={styles.tabHeader}>
            <Text style={styles.tabHeaderEmoji}>
              {activeTab === 'upgrades' ? '🔧' : activeTab === 'staff' ? '👨‍🍳' : '🛍️'}
            </Text>
          </View>
        )}

        {/* Main content */}
        <View style={styles.content}>{renderContent()}</View>

        {/* Rush hour banner */}
        <RushHourBanner visible={rushHour.active} endsAt={rushHour.endsAt} />

        {/* Lucky customer */}
        {luckyCustomer && (
          <LuckyCustomer
            reward={luckyCustomer.reward}
            side={luckyCustomer.side}
            onCollect={handleLuckyCollect}
          />
        )}

        <SafeAreaView edges={['bottom']}>
          <BottomBar activeTab={activeTab} onTabPress={handleTabPress} />
        </SafeAreaView>
      </LinearGradient>

      {/* Modals */}
      <OfflineGainsModal
        visible={showOfflineGains && !!pendingOfflineGains}
        coins={pendingOfflineGains?.coins ?? 0}
        timeAway={pendingOfflineGains?.timeAway ?? 0}
        onClose={handleOfflineClose}
      />

      <DailyRewardModal
        visible={showDailyReward}
        onClose={() => {
          dismissDailyReward();
          setShowDailyReward(false);
        }}
      />

      <MysteryBoxModal
        visible={showMysteryBox}
        onClose={() => setShowMysteryBox(false)}
        isCooldown={!boxReady}
        cooldownRemaining={cooldownRemaining}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.gradientTop,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stationList: {
    paddingTop: spacing.sm,
  },
  bottomPad: {
    height: spacing['4xl'],
  },
  tabHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  tabHeaderEmoji: {
    fontSize: 0, // hidden, just placeholder
  },
});
