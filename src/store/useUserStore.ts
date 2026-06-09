import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import { UserProfile, Item, PlantSlot, Task, Level } from '@/types/game';
import { tasks as initialTasksData } from '@/data/tasks';
import { levels as initialLevelsData } from '@/data/levels';

export interface LevelProgress {
  levelId: number;
  bestScore: number;
  stars: number;
  completed: boolean;
  unlocked: boolean;
}

interface PersistState {
  profile: UserProfile;
  items: Item[];
  plantSlots: PlantSlot[];
  collectedFlowerIds: number[];
  tasks: Task[];
  levelProgress: Record<number, LevelProgress>;
  currentLevel: number;
}

interface UserStore extends PersistState {
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addItem: (itemId: string, count: number) => void;
  useItem: (itemId: string, count: number) => boolean;
  plantFlower: (slotId: number, flowerId: number, seedItemId: string) => boolean;
  harvestFlower: (slotId: number) => { success: boolean; flowerId?: number };
  claimOfflineEarnings: () => number;
  completeNewUserGuide: () => void;
  saveLevelResult: (levelId: number, score: number, stars: number) => {
    rewarded: boolean;
    rewards: { coins: number; seeds?: number };
  };
  claimTask: (taskId: number) => { success: boolean; message: string };
  claimAllClaimableTasks: (type?: 'daily' | 'challenge' | 'steps') => number;
  getLevelProgress: (levelId: number) => LevelProgress;
  getLevelWithProgress: (level: Level) => Level;
  resetAll: () => void;
}

const STORAGE_KEY = 'huaxiaoxiao_user_store_v1';

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
  { id: 'seed_rose', name: '玫瑰花种', description: '可种植玫瑰', type: 'seed', icon: '🌹', count: 8 },
  { id: 'seed_sunflower', name: '向日葵花种', description: '可种植向日葵', type: 'seed', icon: '🌻', count: 5 },
  { id: 'seed_tulip', name: '郁金香花种', description: '可种植郁金香', type: 'seed', icon: '🌷', count: 3 },
  { id: 'seed_cherry', name: '樱花花种', description: '可种植樱花', type: 'seed', icon: '🌸', count: 2 },
  { id: 'pot_clay', name: '陶土花盆', description: '普通花盆', type: 'pot', icon: '🪴', count: 6 },
  { id: 'pot_porcelain', name: '陶瓷花盆', description: '精美花盆', type: 'pot', icon: '🏺', count: 2 }
];

const initialSlots: PlantSlot[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  occupied: i < 4,
  flowerId: i < 4 ? [1, 2, 3, 5][i] : undefined,
  plantedAt: i < 4 ? Date.now() - (4 - i) * 3600000 : undefined,
  growthStage: (i < 4 ? ([3, 2, 1, 0][i] as 0 | 1 | 2 | 3) : undefined)
}));

const initialLevelProgress: Record<number, LevelProgress> = {};
initialLevelsData.forEach((lvl) => {
  initialLevelProgress[lvl.id] = {
    levelId: lvl.id,
    bestScore: lvl.bestScore,
    stars: lvl.stars,
    completed: lvl.completed,
    unlocked: lvl.unlocked
  };
});

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

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      items: initialItems,
      plantSlots: initialSlots,
      collectedFlowerIds: [1, 2, 3, 4, 5, 6, 7, 8],
      tasks: JSON.parse(JSON.stringify(initialTasksData)),
      levelProgress: initialLevelProgress,
      currentLevel: initialProfile.currentLevel,

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

      addItem: (itemId, count) => set((state) => {
        const itemIndex = state.items.findIndex((i) => i.id === itemId);
        if (itemIndex >= 0) {
          const newItems = [...state.items];
          newItems[itemIndex] = { ...newItems[itemIndex], count: newItems[itemIndex].count + count };
          return { items: newItems };
        }
        return { items: state.items };
      }),

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
        const { plantSlots, collectedFlowerIds } = get();
        const slot = plantSlots.find((s) => s.id === slotId);
        if (!slot || !slot.occupied || slot.flowerId === undefined) {
          return { success: false };
        }
        if ((slot.growthStage || 0) < 3) {
          return { success: false };
        }

        const flowerId = slot.flowerId;
        const isNew = !collectedFlowerIds.includes(flowerId);

        set((state) => {
          const nextCollected = isNew
            ? [...state.collectedFlowerIds, flowerId]
            : state.collectedFlowerIds;
          const flowerSeedMap: Record<number, string> = {
            1: 'seed_rose',
            2: 'seed_sunflower',
            3: 'seed_tulip',
            4: 'seed_cherry'
          };
          const seedId = flowerSeedMap[flowerId];
          let nextItems = state.items;
          if (seedId) {
            nextItems = state.items.map((i) =>
              i.id === seedId ? { ...i, count: i.count + 1 } : i
            );
          }
          return {
            collectedFlowerIds: nextCollected,
            items: nextItems,
            plantSlots: state.plantSlots.map((s) =>
              s.id === slotId
                ? { ...s, occupied: false, flowerId: undefined, plantedAt: undefined, growthStage: undefined }
                : s
            )
          };
        });

        return { success: true, flowerId };
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

      saveLevelResult: (levelId, score, stars) => {
        const state = get();
        const lvl = initialLevelsData.find((l) => l.id === levelId);
        if (!lvl) return { rewarded: false, rewards: { coins: 0 } };

        const prev = state.levelProgress[levelId];
        const firstTime = !prev?.completed;
        const newBestScore = Math.max(prev?.bestScore || 0, score);
        const newStars = Math.max(prev?.stars || 0, stars);

        set((s) => {
          const nextProgress = {
            ...s.levelProgress,
            [levelId]: {
              levelId,
              bestScore: newBestScore,
              stars: newStars,
              completed: true,
              unlocked: true
            }
          };
          const nextLevelId = levelId + 1;
          if (initialLevelsData.find((l) => l.id === nextLevelId)) {
            nextProgress[nextLevelId] = {
              levelId: nextLevelId,
              bestScore: nextProgress[nextLevelId]?.bestScore || 0,
              stars: nextProgress[nextLevelId]?.stars || 0,
              completed: nextProgress[nextLevelId]?.completed || false,
              unlocked: true
            };
          }
          const rewards = lvl.rewards;
          let nextItems = s.items;
          if (firstTime && rewards.seeds) {
            nextItems = s.items.map((i) =>
              i.id === 'seed_rose' ? { ...i, count: i.count + rewards.seeds! } : i
            );
          }
          return {
            levelProgress: nextProgress,
            currentLevel: Math.max(s.currentLevel, firstTime ? levelId + 1 : s.currentLevel),
            profile: {
              ...s.profile,
              coins: s.profile.coins + (firstTime ? rewards.coins : 0),
              totalScore: s.profile.totalScore + score,
              currentLevel: Math.max(s.profile.currentLevel, firstTime ? levelId + 1 : s.profile.currentLevel)
            },
            items: nextItems
          };
        });

        if (firstTime) {
          return { rewarded: true, rewards: lvl.rewards };
        }
        return { rewarded: false, rewards: { coins: 0 } };
      },

      claimTask: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return { success: false, message: '任务不存在' };
        if (!task.completed) return { success: false, message: '任务未完成' };
        if (task.claimed) return { success: false, message: '奖励已领取' };

        set((s) => {
          const nextTasks = s.tasks.map((t) =>
            t.id === taskId ? { ...t, claimed: true } : t
          );
          let nextCoins = s.profile.coins;
          let nextItems = s.items;

          if (task.reward.coins) nextCoins += task.reward.coins;
          if (task.reward.seeds) {
            nextItems = nextItems.map((i) =>
              i.id === 'seed_rose' ? { ...i, count: i.count + task.reward.seeds! } : i
            );
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
            items: nextItems
          };
        });

        return { success: true, message: '领取成功' };
      },

      claimAllClaimableTasks: (type) => {
        const state = get();
        const claimable = state.tasks.filter(
          (t) => t.completed && !t.claimed && (!type || t.type === type)
        );
        let count = 0;
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
            unlocked: lvl?.unlocked || false
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

      resetAll: () => {
        set({
          profile: initialProfile,
          items: JSON.parse(JSON.stringify(initialItems)),
          plantSlots: JSON.parse(JSON.stringify(initialSlots)),
          collectedFlowerIds: [1, 2, 3, 4, 5, 6, 7, 8],
          tasks: JSON.parse(JSON.stringify(initialTasksData)),
          levelProgress: JSON.parse(JSON.stringify(initialLevelProgress)),
          currentLevel: initialProfile.currentLevel
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
        tasks: state.tasks,
        levelProgress: state.levelProgress,
        currentLevel: state.currentLevel
      })
    }
  )
);
