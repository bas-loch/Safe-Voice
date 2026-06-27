import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STATION_CONFIGS,
  getUpgradeCost,
  getCycleMs,
  getCoinsPerCycle,
  MYSTERY_BOX_REWARDS,
  DAILY_REWARD_AMOUNTS,
  DAILY_REWARD_GEMS,
  OFFLINE_CAP_MS,
  OFFLINE_EFFICIENCY,
  MYSTERY_BOX_COOLDOWN_MS,
} from '../constants/balance';
import { getTodayString, isNewDay } from '../utils/time';

export interface StationState {
  id: string;
  level: number; // 0 = locked, 1+ = active
  lastCycleStart: number;
  cycleCount: number;
  hasChef: boolean;
  hasManager: boolean;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MysteryReward {
  rarity: Rarity;
  coins: number;
  gems: number;
}

interface GameStore {
  restaurantName: string;
  coins: number;
  gems: number;
  stations: StationState[];
  dailyReward: {
    lastClaim: string | null;
    streak: number;
  };
  lastSessionTime: number;
  mysteryBoxLastOpened: number;
  rushHour: { active: boolean; endsAt: number };
  totalCoinsEarned: number;

  // UI helpers (not persisted — managed separately)
  pendingOfflineGains: { coins: number; timeAway: number } | null;
  pendingDailyReward: boolean;

  // Actions
  setRestaurantName: (name: string) => void;
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  spendGems: (amount: number) => boolean;
  upgradeStation: (stationId: string) => boolean;
  unlockStation: (stationId: string) => boolean;
  completeCycle: (stationId: string, now: number, coins: number) => void;
  hireChef: (stationId: string) => boolean;
  hireManager: (stationId: string) => boolean;
  claimDailyReward: () => { coins: number; gems: number; day: number } | null;
  openMysteryBox: () => MysteryReward | null;
  forceOpenMysteryBox: () => MysteryReward;
  activateRushHour: () => void;
  endRushHour: () => void;
  calculateAndSetOfflineGains: () => void;
  applyOfflineGains: (multiplier?: number) => void;
  dismissOfflineGains: () => void;
  dismissDailyReward: () => void;
}

const initialStations: StationState[] = STATION_CONFIGS.map((config, i) => ({
  id: config.id,
  level: i === 0 ? 1 : 0,
  lastCycleStart: Date.now(),
  cycleCount: 0,
  hasChef: false,
  hasManager: false,
}));

function rollMysteryReward(): MysteryReward {
  const roll = Math.random();
  let rarity: Rarity;
  if (roll < 0.05) rarity = 'legendary';
  else if (roll < 0.20) rarity = 'epic';
  else if (roll < 0.50) rarity = 'rare';
  else rarity = 'common';

  const r = MYSTERY_BOX_REWARDS[rarity];
  const coins = Math.floor(r.minCoins + Math.random() * (r.maxCoins - r.minCoins));
  const gems = 'minGems' in r
    ? Math.floor(r.minGems + Math.random() * ((r.maxGems ?? r.minGems) - r.minGems))
    : 0;
  return { rarity, coins, gems };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      restaurantName: 'La Medina',
      coins: 50,
      gems: 10,
      stations: initialStations,
      dailyReward: { lastClaim: null, streak: 0 },
      lastSessionTime: Date.now(),
      mysteryBoxLastOpened: 0,
      rushHour: { active: false, endsAt: 0 },
      totalCoinsEarned: 0,
      pendingOfflineGains: null,
      pendingDailyReward: false,

      setRestaurantName: (name) => set({ restaurantName: name }),

      addCoins: (amount) =>
        set((s) => ({ coins: s.coins + amount, totalCoinsEarned: s.totalCoinsEarned + amount })),

      addGems: (amount) => set((s) => ({ gems: s.gems + amount })),

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      spendGems: (amount) => {
        const { gems } = get();
        if (gems < amount) return false;
        set({ gems: gems - amount });
        return true;
      },

      upgradeStation: (stationId) => {
        const { stations, spendCoins } = get();
        const idx = stations.findIndex((s) => s.id === stationId);
        if (idx === -1) return false;
        const station = stations[idx];
        if (station.level === 0) return false;
        const cost = getUpgradeCost(idx, station.level);
        if (!spendCoins(cost)) return false;
        const updated = stations.map((s, i) =>
          i === idx ? { ...s, level: s.level + 1 } : s
        );
        set({ stations: updated });
        return true;
      },

      unlockStation: (stationId) => {
        const { stations, spendCoins } = get();
        const idx = stations.findIndex((s) => s.id === stationId);
        if (idx === -1) return false;
        const station = stations[idx];
        if (station.level > 0) return false;
        const config = STATION_CONFIGS[idx];
        if (!spendCoins(config.unlockCost)) return false;
        const updated = stations.map((s, i) =>
          i === idx ? { ...s, level: 1, lastCycleStart: Date.now() } : s
        );
        set({ stations: updated });
        return true;
      },

      completeCycle: (stationId, now, coins) => {
        const { stations, rushHour } = get();
        const multiplier = rushHour.active && Date.now() < rushHour.endsAt ? 2 : 1;
        const earned = coins * multiplier;
        const updated = stations.map((s) =>
          s.id === stationId
            ? { ...s, lastCycleStart: now, cycleCount: s.cycleCount + 1 }
            : s
        );
        set((prev) => ({
          stations: updated,
          coins: prev.coins + earned,
          totalCoinsEarned: prev.totalCoinsEarned + earned,
        }));
      },

      hireChef: (stationId) => {
        const { stations } = get();
        const idx = stations.findIndex((s) => s.id === stationId);
        if (idx === -1) return false;
        const config = STATION_CONFIGS[idx];
        if (!get().spendGems(config.staffCostGems)) return false;
        const updated = stations.map((s, i) =>
          i === idx ? { ...s, hasChef: true } : s
        );
        set({ stations: updated });
        return true;
      },

      hireManager: (stationId) => {
        const { stations } = get();
        const idx = stations.findIndex((s) => s.id === stationId);
        if (idx === -1) return false;
        const config = STATION_CONFIGS[idx];
        if (!get().spendGems(Math.floor(config.staffCostGems * 1.5))) return false;
        const updated = stations.map((s, i) =>
          i === idx ? { ...s, hasManager: true } : s
        );
        set({ stations: updated });
        return true;
      },

      claimDailyReward: () => {
        const { dailyReward } = get();
        if (!isNewDay(dailyReward.lastClaim)) return null;
        const streak = isNewDay(dailyReward.lastClaim) ? Math.min(dailyReward.streak + 1, 7) : 1;
        const day = ((streak - 1) % 7);
        const coins = DAILY_REWARD_AMOUNTS[day];
        const gems = DAILY_REWARD_GEMS[day];
        set((s) => ({
          coins: s.coins + coins,
          gems: s.gems + gems,
          totalCoinsEarned: s.totalCoinsEarned + coins,
          dailyReward: { lastClaim: getTodayString(), streak },
          pendingDailyReward: false,
        }));
        return { coins, gems, day: day + 1 };
      },

      openMysteryBox: () => {
        const now = Date.now();
        if (now - get().mysteryBoxLastOpened < MYSTERY_BOX_COOLDOWN_MS) return null;
        const reward = rollMysteryReward();
        set((s) => ({
          mysteryBoxLastOpened: now,
          coins: s.coins + reward.coins,
          gems: s.gems + reward.gems,
          totalCoinsEarned: s.totalCoinsEarned + reward.coins,
        }));
        return reward;
      },

      activateRushHour: () => {
        const endsAt = Date.now() + 60000;
        set({ rushHour: { active: true, endsAt } });
      },

      endRushHour: () => set({ rushHour: { active: false, endsAt: 0 } }),

      forceOpenMysteryBox: () => {
        const now = Date.now();
        const reward = rollMysteryReward();
        set((s) => ({
          mysteryBoxLastOpened: now,
          coins: s.coins + reward.coins,
          gems: s.gems + reward.gems,
          totalCoinsEarned: s.totalCoinsEarned + reward.coins,
        }));
        return reward;
      },

      calculateAndSetOfflineGains: () => {
        const { lastSessionTime, stations } = get();
        const now = Date.now();
        const elapsed = Math.min(now - lastSessionTime, OFFLINE_CAP_MS);
        if (elapsed < 10000) {
          set({ lastSessionTime: now });
          return;
        }
        let totalCoins = 0;
        stations.forEach((station, idx) => {
          if (station.level === 0) return;
          const config = STATION_CONFIGS[idx];
          const cycleMs = getCycleMs(config, station.level, station.hasChef);
          const cycles = Math.floor(elapsed / cycleMs);
          const coinsPerCycle = getCoinsPerCycle(config, station.level, station.hasManager);
          totalCoins += cycles * coinsPerCycle;
        });
        set({
          pendingOfflineGains: { coins: totalCoins, timeAway: elapsed },
          lastSessionTime: now,
        });
      },

      applyOfflineGains: (multiplier = 1) => {
        const { pendingOfflineGains } = get();
        if (!pendingOfflineGains) return;
        const earned = Math.floor(pendingOfflineGains.coins * multiplier);
        set((s) => ({
          coins: s.coins + earned,
          totalCoinsEarned: s.totalCoinsEarned + earned,
          pendingOfflineGains: null,
        }));
      },

      dismissOfflineGains: () => set({ pendingOfflineGains: null }),
      dismissDailyReward: () => set({ pendingDailyReward: false }),
    }),
    {
      name: 'taste-of-tunisia-save',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        restaurantName: state.restaurantName,
        coins: state.coins,
        gems: state.gems,
        stations: state.stations,
        dailyReward: state.dailyReward,
        lastSessionTime: state.lastSessionTime,
        mysteryBoxLastOpened: state.mysteryBoxLastOpened,
        rushHour: state.rushHour,
        totalCoinsEarned: state.totalCoinsEarned,
      }),
      onRehydrateStorage: () => (hydratedState) => {
        if (!hydratedState) return;
        const now = Date.now();

        // Anti-cheat: validate saved timestamps
        const rawElapsed = now - hydratedState.lastSessionTime;
        const elapsed = rawElapsed < 0
          ? 0 // horloge reculée — ignorer
          : Math.min(rawElapsed, OFFLINE_CAP_MS);

        // Anti-cheat: mystery box timestamp dans le futur → reset
        const mysteryBoxLastOpened =
          hydratedState.mysteryBoxLastOpened > now ? 0 : hydratedState.mysteryBoxLastOpened;

        // Anti-cheat: rush hour expiré → désactiver
        const rushHour =
          hydratedState.rushHour.active && hydratedState.rushHour.endsAt > now
            ? hydratedState.rushHour
            : { active: false, endsAt: 0 };

        const pendingDailyReward = isNewDay(hydratedState.dailyReward?.lastClaim ?? null);

        if (elapsed >= 10000) {
          let totalCoins = 0;
          hydratedState.stations.forEach((station, idx) => {
            if (station.level === 0) return;
            const config = STATION_CONFIGS[idx];
            if (!config) return;
            const cycleMs = getCycleMs(config, station.level, station.hasChef);
            const cycles = Math.floor(elapsed / cycleMs);
            const coinsPerCycle = getCoinsPerCycle(config, station.level, station.hasManager);
            totalCoins += cycles * coinsPerCycle;
          });
          // 25% d'efficacité hors-ligne
          const cappedCoins = Math.floor(totalCoins * OFFLINE_EFFICIENCY);
          useGameStore.setState({
            pendingOfflineGains: { coins: cappedCoins, timeAway: elapsed },
            lastSessionTime: now,
            mysteryBoxLastOpened,
            rushHour,
            pendingDailyReward,
          });
        } else {
          useGameStore.setState({
            lastSessionTime: now,
            mysteryBoxLastOpened,
            rushHour,
            pendingDailyReward,
          });
        }
      },
    }
  )
);
