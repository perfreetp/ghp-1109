import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { Task } from '@/types/game';
import ProgressBar from '@/components/ProgressBar';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
  onClaim?: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClaim }) => {
  const { title, description, type, target, progress, reward, completed, claimed } = task;

  const typeLabel = {
    daily: '每日',
    challenge: '限时',
    steps: '步数'
  }[type];

  const typeColor = {
    daily: '#FF7BA9',
    challenge: '#FFD93D',
    steps: '#7EC8A3'
  }[type];

  return (
    <View className={styles.taskCard}>
      <View className={styles.taskHeader}>
        <View className={styles.taskType} style={{ backgroundColor: typeColor }}>
          <Text className={styles.taskTypeText}>{typeLabel}</Text>
        </View>
        <Text className={styles.taskTitle}>{title}</Text>
      </View>
      <Text className={styles.taskDesc}>{description}</Text>
      <View className={styles.progressWrap}>
        <ProgressBar
          progress={progress}
          total={target}
          size="md"
          color={typeColor}
        />
      </View>
      <View className={styles.taskFooter}>
        <View className={styles.rewardArea}>
          <Text className={styles.rewardLabel}>奖励：</Text>
          {reward.coins && <Text className={styles.rewardItem}>💰 {reward.coins}</Text>}
          {reward.seeds && <Text className={styles.rewardItem}>🌱 {reward.seeds}</Text>}
        </View>
        {claimed ? (
          <View className={classnames(styles.claimBtn, styles.claimed)}>
            <Text className={styles.claimBtnText}>已领取</Text>
          </View>
        ) : completed ? (
          <View
            className={styles.claimBtn}
            onClick={() => onClaim && onClaim(task.id)}
          >
            <Text className={styles.claimBtnText}>领取</Text>
          </View>
        ) : (
          <View className={classnames(styles.claimBtn, styles.disabled)}>
            <Text className={styles.claimBtnText}>进行中</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TaskCard;
