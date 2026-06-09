import { LeaderboardUser } from '@/types/game';

const nicknames = [
  '花仙子', '玫瑰园主', '向日葵', '郁金香公主', '樱花恋人',
  '花园精灵', '百合骑士', '牡丹女王', '兰花公子', '菊花隐士',
  '梅花傲雪', '昙花一现', '木棉花', '茉莉清香', '睡莲仙子'
];

export const friendLeaderboard: LeaderboardUser[] = Array.from({ length: 15 }, (_, i) => ({
  rank: i + 1,
  userId: `user_${String(i + 1).padStart(3, '0')}`,
  nickname: nicknames[i % nicknames.length] + (i >= 10 ? String(i - 4) : ''),
  avatar: `https://picsum.photos/id/${100 + i}/200/200`,
  score: Math.floor(200000 - i * 8000 - Math.random() * 5000),
  level: Math.max(1, 30 - i * 2),
  isFriend: i !== 4,
  isSelf: i === 4
}));

friendLeaderboard[4] = {
  rank: 5,
  userId: 'user_001',
  nickname: '花仙子（我）',
  avatar: 'https://picsum.photos/id/64/200/200',
  score: 128500,
  level: 12,
  isFriend: false,
  isSelf: true
};

export const globalLeaderboard: LeaderboardUser[] = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  userId: `global_${String(i + 1).padStart(4, '0')}`,
  nickname: `玩家${nicknames[i % nicknames.length]}${i + 1}`,
  avatar: `https://picsum.photos/id/${200 + i}/200/200`,
  score: Math.floor(500000 - i * 15000 - Math.random() * 8000),
  level: Math.max(10, 60 - i * 2),
  isFriend: i % 7 === 0,
  isSelf: false
}));
