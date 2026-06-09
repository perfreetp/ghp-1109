import { Task } from '@/types/game';

export const tasks: Task[] = [
  {
    id: 1,
    title: '每日签到',
    description: '今日登录游戏',
    type: 'daily',
    target: 1,
    progress: 1,
    reward: { coins: 100 },
    completed: true,
    claimed: false
  },
  {
    id: 2,
    title: '消除达人',
    description: '完成3局游戏',
    type: 'daily',
    target: 3,
    progress: 2,
    reward: { coins: 150, seeds: 1 },
    completed: false,
    claimed: false
  },
  {
    id: 3,
    title: '连击高手',
    description: '单局累计达成5连击',
    type: 'daily',
    target: 5,
    progress: 3,
    reward: { coins: 200 },
    completed: false,
    claimed: false
  },
  {
    id: 4,
    title: '种子收藏家',
    description: '收集5颗花种',
    type: 'daily',
    target: 5,
    progress: 2,
    reward: { coins: 100, items: [{ id: 'shovel', count: 2 }] },
    completed: false,
    claimed: false
  },
  {
    id: 5,
    title: '园艺新手',
    description: '在花园种下3朵花',
    type: 'daily',
    target: 3,
    progress: 1,
    reward: { coins: 180 },
    completed: false,
    claimed: false
  },
  {
    id: 101,
    title: '限时挑战：玫瑰收集',
    description: '在2小时内消除50个玫瑰',
    type: 'challenge',
    target: 50,
    progress: 32,
    reward: { coins: 500, seeds: 3 },
    completed: false,
    claimed: false,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 102,
    title: '极限通关',
    description: '连续通关第25关',
    type: 'challenge',
    target: 1,
    progress: 0,
    reward: { coins: 800, seeds: 5, items: [{ id: 'watercan', count: 3 }] },
    completed: false,
    claimed: false,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 201,
    title: '今日步数：健康挑战',
    description: '今日行走5000步',
    type: 'steps',
    target: 5000,
    progress: 3240,
    reward: { coins: 250 },
    completed: false,
    claimed: false
  }
];

export function getDailyTasks(): Task[] {
  return tasks.filter((t) => t.type === 'daily');
}

export function getChallengeTasks(): Task[] {
  return tasks.filter((t) => t.type === 'challenge');
}

export function getStepTasks(): Task[] {
  return tasks.filter((t) => t.type === 'steps');
}
