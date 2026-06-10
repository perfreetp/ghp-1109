export interface Tile {
  id: string;
  type: number;
  row: number;
  col: number;
  isMatched: boolean;
  isSelected: boolean;
}

export type LevelGoalType = 'score' | 'collectType' | 'comboCount' | 'useTool' | 'movesLimit';

export interface LevelGoal {
  type: LevelGoalType;
  target: number;
  current?: number;
  flowerType?: number;
  toolId?: string;
  label: string;
  icon?: string;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  targetScore: number;
  moves: number;
  boardSize: number;
  tileTypes: number;
  stars1Score: number;
  stars2Score: number;
  stars3Score: number;
  goals: LevelGoal[];
  rewards: {
    coins: number;
    seeds?: number;
    seedType?: string;
    seedFlowerId?: number;
  };
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  stars: number;
  tutorialTool?: string;
}

export interface Flower {
  id: number;
  name: string;
  meaning: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  emoji: string;
  unlocked: boolean;
  collectedCount: number;
  growthSeconds: number;
  harvestReward: number;
}

export type ItemSource = 'levelReward' | 'taskReward' | 'gardenHarvest' | 'shop';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'seed' | 'pot';
  icon: string;
  count: number;
  price?: number;
  rarity?: 'common' | 'rare' | 'epic';
  gardenEffect?: {
    growthSpeedMultiplier?: number;
    harvestBonus?: number;
    expandSlots?: number;
  };
}

export interface Task {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'challenge' | 'steps';
  target: number;
  progress: number;
  reward: {
    coins?: number;
    seeds?: number;
    seedType?: string;
    items?: { id: string; count: number }[];
  };
  completed: boolean;
  claimed: boolean;
  deadline?: string;
}

export interface LeaderboardUser {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  level: number;
  isFriend: boolean;
  isSelf: boolean;
}

export type PotLevel = 0 | 1 | 2;

export interface PlantSlot {
  id: number;
  occupied: boolean;
  flowerId?: number;
  plantedAt?: number;
  growthStage?: 0 | 1 | 2 | 3;
  potLevel?: PotLevel;
  potId?: string;
}

export interface LevelPlayRecord {
  levelId: number;
  playedAt: number;
  score: number;
  stars: number;
  collectedFlowers: Record<number, number>;
  maxCombo: number;
  usedTools: Record<string, number>;
}

export interface FlowerSourceRecord {
  levelReward: number;
  taskReward: number;
  gardenHarvest: number;
  shop: number;
}

export interface ItemSourceRecord {
  levelReward: number;
  taskReward: number;
  gardenHarvest: number;
  shop: number;
}

export interface UserProfile {
  userId: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
  coins: number;
  diamonds: number;
  currentLevel: number;
  totalScore: number;
  offlineEarnings: number;
  lastOnlineTime: number;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    eyeCareMode: boolean;
  };
  isNewUser: boolean;
}

export interface GameState {
  currentLevel: number;
  score: number;
  movesLeft: number;
  combo: number;
  maxCombo: number;
  board: Tile[][];
  selectedTile: Tile | null;
  isAnimating: boolean;
  gameOver: boolean;
  gameResult: 'win' | 'lose' | null;
  activeItem: string | null;
  collectTypeCount: Record<number, number>;
  toolsUsedCount: Record<string, number>;
}
