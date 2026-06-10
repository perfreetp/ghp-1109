import { FlowerOrder } from '@/types/game';

const ORDER_TEMPLATES: Omit<FlowerOrder, 'id' | 'status' | 'createdAt' | 'expiresAt'>[] = [
  {
    title: '小区绿化委托',
    requester: '王阿姨',
    description: '小区美化需要一批玫瑰，拜托了！',
    requirements: [{ flowerId: 1, count: 5 }],
    reward: { coins: 150, exp: 30 }
  },
  {
    title: '婚礼花束订单',
    requester: '李经理',
    description: '客户婚礼现场需要向日葵点缀',
    requirements: [{ flowerId: 2, count: 4 }, { flowerId: 1, count: 3 }],
    reward: { coins: 280, items: [{ id: 'pot_clay', count: 1 }], exp: 50 }
  },
  {
    title: '咖啡馆布置',
    requester: '张老板',
    description: '新开的咖啡馆想搞郁金香主题',
    requirements: [{ flowerId: 3, count: 6 }],
    reward: { coins: 320, items: [{ id: 'care_water', count: 3 }], exp: 60 }
  },
  {
    title: '樱花节筹备',
    requester: '陈主任',
    description: '街道樱花节需要大量樱花装饰',
    requirements: [{ flowerId: 4, count: 8 }],
    reward: { coins: 420, items: [{ id: 'pot_porcelain', count: 1 }], exp: 80 }
  },
  {
    title: '花艺教室课程',
    requester: '赵老师',
    description: '插花课需要多种花材搭配',
    requirements: [
      { flowerId: 1, count: 3 },
      { flowerId: 2, count: 3 },
      { flowerId: 3, count: 2 }
    ],
    reward: { coins: 360, items: [{ id: 'care_fertilizer', count: 2 }], exp: 70 }
  },
  {
    title: '高端客户定制',
    requester: '周女士',
    description: '私人府邸花园要稀有花种',
    requirements: [{ flowerId: 4, count: 5 }, { flowerId: 3, count: 5 }],
    reward: { coins: 520, items: [{ id: 'rainbow', count: 1 }], exp: 100 }
  },
  {
    title: '春季花展',
    requester: '市园林局',
    description: '花展需要玫瑰和向日葵各一批',
    requirements: [{ flowerId: 1, count: 8 }, { flowerId: 2, count: 6 }],
    reward: { coins: 480, items: [{ id: 'pot_clay', count: 2 }], exp: 90 }
  },
  {
    title: '下午茶餐厅',
    requester: '林店长',
    description: '餐桌装饰用樱花，越多越好',
    requirements: [{ flowerId: 4, count: 4 }, { flowerId: 1, count: 4 }],
    reward: { coins: 300, items: [{ id: 'care_water', count: 5 }], exp: 55 }
  }
];

function getDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

let dayOrderSeed = 0;
const generatedDayKey = { key: '', seed: 0 };

export function generateDailyOrders(count = 4): FlowerOrder[] {
  const now = Date.now();
  const todayKey = getDayKey(now);
  if (generatedDayKey.key !== todayKey) {
    generatedDayKey.key = todayKey;
    generatedDayKey.seed = Math.floor(Math.random() * 1000);
  }
  dayOrderSeed = generatedDayKey.seed;

  const shuffled = [...ORDER_TEMPLATES].sort(() => {
    dayOrderSeed = (dayOrderSeed * 9301 + 49297) % 233280;
    return dayOrderSeed / 233280 - 0.5;
  });

  return shuffled.slice(0, count).map((tpl, idx) => ({
    id: Math.floor(now / 1000) + idx,
    ...tpl,
    status: 'pending' as const,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000
  }));
}

export { ORDER_TEMPLATES };
