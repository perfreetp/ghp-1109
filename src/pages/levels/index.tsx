import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import LevelCard from '@/components/LevelCard';
import { levels } from '@/data/levels';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

const LevelsPage: React.FC = () => {
  const { profile } = useUserStore();
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'uncompleted', label: '未通关' },
    { id: '3star', label: '满星' }
  ];

  const filteredLevels = levels.filter((level) => {
    if (activeFilter === 'uncompleted') return level.unlocked && !level.completed;
    if (activeFilter === '3star') return level.stars === 3;
    return true;
  });

  const completedCount = levels.filter((l) => l.completed).length;
  const totalCount = levels.length;
  const totalStars = levels.reduce((acc, l) => acc + l.stars, 0);

  const handleLevelClick = (levelId: number) => {
    const level = levels.find((l) => l.id === levelId);
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
          <Text style={{ fontSize: '28rpx', fontWeight: 600 }}>⭐ {totalStars}</Text>
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
