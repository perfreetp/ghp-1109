import React, { useState, useMemo, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { getFlowerById } from '@/data/flowers';
import { FlowerOrder } from '@/types/game';
import styles from './index.module.scss';

const ITEM_EMOJI: Record<string, string> = {
  pot_clay: '🏺',
  pot_porcelain: '🏺',
  care_water: '💧',
  care_fertilizer: '🧪',
  shovel: '⛏️',
  watercan: '🚿',
  rainbow: '🌈'
};

const ITEM_NAME: Record<string, string> = {
  pot_clay: '陶土花盆',
  pot_porcelain: '陶瓷花盆',
  care_water: '滴灌水',
  care_fertilizer: '营养肥料',
  shovel: '铲子',
  watercan: '浇水壶',
  rainbow: '彩虹花'
};

const FlowerSeedMap: Record<number, string> = {
  1: 'seed_rose', 2: 'seed_sunflower', 3: 'seed_tulip', 4: 'seed_cherry',
  5: 'seed_lily', 6: 'seed_lavender', 7: 'seed_daisy', 8: 'seed_magnolia',
  9: 'seed_peony', 10: 'seed_camellia', 11: 'seed_jasmine', 12: 'seed_nightbloom'
};

type TabType = 'all' | 'pending' | 'done';

const OrdersPage: React.FC = () => {
  const { items, getOrders, deliverOrder, refreshDailyOrders, profile } = useUserStore();
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useDidShow(() => setTick((t) => t + 1));

  useEffect(() => {
    refreshDailyOrders();
    setTick((t) => t + 1);
  }, []);

  const orders = useMemo(() => {
    void tick;
    return getOrders();
  }, [tick, getOrders]);

  const stats = useMemo(() => {
    void tick;
    const pending = orders.filter((o) => o.status === 'pending');
    const completed = orders.filter((o) => o.status === 'completed');
    return {
      total: orders.length,
      pending: pending.length,
      completed: completed.length
    };
  }, [orders, tick]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'pending') return orders.filter((o) => o.status === 'pending');
    return orders.filter((o) => o.status !== 'pending');
  }, [orders, activeTab]);

  const getStockForFlower = (flowerId: number): number => {
    const seedId = FlowerSeedMap[flowerId];
    if (!seedId) return 0;
    return items.find((i) => i.id === seedId)?.count || 0;
  };

  const canDeliver = (order: FlowerOrder): boolean => {
    if (order.status !== 'pending') return false;
    if (order.expiresAt < Date.now()) return false;
    return order.requirements.every((r) => getStockForFlower(r.flowerId) >= r.count);
  };

  const formatTimeLeft = (expiresAt: number): string => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}天${hours % 24}小时`;
    if (hours > 0) return `${hours}小时${mins}分钟`;
    return `${mins}分钟`;
  };

  const handleDeliver = (orderId: number) => {
    const result = deliverOrder(orderId);
    Taro.showToast({
      title: result.message,
      icon: result.success ? 'success' : 'none',
      duration: 2500
    });
    if (result.success) {
      setTick((t) => t + 1);
    }
  };

  const handleRefresh = () => {
    refreshDailyOrders();
    setTick((t) => t + 1);
    Taro.showToast({ title: '订单已刷新', icon: 'success' });
  };

  const statusTextMap: Record<string, string> = {
    pending: '进行中',
    completed: '已交付',
    expired: '已过期'
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerSection}>
        <Text className={styles.headerTitle}>🌸 花束委托订单</Text>
        <Text className={styles.headerDesc}>把花园收获的花种交付给委托人，换取丰厚奖励！</Text>
        <View className={styles.statsRow}>
          <View className={styles.statsCard}>
            <Text className={styles.statsLabel}>总订单</Text>
            <Text className={styles.statsValue}>{stats.total}</Text>
          </View>
          <View className={styles.statsCard}>
            <Text className={styles.statsLabel}>进行中</Text>
            <Text className={styles.statsValue}>{stats.pending}</Text>
          </View>
          <View className={styles.statsCard}>
            <Text className={styles.statsLabel}>已交付</Text>
            <Text className={styles.statsValue}>{stats.completed}</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        {(['all', 'pending', 'done'] as TabType[]).map((t) => (
          <View
            key={t}
            className={classnames(styles.tabItem, activeTab === t && styles.active)}
            onClick={() => setActiveTab(t)}
          >
            <Text>{t === 'all' ? '全部' : t === 'pending' ? '进行中' : '已完成'}</Text>
          </View>
        ))}
      </View>

      <View className={styles.refreshBtn} onClick={handleRefresh}>
        <Text>🔄</Text>
        <Text className={styles.refreshText}>刷新今日订单</Text>
      </View>

      <View className={styles.section}>
        {filteredOrders.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyTitle}>暂无订单</Text>
            <Text className={styles.emptyDesc}>点击「刷新今日订单」获取最新委托</Text>
          </View>
        )}

        {filteredOrders.map((order) => {
          const canDeliverNow = canDeliver(order);
          const avatar = (order.requester || '?').charAt(0);
          return (
            <View
              key={order.id}
              className={classnames(
                styles.orderCard,
                order.status === 'completed' && styles.completed,
                order.status === 'expired' && styles.expired
              )}
            >
              <View className={styles.orderHeader}>
                <Text className={styles.orderTitle}>{order.title}</Text>
                <View className={classnames(styles.orderStatusBadge, order.status)}>
                  <Text>{statusTextMap[order.status]}</Text>
                </View>
              </View>

              <View className={styles.orderRequester}>
                <View className={styles.avatarBox}><Text>{avatar}</Text></View>
                <View className={styles.requesterInfo}>
                  <Text className={styles.requesterName}>{order.requester}</Text>
                  <Text className={styles.requesterDesc}>{order.description}</Text>
                </View>
                {order.status === 'pending' && (
                  <Text className={styles.expireTime}>⏱ {formatTimeLeft(order.expiresAt)}</Text>
                )}
              </View>

              <View className={styles.requirementsSection}>
                <Text className={styles.sectionSubTitle}>🌷 花材需求</Text>
                <View className={styles.requirementsList}>
                  {order.requirements.map((req, idx) => {
                    const flower = getFlowerById(req.flowerId);
                    const stock = getStockForFlower(req.flowerId);
                    const enough = stock >= req.count;
                    return (
                      <View key={idx} className={styles.requirementItem}>
                        <Text className={styles.requirementEmoji}>{flower?.emoji || '🌸'}</Text>
                        <View className={styles.requirementInfo}>
                          <Text className={styles.requirementName}>{flower?.name || '花'}</Text>
                          <Text className={classnames(styles.requirementCount, enough ? styles.enough : styles.lack)}>
                            {stock}/{req.count} {enough ? '✅' : '❌'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View className={styles.rewardSection}>
                <Text className={styles.sectionSubTitle}>🎁 交付奖励</Text>
                <View className={styles.rewardList}>
                  {order.reward.coins && (
                    <View className={styles.rewardItem}>
                      <Text className={styles.rewardEmoji}>💰</Text>
                      <Text className={styles.rewardText}>金币 ×{order.reward.coins}</Text>
                    </View>
                  )}
                  {order.reward.items?.map((rItem, i) => (
                    <View key={i} className={styles.rewardItem}>
                      <Text className={styles.rewardEmoji}>{ITEM_EMOJI[rItem.id] || '📦'}</Text>
                      <Text className={styles.rewardText}>{ITEM_NAME[rItem.id] || rItem.id} ×{rItem.count}</Text>
                    </View>
                  ))}
                  {order.reward.exp && (
                    <View className={styles.rewardItem}>
                      <Text className={styles.rewardEmoji}>⭐</Text>
                      <Text className={styles.rewardText}>EXP +{order.reward.exp}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.actionRow}>
                {order.status === 'pending' ? (
                  <View
                    className={classnames(
                      styles.orderBtn,
                      canDeliverNow ? styles.primary : styles.disabled
                    )}
                    onClick={() => canDeliverNow && handleDeliver(order.id)}
                  >
                    <Text>{canDeliverNow ? '✅ 立即交付' : '🚫 花材不足'}</Text>
                  </View>
                ) : (
                  <View className={classnames(styles.orderBtn, styles.secondary)}>
                    <Text>{order.status === 'completed' ? '🎉 已完成' : '⌛ 已过期'}</Text>
                  </View>
                )}
                <View
                  className={classnames(styles.orderBtn, styles.secondary)}
                  onClick={() => Taro.switchTab({ url: '/pages/garden/index' })}
                >
                  <Text>🌱 去花园种花</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default OrdersPage;
