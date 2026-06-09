import { Level } from '@/types/game';

export const levels: Level[] = Array.from({ length: 30 }, (_, i) => {
  const id = i + 1;
  const baseTarget = 500 + id * 150;
  const moves = Math.max(15, 30 - Math.floor(id / 5));
  const boardSize = id <= 10 ? 6 : id <= 20 ? 7 : 8;
  const tileTypes = id <= 5 ? 4 : id <= 15 ? 5 : 6;

  return {
    id,
    name: `第 ${id} 关`,
    description: [
      '春日花园', '夏日池塘', '秋叶庭院', '冬雪温室', '晨曦露台',
      '午后阳台', '黄昏花田', '月夜花圃', '彩虹小径', '梦幻温室',
      '桃花深处', '竹林幽径', '荷塘月色', '菊香满园', '梅雪争春',
      '兰草幽谷', '海棠依旧', '杜鹃啼血', '紫藤缠绕', '蔷薇满架',
      '茉莉芬芳', '栀子花开', '桂花飘香', '水仙凌波', '木棉映红',
      '合欢盈盈', '紫薇灼灼', '山茶傲雪', '芙蓉出水', '牡丹倾城'
    ][i],
    targetScore: baseTarget,
    moves,
    boardSize,
    tileTypes,
    stars1Score: baseTarget,
    stars2Score: Math.floor(baseTarget * 1.4),
    stars3Score: Math.floor(baseTarget * 2),
    rewards: {
      coins: 50 + id * 20,
      seeds: id % 3 === 0 ? Math.ceil(id / 5) : undefined
    },
    unlocked: id <= 25,
    completed: id < 25,
    bestScore: id < 25 ? Math.floor(baseTarget * (1.2 + Math.random() * 0.8)) : 0,
    stars: id < 25 ? (Math.random() > 0.3 ? (Math.random() > 0.5 ? 3 : 2) : 1) : 0
  };
});

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function getUnlockedLevels(): Level[] {
  return levels.filter((l) => l.unlocked);
}
