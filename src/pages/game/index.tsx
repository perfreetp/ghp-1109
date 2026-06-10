import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import GameBoard from '@/components/GameBoard';
import { Tile, Level, LevelGoal } from '@/types/game';
import { getLevelById } from '@/data/levels';
import { useUserStore } from '@/store/useUserStore';
import {
  generateBoard,
  findMatches,
  swapTiles,
  removeMatches,
  dropTiles,
  areAdjacent,
  calculateScore,
  calculateStars
} from '@/utils/gameLogic';
import styles from './index.module.scss';

const flowerTileNames: Record<number, { flowerId: number; name: string; emoji: string }> = {
  0: { flowerId: 1, name: '玫瑰', emoji: '🌹' },
  1: { flowerId: 2, name: '向日葵', emoji: '🌻' },
  2: { flowerId: 3, name: '郁金香', emoji: '🌷' },
  3: { flowerId: 4, name: '樱花', emoji: '🌸' },
  4: { flowerId: 5, name: '百合', emoji: '💮' },
  5: { flowerId: 6, name: '薰衣草', emoji: '🌾' }
};

const toolNameMap: Record<string, string> = {
  shovel: '铲子',
  watercan: '浇水壶',
  rainbow: '彩虹花'
};

const GamePage: React.FC = () => {
  const router = useRouter();
  const levelId = Number(router.params.levelId || 1);
  const level: Level = getLevelById(levelId) || getLevelById(1)!;

  const { items, useItem, saveLevelResult, profile } = useUserStore();

  const [board, setBoard] = useState<Tile[][]>(() => generateBoard(level.boardSize, level.tileTypes));
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCombo, setShowCombo] = useState(false);
  const [comboNumber, setComboNumber] = useState(0);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [earnedStars, setEarnedStars] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);
  const [lastRewards, setLastRewards] = useState<{ coins: number; seeds?: number; firstTime: boolean; bonusCoins?: number; goalBonus?: number; stepsBonus?: number } | null>(null);
  const [collectTypeCount, setCollectTypeCount] = useState<Record<number, number>>({});
  const [toolsUsedCount, setToolsUsedCount] = useState<Record<string, number>>({});
  const [bonusCoinsState, setBonusCoinsState] = useState(0);
  const [goalBonusState, setGoalBonusState] = useState(0);
  const [stepsBonusState, setStepsBonusState] = useState(0);

  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentLevelIdRef = useRef(levelId);
  const initRef = useRef(0);
  const collectTypeCountRef = useRef<Record<number, number>>({});
  const tutorialShownRef = useRef(false);

  const resetGame = (targetLevelId: number) => {
    const targetLevel = getLevelById(targetLevelId) || getLevelById(1)!;
    currentLevelIdRef.current = targetLevelId;
    initRef.current += 1;
    setBoard(generateBoard(targetLevel.boardSize, targetLevel.tileTypes));
    setSelectedTile(null);
    setScore(0);
    setMovesLeft(targetLevel.moves);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setGameResult(null);
    setEarnedStars(0);
    setActiveTool(null);
    setResultSaved(false);
    setLastRewards(null);
    setBonusCoinsState(0);
    setGoalBonusState(0);
    setStepsBonusState(0);
    setCollectTypeCount({});
    setToolsUsedCount({});
    collectTypeCountRef.current = {};
    tutorialShownRef.current = false;
  };

  useEffect(() => {
    console.log(`[GamePage] 开始游戏：关卡 ${levelId} - ${level.name}`);
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [levelId, level.name]);

  const currentLevel = () => {
    const id = currentLevelIdRef.current;
    return getLevelById(id) || level;
  };

  const getGoalCurrentValue = (goal: LevelGoal): number => {
    const lvl = currentLevel();
    switch (goal.type) {
      case 'score':
        return score;
      case 'movesLimit':
        return lvl.moves - movesLeft;
      case 'collectType':
        return collectTypeCount[(goal.flowerType || 1) - 1] || 0;
      case 'comboCount':
        return maxCombo;
      case 'useTool':
        return toolsUsedCount[goal.toolId!] || 0;
      default:
        return 0;
    }
  };

  const isGoalReached = (goal: LevelGoal): boolean => {
    return getGoalCurrentValue(goal) >= goal.target;
  };

  const processMatches = async (currentBoard: Tile[][], scoreSetter: (n: number) => void): Promise<Tile[][]> => {
    let workingBoard = currentBoard;
    let localCombo = 0;
    let totalScoreGain = 0;
    collectTypeCountRef.current = { ...collectTypeCount };

    let matches = findMatches(workingBoard);
    while (matches.length > 0) {
      localCombo++;
      const scoreGain = calculateScore(matches, localCombo);
      totalScoreGain += scoreGain;

      matches.forEach((tile) => {
        if (tile.type >= 0) {
          collectTypeCountRef.current[tile.type] = (collectTypeCountRef.current[tile.type] || 0) + 1;
        }
      });

      if (localCombo >= 2) {
        setComboNumber(localCombo);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 800);
      }

      setCombo(localCombo);
      setMaxCombo((prev) => Math.max(prev, localCombo));

      workingBoard = removeMatches(workingBoard, matches);
      setBoard([...workingBoard.map((r) => [...r])]);

      await new Promise((resolve) => setTimeout(resolve, 250));

      workingBoard = dropTiles(workingBoard, currentLevel().tileTypes);
      setBoard([...workingBoard.map((r) => [...r])]);

      await new Promise((resolve) => setTimeout(resolve, 200));
      matches = findMatches(workingBoard);
    }

    setCollectTypeCount({ ...collectTypeCountRef.current });

    if (totalScoreGain > 0) {
      scoreSetter(totalScoreGain);
    }

    setCombo(0);
    return workingBoard;
  };

  const tryEndGameAfterMove = (nextScore: number, remainingMoves: number) => {
    const lvl = currentLevel();
    if (nextScore >= lvl.targetScore) {
      const stars = calculateStars(nextScore, lvl.stars1Score, lvl.stars2Score, lvl.stars3Score);
      setEarnedStars(stars);
      setGameOver(true);
      setGameResult('win');
      return;
    }
    if (remainingMoves <= 0) {
      setGameOver(true);
      setGameResult('lose');
    }
  };

  const calculateBonusCoins = (): number => {
    const lvl = currentLevel();
    let bonus = 0;
    const extraGoalTypes = ['collectType', 'comboCount', 'useTool'];
    lvl.goals.forEach((goal) => {
      if (extraGoalTypes.includes(goal.type) && isGoalReached(goal)) {
        bonus += Math.round(lvl.rewards.coins * 0.1);
      }
    });
    if (movesLeft >= 5) {
      bonus += movesLeft * 10;
    }
    return bonus;
  };

  const showTutorialIfNeeded = (toolId: string) => {
    const lvl = currentLevel();
    if (lvl.tutorialTool === toolId && !tutorialShownRef.current) {
      tutorialShownRef.current = true;
      const toolName = toolNameMap[toolId] || toolId;
      Taro.showModal({
        title: '本关教学',
        content: `使用 ${toolName} 可通过关卡目标！`,
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  };

  const performSwap = async (tile1: Tile, tile2: Tile) => {
    if (isAnimating || gameOver) return;
    if (!areAdjacent(tile1, tile2)) return;

    setIsAnimating(true);
    setSelectedTile(null);

    let lvlBoard = board;
    let newBoard = swapTiles(lvlBoard, tile1, tile2);
    setBoard(newBoard);

    await new Promise((resolve) => setTimeout(resolve, 180));

    let matches = findMatches(newBoard);
    if (matches.length === 0) {
      newBoard = swapTiles(newBoard, newBoard[tile1.row][tile1.col], newBoard[tile2.row][tile2.col]);
      setBoard(newBoard);
      setIsAnimating(false);
      return;
    }

    let addedScore = 0;
    newBoard = await processMatches(newBoard, (n) => {
      addedScore += n;
    });
    const nextScore = score + addedScore;
    const nextMoves = movesLeft - 1;
    setScore(nextScore);
    setBoard(newBoard);
    setIsAnimating(false);
    setMovesLeft(nextMoves);
    tryEndGameAfterMove(nextScore, nextMoves);
  };

  const handleTileSelect = async (tile: Tile) => {
    if (isAnimating || gameOver) return;

    if (activeTool === 'shovel') {
      showTutorialIfNeeded('shovel');
      if (useItem('shovel', 1)) {
        setToolsUsedCount((prev) => ({ ...prev, shovel: (prev.shovel || 0) + 1 }));
        setIsAnimating(true);
        const newBoard = removeMatches(board, [tile]);
        setBoard(newBoard);
        await new Promise((r) => setTimeout(r, 200));
        let addedScore = 0;
        const finalBoard = await processMatches(dropTiles(newBoard, currentLevel().tileTypes), (n) => {
          addedScore += n;
        });
        const nextScore = score + addedScore;
        const nextMoves = movesLeft - 1;
        setScore(nextScore);
        setIsAnimating(false);
        setActiveTool(null);
        setMovesLeft(nextMoves);
        tryEndGameAfterMove(nextScore, nextMoves);
      }
      return;
    }

    if (activeTool === 'watercan') {
      showTutorialIfNeeded('watercan');
      if (useItem('watercan', 1)) {
        setToolsUsedCount((prev) => ({ ...prev, watercan: (prev.watercan || 0) + 1 }));
        setIsAnimating(true);
        const rowTiles = board[tile.row];
        const colTiles = board.map((r) => r[tile.col]);
        const toRemove = [...rowTiles, ...colTiles];
        const newBoard = removeMatches(board, toRemove);
        setBoard(newBoard);
        await new Promise((r) => setTimeout(r, 250));
        let addedScore = 0;
        const finalBoard = await processMatches(dropTiles(newBoard, currentLevel().tileTypes), (n) => {
          addedScore += n;
        });
        const nextScore = score + addedScore;
        const nextMoves = movesLeft - 1;
        setScore(nextScore);
        setIsAnimating(false);
        setActiveTool(null);
        setMovesLeft(nextMoves);
        tryEndGameAfterMove(nextScore, nextMoves);
      }
      return;
    }

    if (activeTool === 'rainbow') {
      showTutorialIfNeeded('rainbow');
      if (useItem('rainbow', 1)) {
        setToolsUsedCount((prev) => ({ ...prev, rainbow: (prev.rainbow || 0) + 1 }));
        setIsAnimating(true);
        const targetType = tile.type;
        const toRemove = board.flat().filter((t) => t.type === targetType);
        const newBoard = removeMatches(board, toRemove);
        setBoard(newBoard);
        await new Promise((r) => setTimeout(r, 300));
        let addedScore = 0;
        const finalBoard = await processMatches(dropTiles(newBoard, currentLevel().tileTypes), (n) => {
          addedScore += n;
        });
        const nextScore = score + addedScore;
        const nextMoves = movesLeft - 1;
        setScore(nextScore);
        setIsAnimating(false);
        setActiveTool(null);
        setMovesLeft(nextMoves);
        tryEndGameAfterMove(nextScore, nextMoves);
      }
      return;
    }

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }
    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }
    if (!areAdjacent(selectedTile, tile)) {
      setSelectedTile(tile);
      return;
    }
    performSwap(selectedTile, tile);
  };

  const handleSwipe = (fromTile: Tile, toTile: Tile) => {
    if (activeTool || isAnimating || gameOver) return;
    performSwap(fromTile, toTile);
  };

  useEffect(() => {
    if (!gameOver || gameResult !== 'win' || resultSaved) return;
    const lvl = currentLevel();
    let goalBonus = 0;
    const extraGoalTypes = ['collectType', 'comboCount', 'useTool'];
    lvl.goals.forEach((goal) => {
      if (extraGoalTypes.includes(goal.type) && isGoalReached(goal)) {
        goalBonus += Math.round(lvl.rewards.coins * 0.1);
      }
    });
    const stepsBonus = movesLeft >= 5 ? movesLeft * 10 : 0;
    const bonusCoins = goalBonus + stepsBonus;
    const { rewarded, rewards } = saveLevelResult(lvl.id, score, earnedStars, {
      collectedFlowerTileTypes: collectTypeCount,
      maxCombo,
      usedTools: toolsUsedCount,
      bonusCoins
    });
    setBonusCoinsState(bonusCoins);
    setGoalBonusState(goalBonus);
    setStepsBonusState(stepsBonus);
    setLastRewards({ coins: rewards.coins, seeds: rewards.seeds, firstTime: rewarded, bonusCoins, goalBonus, stepsBonus });
    setResultSaved(true);
    Taro.vibrateShort && useUserStore.getState().profile.settings.vibrationEnabled && Taro.vibrateShort({ type: 'medium' }).catch(() => {});
  }, [gameOver, gameResult, earnedStars, resultSaved, score, saveLevelResult, collectTypeCount, maxCombo, toolsUsedCount, movesLeft]);

  const handleToolSelect = (toolId: string) => {
    const tool = items.find((i) => i.id === toolId);
    if (!tool || tool.count <= 0) {
      Taro.showToast({ title: '道具不足', icon: 'none' });
      return;
    }
    setActiveTool((prev) => (prev === toolId ? null : toolId));
  };

  const handleRestart = () => {
    resetGame(currentLevelIdRef.current);
  };

  const handleNextLevel = () => {
    const nextId = currentLevelIdRef.current + 1;
    if (!getLevelById(nextId)) {
      Taro.showToast({ title: '已完成所有关卡！', icon: 'none' });
      handleBack();
      return;
    }
    resetGame(nextId);
  };

  const handleBack = () => {
    Taro.navigateBack({ delta: 1 }).catch(() => Taro.switchTab({ url: '/pages/levels/index' }));
  };

  const lvl = currentLevel();

  const collectedFlowerEntries = Object.entries(collectTypeCount)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const usedToolEntries = Object.entries(toolsUsedCount)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const renderGoalDisplay = (goal: LevelGoal, index: number) => {
    const current = getGoalCurrentValue(goal);
    const reached = isGoalReached(goal);
    let displayText = '';
    let displayIcon = goal.icon || '📋';

    switch (goal.type) {
      case 'score':
        displayText = `🎯 ${score.toLocaleString()}/${goal.target.toLocaleString()}`;
        break;
      case 'movesLimit':
        displayText = `👣 ${lvl.moves - movesLeft}/${lvl.moves}`;
        break;
      case 'collectType':
        const flowerInfo = flowerTileNames[(goal.flowerType || 1) - 1];
        displayIcon = flowerInfo?.emoji || displayIcon;
        displayText = `${displayIcon} ${collectTypeCount[(goal.flowerType || 1) - 1] || 0}/${goal.target}`;
        break;
      case 'comboCount':
        displayText = `⚡ ${maxCombo}/${goal.target}`;
        break;
      case 'useTool':
        const toolItem = items.find((i) => i.id === goal.toolId);
        displayIcon = toolItem?.icon || '🔧';
        displayText = `${displayIcon} ${toolsUsedCount[goal.toolId!] || 0}/${goal.target}`;
        break;
      default:
        displayText = `${current}/${goal.target}`;
    }

    return (
      <View
        key={index}
        className={classnames(styles.goalItem, reached && styles.goalReached)}
      >
        <Text className={styles.goalText}>{displayText}</Text>
        {reached && <Text className={styles.goalCheck}>✅</Text>}
      </View>
    );
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.customNav}>
        <View className={styles.backBtn} onClick={handleBack}>
          <Text className={styles.backIcon}>←</Text>
        </View>
        <View className={styles.levelInfo}>
          <Text className={styles.levelName}>第 {lvl.id} 关</Text>
          <Text className={styles.levelDesc}>{lvl.description}</Text>
        </View>
        <View className={styles.settingBtn} onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}>
          <Text className={styles.settingIcon}>⚙️</Text>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statBox}>
          <Text className={styles.statBoxLabel}>分数</Text>
          <Text className={styles.statBoxValue}>{score.toLocaleString()}</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={styles.statBoxLabel}>步数</Text>
          <Text className={classnames(styles.statBoxValue, movesLeft <= 5 && styles.danger)}>{movesLeft}</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={styles.statBoxLabel}>连击</Text>
          <Text className={classnames(styles.statBoxValue, combo >= 2 && styles.combo)}>×{combo}</Text>
        </View>
      </View>

      <View className={styles.goalsSection}>
        <Text className={styles.goalsTitle}>🎯 关卡目标</Text>
        <View className={styles.goalsList}>
          {lvl.goals.map((goal, index) => renderGoalDisplay(goal, index))}
        </View>
      </View>

      <View className={styles.boardWrap}>
        <GameBoard
          board={board}
          selectedTile={selectedTile}
          onTileSelect={handleTileSelect}
          onSwipe={handleSwipe}
          disabled={isAnimating || gameOver}
        />
      </View>

      <View className={styles.toolsBar}>
        {['shovel', 'watercan', 'rainbow'].map((toolId) => {
          const tool = items.find((i) => i.id === toolId);
          if (!tool) return null;
          return (
            <View
              key={toolId}
              className={classnames(
                styles.toolBtn,
                activeTool === toolId && styles.active,
                tool.count <= 0 && styles.disabled
              )}
              onClick={() => handleToolSelect(toolId)}
            >
              <Text className={styles.toolIcon}>{tool.icon}</Text>
              <Text className={styles.toolName}>{tool.name}</Text>
              <View className={styles.toolCount}>
                <Text className={styles.toolCountText}>{tool.count}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {showCombo && (
        <View className={styles.comboPopup}>
          <Text className={styles.comboText}>×{comboNumber} COMBO!</Text>
        </View>
      )}

      {gameOver && gameResult && (
        <View className={styles.resultMask}>
          <View className={styles.resultCard}>
            <Text className={styles.resultEmoji}>{gameResult === 'win' ? '🎉' : '😢'}</Text>
            <Text className={classnames(styles.resultTitle, styles[gameResult])}>
              {gameResult === 'win' ? '通关成功！' : '挑战失败'}
            </Text>
            <Text className={styles.resultScore}>最终分数：{score.toLocaleString()}</Text>

            {gameResult === 'win' && (
              <>
                <View className={styles.resultStars}>
                  {[1, 2, 3].map((s) => (
                    <Text key={s} className={classnames(styles.starIcon, s <= earnedStars && styles.active)}>⭐</Text>
                  ))}
                </View>

                <View className={styles.achievementCard}>
                  <Text className={styles.achievementTitle}>🏆 本局成就</Text>
                  <View className={styles.achievementList}>
                    {lvl.goals.map((goal, idx) => {
                      const reached = isGoalReached(goal);
                      let icon = goal.icon || '📋';
                      if (goal.type === 'collectType') {
                        const fi = flowerTileNames[(goal.flowerType || 1) - 1];
                        icon = fi?.emoji || icon;
                      }
                      if (goal.type === 'useTool') {
                        const ti = items.find((i) => i.id === goal.toolId);
                        icon = ti?.icon || icon;
                      }
                      return (
                        <View key={idx} className={styles.achievementItem}>
                          <Text className={styles.achievementIcon}>{reached ? '✅' : '❌'}</Text>
                          <Text className={styles.achievementGoalIcon}>{icon}</Text>
                          <Text className={classnames(styles.achievementLabel, reached && styles.reachedLabel)}>
                            {goal.label}{reached ? ' 达成' : ' (未达成)'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {collectedFlowerEntries.length > 0 && (
                    <View className={styles.statsSection}>
                      <Text className={styles.statsSectionTitle}>🌸 收集统计</Text>
                      <View className={styles.statsGrid}>
                        {collectedFlowerEntries.map(([type, count]) => {
                          const fi = flowerTileNames[Number(type)];
                          return (
                            <View key={type} className={styles.statsItem}>
                              <Text className={styles.statsItemIcon}>{fi?.emoji || '❓'}</Text>
                              <Text className={styles.statsItemName}>{fi?.name || '未知'}</Text>
                              <Text className={styles.statsItemCount}>×{count}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View className={styles.statsRow}>
                    <Text className={styles.statsRowItem}>⚡ 最大连击：{maxCombo} 次</Text>
                  </View>

                  {usedToolEntries.length > 0 && (
                    <View className={styles.statsSection}>
                      <Text className={styles.statsSectionTitle}>🔧 使用道具</Text>
                      <View className={styles.statsGrid}>
                        {usedToolEntries.map(([toolId, count]) => {
                          const ti = items.find((i) => i.id === toolId);
                          return (
                            <View key={toolId} className={styles.statsItem}>
                              <Text className={styles.statsItemIcon}>{ti?.icon || '🔧'}</Text>
                              <Text className={styles.statsItemName}>{ti?.name || toolId}</Text>
                              <Text className={styles.statsItemCount}>×{count}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {lastRewards && lastRewards.firstTime && (
                  <View className={styles.rewardBox}>
                    <Text className={styles.rewardTitle}>🎁 首次通关奖励</Text>
                    <View className={styles.rewardRow}>
                      <Text className={styles.rewardItem}>💰 {lastRewards.coins}</Text>
                      {lastRewards.seeds && <Text className={styles.rewardItem}>🌹 ×{lastRewards.seeds}</Text>}
                    </View>
                  </View>
                )}
                {(bonusCoinsState > 0 || (lastRewards && lastRewards.bonusCoins)) && (
                  <View className={styles.rewardBox}>
                    <Text className={styles.rewardTitle}>✨ 额外奖励</Text>
                    {goalBonusState > 0 && (
                      <View className={styles.rewardRow}>
                        <Text className={styles.rewardItem}>🎯 多目标达成</Text>
                        <Text className={styles.rewardValue}>+{goalBonusState} 💰</Text>
                      </View>
                    )}
                    {stepsBonusState > 0 && (
                      <View className={styles.rewardRow}>
                        <Text className={styles.rewardItem}>👣 剩余步数{movesLeft}步</Text>
                        <Text className={styles.rewardValue}>+{stepsBonusState} 💰</Text>
                      </View>
                    )}
                    <View className={styles.rewardDivider} />
                    <View className={styles.rewardRow}>
                      <Text className={classnames(styles.rewardItem, styles.bold)}>额外奖励合计</Text>
                      <Text className={classnames(styles.rewardValue, styles.bold)}>+{bonusCoinsState || lastRewards?.bonusCoins || 0} 💰</Text>
                    </View>
                  </View>
                )}
                {lastRewards && !lastRewards.firstTime && bonusCoinsState === 0 && (
                  <Text className={styles.replayTip}>已获得过首次奖励，完成额外目标获得更多奖励！</Text>
                )}
              </>
            )}

            <View className={styles.resultBtnRow}>
              <View className={classnames(styles.resultBtn, styles.secondary)} onClick={handleBack}>
                <Text className={styles.resultBtnText}>返回关卡</Text>
              </View>
              {gameResult === 'win' ? (
                <View className={classnames(styles.resultBtn, styles.primary)} onClick={handleNextLevel}>
                  <Text className={styles.resultBtnText}>下一关</Text>
                </View>
              ) : (
                <View className={classnames(styles.resultBtn, styles.primary)} onClick={handleRestart}>
                  <Text className={styles.resultBtnText}>再试一次</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default GamePage;
