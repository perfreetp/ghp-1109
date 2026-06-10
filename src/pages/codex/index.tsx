import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import FlowerCard from '@/components/FlowerCard';
import { flowers } from '@/data/flowers';
import { Flower } from '@/types/game';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

type FilterType = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

const CodexPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);

  const {
    collectedFlowerIds,
    getFlowerCollectCount,
    getFlowerSourceRecord
  } = useUserStore();

  const filters = [
    { id: 'all' as FilterType, label: '全部' },
    { id: 'common' as FilterType, label: '普通' },
    { id: 'rare' as FilterType, label: '稀有' },
    { id: 'epic' as FilterType, label: '史诗' },
    { id: 'legendary' as FilterType, label: '传说' }
  ];

  const filteredFlowers =
    activeFilter === 'all' ? flowers : flowers.filter((f) => f.rarity === activeFilter);

  const unlockedCount = flowers.filter((f) => collectedFlowerIds.includes(f.id)).length;
  const totalCount = flowers.length;

  const rarityColors = {
    common: '#ADB5BD',
    rare: '#74C0FC',
    epic: '#DA77F2',
    legendary: '#FFD93D'
  };

  const rarityLabels = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };

  const handleFlowerClick = (flower: Flower) => {
    const unlocked = collectedFlowerIds.includes(flower.id);
    if (!unlocked) {
      Taro.showToast({ title: '完成相应关卡可解锁', icon: 'none' });
      return;
    }
    setSelectedFlower(flower);
  };

  const renderSourceItem = (icon: string, label: string, count: number) => (
    <View className={styles.sourceItem}>
      <Text className={styles.sourceIcon}>{icon}</Text>
      <View className={styles.sourceInfo}>
        <Text className={styles.sourceLabel}>{label}</Text>
        <View className={styles.sourceBar}>
          <View
            className={styles.sourceBarFill}
            style={{
              width: totalCollectCount > 0 ? `${(count / totalCollectCount) * 100}%` : '0%'
            }}
          />
        </View>
      </View>
      <Text className={styles.sourceCount}>{count}</Text>
    </View>
  );

  const totalCollectCount = selectedFlower ? getFlowerCollectCount(selectedFlower.id) : 0;
  const sourceRecord = selectedFlower ? getFlowerSourceRecord(selectedFlower.id) : {
    levelReward: 0,
    taskReward: 0,
    gardenHarvest: 0,
    shop: 0
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>📖 花语图鉴</Text>
        <Text className={styles.summaryDesc}>收集所有花朵，解锁它们的花语</Text>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
        </View>
        <Text className={styles.progressText}>
          {unlockedCount} / {totalCount} 已解锁
        </Text>
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

      <View className={styles.flowerGrid}>
        {filteredFlowers.map((flower) => (
          <FlowerCard
            key={flower.id}
            flower={flower}
            unlocked={collectedFlowerIds.includes(flower.id)}
            collectedCount={getFlowerCollectCount(flower.id)}
            onClick={() => handleFlowerClick(flower)}
          />
        ))}
      </View>

      {selectedFlower && (
        <View className={styles.detailMask} onClick={() => setSelectedFlower(null)}>
          <View className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <View className={styles.detailCloseBtn} onClick={() => setSelectedFlower(null)}>
              <Text className={styles.detailCloseIcon}>×</Text>
            </View>
            <View className={styles.detailHeader} style={{ backgroundColor: `${selectedFlower.color}15` }}>
              <Text className={styles.detailFlowerIcon}>{selectedFlower.emoji}</Text>
              <Text className={styles.detailName}>{selectedFlower.name}</Text>
              <Text className={styles.detailMeaning}>{selectedFlower.meaning}</Text>
              <View
                className={styles.detailRarity}
                style={{ backgroundColor: rarityColors[selectedFlower.rarity] }}
              >
                {rarityLabels[selectedFlower.rarity]}
              </View>
            </View>
            <View className={styles.detailBody}>
              <View className={styles.collectStatsRow}>
                <View className={styles.collectStatItem}>
                  <Text className={styles.collectStatValue}>{totalCollectCount}</Text>
                  <Text className={styles.collectStatLabel}>收集了{totalCollectCount}次</Text>
                </View>
                <View className={styles.collectStatItem}>
                  <Text className={styles.collectStatValue}>{selectedFlower.growthSeconds}s</Text>
                  <Text className={styles.collectStatLabel}>成长时间</Text>
                </View>
                <View className={styles.collectStatItem}>
                  <Text className={styles.collectStatValue}>+{selectedFlower.harvestReward}</Text>
                  <Text className={styles.collectStatLabel}>每次收获花种</Text>
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>📊 来源分布</Text>
                <View className={styles.sourceList}>
                  {renderSourceItem('🏆', '关卡奖励', sourceRecord.levelReward)}
                  {renderSourceItem('📋', '任务奖励', sourceRecord.taskReward)}
                  {renderSourceItem('🌱', '花园收获', sourceRecord.gardenHarvest)}
                  {renderSourceItem('🏪', '商店', sourceRecord.shop)}
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>📜 花之详情</Text>
                <Text className={styles.detailDesc}>{selectedFlower.description}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CodexPage;
