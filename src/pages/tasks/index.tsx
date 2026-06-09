import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import TaskCard from '@/components/TaskCard';
import { useUserStore } from '@/store/useUserStore';
import { Task } from '@/types/game';
import styles from './index.module.scss';

type TabType = 'daily' | 'challenge' | 'steps';

const TasksPage: React.FC = () => {
  const { tasks, claimTask, claimAllClaimableTasks } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [, setTick] = useState(0);

  useDidShow(() => setTick((t) => t + 1));

  const tabs = [
    { id: 'daily' as TabType, label: '📋 每日任务' },
    { id: 'challenge' as TabType, label: '🎯 限时挑战' },
    { id: 'steps' as TabType, label: '🚶 步数目标' }
  ];

  const filteredTasks: Task[] = useMemo(() => {
    return tasks.filter((t) => t.type === activeTab);
  }, [activeTab, tasks]);

  const allCompletedCount = tasks.filter((t) => t.completed && !t.claimed).length;
  const totalCount = tasks.length;
  const currentClaimableCount = filteredTasks.filter((t) => t.completed && !t.claimed).length;

  const handleClaim = (taskId: number) => {
    const result = claimTask(taskId);
    if (result.success) {
      Taro.showToast({ title: result.message || '领取成功', icon: 'success' });
    } else {
      Taro.showToast({ title: result.message || '无法领取', icon: 'none' });
    }
  };

  const handleClaimAll = () => {
    const count = claimAllClaimableTasks(activeTab);
    if (count > 0) {
      Taro.showToast({ title: `已领取 ${count} 个奖励`, icon: 'success' });
    } else {
      Taro.showToast({ title: '暂无可领取奖励', icon: 'none' });
    }
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>📋 任务中心</Text>
        <View className={styles.progressRow}>
          <Text className={styles.progressInfo}>可领取 {allCompletedCount} / {totalCount}</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${(tasks.filter((t) => t.completed).length / totalCount) * 100}%` }}
          />
        </View>
        {currentClaimableCount > 0 && (
          <View className={styles.claimAllBtn} onClick={handleClaimAll}>
            <Text className={styles.claimAllText}>一键领取（{currentClaimableCount}）</Text>
          </View>
        )}
      </View>

      <View className={styles.tabHeader}>
        {tabs.map((tab) => {
          const tabClaimable = tasks.filter((t) => t.type === tab.id && t.completed && !t.claimed).length;
          return (
            <View
              key={tab.id}
              className={classnames(styles.tabItem, activeTab === tab.id && styles.active)}
              onClick={() => setActiveTab(tab.id)}
            >
              <Text className={styles.tabText}>{tab.label}</Text>
              {tabClaimable > 0 && (
                <View className={styles.tabBadge}>
                  <Text className={styles.tabBadgeText}>{tabClaimable}</Text>
                </View>
              )}
            </View>
          );
        })}
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
