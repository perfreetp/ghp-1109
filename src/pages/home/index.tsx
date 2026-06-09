import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import { levels } from '@/data/levels';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { profile, claimOfflineEarnings } = useUserStore();
  const [showOffline, setShowOffline] = useState(true);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    const offlineTime = (Date.now() - profile.lastOnlineTime) / (1000 * 60 * 60);
    if (offlineTime > 1) {
      const coins = Math.min(500, Math.floor(offlineTime * 35));
      setEarnings(coins);
      setShowOffline(true);
    } else {
      setShowOffline(false);
    }
  }, []);

  useDidShow(() => {
    console.log('[HomePage] 页面显示');
  });

  const handleClaim = () => {
    const claimed = claimOfflineEarnings();
    Taro.showToast({
      title: `领取 ${claimed || earnings} 金币`,
      icon: 'success'
    });
    setShowOffline(false);
  };

  const handleQuickStart = () => {
    const currentLevel = levels.find((l) => l.id === profile.currentLevel);
    if (currentLevel?.unlocked) {
      Taro.navigateTo({ url: `/pages/game/index?levelId=${profile.currentLevel}` });
    } else {
      Taro.switchTab({ url: '/pages/levels/index' });
    }
  };

  const currentLevel = levels.find((l) => l.id === profile.currentLevel);

  return (
    <ScrollView scrollY className={styles.pageContainer}>
      <View className={styles.heroSection}>
        <View className={styles.userRow}>
          <Image className={styles.avatar} src={profile.avatar} mode="aspectFill" />
          <View className={styles.userInfo}>
            <Text className={styles.nickname}>{profile.nickname}</Text>
            <View className={styles.levelInfo}>
              <View className={styles.levelBadge}>
                <Text className={styles.levelText}>Lv.{profile.level}</Text>
              </View>
            </View>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{profile.coins}</Text>
            <Text className={styles.statLabel}>💰 金币</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{profile.diamonds}</Text>
            <Text className={styles.statLabel}>💎 钻石</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{profile.totalScore.toLocaleString()}</Text>
            <Text className={styles.statLabel}>🏆 总分</Text>
          </View>
        </View>
      </View>

      <View className={styles.contentSection}>
        <View className={styles.quickStartCard}>
          <View className={styles.quickInfo}>
            <Text className={styles.quickTitle}>快速开始</Text>
            <Text className={styles.quickDesc}>
              第 {profile.currentLevel} 关 · {currentLevel?.description || '春日花园'}
            </Text>
          </View>
          <View className={styles.quickBtn} onClick={handleQuickStart}>
            <Text className={styles.quickBtnText}>开始游戏</Text>
          </View>
        </View>

        {showOffline && (
          <View className={styles.offlineCard}>
            <View className={styles.offlineInfo}>
              <Text className={styles.offlineTitle}>🎁 离线收益</Text>
              <Text className={styles.offlineCoins}>💰 {earnings}</Text>
            </View>
            <View className={styles.claimBtn} onClick={handleClaim}>
              <Text className={styles.claimBtnText}>领取</Text>
            </View>
          </View>
        )}

        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>每日活动</Text>
        </View>

        <View className={styles.dailyGrid}>
          <View
            className={styles.dailyCard}
            onClick={() => Taro.navigateTo({ url: '/pages/tasks/index' })}
          >
            <Text className={styles.dailyIcon}>📋</Text>
            <Text className={styles.dailyTitle}>每日任务</Text>
            <Text className={styles.dailyDesc}>3个可领取</Text>
          </View>
          <View
            className={styles.dailyCard}
            onClick={() => Taro.switchTab({ url: '/pages/levels/index' })}
          >
            <Text className={styles.dailyIcon}>🎯</Text>
            <Text className={styles.dailyTitle}>限时挑战</Text>
            <Text className={styles.dailyDesc}>剩余 23:59</Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>快捷入口</Text>
        </View>

        <View className={styles.entryGrid}>
          <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/levels/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>🎮</Text>
            </View>
            <Text className={styles.entryText}>关卡</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/garden/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>🏡</Text>
            </View>
            <Text className={styles.entryText}>花园</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/backpack/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>🎒</Text>
            </View>
            <Text className={styles.entryText}>背包</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.navigateTo({ url: '/pages/codex/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>📖</Text>
            </View>
            <Text className={styles.entryText}>图鉴</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.navigateTo({ url: '/pages/leaderboard/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>🏆</Text>
            </View>
            <Text className={styles.entryText}>排行</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.navigateTo({ url: '/pages/tasks/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>📝</Text>
            </View>
            <Text className={styles.entryText}>任务</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>⚙️</Text>
            </View>
            <Text className={styles.entryText}>设置</Text>
          </View>
          <View className={styles.entryItem} onClick={() => Taro.showModal({
            title: '新手引导',
            content: '1. 滑动交换相邻方块\n2. 三个以上相同消除\n3. 连续消除触发连击\n4. 使用道具助通关',
            showCancel: false,
            confirmText: '知道了'
          })}>
            <View className={styles.entryIconWrap}>
              <Text className={styles.entryIcon}>💡</Text>
            </View>
            <Text className={styles.entryText}>引导</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
