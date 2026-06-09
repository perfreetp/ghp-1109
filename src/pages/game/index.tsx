import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import GameBoard from '@/components/GameBoard';
import { Tile, Level } from '@/types/game';
import { getLevelById, levels } from '@/data/levels';
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

const GamePage: React.FC = () => {
  const router = useRouter();
  const levelId = Number(router.params.levelId || 1);
  const level: Level = getLevelById(levelId) || getLevelById(1)!;

  const { items, useItem, saveLevelResult, profile, updateProfile } = useUserStore();

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
  const [lastRewards, setLastRewards] = useState<{ coins: number; seeds?: number; firstTime: boolean } | null>(null);

  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentLevelIdRef = useRef(levelId);
  const initRef = useRef(0);

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

  const processMatches = async (currentBoard: Tile[][], scoreSetter: (n: number) => void): Promise<Tile[][]> => {
    let workingBoard = currentBoard;
    let localCombo = 0;
    let totalScoreGain = 0;

    let matches = findMatches(workingBoard);
    while (matches.length > 0) {
      localCombo++;
      const scoreGain = calculateScore(matches, localCombo);
      totalScoreGain += scoreGain;

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
      if (useItem('shovel', 1)) {
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
      if (useItem('watercan', 1)) {
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
    const { rewarded, rewards } = saveLevelResult(lvl.id, score, earnedStars);
    setLastRewards({ coins: rewards.coins, seeds: rewards.seeds, firstTime: rewarded });
    setResultSaved(true);
    Taro.vibrateShort && useUserStore.getState().profile.settings.vibrationEnabled && Taro.vibrateShort({ type: 'medium' }).catch(() => {});
  }, [gameOver, gameResult, earnedStars, resultSaved, score, saveLevelResult]);

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
  const targetPercent = Math.min(100, (score / lvl.targetScore) * 100);

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

      <View className={styles.targetSection}>
        <Text className={styles.targetTitle}>🎯 目标分数：{lvl.targetScore.toLocaleString()}</Text>
        <View className={styles.targetBar}>
          <View className={styles.targetFill} style={{ width: `${targetPercent}%` }} />
          <Text className={styles.targetText}>{Math.floor(targetPercent)}%</Text>
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
                {lastRewards && lastRewards.firstTime && (
                  <View className={styles.rewardBox}>
                    <Text className={styles.rewardTitle}>🎁 首次通关奖励</Text>
                    <View className={styles.rewardRow}>
                      <Text className={styles.rewardItem}>💰 {lastRewards.coins}</Text>
                      {lastRewards.seeds && <Text className={styles.rewardItem}>🌹 ×{lastRewards.seeds}</Text>}
                    </View>
                  </View>
                )}
                {lastRewards && !lastRewards.firstTime && (
                  <Text className={styles.replayTip}>已获得过首次奖励，继续加油刷新记录！</Text>
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
