import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import ItemCard from '@/components/ItemCard';
import styles from './index.module.scss';

type TabType = 'tool' | 'seed' | 'pot';

const BackpackPage: React.FC = () => {
  const { items, addItem, useItem, spendCoins } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('tool');

  useEffect(() => {
    const handler = (tab: TabType) => {
      if (['tool', 'seed', 'pot'].includes(tab)) {
        setActiveTab(tab);
      }
    };
    Taro.eventCenter.on('backpack:switchTab', handler);
    return () => {
      Taro.eventCenter.off('backpack:switchTab', handler);
    };
  }, []);

  const tabs = [
    { id: 'tool' as TabType, label: '🛠️ 道具' },
    { id: 'seed' as TabType, label: '🌱 花种' },
    { id: 'pot' as TabType, label: '🏺 花盆' }
  ];

  const filteredItems = items.filter((item) => item.type === activeTab);

  const toolCount = items.filter((i) => i.type === 'tool').reduce((acc, i) => acc + i.count, 0);
  const seedCount = items.filter((i) => i.type === 'seed').reduce((acc, i) => acc + i.count, 0);
  const potCount = items.filter((i) => i.type === 'pot').reduce((acc, i) => acc + i.count, 0);

  const handleUseItem = (itemId: string) => {
    Taro.showModal({
      title: '使用道具',
      content: '前往关卡页面，进入游戏后可使用此道具',
      confirmText: '去游戏',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.switchTab({ url: '/pages/levels/index' });
        }
      }
    });
  };

  const handleSynth = () => {
    const clayPots = items.find((i) => i.id === 'pot_clay');
    if (clayPots && clayPots.count >= 3) {
      useItem('pot_clay', 3);
      addItem('pot_porcelain', 1);
      Taro.vibrateShort && Taro.vibrateShort && Taro.vibrateShort({ type: 'light' }).catch(() => {});
      Taro.showToast({ title: '合成陶瓷花盆 +1', icon: 'success' });
    } else {
      Taro.showToast({ title: '陶土花盆不足（需3个）', icon: 'none' });
    }
  };

  const handleBuy = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.price) return;
    Taro.showModal({
      title: `购买 ${item.name}`,
      content: `花费 💰${item.price} 购买 1 个 ${item.name}`,
      success: (res) => {
        if (res.confirm) {
          if (spendCoins(item.price!)) {
            addItem(itemId, 1);
            Taro.showToast({ title: '购买成功', icon: 'success' });
          } else {
            Taro.showToast({ title: '金币不足', icon: 'none' });
          }
        }
      }
    });
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.tabBar}>
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

      <View className={styles.summaryRow}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{toolCount}</Text>
          <Text className={styles.summaryLabel}>道具总数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{seedCount}</Text>
          <Text className={styles.summaryLabel}>花种总数</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{potCount}</Text>
          <Text className={styles.summaryLabel}>花盆总数</Text>
        </View>
      </View>

      {activeTab === 'pot' && (
        <View className={styles.synthCard}>
          <View className={styles.synthInfo}>
            <Text className={styles.synthTitle}>🏺 花盆合成</Text>
            <Text className={styles.synthDesc}>3个陶土花盆 → 1个陶瓷花盆</Text>
          </View>
          <View className={styles.synthBtn} onClick={handleSynth}>
            <Text className={styles.synthBtnText}>立即合成</Text>
          </View>
        </View>
      )}

      <Text className={styles.sectionTitle}>
        {activeTab === 'tool' ? '道具列表' : activeTab === 'seed' ? '花种列表' : '花盆列表'}
      </Text>

      {filteredItems.length > 0 ? (
        filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showUseBtn={activeTab === 'tool'}
            onUse={() => handleUseItem(item.id)}
            onClick={item.price ? () => handleBuy(item.id) : undefined}
          />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📦</Text>
          <Text className={styles.emptyText}>暂无物品</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default BackpackPage;
