import { Flower } from '@/types/game';

export const flowers: Flower[] = [
  {
    id: 1,
    name: '玫瑰',
    meaning: '热情与爱情',
    description: '玫瑰是爱与美的象征，代表着热烈的爱情和真挚的情感。',
    rarity: 'common',
    color: '#FF6B6B',
    emoji: '🌹',
    unlocked: true,
    collectedCount: 15,
    growthSeconds: 60,
    harvestReward: 1
  },
  {
    id: 2,
    name: '向日葵',
    meaning: '阳光与希望',
    description: '向日葵总是向着阳光生长，象征着积极向上和对生活的热爱。',
    rarity: 'common',
    color: '#FFD93D',
    emoji: '🌻',
    unlocked: true,
    collectedCount: 12,
    growthSeconds: 90,
    harvestReward: 1
  },
  {
    id: 3,
    name: '郁金香',
    meaning: '优雅与祝福',
    description: '郁金香代表优雅高贵，是春天和新生的象征。',
    rarity: 'rare',
    color: '#E85C90',
    emoji: '🌷',
    unlocked: true,
    collectedCount: 8,
    growthSeconds: 180,
    harvestReward: 1
  },
  {
    id: 4,
    name: '樱花',
    meaning: '纯洁与浪漫',
    description: '樱花盛开时绚烂美丽，代表着纯洁的爱情和美好的回忆。',
    rarity: 'rare',
    color: '#FFB6C8',
    emoji: '🌸',
    unlocked: true,
    collectedCount: 6,
    growthSeconds: 240,
    harvestReward: 1
  },
  {
    id: 5,
    name: '百合',
    meaning: '纯洁与高贵',
    description: '百合花寓意百年好合，是最纯洁的祝福。',
    rarity: 'rare',
    color: '#FFFFFF',
    emoji: '💐',
    unlocked: true,
    collectedCount: 5,
    growthSeconds: 300,
    harvestReward: 2
  },
  {
    id: 6,
    name: '芙蓉',
    meaning: '清新与脱俗',
    description: '芙蓉花清新脱俗，出淤泥而不染。',
    rarity: 'epic',
    color: '#FF9FF3',
    emoji: '🌺',
    unlocked: true,
    collectedCount: 3,
    growthSeconds: 480,
    harvestReward: 2
  },
  {
    id: 7,
    name: '牡丹',
    meaning: '富贵与吉祥',
    description: '牡丹花开富贵，是吉祥繁荣的象征。',
    rarity: 'epic',
    color: '#FF4757',
    emoji: '🏵️',
    unlocked: true,
    collectedCount: 2,
    growthSeconds: 600,
    harvestReward: 2
  },
  {
    id: 8,
    name: '兰花',
    meaning: '高洁与典雅',
    description: '兰花是花中君子，象征高洁典雅的品格。',
    rarity: 'legendary',
    color: '#A29BFE',
    emoji: '🪻',
    unlocked: true,
    collectedCount: 1,
    growthSeconds: 900,
    harvestReward: 3
  },
  {
    id: 9,
    name: '昙花',
    meaning: '永恒与刹那',
    description: '昙花一现，却将最美的瞬间留在人间。',
    rarity: 'legendary',
    color: '#DFE6E9',
    emoji: '🌼',
    unlocked: false,
    collectedCount: 0,
    growthSeconds: 1200,
    harvestReward: 3
  },
  {
    id: 10,
    name: '曼陀罗',
    meaning: '神秘与传说',
    description: '传说中充满神秘色彩的花朵。',
    rarity: 'legendary',
    color: '#6C5CE7',
    emoji: '🌿',
    unlocked: false,
    collectedCount: 0,
    growthSeconds: 1500,
    harvestReward: 3
  },
  {
    id: 11,
    name: '梅花',
    meaning: '坚韧与傲骨',
    description: '梅花香自苦寒来，象征坚韧不拔的精神。',
    rarity: 'epic',
    color: '#FCBAD3',
    emoji: '🌾',
    unlocked: false,
    collectedCount: 0,
    growthSeconds: 720,
    harvestReward: 2
  },
  {
    id: 12,
    name: '菊花',
    meaning: '隐逸与高洁',
    description: '菊花是花中隐士，代表淡泊名利的品格。',
    rarity: 'rare',
    color: '#FFEAA7',
    emoji: '🍂',
    unlocked: false,
    collectedCount: 0,
    growthSeconds: 360,
    harvestReward: 1
  }
];

export function getFlowerById(id: number): Flower | undefined {
  return flowers.find((f) => f.id === id);
}

export function getUnlockedFlowers(): Flower[] {
  return flowers.filter((f) => f.unlocked);
}

export function getFlowersByRarity(rarity: Flower['rarity']): Flower[] {
  return flowers.filter((f) => f.rarity === rarity);
}
