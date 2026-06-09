import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import LevelCard from '@/components/LevelCard';
import { levels } from '@/data/levels';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

const LevelsPage: React.FC = () => {
  const { profile, getLevelWithProgress } = useUserStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useDidShow(() => {
    setTick((t) => t + 1);
  });

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'uncompleted', label: '未通关' },
    { id: '3star', label: '满星' }
  ];

  const mergedLevels = useMemo(() => {
    return levels.map((lvl) => getLevelWithProgress(lvl));
  }, [tick, profile.currentLevel, getLevelWithProgress]);

  const filteredLevels = mergedLevels.filter((level) => {
    if (activeFilter === 'uncompleted') return level.unlocked && !level.completed;
    if (activeFilter === '3star') return level.stars === 3;
    return true;
  });

  const completedCount = mergedLevels.filter((l) => l.completed).length;
  const totalCount = mergedLevels.length;
  const totalStars = mergedLevels.reduce((acc, l) => acc + l.stars, 0);

  const handleLevelClick = (levelId: number) => {
    const level = mergedLevels.find((l) => l.id === levelId);
    if (level?.unlocked) {
      Taro.navigateTo({ url: `/pages/game/index?levelId=${levelId}` });
    } else {
      Taro.showToast({ title: '关卡未解锁', icon: 'none' });
    }
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryTitle}>关卡进度</Text>
          <Text className={styles.summaryProgress}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </View>
        <View className={styles.summaryRow} style={{ marginTop: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', opacity: 0.9 }}>收集星星</Text>
          <Text style={{ fontSize: '28rpx', fontWeight: 600 }}>⭐ {totalStars} / {totalCount * 3}</Text>
        </View>
        <View className={styles.summaryRow} style={{ marginTop: '8rpx' }}>
          <Text style={{ fontSize: '24rpx', opacity: 0.9 }}>当前关卡</Text>
          <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#FF7BA9' }}>第 {profile.currentLevel} 关</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterTabs}>
        {filters.map((f) => (
          <View
            key={f.id}
            className={classnames(styles.filterTab, activeFilter === f.id && styles.active)}
            onClick={() => setActiveFilter(f.id)}
          >
            <Text className={styles.filterTabText}>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.levelGrid}>
        {filteredLevels.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            onClick={() => handleLevelClick(level.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default LevelsPage;
