import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import FlowerCard from '@/components/FlowerCard';
import { flowers } from '@/data/flowers';
import { Flower } from '@/types/game';
import styles from './index.module.scss';

type FilterType = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

const CodexPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);

  const filters = [
    { id: 'all' as FilterType, label: '全部' },
    { id: 'common' as FilterType, label: '普通' },
    { id: 'rare' as FilterType, label: '稀有' },
    { id: 'epic' as FilterType, label: '史诗' },
    { id: 'legendary' as FilterType, label: '传说' }
  ];

  const filteredFlowers =
    activeFilter === 'all' ? flowers : flowers.filter((f) => f.rarity === activeFilter);

  const unlockedCount = flowers.filter((f) => f.unlocked).length;
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
            onClick={() => flower.unlocked && setSelectedFlower(flower)}
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
              <View
                className={styles.detailRarity}
                style={{ backgroundColor: rarityColors[selectedFlower.rarity] }}
              >
                {rarityLabels[selectedFlower.rarity]}
              </View>
            </View>
            <View className={styles.detailBody}>
              <View className={styles.detailStats}>
                <View className={styles.detailStat}>
                  <Text className={styles.detailStatValue}>{selectedFlower.collectedCount}</Text>
                  <Text className={styles.detailStatLabel}>收集数量</Text>
                </View>
                <View className={styles.detailStat}>
                  <Text className={styles.detailStatValue}>✓</Text>
                  <Text className={styles.detailStatLabel}>已解锁</Text>
                </View>
              </View>
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>🌸 花语</Text>
                <Text className={styles.detailValue}>{selectedFlower.meaning}</Text>
              </View>
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>📜 详情</Text>
                <Text className={styles.detailValue}>{selectedFlower.description}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CodexPage;
