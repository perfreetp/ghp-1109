import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import ItemCard from '@/components/ItemCard';
import { Item, PlantSlot } from '@/types/game';
import styles from './index.module.scss';

type TabType = 'tool' | 'seed' | 'pot';

const BackpackPage: React.FC = () => {
  const {
    items,
    plantSlots,
    addItem,
    useItem,
    spendCoins,
    expandGardenSlot,
    upgradeSlotPot
  } = useUserStore();
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

  const handleExpandGarden = () => {
    const result = expandGardenSlot('pot_clay');
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  const handleUpgradeEmptySlot = () => {
    const targetSlot = plantSlots.find((s) => (s.potLevel || 0) === 0 && !s.occupied);
    if (!targetSlot) {
      Taro.showToast({ title: '没有可升级的空格', icon: 'none' });
      return;
    }
    const result = upgradeSlotPot(targetSlot.id, 'pot_clay');
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
    } else {
      let toastMsg = result.message;
      if (result.message.includes('花盆数量不足')) {
        toastMsg = '陶土花盆不足';
      }
      Taro.showToast({ title: toastMsg, icon: 'none' });
    }
  };

  const handleUpgradeClayToPorcelain = () => {
    const hasClaySlot = plantSlots.some((s) => (s.potLevel || 0) === 1 && !s.occupied);
    if (!hasClaySlot) {
      Taro.showToast({ title: '需要先有陶土花盆再升级陶瓷', icon: 'none' });
      return;
    }
    const targetSlot = plantSlots.find((s) => (s.potLevel || 0) === 1 && !s.occupied);
    if (!targetSlot) {
      Taro.showToast({ title: '没有可升级的陶土花盆格子', icon: 'none' });
      return;
    }
    const result = upgradeSlotPot(targetSlot.id, 'pot_porcelain');
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  const renderPotCard = (item: Item) => {
    const isClay = item.id === 'pot_clay';
    const isPorcelain = item.id === 'pot_porcelain';
    const disabled = item.count <= 0;

    return (
      <View key={item.id} className={styles.potCard}>
        <View className={styles.potCardHeader}>
          <View className={styles.potIconWrap}>
            <Text className={styles.potIcon}>{item.icon}</Text>
          </View>
          <View className={styles.potInfo}>
            <Text className={styles.potName}>{item.name}</Text>
            <Text className={styles.potDesc}>{item.description}</Text>
            {item.rarity && (
              <View className={classnames(styles.potRarity, styles[`rarity_${item.rarity}`])}>
                <Text className={styles.potRarityText}>
                  {item.rarity === 'common' ? '普通' : item.rarity === 'rare' ? '稀有' : '史诗'}
                </Text>
              </View>
            )}
          </View>
          <View className={styles.potCountBadge}>
            <Text className={styles.potCountText}>×{item.count}</Text>
          </View>
        </View>
        <View className={styles.potActions}>
          {isClay && (
            <>
              <View
                className={classnames(styles.potActionBtn, styles.btnPrimary, disabled && styles.disabled)}
                onClick={() => !disabled && handleExpandGarden()}
              >
                <Text className={styles.potActionBtnText}>扩建花园</Text>
              </View>
              <View
                className={classnames(styles.potActionBtn, styles.btnSecondary, disabled && styles.disabled)}
                onClick={() => !disabled && handleUpgradeEmptySlot()}
              >
                <Text className={styles.potActionBtnText}>升级空格</Text>
              </View>
            </>
          )}
          {isPorcelain && (
            <View
              className={classnames(styles.potActionBtn, styles.btnPrimary, styles.btnFull, disabled && styles.disabled)}
              onClick={() => !disabled && handleUpgradeClayToPorcelain()}
            >
              <Text className={styles.potActionBtnText}>升级陶土格</Text>
            </View>
          )}
        </View>
        {item.price && (
          <View className={styles.potBuyRow} onClick={() => handleBuy(item.id)}>
            <Text className={styles.potBuyPrice}>💰 {item.price}</Text>
            <Text className={styles.potBuyLink}>购买</Text>
          </View>
        )}
      </View>
    );
  };

  const potItems = filteredItems.filter((i) => i.type === 'pot');
  const nonPotItems = filteredItems.filter((i) => i.type !== 'pot');

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

      {activeTab === 'pot' ? (
        potItems.length > 0 ? (
          potItems.map((item) => renderPotCard(item))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyText}>暂无物品</Text>
          </View>
        )
      ) : (
        nonPotItems.length > 0 ? (
          nonPotItems.map((item) => (
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
        )
      )}
    </ScrollView>
  );
};

export default BackpackPage;
