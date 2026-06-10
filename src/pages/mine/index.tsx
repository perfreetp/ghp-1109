import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { profile } = useUserStore();

  const expPercent = (profile.exp % 500) / 500 * 100;

  const menuGroups = [
    {
      title: '游戏功能',
      items: [
        { icon: '📋', title: '每日任务', desc: '完成任务领取奖励', url: '/pages/tasks/index', badge: '3' },
        { icon: '�', title: '花束委托', desc: '交付花种换金币道具', url: '/pages/orders/index', badge: 'New' },
        { icon: '�🏆', title: '排行榜', desc: '好友分数排行', url: '/pages/leaderboard/index' },
        { icon: '📖', title: '花语图鉴', desc: '已收集8/12种花', url: '/pages/codex/index', badge: 'New' },
      ]
    },
    {
      title: '个性化',
      items: [
        { icon: '⚙️', title: '设置', desc: '音效、震动、护眼模式', url: '/pages/settings/index' },
        { icon: '💡', title: '新手引导', desc: '重新学习玩法', url: '', action: 'guide' },
        { icon: '🎨', title: '主题装扮', desc: '更多主题敬请期待', url: '', disabled: true },
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '💬', title: '意见反馈', desc: '帮助我们做得更好', url: '' },
        { icon: '⭐', title: '给个好评', desc: '支持一下开发者', url: '' },
        { icon: 'ℹ️', title: '关于', desc: '花消消 v1.0.0', url: '' },
      ]
    }
  ];

  const handleMenuClick = (url: string, action?: string, disabled?: boolean) => {
    if (disabled) {
      Taro.showToast({ title: '敬请期待', icon: 'none' });
      return;
    }
    if (action === 'guide') {
      Taro.showModal({
        title: '🎮 新手引导',
        content: '1. 滑动交换相邻方块\n2. 三个或以上相同图案即可消除\n3. 连续消除会触发连击加分\n4. 使用铲子可以消除单个方块\n5. 使用浇水壶可以消除整行或整列\n6. 收集花种布置你的专属花园',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    if (url) {
      Taro.navigateTo({ url });
    }
  };

  return (
    <ScrollView scrollY className={styles.pageContainer}>
      <View className={styles.profileHeader}>
        <View className={styles.profileRow}>
          <Image className={styles.avatar} src={profile.avatar} mode="aspectFill" />
          <View className={styles.profileInfo}>
            <Text className={styles.nickname}>{profile.nickname}</Text>
            <View className={styles.levelRow}>
              <View className={styles.levelBadge}>
                <Text className={styles.levelText}>Lv.{profile.level}</Text>
              </View>
            </View>
            <View className={styles.expBar}>
              <View className={styles.expFill} style={{ width: `${expPercent}%` }} />
            </View>
          </View>
        </View>
        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{profile.coins}</Text>
            <Text className={styles.statLabel}>💰 金币</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{profile.diamonds}</Text>
            <Text className={styles.statLabel}>💎 钻石</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{profile.totalScore.toLocaleString()}</Text>
            <Text className={styles.statLabel}>🏆 总分</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{profile.currentLevel}</Text>
            <Text className={styles.statLabel}>🎯 关卡</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        {menuGroups.map((group, gi) => (
          <View key={gi} className={styles.menuGroup}>
            {group.items.map((item, ii) => (
              <View
                key={ii}
                className={styles.menuItem}
                onClick={() => handleMenuClick(item.url, item.action, item.disabled)}
              >
                <View className={styles.menuIcon}>{item.icon}</View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
                {item.badge && (
                  <View className={styles.menuBadge}>
                    <Text className={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default MinePage;
