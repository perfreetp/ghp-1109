import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { getLevelById, levels } from '@/data/levels';
import { getFlowerById } from '@/data/flowers';
import { LevelPlayRecord } from '@/types/game';
import styles from './index.module.scss';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${MM}-${dd} ${HH}:${mm}`;
}

function renderStars(stars: number, max = 3) {
  return (
    <View className={styles.starsRow}>
      {Array.from({ length: max }, (_, i) => (
        <Text
          key={i}
          className={i < stars ? styles.starActive : styles.starInactive}
        >
          ⭐
        </Text>
      ))}
    </View>
  );
}

const LevelDetailPage: React.FC = () => {
  const router = useRouter();
  const levelId = Number(router.params.levelId || 25);
  const { getLevelProgress, getLevelPlayRecords, getLevelWithProgress } = useUserStore();

  const [tick, setTick] = React.useState(0);

  useDidShow(() => {
    setTick((t) => t + 1);
  });

  const level = useMemo(() => {
    const base = getLevelById(levelId);
    if (!base) return undefined;
    return getLevelWithProgress(base);
  }, [levelId, getLevelWithProgress, tick]);

  const levelProgress = useMemo(() => getLevelProgress(levelId), [levelId, getLevelProgress, tick]);
  const records: LevelPlayRecord[] = useMemo(() => getLevelPlayRecords(levelId).slice(-5).reverse(), [levelId, getLevelPlayRecords, tick]);
  const nextLevel = useMemo(() => {
    const maxId = levels[levels.length - 1]?.id || 0;
    if (levelId >= maxId) return undefined;
    const base = getLevelById(levelId + 1);
    if (!base) return undefined;
    return getLevelWithProgress(base);
  }, [levelId, getLevelWithProgress, tick]);

  if (!level) {
    return (
      <ScrollView scrollY className='pageContainer'>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🌸</Text>
          <Text className={styles.emptyTitle}>关卡不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const scoreProgress = Math.min(100, (levelProgress.bestScore / level.targetScore) * 100);

  const seedInfo = level.rewards.seedType && level.rewards.seeds
    ? (() => {
        const itemMap: Record<string, { name: string; emoji: string; flowerId: number }> = {
          seed_rose: { name: '玫瑰花种', emoji: '🌹', flowerId: 1 },
          seed_sunflower: { name: '向日葵花种', emoji: '🌻', flowerId: 2 },
          seed_tulip: { name: '郁金香花种', emoji: '🌷', flowerId: 3 },
          seed_cherry: { name: '樱花花种', emoji: '🌸', flowerId: 4 }
        };
        return itemMap[level.rewards.seedType];
      })()
    : undefined;

  const handleStartGame = () => {
    Taro.navigateTo({ url: `/pages/game/index?levelId=${levelId}` });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.headerCard}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.headerName}>{level.name}</Text>
            <Text className={styles.headerDesc}>{level.description}</Text>
          </View>
          {renderStars(levelProgress.stars)}
        </View>
        <View className={styles.scoreCompare}>
          <View className={styles.scoreItem}>
            <Text className={styles.scoreLabel}>最高分</Text>
            <Text className={styles.scoreValue}>{levelProgress.bestScore}</Text>
          </View>
          <View className={styles.scoreProgressWrap}>
            <View className={styles.scoreProgressBar}>
              <View
                className={styles.scoreProgressFill}
                style={{ width: `${scoreProgress}%` }}
              />
            </View>
            <Text className={styles.targetScore}>目标 {level.targetScore}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>📊 关卡信息</Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>🏆</Text>
            <Text className={styles.infoLabel}>目标分</Text>
            <Text className={styles.infoValue}>{level.targetScore}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>👣</Text>
            <Text className={styles.infoLabel}>步数</Text>
            <Text className={styles.infoValue}>{level.moves}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>📐</Text>
            <Text className={styles.infoLabel}>棋盘</Text>
            <Text className={styles.infoValue}>{level.boardSize}×{level.boardSize}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>🌸</Text>
            <Text className={styles.infoLabel}>种类</Text>
            <Text className={styles.infoValue}>{level.tileTypes} 种</Text>
          </View>
        </View>
      </View>

      {records.length > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>📜 通关记录（最近{records.length}局）</Text>
          {records.map((rec, idx) => {
            const collectedEntries = Object.entries(rec.collectedFlowers || {}).filter(([, v]) => v > 0);
            return (
              <View key={idx} className={styles.recordItem}>
                <View className={styles.recordLeft}>
                  <Text className={styles.recordDate}>{formatDate(rec.playedAt)}</Text>
                  <View className={styles.recordScoreLine}>
                    <Text className={styles.recordScore}>{rec.score} 分</Text>
                    {renderStars(rec.stars)}
                    <Text className={styles.recordCombo}>⚡ {rec.maxCombo || 0}</Text>
                  </View>
                </View>
                {collectedEntries.length > 0 && (
                  <View className={styles.recordCollected}>
                    {collectedEntries.map(([fid, count]) => {
                      const f = getFlowerById(Number(fid));
                      return (
                        <View key={fid} className={styles.collectedTag}>
                          <Text>{f?.emoji || '🌺'} {count}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>🎁 首次通关奖励</Text>
        <View className={styles.rewardStatus}>
          <Text className={styles.rewardStatusLabel}>奖励状态</Text>
          <Text className={levelProgress.firstRewarded ? styles.rewarded : styles.notRewarded}>
            {levelProgress.firstRewarded ? '✅ 已领取' : '❌ 未领取'}
          </Text>
        </View>
        <View className={styles.rewardList}>
          <View className={styles.rewardItem}>
            <Text className={styles.rewardIcon}>💰</Text>
            <Text className={styles.rewardName}>金币</Text>
            <Text className={styles.rewardCount}>× {level.rewards.coins}</Text>
          </View>
          {seedInfo && level.rewards.seeds && (
            <View className={styles.rewardItem}>
              <Text className={styles.rewardIcon}>🌱</Text>
              <Text className={styles.rewardName}>{seedInfo.name}</Text>
              <Text className={styles.rewardCount}>× {level.rewards.seeds}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>🎯 关卡目标</Text>
        <View className={styles.goalList}>
          {level.goals.map((goal, idx) => (
            <View key={idx} className={styles.goalItem}>
              <Text className={styles.goalIcon}>{goal.icon || '📌'}</Text>
              <Text className={styles.goalLabel}>{goal.label}</Text>
              <Text className={styles.goalTarget}>× {goal.target}</Text>
            </View>
          ))}
        </View>
      </View>

      {nextLevel && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>➡️ 下一关</Text>
          <View className={styles.nextLevelRow}>
            <View className={styles.nextLevelInfo}>
              <Text className={styles.nextLevelName}>{nextLevel.name}</Text>
              <Text className={styles.nextLevelDesc}>{nextLevel.description}</Text>
            </View>
            <View className={nextLevel.unlocked ? styles.unlocked : styles.locked}>
              <Text>{nextLevel.unlocked ? '🔓 已解锁' : '🔒 未解锁'}</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomBtns}>
        <View className={styles.backBtn} onClick={handleBack}>
          <Text className={styles.backBtnText}>← 返回关卡</Text>
        </View>
        <View className={styles.startBtn} onClick={handleStartGame}>
          <Text className={styles.startBtnText}>🎮 开始挑战</Text>
        </View>
      </View>

      <View className={styles.bottomSpacer} />
    </ScrollView>
  );
};

export default LevelDetailPage;
