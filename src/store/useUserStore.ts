import { create } from 'zustand';
import { UserProfile, Item, PlantSlot } from '@/types/game';

interface UserStore {
  profile: UserProfile;
  items: Item[];
  plantSlots: PlantSlot[];
  collectedFlowerIds: number[];
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addItem: (itemId: string, count: number) => void;
  useItem: (itemId: string, count: number) => boolean;
  plantFlower: (slotId: number, flowerId: number) => boolean;
  collectFlower: (flowerId: number) => void;
  claimOfflineEarnings: () => number;
  completeNewUserGuide: () => void;
}

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

export const useUserStore = create<UserStore>((set, get) => ({
  profile: initialProfile,
  items: initialItems,
  plantSlots: initialSlots,
  collectedFlowerIds: [1, 2, 3, 4, 5, 6, 7, 8],

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

  plantFlower: (slotId, flowerId) => set((state) => ({
    plantSlots: state.plantSlots.map((slot) =>
      slot.id === slotId
        ? { ...slot, occupied: true, flowerId, plantedAt: Date.now(), growthStage: 0 }
        : slot
    )
  })),

  collectFlower: (flowerId) => set((state) => ({
    collectedFlowerIds: state.collectedFlowerIds.includes(flowerId)
      ? state.collectedFlowerIds
      : [...state.collectedFlowerIds, flowerId]
  })),

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
  }))
}));
