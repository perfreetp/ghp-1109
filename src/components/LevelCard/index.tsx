import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Level } from '@/types/game';
import styles from './index.module.scss';

interface LevelCardProps {
  level: Level;
  onClick?: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, onClick }) => {
  const { id, name, description, unlocked, stars, rewards } = level;

  if (!unlocked) {
    return (
      <View className={classnames(styles.levelCard, styles.locked)}>
        <View className={styles.lockIcon}>🔒</View>
        <Text className={styles.levelNum}>{id}</Text>
      </View>
    );
  }

  return (
    <View className={styles.levelCard} onClick={onClick}>
      <View className={styles.levelHeader}>
        <Text className={styles.levelNum}>{id}</Text>
        {stars > 0 && (
          <View className={styles.stars}>
            {[1, 2, 3].map((s) => (
              <Text key={s} className={classnames(styles.star, s <= stars && styles.starActive)}>
                ⭐
              </Text>
            ))}
          </View>
        )}
      </View>
      <Text className={styles.levelName}>{name}</Text>
      <Text className={styles.levelDesc}>{description}</Text>
      <View className={styles.rewardInfo}>
        <Text className={styles.rewardText}>💰 {rewards.coins}</Text>
      </View>
    </View>
  );
};

export default LevelCard;
