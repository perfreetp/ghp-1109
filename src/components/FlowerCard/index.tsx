import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Flower } from '@/types/game';
import styles from './index.module.scss';

interface FlowerCardProps {
  flower: Flower;
  unlocked: boolean;
  collectedCount: number;
  onClick?: () => void;
}

const FlowerCard: React.FC<FlowerCardProps> = ({ flower, unlocked, collectedCount, onClick }) => {
  const { name, meaning, rarity, color, emoji } = flower;

  const rarityConfig = {
    common: { label: '普通', color: '#ADB5BD' },
    rare: { label: '稀有', color: '#74C0FC' },
    epic: { label: '史诗', color: '#DA77F2' },
    legendary: { label: '传说', color: '#FFD93D' }
  }[rarity];

  return (
    <View
      className={classnames(styles.flowerCard, !unlocked && styles.locked)}
      onClick={onClick}
    >
      <View className={styles.rarityTag} style={{ backgroundColor: rarityConfig.color }}>
        <Text className={styles.rarityText}>{rarityConfig.label}</Text>
      </View>
      <View
        className={styles.flowerIconWrap}
        style={{ backgroundColor: unlocked ? `${color}20` : '#E9ECEF' }}
      >
        <Text className={styles.flowerIcon} style={{ opacity: unlocked ? 1 : 0.3 }}>
          {unlocked ? emoji : '❓'}
        </Text>
        {!unlocked && (
          <View className={styles.lockOverlay}>
            <Text className={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>
      <Text className={styles.flowerName}>{unlocked ? name : '???'}</Text>
      <Text className={styles.flowerMeaning}>
        {unlocked ? meaning : '尚未解锁'}
      </Text>
      {unlocked && collectedCount > 0 && (
        <View className={styles.countBadge}>
          <Text className={styles.countText}>收集×{collectedCount}</Text>
        </View>
      )}
      {!unlocked && (
        <View className={styles.lockBadge}>
          <Text className={styles.lockBadgeText}>未解锁🔒</Text>
        </View>
      )}
    </View>
  );
};

export default FlowerCard;
