import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import {
  UserProfile,
  Item,
  PlantSlot,
  Task,
  Level,
  LevelPlayRecord,
  FlowerSourceRecord,
  PotLevel,
  FlowerOrder,
  LevelGoal
} from '@/types/game';
import { tasks as initialTasksData } from '@/data/tasks';
import { levels as initialLevelsData } from '@/data/levels';
import { getFlowerById } from '@/data/flowers';
import { generateDailyOrders } from '@/data/orders';

export interface LevelProgress {
  levelId: number;
  bestScore: number;
  stars: number;
  completed: boolean;
  unlocked: boolean;
  firstRewarded: boolean;
  playedCount: number;
}

export type CareType = 'water' | 'fertilizer';

interface BatchHarvestSummary {
  flowerId: number;
  count: number;
  emoji: string;
  name: string;
}

interface PersistState {
  profile: UserProfile;
  items: Item[];
  plantSlots: PlantSlot[];
  collectedFlowerIds: number[];
  flowerCollectCount: Record<number, number>;
  flowerSources: Record<number, FlowerSourceRecord>;
  tasks: Task[];
  levelProgress: Record<number, LevelProgress>;
  levelRecords: Record<number, LevelPlayRecord[]>;
  currentLevel: number;
  orders: FlowerOrder[];
  lastOrderRefreshDay: string;
}

interface UserStore extends PersistState {
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addItem: (itemId: string, count: number, source?: 'levelReward' | 'taskReward' | 'gardenHarvest' | 'shop') => void;
  useItem: (itemId: string, count: number) => boolean;
  plantFlower: (slotId: number, flowerId: number, seedItemId: string) => boolean;
  harvestFlower: (slotId: number) => { success: boolean; flowerId?: number; reward?: number };
  checkAndUpdatePlantGrowth: () => number;
  upgradeSlotPot: (slotId: number, potItemId: 'pot_clay' | 'pot_porcelain') => { success: boolean; message: string };
  expandGardenSlot: (potItemId: 'pot_clay') => { success: boolean; message: string; newSlotId?: number };
  getNextEmptySlotId: () => number | null;
  careForPlant: (slotId: number, careType: CareType) => { success: boolean; message: string; savedSeconds?: number };
  careAllPlants: (careType: CareType) => { success: boolean; message: string; totalSaved?: number; affectedCount?: number };
  batchHarvestAllReady: () => {
    success: boolean; message: string; totalHarvested?: number; summary?: BatchHarvestSummary[] };
  claimOfflineEarnings: () => number;
  completeNewUserGuide: () => void;
  saveLevelResult: (
    levelId: number,
    score: number,
    stars: number,
    extras: {
      collectedFlowerTileTypes?: Record<number, number>;
      maxCombo?: number;
      usedTools?: Record<string, number>;
      bonusCoins?: number;
      movesUsed?: number;
      totalMoves?: number;
      goalsCompleted?: Record<string, boolean>;
      allRequiredGoalsReached?: boolean;
    }
  ) => {
    rewarded: boolean;
    rewards: { coins: number; seeds?: number; seedType?: string; bonusCoins?: number; goalCoins?: number };
  };
  getLevelPlayRecords: (levelId: number) => LevelPlayRecord[];
  claimTask: (taskId: number) => { success: boolean; message: string };
  claimAllClaimableTasks: (type?: 'daily' | 'challenge' | 'steps') => number;
  getLevelProgress: (levelId: number) => LevelProgress;
  getLevelWithProgress: (level: Level) => Level;
  getFlowerCollectCount: (flowerId: number) => number;
  getFlowerSourceRecord: (flowerId: number) => FlowerSourceRecord;
  tileTypeToFlowerId: (tileType: number) => number;
  refreshDailyOrders: () => FlowerOrder[];
  getOrders: () => FlowerOrder[];
  deliverOrder: (orderId: number) => {
    success: boolean;
    message: string;
    rewards?: { coins?: number; items?: { id: string; count: number }[] };
  };
  resetAll: () => void;
}

const STORAGE_KEY = 'huaxiaoxiao_user_store_v4';

const CARE_CONFIG: Record<CareType, { itemId: string; savedSeconds: number }> = {
  water: { itemId: 'care_water', savedSeconds: 20 },
  fertilizer: { itemId: 'care_fertilizer', savedSeconds: 60 }
};

const initialProfile: UserProfile = {
  userId: 'user_001',
  nickname: '花仙子',
  avatar: 'https://picsum.photos/id/64/200/200',
  level: 12,
  exp: 2450,
  coins: 8560,
  diamonds: 120,
  currentLevel: 25,
  totalScore: 128500,
  offlineEarnings: 0,
  lastOnlineTime: Date.now() - 8 * 60 * 60 * 1000,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
    eyeCareMode: false
  },
  isNewUser: false
};

const initialItems: Item[] = [
  { id: 'shovel', name: '铲子', description: '消除任意一个方块', type: 'tool', icon: '⛏️', count: 5, price: 100 },
  { id: 'watercan', name: '浇水壶', description: '消除整行或整列', type: 'tool', icon: '🚿', count: 3, price: 200 },
  { id: 'rainbow', name: '彩虹花', description: '消除所有同色方块', type: 'tool', icon: '🌈', count: 1, price: 500 },
  { id: 'care_water', name: '滴灌水', description: '花园照料：给某朵花加速成长20秒', type: 'tool', icon: '💧', count: 10, price: 30 },
  { id: 'care_fertilizer', name: '营养肥料', description: '花园照料：给某朵花加速成长60秒', type: 'tool', icon: '🧪', count: 5, price: 80 },
  { id: 'seed_rose', name: '玫瑰花种', description: '可种植玫瑰，60秒成熟', type: 'seed', icon: '🌹', count: 8 },
  { id: 'seed_sunflower', name: '向日葵花种', description: '可种植向日葵，90秒成熟', type: 'seed', icon: '🌻', count: 5 },
  { id: 'seed_tulip', name: '郁金香花种', description: '可种植郁金香，180秒成熟', type: 'seed', icon: '🌷', count: 3 },
  { id: 'seed_cherry', name: '樱花花种', description: '可种植樱花，240秒成熟', type: 'seed', icon: '🌸', count: 2 },
  { id: 'pot_clay', name: '陶土花盆', description: '扩建花园1个新格子，或加速成长+20%', type: 'pot', icon: '🪴', count: 6, rarity: 'common', gardenEffect: { growthSpeedMultiplier: 1.2, expandSlots: 1 } },
  { id: 'pot_porcelain', name: '陶瓷花盆', description: '升级花园格子，成长加速+50%，收获翻倍', type: 'pot', icon: '🏺', count: 2, rarity: 'rare', gardenEffect: { growthSpeedMultiplier: 1.5, harvestBonus: 2 } }
];

const initialSlots: PlantSlot[] = Array.from({ length: 12 }, (_, i) => {
  const now = Date.now();
  if (i === 0) return { id: 0, occupied: true, flowerId: 1, plantedAt: now - 60 * 1000, growthStage: 3, potLevel: 1, potId: 'pot_clay' };
  if (i === 1) return { id: 1, occupied: true, flowerId: 2, plantedAt: now - 40 * 1000, growthStage: 1 };
  if (i === 2) return { id: 2, occupied: true, flowerId: 3, plantedAt: now - 90 * 1000, growthStage: 2 };
  if (i === 3) return { id: 3, occupied: true, flowerId: 4, plantedAt: now - 10 * 1000, growthStage: 0 };
  return { id: i, occupied: false, potLevel: i < 6 ? 1 : 0 as PotLevel, potId: i < 6 ? 'pot_clay' : undefined };
});

const initialLevelProgress: Record<number, LevelProgress> = {};
initialLevelsData.forEach((lvl) => {
  initialLevelProgress[lvl.id] = {
    levelId: lvl.id,
    bestScore: lvl.bestScore,
    stars: lvl.stars,
    completed: lvl.completed,
    unlocked: lvl.unlocked,
    firstRewarded: lvl.completed,
    playedCount: lvl.completed ? Math.floor(Math.random() * 3) + 1 : 0
  };
});

const initialFlowerCollectCount: Record<number, number> = {
  1: 15, 2: 12, 3: 8, 4: 6, 5: 5, 6: 3, 7: 2, 8: 1
};

const initialFlowerSources: Record<number, FlowerSourceRecord> = {};
[1, 2, 3, 4, 5, 6, 7, 8].forEach((id) => {
  const total = initialFlowerCollectCount[id] || 0;
  initialFlowerSources[id] = {
    levelReward: Math.round(total * 0.5),
    taskReward: Math.round(total * 0.25),
    gardenHarvest: Math.round(total * 0.25),
    shop: 0
  };
});

const POT_LEVEL_MAP: Record<string, PotLevel> = {
  pot_clay: 1,
  pot_porcelain: 2
};

const POT_SPEED_MAP: Record<PotLevel, number> = {
  0: 1,
  1: 1.2,
  2: 1.5
};

const POT_HARVEST_MAP: Record<PotLevel, number> = {
  0: 1,
  1: 1,
  2: 2
};

function getTaroStorage() {
  return {
    getItem: async (name: string) => {
      try {
        const val = Taro.getStorageSync(name);
        return val || null;
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: string) => {
      try {
        Taro.setStorageSync(name, value);
      } catch {}
    },
    removeItem: async (name: string) => {
      try {
        Taro.removeStorageSync(name);
      } catch {}
    }
  };
}

function computeGrowthStage(
  plantedAt: number,
  growthSeconds: number,
  potLevel: PotLevel = 0,
  now: number = Date.now()
): 0 | 1 | 2 | 3 {
  const multiplier = POT_SPEED_MAP[potLevel] || 1;
  const actualSeconds = growthSeconds / multiplier;
  const elapsedMs = now - plantedAt;
  const elapsedSeconds = Math.max(0, elapsedMs / 1000);
  const progress = Math.min(1, elapsedSeconds / actualSeconds);
  if (progress < 0.25) return 0;
  if (progress < 0.55) return 1;
  if (progress < 1) return 2;
  return 3;
}

const TILE_TYPE_TO_FLOWER_ID: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      items: initialItems,
      plantSlots: initialSlots,
      collectedFlowerIds: [1, 2, 3, 4, 5, 6, 7, 8],
      flowerCollectCount: initialFlowerCollectCount,
      flowerSources: initialFlowerSources,
      tasks: JSON.parse(JSON.stringify(initialTasksData)),
      levelProgress: initialLevelProgress,
      levelRecords: {},
      currentLevel: initialProfile.currentLevel,
      orders: [],
      lastOrderRefreshDay: '',

      tileTypeToFlowerId: (tileType: number) => {
        return TILE_TYPE_TO_FLOWER_ID[tileType] || (tileType + 1);
      },

      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),

      updateSettings: (settings) => set((state) => ({
        profile: { ...state.profile, settings: { ...state.profile.settings, ...settings } }
      })),

      addCoins: (amount) => set((state) => ({
        profile: { ...state.profile, coins: state.profile.coins + amount }
      })),

      spendCoins: (amount) => {
        const { profile } = get();
        if (profile.coins >= amount) {
          set((state) => ({ profile: { ...state.profile, coins: state.profile.coins - amount } }));
          return true;
        }
        return false;
      },

      addItem: (itemId, count, source) => {
        if (count <= 0) return;
        set((state) => {
          const itemIndex = state.items.findIndex((i) => i.id === itemId);
          if (itemIndex < 0) return state;
          const newItems = [...state.items];
          newItems[itemIndex] = { ...newItems[itemIndex], count: newItems[itemIndex].count + count };

          let nextFlowerSources = state.flowerSources;
          let nextFlowerCollectCount = state.flowerCollectCount;
          let nextCollected = state.collectedFlowerIds;
          if (source === 'levelReward' || source === 'taskReward' || source === 'gardenHarvest') {
            const flowerSeedMap: Record<string, number> = {
              seed_rose: 1,
              seed_sunflower: 2,
              seed_tulip: 3,
              seed_cherry: 4
            };
            const flowerId = flowerSeedMap[itemId];
            if (flowerId !== undefined) {
              nextFlowerSources = {
                ...nextFlowerSources,
                [flowerId]: {
                  levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0,
                  ...(nextFlowerSources[flowerId] || {}),
                  [source]: ((nextFlowerSources[flowerId] || {})[source] || 0) + count
                }
              };
              nextFlowerCollectCount = {
                ...nextFlowerCollectCount,
                [flowerId]: (nextFlowerCollectCount[flowerId] || 0) + count
              };
              if (!nextCollected.includes(flowerId)) {
                nextCollected = [...nextCollected, flowerId];
              }
            }
          }

          return {
            items: newItems,
            flowerSources: nextFlowerSources,
            flowerCollectCount: nextFlowerCollectCount,
            collectedFlowerIds: nextCollected
          };
        });
      },

      useItem: (itemId, count) => {
        const { items } = get();
        const item = items.find((i) => i.id === itemId);
        if (item && item.count >= count) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, count: i.count - count } : i
            )
          }));
          return true;
        }
        return false;
      },

      plantFlower: (slotId, flowerId, seedItemId) => {
        const { items, plantSlots } = get();
        const seed = items.find((i) => i.id === seedItemId);
        const slot = plantSlots.find((s) => s.id === slotId);
        if (!seed || seed.count <= 0) return false;
        if (!slot || slot.occupied) return false;

        set((state) => ({
          items: state.items.map((i) =>
            i.id === seedItemId ? { ...i, count: i.count - 1 } : i
          ),
          plantSlots: state.plantSlots.map((s) =>
            s.id === slotId
              ? { ...s, occupied: true, flowerId, plantedAt: Date.now(), growthStage: 0 }
              : s
          )
        }));
        return true;
      },

      harvestFlower: (slotId) => {
        const state = get();
        const slot = state.plantSlots.find((s) => s.id === slotId);
        if (!slot || !slot.occupied || slot.flowerId === undefined) {
          return { success: false };
        }
        if ((slot.growthStage || 0) < 3) {
          return { success: false };
        }

        const flowerId = slot.flowerId;
        const potLevel = slot.potLevel || 0;
        const flowerData = getFlowerById(flowerId);
        const isNew = !state.collectedFlowerIds.includes(flowerId);
        const qualityAdd = (slot.qualityBonus || 0) > 0 ? 1 : 0;
        const reward = (flowerData?.harvestReward || 1) * (POT_HARVEST_MAP[potLevel] || 1) + qualityAdd;
        const flowerSeedMap: Record<number, string> = {
          1: 'seed_rose',
          2: 'seed_sunflower',
          3: 'seed_tulip',
          4: 'seed_cherry'
        };
        const seedId = flowerSeedMap[flowerId];

        set((s) => {
          const nextCollected = isNew
            ? [...s.collectedFlowerIds, flowerId]
            : s.collectedFlowerIds;

          const nextFlowerCollectCount = {
            ...s.flowerCollectCount,
            [flowerId]: (s.flowerCollectCount[flowerId] || 0) + reward
          };

          const nextFlowerSources = {
            ...s.flowerSources,
            [flowerId]: {
              levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0,
              ...(s.flowerSources[flowerId] || {}),
              gardenHarvest: ((s.flowerSources[flowerId] || {}).gardenHarvest || 0) + reward
            }
          };

          let nextItems = s.items;
          if (seedId) {
            nextItems = s.items.map((i) =>
              i.id === seedId ? { ...i, count: i.count + reward } : i
            );
          }

          return {
            collectedFlowerIds: nextCollected,
            flowerCollectCount: nextFlowerCollectCount,
            flowerSources: nextFlowerSources,
            items: nextItems,
            plantSlots: s.plantSlots.map((s2) =>
              s2.id === slotId
                ? { ...s2, occupied: false, flowerId: undefined, plantedAt: undefined, growthStage: undefined }
                : s2
            )
          };
        });

        return { success: true, flowerId, reward };
      },

      batchHarvestAllReady: () => {
        const state = get();
        const tileFlowerMap: Record<number, BatchHarvestSummary> = {};
        let totalHarvested = 0;
        let affected = 0;

        const readySlots = state.plantSlots.filter(
          (s) => s.occupied && s.growthStage === 3 && s.flowerId !== undefined
        );

        if (readySlots.length === 0) {
          return { success: false, message: '暂无可收获的花朵~' };
        }

        for (const slot of readySlots) {
          const flowerId = slot.flowerId!;
          const potLevel = slot.potLevel || 0;
          const flowerData = getFlowerById(flowerId);
          const qualityAdd = (slot.qualityBonus || 0) > 0 ? 1 : 0;
          const reward = (flowerData?.harvestReward || 1) * (POT_HARVEST_MAP[potLevel] || 1) + qualityAdd;
          const flowerSeedMap: Record<number, string> = {
            1: 'seed_rose', 2: 'seed_sunflower', 3: 'seed_tulip', 4: 'seed_cherry'
          };
          const seedId = flowerSeedMap[flowerId];
          const isNew = !state.collectedFlowerIds.includes(flowerId);
          const fName = flowerData?.name || '花朵';
          const fEmoji = flowerData?.emoji || '🌸';

          totalHarvested += reward;
          affected++;

          if (!tileFlowerMap[flowerId]) {
            tileFlowerMap[flowerId] = { flowerId, count: 0, emoji: fEmoji, name: fName };
          }
          tileFlowerMap[flowerId].count += reward;

          set((s) => {
            const nextCollected = isNew ? [...s.collectedFlowerIds, flowerId] : s.collectedFlowerIds;
            const nextFlowerCollectCount = {
              ...s.flowerCollectCount,
              [flowerId]: (s.flowerCollectCount[flowerId] || 0) + reward
            };
            const nextFlowerSources = {
              ...s.flowerSources,
              [flowerId]: {
                levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0,
                ...(s.flowerSources[flowerId] || {}),
                gardenHarvest: ((s.flowerSources[flowerId] || {}).gardenHarvest || 0) + reward
              }
            };
            let nextItems = s.items;
            if (seedId) {
              nextItems = nextItems.map((i) =>
                i.id === seedId ? { ...i, count: i.count + reward } : i
              );
            }
            const nextSlots = s.plantSlots.map((s2) =>
              s2.id === slot.id
                ? { ...s2, occupied: false, flowerId: undefined, plantedAt: undefined, growthStage: undefined }
                : s2
            );
            return {
              collectedFlowerIds: nextCollected,
              flowerCollectCount: nextFlowerCollectCount,
              flowerSources: nextFlowerSources,
              items: nextItems,
              plantSlots: nextSlots
            };
          });
        }

        const summary = Object.values(tileFlowerMap);
        const detailText = summary.map((s) => `${s.emoji}${s.name}×${s.count}`).join(' ');
        return {
          success: true,
          message: `批量收获 ${affected} 朵花，共获得花种 ${totalHarvested} 个！${detailText}`,
          totalHarvested,
          summary
        };
      },

      checkAndUpdatePlantGrowth: () => {
        const state = get();
        const now = Date.now();
        let updatedCount = 0;
        const newSlots = state.plantSlots.map((slot) => {
          if (!slot.occupied || !slot.plantedAt || !slot.flowerId) return slot;
          const flower = getFlowerById(slot.flowerId);
          if (!flower) return slot;
          const nextStage = computeGrowthStage(
            slot.plantedAt,
            flower.growthSeconds,
            slot.potLevel || 0,
            now
          );
          if (nextStage !== slot.growthStage) {
            updatedCount++;
            return { ...slot, growthStage: nextStage as 0 | 1 | 2 | 3 };
          }
          return slot;
        });
        if (updatedCount > 0) {
          set({ plantSlots: newSlots });
        }
        set((s) => ({ profile: { ...s.profile, lastOnlineTime: now } }));
        return updatedCount;
      },

      careForPlant: (slotId, careType) => {
        const config = CARE_CONFIG[careType];
        if (!config) return { success: false, message: '未知照料方式' };
        const state = get();
        const item = state.items.find((i) => i.id === config.itemId);
        if (!item || item.count <= 0) {
          const nameMap: Record<CareType, string> = { water: '滴灌水', fertilizer: '营养肥料' };
          return { success: false, message: `${nameMap[careType]}不足啦！去关卡或商店获取吧` };
        }
        const slot = state.plantSlots.find((s) => s.id === slotId);
        if (!slot || !slot.occupied || !slot.plantedAt) {
          return { success: false, message: '该地块没有正在生长的花朵' };
        }

        const now = Date.now();
        const getDay = (ts: number) => {
          const d = new Date(ts);
          return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        };
        const today = getDay(now);
        const lastCareDay = slot.lastCareAt ? getDay(slot.lastCareAt) : '';
        const yesterday = (() => { const y = new Date(now); y.setDate(y.getDate() - 1); return getDay(y.getTime()); })();

        let nextConsecutive = slot.consecutiveCareDays || 0;
        if (lastCareDay === today) {
          // 今天已照料过，连续天数不变
        } else if (lastCareDay === yesterday || lastCareDay === '') {
          nextConsecutive = (slot.consecutiveCareDays || 0) + 1;
        } else {
          nextConsecutive = 1; // 断了连续
        }

        const nextTodayCareCount = lastCareDay === today ? (slot.todayCareCount || 0) + 1 : 1;
        const nextCareCount = (slot.careCount || 0) + 1;
        const savedMs = config.savedSeconds * 1000;
        const extraSavedMs = nextConsecutive >= 3 ? Math.floor(config.savedSeconds * 0.5 * 1000) : 0;

        set((s) => ({
          items: s.items.map((i) => i.id === config.itemId ? { ...i, count: i.count - 1 } : i),
          plantSlots: s.plantSlots.map((s2) =>
            s2.id === slotId
              ? {
                  ...s2,
                  plantedAt: Math.max(0, (s2.plantedAt || 0) - savedMs - extraSavedMs),
                  lastCareAt: now,
                  careCount: nextCareCount,
                  todayCareCount: nextTodayCareCount,
                  consecutiveCareDays: nextConsecutive,
                  qualityBonus: nextConsecutive >= 3 ? 1 : (s2.qualityBonus || 0)
                }
              : s2
          )
        }));
        const nameMap: Record<CareType, string> = { water: '浇水', fertilizer: '施肥' };
        let extraTip = '';
        if (nextConsecutive >= 3) {
          extraTip = `，连续照料${nextConsecutive}天额外加速${Math.floor(config.savedSeconds * 0.5)}s+收获加成`;
        } else if (nextConsecutive >= 1) {
          extraTip = `，已连续照料${nextConsecutive}天（3天起解锁加成）`;
        }
        return {
          success: true,
          message: `${nameMap[careType]}成功！成长加速 ${config.savedSeconds} 秒${extraTip}`,
          savedSeconds: config.savedSeconds + Math.floor(extraSavedMs / 1000)
        };
      },

      careAllPlants: (careType) => {
        const config = CARE_CONFIG[careType];
        if (!config) return { success: false, message: '未知照料方式' };
        const state = get();
        const item = state.items.find((i) => i.id === config.itemId);
        const growingSlots = state.plantSlots.filter(
          (s) => s.occupied && s.plantedAt && (s.growthStage || 0) < 3
        );
        const affectedCount = Math.min(growingSlots.length, item?.count || 0);
        if (affectedCount === 0) {
          if (!item || item.count === 0) {
            return { success: false, message: '道具不足或无成长中花朵' };
          }
          return { success: false, message: '没有正在成长中的花朵~' };
        }
        if (!item) return { success: false, message: '道具不足！' };

        const now = Date.now();
        const getDay = (ts: number) => {
          const d = new Date(ts);
          return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        };
        const today = getDay(now);
        const yesterday = (() => { const y = new Date(now); y.setDate(y.getDate() - 1); return getDay(y.getTime()); })();
        const savedMs = config.savedSeconds * 1000;
        const applySlots = growingSlots.slice(0, affectedCount);
        const applyIds = new Set(applySlots.map((s) => s.id));
        set((s) => ({
          items: s.items.map((i) => i.id === config.itemId ? { ...i, count: i.count - affectedCount } : i),
          plantSlots: s.plantSlots.map((s2) => {
            if (!applyIds.has(s2.id)) return s2;
            const lastCareDay = s2.lastCareAt ? getDay(s2.lastCareAt) : '';
            let nextConsecutive = s2.consecutiveCareDays || 0;
            if (lastCareDay === today) {
            } else if (lastCareDay === yesterday || lastCareDay === '') {
              nextConsecutive = (s2.consecutiveCareDays || 0) + 1;
            } else {
              nextConsecutive = 1;
            }
            const nextTodayCareCount = lastCareDay === today ? (s2.todayCareCount || 0) + 1 : 1;
            const nextCareCount = (s2.careCount || 0) + 1;
            const extraSavedMs = nextConsecutive >= 3 ? Math.floor(config.savedSeconds * 0.5 * 1000) : 0;
            return {
              ...s2,
              plantedAt: Math.max(0, (s2.plantedAt || 0) - savedMs - extraSavedMs),
              lastCareAt: now,
              careCount: nextCareCount,
              todayCareCount: nextTodayCareCount,
              consecutiveCareDays: nextConsecutive,
              qualityBonus: nextConsecutive >= 3 ? 1 : (s2.qualityBonus || 0)
            };
          })
        }));
        const nameMap = { water: '一键浇水', fertilizer: '批量施肥' };
        return {
          success: true,
          message: `${nameMap[careType]}成功！${affectedCount} 朵花各加速 ${config.savedSeconds}秒，连续3天以上享受额外加成`,
          totalSaved: affectedCount * config.savedSeconds,
          affectedCount
        };
      },

      upgradeSlotPot: (slotId, potItemId) => {
        const state = get();
        const pot = state.items.find((i) => i.id === potItemId);
        if (!pot || pot.count <= 0) return { success: false, message: '花盆数量不足' };
        const slot = state.plantSlots.find((s) => s.id === slotId);
        if (!slot) return { success: false, message: '花园格子不存在' };

        const currentPotLevel = slot.potLevel || 0;
        const targetPotLevel = POT_LEVEL_MAP[potItemId] || 1;
        if (targetPotLevel <= currentPotLevel) {
          return { success: false, message: `当前已有${currentPotLevel === 2 ? '陶瓷' : '陶土'}花盆，无需重复升级` };
        }
        if (potItemId === 'pot_porcelain' && currentPotLevel < 1) {
          return { success: false, message: '升级陶瓷花盆需要先有陶土花盆' };
        }

        set((s) => ({
          items: s.items.map((i) => i.id === potItemId ? { ...i, count: i.count - 1 } : i),
          plantSlots: s.plantSlots.map((s2) =>
            s2.id === slotId ? { ...s2, potLevel: targetPotLevel, potId: potItemId } : s2
          )
        }));
        return { success: true, message: `成功升级至${potItemId === 'pot_porcelain' ? '陶瓷' : '陶土'}花盆！` };
      },

      expandGardenSlot: (potItemId) => {
        const state = get();
        if (potItemId !== 'pot_clay') return { success: false, message: '只有陶土花盆可用于扩建' };
        const pot = state.items.find((i) => i.id === potItemId);
        if (!pot || pot.count <= 0) return { success: false, message: '陶土花盆数量不足，去合成或商店获取吧' };
        const currentCount = state.plantSlots.length;
        if (currentCount >= 24) return { success: false, message: '花园已达最大容量(24格)' };

        const newSlotId = currentCount;
        const newSlot: PlantSlot = {
          id: newSlotId,
          occupied: false,
          potLevel: 1,
          potId: 'pot_clay'
        };

        set((s) => ({
          items: s.items.map((i) => i.id === potItemId ? { ...i, count: i.count - 1 } : i),
          plantSlots: [...s.plantSlots, newSlot]
        }));
        return { success: true, message: '扩建成功！花园增加了1个新格子', newSlotId };
      },

      getNextEmptySlotId: () => {
        const empty = get().plantSlots.find((s) => !s.occupied);
        return empty ? empty.id : null;
      },

      claimOfflineEarnings: () => {
        const { profile } = get();
        const earnings = profile.offlineEarnings || 280;
        set((state) => ({
          profile: { ...state.profile, coins: state.profile.coins + earnings, offlineEarnings: 0 }
        }));
        return earnings;
      },

      completeNewUserGuide: () => set((state) => ({
        profile: { ...state.profile, isNewUser: false }
      })),

      saveLevelResult: (levelId, score, stars, extras) => {
        const state = get();
        const lvl = initialLevelsData.find((l) => l.id === levelId);
        if (!lvl) return { rewarded: false, rewards: { coins: 0 } };

        const allRequiredGoalsReached = extras?.allRequiredGoalsReached !== false;
        const prev = state.levelProgress[levelId];
        const firstTime = !prev?.firstRewarded && allRequiredGoalsReached;
        const newBestScore = allRequiredGoalsReached ? Math.max(prev?.bestScore || 0, score) : (prev?.bestScore || 0);
        const newStars = allRequiredGoalsReached ? Math.max(prev?.stars || 0, stars) : (prev?.stars || 0);
        const playedCount = (prev?.playedCount || 0) + 1;
        const bonusCoins = extras?.bonusCoins || 0;

        // 分目标奖励：每完成一个goal累加对应rewardCoins
        let goalCoins = 0;
        const goalsCompleted = extras?.goalsCompleted || {};
        if (allRequiredGoalsReached) {
          lvl.goals.forEach((goal) => {
            const goalKey = `${goal.type}_${goal.flowerType || goal.toolId || 'default'}`;
            if (goalsCompleted[goalKey] && goal.rewardCoins) {
              goalCoins += goal.rewardCoins;
            }
          });
        }

        const collectedFlowerRecord: Record<number, number> = {};
        if (extras?.collectedFlowerTileTypes) {
          const entries = Object.entries(extras.collectedFlowerTileTypes);
          entries.forEach(([tileType, count]) => {
            const flowerId = TILE_TYPE_TO_FLOWER_ID[Number(tileType)] || (Number(tileType) + 1);
            collectedFlowerRecord[flowerId] = (collectedFlowerRecord[flowerId] || 0) + count;
          });
        }

        const record: LevelPlayRecord = {
          levelId,
          playedAt: Date.now(),
          score,
          stars: allRequiredGoalsReached ? stars : 0,
          collectedFlowers: collectedFlowerRecord,
          maxCombo: extras?.maxCombo || 0,
          usedTools: extras?.usedTools || {},
          movesUsed: extras?.movesUsed || lvl.moves,
          totalMoves: extras?.totalMoves || lvl.moves,
          goalsCompleted
        };

        let nextItems = state.items;
        let nextFlowerCollectCount = state.flowerCollectCount;
        let nextFlowerSources = state.flowerSources;
        let nextCollectedIds = state.collectedFlowerIds;

        if (firstTime && lvl.rewards.seeds && lvl.rewards.seedType) {
          const seedId = lvl.rewards.seedType;
          const seedsCount = lvl.rewards.seeds;
          const flowerId = lvl.rewards.seedFlowerId;
          nextItems = nextItems.map((i) =>
            i.id === seedId ? { ...i, count: i.count + seedsCount } : i
          );
          if (flowerId) {
            nextFlowerCollectCount = {
              ...nextFlowerCollectCount,
              [flowerId]: (nextFlowerCollectCount[flowerId] || 0) + seedsCount
            };
            nextFlowerSources = {
              ...nextFlowerSources,
              [flowerId]: {
                levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0,
                ...(nextFlowerSources[flowerId] || {}),
                levelReward: ((nextFlowerSources[flowerId] || {}).levelReward || 0) + seedsCount
              }
            };
            if (!nextCollectedIds.includes(flowerId)) {
              nextCollectedIds = [...nextCollectedIds, flowerId];
            }
          }
        }

        // 完成关卡的总金币：首次通关奖励 + 分目标goalCoins + 额外bonusCoins
        const totalCoinsGained = (firstTime ? lvl.rewards.coins : 0) + goalCoins + bonusCoins;

        set((s) => {
          const nextProgress = {
            ...s.levelProgress,
            [levelId]: {
              levelId,
              bestScore: newBestScore,
              stars: newStars,
              completed: allRequiredGoalsReached ? true : (prev?.completed || false),
              unlocked: true,
              firstRewarded: firstTime ? true : (prev?.firstRewarded || false),
              playedCount
            }
          };
          const nextLevelId = levelId + 1;
          if (initialLevelsData.find((l) => l.id === nextLevelId)) {
            const oldNext = s.levelProgress[nextLevelId];
            const shouldUnlockNext = allRequiredGoalsReached;
            nextProgress[nextLevelId] = {
              levelId: nextLevelId,
              bestScore: oldNext?.bestScore || 0,
              stars: oldNext?.stars || 0,
              completed: oldNext?.completed || false,
              unlocked: shouldUnlockNext ? true : (oldNext?.unlocked || false),
              firstRewarded: oldNext?.firstRewarded || false,
              playedCount: oldNext?.playedCount || 0
            };
          }
          const nextRecords = {
            ...s.levelRecords,
            [levelId]: [...(s.levelRecords[levelId] || []), record].slice(-5)
          };
          return {
            levelProgress: nextProgress,
            levelRecords: nextRecords,
            currentLevel: Math.max(s.currentLevel, firstTime ? levelId + 1 : s.currentLevel),
            profile: {
              ...s.profile,
              coins: s.profile.coins + totalCoinsGained,
              totalScore: s.profile.totalScore + score,
              currentLevel: Math.max(s.profile.currentLevel, firstTime ? levelId + 1 : s.profile.currentLevel)
            },
            items: nextItems,
            flowerCollectCount: nextFlowerCollectCount,
            flowerSources: nextFlowerSources,
            collectedFlowerIds: nextCollectedIds
          };
        });

        if (firstTime) {
          return { rewarded: true, rewards: { ...lvl.rewards, bonusCoins, goalCoins } };
        }
        return { rewarded: false, rewards: { coins: goalCoins + bonusCoins, bonusCoins, goalCoins } };
      },

      getLevelPlayRecords: (levelId) => get().levelRecords[levelId] || [],

      refreshDailyOrders: () => {
        const now = Date.now();
        const getDay = (ts: number) => {
          const d = new Date(ts);
          return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        };
        const todayKey = getDay(now);
        const state = get();
        if (state.lastOrderRefreshDay === todayKey && state.orders.length > 0) {
          return state.orders;
        }
        const newOrders = generateDailyOrders(4);
        set({ orders: newOrders, lastOrderRefreshDay: todayKey });
        return newOrders;
      },

      getOrders: () => {
        const state = get();
        // 过期订单标记
        const now = Date.now();
        let needUpdate = false;
        const normalized = state.orders.map((o) => {
          if (o.status === 'pending' && o.expiresAt < now) {
            needUpdate = true;
            return { ...o, status: 'expired' as const };
          }
          return o;
        });
        if (needUpdate) set({ orders: normalized });
        if (normalized.length === 0) {
          return state.refreshDailyOrders();
        }
        return normalized;
      },

      deliverOrder: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { success: false, message: '订单不存在' };
        if (order.status !== 'pending') {
          return { success: false, message: order.status === 'expired' ? '订单已过期' : '订单已交付' };
        }
        const now = Date.now();
        if (order.expiresAt < now) {
          return { success: false, message: '订单已过期' };
        }

        // 检查花种库存是否够（从items里找seed_xxx对应数量）
        const flowerSeedMap: Record<number, string> = {
          1: 'seed_rose', 2: 'seed_sunflower', 3: 'seed_tulip', 4: 'seed_cherry',
          5: 'seed_lily', 6: 'seed_lavender', 7: 'seed_daisy', 8: 'seed_magnolia',
          9: 'seed_peony', 10: 'seed_camellia', 11: 'seed_jasmine', 12: 'seed_nightbloom'
        };

        for (const req of order.requirements) {
          const seedId = flowerSeedMap[req.flowerId];
          if (!seedId) return { success: false, message: '花种数据异常' };
          const stock = state.items.find((i) => i.id === seedId)?.count || 0;
          if (stock < req.count) {
            const flower = getFlowerById(req.flowerId);
            return { success: false, message: `${flower?.name || '花'}种不足！需要${req.count}个，当前${stock}个` };
          }
        }

        // 扣减库存 + 减少图鉴收集次数(订单消耗属于减少库存，但是flowerCollectCount属于收集统计保持不变)
        // 花种来源统计：消耗不计入来源，只扣库存
        let nextItems = state.items;
        for (const req of order.requirements) {
          const seedId = flowerSeedMap[req.flowerId];
          nextItems = nextItems.map((i) => i.id === seedId ? { ...i, count: i.count - req.count } : i);
        }

        // 发放奖励
        const rwd = order.reward;
        if (rwd.coins) {
          set((s) => ({ profile: { ...s.profile, coins: s.profile.coins + (rwd.coins || 0) } }));
        }
        if (rwd.items && rwd.items.length > 0) {
          nextItems = [...nextItems];
          for (const rItem of rwd.items) {
            const idx = nextItems.findIndex((i) => i.id === rItem.id);
            if (idx >= 0) {
              nextItems[idx] = { ...nextItems[idx], count: nextItems[idx].count + rItem.count };
            }
          }
        }
        if (rwd.exp) {
          set((s) => {
            const totalExp = s.profile.exp + (rwd.exp || 0);
            const newLevel = 1 + Math.floor(totalExp / 100);
            return { profile: { ...s.profile, exp: totalExp, level: newLevel } };
          });
        }

        set((s) => ({
          items: nextItems,
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'completed' as const } : o))
        }));

        const rewardSummary: string[] = [];
        if (rwd.coins) rewardSummary.push(`💰 +${rwd.coins}`);
        if (rwd.items) rwd.items.forEach((i) => rewardSummary.push(`${i.id} ×${i.count}`));
        if (rwd.exp) rewardSummary.push(`EXP +${rwd.exp}`);
        return {
          success: true,
          message: `订单交付成功！获得奖励：${rewardSummary.join('，')}`,
          rewards: { coins: rwd.coins, items: rwd.items }
        };
      },

      claimTask: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return { success: false, message: '任务不存在' };
        if (!task.completed) return { success: false, message: '任务未完成' };
        if (task.claimed) return { success: false, message: '奖励已领取' };

        set((s) => {
          const nextTasks = s.tasks.map((t) => t.id === taskId ? { ...t, claimed: true } : t);
          let nextCoins = s.profile.coins;
          let nextItems = s.items;
          let nextFlowerCollectCount = s.flowerCollectCount;
          let nextFlowerSources = s.flowerSources;
          let nextCollectedIds = s.collectedFlowerIds;

          if (task.reward.coins) nextCoins += task.reward.coins;
          if (task.reward.seeds) {
            const seedId = task.reward.seedType || 'seed_rose';
            const flowerSeedMap: Record<string, number> = {
              seed_rose: 1, seed_sunflower: 2, seed_tulip: 3, seed_cherry: 4
            };
            const flowerId = flowerSeedMap[seedId];
            nextItems = nextItems.map((i) => i.id === seedId ? { ...i, count: i.count + task.reward.seeds! } : i);
            if (flowerId) {
              const count = task.reward.seeds;
              nextFlowerCollectCount = {
                ...nextFlowerCollectCount,
                [flowerId]: (nextFlowerCollectCount[flowerId] || 0) + count
              };
              nextFlowerSources = {
                ...nextFlowerSources,
                [flowerId]: {
                  levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0,
                  ...(nextFlowerSources[flowerId] || {}),
                  taskReward: ((nextFlowerSources[flowerId] || {}).taskReward || 0) + count
                }
              };
              if (!nextCollectedIds.includes(flowerId)) {
                nextCollectedIds = [...nextCollectedIds, flowerId];
              }
            }
          }
          if (task.reward.items) {
            task.reward.items.forEach((ri) => {
              nextItems = nextItems.map((i) =>
                i.id === ri.id ? { ...i, count: i.count + ri.count } : i
              );
            });
          }

          return {
            tasks: nextTasks,
            profile: { ...s.profile, coins: nextCoins },
            items: nextItems,
            flowerCollectCount: nextFlowerCollectCount,
            flowerSources: nextFlowerSources,
            collectedFlowerIds: nextCollectedIds
          };
        });
        return { success: true, message: '领取成功' };
      },

      claimAllClaimableTasks: (type) => {
        let count = 0;
        const tasks = get().tasks;
        const claimable = tasks.filter(
          (t) => t.completed && !t.claimed && (!type || t.type === type)
        );
        claimable.forEach((t) => {
          const res = get().claimTask(t.id);
          if (res.success) count++;
        });
        return count;
      },

      getLevelProgress: (levelId) => {
        const state = get();
        const p = state.levelProgress[levelId];
        const lvl = initialLevelsData.find((l) => l.id === levelId);
        return (
          p || {
            levelId,
            bestScore: lvl?.bestScore || 0,
            stars: lvl?.stars || 0,
            completed: lvl?.completed || false,
            unlocked: lvl?.unlocked || false,
            firstRewarded: lvl?.completed || false,
            playedCount: 0
          }
        );
      },

      getLevelWithProgress: (level) => {
        const p = get().levelProgress[level.id];
        if (!p) return level;
        return {
          ...level,
          bestScore: p.bestScore,
          stars: p.stars,
          completed: p.completed,
          unlocked: p.unlocked
        };
      },

      getFlowerCollectCount: (flowerId) => get().flowerCollectCount[flowerId] || 0,

      getFlowerSourceRecord: (flowerId) =>
        get().flowerSources[flowerId] || { levelReward: 0, taskReward: 0, gardenHarvest: 0, shop: 0 },

      resetAll: () => {
        set({
          profile: initialProfile,
          items: JSON.parse(JSON.stringify(initialItems)),
          plantSlots: JSON.parse(JSON.stringify(initialSlots)),
          collectedFlowerIds: [1, 2, 3, 4, 5, 6, 7, 8],
          flowerCollectCount: JSON.parse(JSON.stringify(initialFlowerCollectCount)),
          flowerSources: JSON.parse(JSON.stringify(initialFlowerSources)),
          tasks: JSON.parse(JSON.stringify(initialTasksData)),
          levelProgress: JSON.parse(JSON.stringify(initialLevelProgress)),
          levelRecords: {},
          currentLevel: initialProfile.currentLevel,
          orders: [],
          lastOrderRefreshDay: ''
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getTaroStorage()),
      partialize: (state) => ({
        profile: state.profile,
        items: state.items,
        plantSlots: state.plantSlots,
        collectedFlowerIds: state.collectedFlowerIds,
        flowerCollectCount: state.flowerCollectCount,
        flowerSources: state.flowerSources,
        tasks: state.tasks,
        levelProgress: state.levelProgress,
        levelRecords: state.levelRecords,
        currentLevel: state.currentLevel,
        orders: state.orders,
        lastOrderRefreshDay: state.lastOrderRefreshDay
      })
    }
  )
);
