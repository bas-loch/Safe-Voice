import { colors } from '../theme/tokens';

export interface StationConfig {
  id: string;
  name: string;
  emoji: string;
  baseCoinPerCycle: number;
  baseCycleMs: number;
  unlockCost: number;
  color: string;
  staffCostGems: number;
}

export const STATION_CONFIGS: StationConfig[] = [
  {
    id: 'grill',
    name: 'Grillade',
    emoji: '🍢',
    baseCoinPerCycle: 5,
    baseCycleMs: 3000,
    unlockCost: 0,
    color: colors.terracotta.DEFAULT,
    staffCostGems: 5,
  },
  {
    id: 'pastry',
    name: 'Pâtisserie',
    emoji: '🥧',
    baseCoinPerCycle: 12,
    baseCycleMs: 6000,
    unlockCost: 80,
    color: colors.olive.DEFAULT,
    staffCostGems: 8,
  },
  {
    id: 'juice',
    name: 'Bar à Jus',
    emoji: '🧃',
    baseCoinPerCycle: 18,
    baseCycleMs: 8000,
    unlockCost: 300,
    color: colors.blue.DEFAULT,
    staffCostGems: 10,
  },
  {
    id: 'couscous',
    name: 'Couscous',
    emoji: '🍲',
    baseCoinPerCycle: 30,
    baseCycleMs: 12000,
    unlockCost: 1000,
    color: colors.terracotta.light,
    staffCostGems: 15,
  },
  {
    id: 'bread',
    name: 'Boulangerie',
    emoji: '🫓',
    baseCoinPerCycle: 45,
    baseCycleMs: 15000,
    unlockCost: 3500,
    color: colors.olive.light,
    staffCostGems: 20,
  },
  {
    id: 'coffee',
    name: 'Café Arabe',
    emoji: '☕',
    baseCoinPerCycle: 70,
    baseCycleMs: 20000,
    unlockCost: 10000,
    color: '#6B4E3A',
    staffCostGems: 25,
  },
  {
    id: 'salad',
    name: 'Salade Fraîche',
    emoji: '🥗',
    baseCoinPerCycle: 110,
    baseCycleMs: 28000,
    unlockCost: 30000,
    color: colors.olive.DEFAULT,
    staffCostGems: 30,
  },
  {
    id: 'seafood',
    name: 'Fruits de Mer',
    emoji: '🍤',
    baseCoinPerCycle: 180,
    baseCycleMs: 40000,
    unlockCost: 100000,
    color: colors.blue.dark,
    staffCostGems: 40,
  },
];

export const UPGRADE_COST_MULTIPLIER = 1.18;
export const BASE_UPGRADE_COSTS = [15, 30, 60, 120, 250, 500, 1000, 2500];

export const CYCLE_TIME_REDUCTION_PER_LEVEL = 0.04;
export const COINS_MULTIPLIER_PER_LEVEL = 1.12;

export const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000;
export const MYSTERY_BOX_COOLDOWN_MS = 15 * 60 * 1000;
export const RUSH_HOUR_DURATION_MS = 60000;
export const RUSH_HOUR_MULTIPLIER = 2;
export const RUSH_HOUR_CHECK_INTERVAL_MS = 45000;
export const RUSH_HOUR_CHANCE = 0.25;
export const LUCKY_CUSTOMER_CHECK_INTERVAL_MS = 30000;
export const LUCKY_CUSTOMER_CHANCE = 0.3;
export const LUCKY_CUSTOMER_REWARD_MIN = 10;
export const LUCKY_CUSTOMER_REWARD_MAX = 50;

export const DAILY_REWARD_AMOUNTS = [20, 35, 55, 80, 120, 180, 300];
export const DAILY_REWARD_GEMS = [0, 0, 1, 0, 2, 0, 5];

export const MYSTERY_BOX_REWARDS = {
  common: { chance: 0.50, minCoins: 20, maxCoins: 60 },
  rare: { chance: 0.30, minCoins: 80, maxCoins: 200, minGems: 1, maxGems: 2 },
  epic: { chance: 0.15, minCoins: 300, maxCoins: 800, minGems: 3, maxGems: 8 },
  legendary: { chance: 0.05, minCoins: 1000, maxCoins: 3000, minGems: 10, maxGems: 25 },
};

export const STAFF_TYPES = {
  chef: { name: 'Chef', emoji: '👨‍🍳', description: 'Réduit le temps de cycle de 25%', cycleReduction: 0.25 },
  manager: { name: 'Manager', emoji: '👔', description: 'Augmente les gains de 50%', coinsMultiplier: 0.5 },
};

export const SHOP_GEM_PACKS = [
  { id: 'gems_small', gems: 50, price: '0.99€', bonus: '' },
  { id: 'gems_medium', gems: 150, price: '2.99€', bonus: '+25 bonus' },
  { id: 'gems_large', gems: 350, price: '5.99€', bonus: '+75 bonus' },
  { id: 'gems_xl', gems: 800, price: '9.99€', bonus: '+200 bonus' },
];

export function getUpgradeCost(stationIndex: number, currentLevel: number): number {
  const base = BASE_UPGRADE_COSTS[stationIndex] ?? 15;
  return Math.floor(base * Math.pow(UPGRADE_COST_MULTIPLIER, currentLevel));
}

export function getCycleMs(config: StationConfig, level: number, hasChef: boolean): number {
  const reduction = 1 - CYCLE_TIME_REDUCTION_PER_LEVEL * (level - 1) - (hasChef ? 0.25 : 0);
  return Math.max(config.baseCycleMs * Math.max(reduction, 0.3), 800);
}

export function getCoinsPerCycle(config: StationConfig, level: number, hasManager: boolean): number {
  const base = config.baseCoinPerCycle * Math.pow(COINS_MULTIPLIER_PER_LEVEL, level - 1);
  return Math.floor(base * (hasManager ? 1.5 : 1));
}
