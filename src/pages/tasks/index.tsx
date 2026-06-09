import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import TaskCard from '@/components/TaskCard';
import { tasks, getDailyTasks, getChallengeTasks, getStepTasks } from '@/data/tasks';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

type TabType = 'daily' | 'challenge' | 'steps';

const TasksPage: React.FC = () => {
  const { addCoins, addItem } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  const tabs = [
    { id: 'daily' as TabType, label: '📋 每日任务' },
    { id: 'challenge' as TabType, label: '🎯 限时挑战' },
    { id: 'steps' as TabType, label: '🚶 步数目标' }
  ];

  const filteredTasks = {
    daily: getDailyTasks(),
    challenge: getChallengeTasks(),
    steps: getStepTasks()
  }[activeTab];

  const completedCount = tasks.filter((t) => t.completed && !t.claimed).length;
  const totalCount = tasks.length;

  const handleClaim = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.reward.coins) addCoins(task.reward.coins);
    if (task.reward.seeds) addItem('seed_rose', task.reward.seeds);
    if (task.reward.items) {
      task.reward.items.forEach((item) => addItem(item.id, item.count));
    }

    Taro.showToast({ title: '奖励已领取', icon: 'success' });
    console.log(`[TasksPage] 领取任务奖励: 任务ID=${taskId}`);
  };

  const handleClaimAll = () => {
    const claimableTasks = tasks.filter((t) => t.completed && !t.claimed);
    claimableTasks.forEach((t) => handleClaim(t.id));
    Taro.showToast({ title: `已领取 ${claimableTasks.length} 个奖励`, icon: 'success' });
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>📋 任务中心</Text>
        <View className={styles.progressRow}>
          <Text className={styles.progressInfo}>可领取 {completedCount} / {totalCount}</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${(tasks.filter((t) => t.completed).length / totalCount) * 100}%` }}
          />
        </View>
        {completedCount > 0 && (
          <View className={styles.claimAllBtn} onClick={handleClaimAll}>
            <Text className={styles.claimAllText}>一键领取全部</Text>
          </View>
        )}
      </View>

      <View className={styles.tabHeader}>
        {tabs.map((tab) => (
          <View
            key={tab.id}
            className={classnames(styles.tabItem, activeTab === tab.id && styles.active)}
            onClick={() => setActiveTab(tab.id)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      {filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} onClaim={handleClaim} />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎉</Text>
          <Text className={styles.emptyTitle}>暂无任务</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TasksPage;
