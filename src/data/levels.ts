import { Level } from '@/types/game';

const flowerTileNames: Record<number, { flowerId: number; name: string; emoji: string }> = {
  1: { flowerId: 1, name: '玫瑰', emoji: '🌹' },
  2: { flowerId: 2, name: '向日葵', emoji: '🌻' },
  3: { flowerId: 3, name: '郁金香', emoji: '🌷' },
  4: { flowerId: 4, name: '樱花', emoji: '🌸' },
  5: { flowerId: 5, name: '百合', emoji: '💮' },
  6: { flowerId: 6, name: '薰衣草', emoji: '🌾' }
};

function buildGoalsForLevel(id: number, baseTarget: number, tileTypes: number, moves: number): Level['goals'] {
  const goals: Level['goals'] = [
    {
      type: 'score',
      target: baseTarget,
      label: '达到目标分',
      icon: '🎯'
    },
    {
      type: 'movesLimit',
      target: moves,
      label: '步数内完成',
      icon: '👣'
    }
  ];

  if (id >= 2 && id % 2 === 0) {
    const flowerType = ((id + 1) % tileTypes) + 1;
    const count = 6 + Math.floor(id / 4) * 2;
    const info = flowerTileNames[flowerType] || flowerTileNames[1];
    goals.push({
      type: 'collectType',
      target: count,
      flowerType,
      label: `收集${info.name}${count}个`,
      icon: info.emoji
    });
  }

  if (id >= 4 && id % 3 === 1) {
    const comboTarget = id <= 15 ? 3 : 5;
    goals.push({
      type: 'comboCount',
      target: comboTarget,
      label: `达成${comboTarget}连击`,
      icon: '⚡'
    });
  }

  if (id === 3) {
    goals.push({
      type: 'useTool',
      target: 1,
      toolId: 'shovel',
      label: '使用1次铲子',
      icon: '⛏️'
    });
  }
  if (id === 7) {
    goals.push({
      type: 'useTool',
      target: 1,
      toolId: 'watercan',
      label: '使用1次浇水壶',
      icon: '🚿'
    });
  }
  if (id === 13) {
    goals.push({
      type: 'useTool',
      target: 1,
      toolId: 'rainbow',
      label: '使用1次彩虹花',
      icon: '🌈'
    });
  }

  return goals;
}

export const levels: Level[] = Array.from({ length: 30 }, (_, i) => {
  const id = i + 1;
  const baseTarget = 500 + id * 150;
  const moves = Math.max(15, 30 - Math.floor(id / 5));
  const boardSize = id <= 10 ? 6 : id <= 20 ? 7 : 8;
  const tileTypes = id <= 5 ? 4 : id <= 15 ? 5 : 6;
  const seedFlowerId = (id % 4) + 1;
  const seedTypeMap: Record<number, string> = {
    1: 'seed_rose',
    2: 'seed_sunflower',
    3: 'seed_tulip',
    4: 'seed_cherry'
  };
  const goals = buildGoalsForLevel(id, baseTarget, tileTypes, moves);
  const tutorialToolMap: Record<number, string> = {
    3: 'shovel',
    7: 'watercan',
    13: 'rainbow'
  };

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
    goals,
    stars1Score: baseTarget,
    stars2Score: Math.floor(baseTarget * 1.4),
    stars3Score: Math.floor(baseTarget * 2),
    rewards: {
      coins: 50 + id * 20,
      seeds: id % 3 === 0 ? Math.ceil(id / 5) : undefined,
      seedType: id % 3 === 0 ? seedTypeMap[seedFlowerId] : undefined,
      seedFlowerId: id % 3 === 0 ? seedFlowerId : undefined
    },
    unlocked: id <= 25,
    completed: id < 25,
    bestScore: id < 25 ? Math.floor(baseTarget * (1.2 + Math.random() * 0.8)) : 0,
    stars: id < 25 ? (Math.random() > 0.3 ? (Math.random() > 0.5 ? 3 : 2) : 1) : 0,
    tutorialTool: tutorialToolMap[id]
  };
});

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function getUnlockedLevels(): Level[] {
  return levels.filter((l) => l.unlocked);
}
