import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { getFlowerById } from '@/data/flowers';
import { Item } from '@/types/game';
import styles from './index.module.scss';

interface SeedOption {
  seedItemId: string;
  flowerId: number;
  name: string;
  emoji: string;
  count: number;
}

const GardenPage: React.FC = () => {
  const { plantSlots, collectedFlowerIds, items, plantFlower, harvestFlower } = useUserStore();
  const [, setTick] = useState(0);

  useDidShow(() => setTick((t) => t + 1));

  const occupiedCount = plantSlots.filter((s) => s.occupied).length;
  const totalSlots = plantSlots.length;
  const flowerTypes = new Set(plantSlots.filter((s) => s.occupied).map((s) => s.flowerId)).size;

  const seedOptions: SeedOption[] = useMemo(() => {
    const mapping: Array<Omit<SeedOption, 'count'>> = [
      { seedItemId: 'seed_rose', flowerId: 1, name: '玫瑰', emoji: '🌹' },
      { seedItemId: 'seed_sunflower', flowerId: 2, name: '向日葵', emoji: '🌻' },
      { seedItemId: 'seed_tulip', flowerId: 3, name: '郁金香', emoji: '🌷' },
      { seedItemId: 'seed_cherry', flowerId: 4, name: '樱花', emoji: '🌸' }
    ];
    return mapping.map((m) => {
      const found = items.find((i) => i.id === m.seedItemId);
      return { ...m, count: found?.count || 0 };
    });
  }, [items]);

  const openPlantSheet = (slotId: number) => {
    const labels = seedOptions.map((s) => `${s.emoji} ${s.name} (库存×${s.count})`);
    const noneLeft = seedOptions.every((s) => s.count <= 0);
    if (noneLeft) {
      Taro.showModal({
        title: '花种不足',
        content: '背包里没有可用花种了，通关关卡或完成任务可获得花种哦！',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    Taro.showActionSheet({
      itemList: labels,
      success: (res) => {
        const chosen = seedOptions[res.tapIndex];
        if (!chosen) return;
        if (chosen.count <= 0) {
          Taro.showToast({ title: `${chosen.name}花种不足`, icon: 'none' });
          return;
        }
        const ok = plantFlower(slotId, chosen.flowerId, chosen.seedItemId);
        if (ok) {
          Taro.showToast({ title: `种下${chosen.name}啦！`, icon: 'success' });
        } else {
          Taro.showToast({ title: '种植失败', icon: 'none' });
        }
      }
    });
  };

  const handlePlotClick = (slotId: number) => {
    const slot = plantSlots.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.occupied) {
      const flower = getFlowerById(slot.flowerId!);
      const stage = slot.growthStage || 0;
      const isReady = stage === 3;
      Taro.showModal({
        title: `${flower?.emoji || '🌸'} ${flower?.name || '花朵'}`,
        content: `生长阶段：${stage + 1}/4${isReady ? ' ✅已成熟可收获' : ''}\n\n花语：${flower?.meaning || ''}`,
        confirmText: isReady ? '🌾 收获' : '关闭',
        showCancel: isReady,
        cancelText: '关闭',
        success: (res) => {
          if (isReady && res.confirm) {
            const result = harvestFlower(slotId);
            if (result.success) {
              const harvestedFlower = getFlowerById(result.flowerId!);
              Taro.showToast({
                title: `收获 ${harvestedFlower?.name || ''} +1`,
                icon: 'success'
              });
            } else {
              Taro.showToast({ title: '收获失败', icon: 'none' });
            }
          } else if (!isReady && res.confirm) {
            Taro.showToast({ title: '耐心等待成熟吧~', icon: 'none' });
          }
        }
      });
    } else {
      openPlantSheet(slotId);
    }
  };

  const handleShare = () => {
    Taro.showShareMenu && Taro.showShareMenu({ withShareTicket: true });
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' });
  };

  const handleSynth = () => {
    Taro.switchTab({
      url: '/pages/backpack/index',
      success: () => {
        setTimeout(() => {
          Taro.eventCenter.trigger('backpack:switchTab', 'pot');
        }, 100);
      },
      fail: () => {
        Taro.showToast({ title: '请在背包页合成花盆', icon: 'none' });
      }
    });
  };

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.gardenHeader}>
        <View className={styles.headerInfo}>
          <Text className={styles.headerTitle}>🏡 我的花园</Text>
          <Text className={styles.headerDesc}>精心照料每一朵花</Text>
        </View>
        <View className={styles.shareBtn} onClick={handleShare}>
          <Text className={styles.shareBtnText}>📷 分享</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{occupiedCount}</Text>
          <Text className={styles.statLabel}>种植中/ {totalSlots}</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{flowerTypes}</Text>
          <Text className={styles.statLabel}>花种类</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{collectedFlowerIds.length}</Text>
          <Text className={styles.statLabel}>已收集</Text>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.actionBtn} onClick={handleSynth}>
          <Text>🌱</Text>
          <Text className={styles.actionBtnText}>种植花种</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleSynth}>
          <Text>🏺</Text>
          <Text className={styles.actionBtnText}>合成花盆</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>花园区域</Text>
      <View className={styles.gardenGrid}>
        {plantSlots.map((slot) => {
          const flower = slot.occupied ? getFlowerById(slot.flowerId!) : null;
          const stageEmoji = ['🌱', '🌿', '🪴', flower?.emoji || '🌸'];
          const stage = slot.growthStage || 0;
          const ready = slot.occupied && stage === 3;
          return (
            <View
              key={slot.id}
              className={classnames(
                styles.plotSlot,
                slot.occupied && styles.occupied,
                ready && styles.ready
              )}
              onClick={() => handlePlotClick(slot.id)}
            >
              {slot.occupied ? (
                <>
                  <Text className={styles.plotFlower}>{stageEmoji[stage]}</Text>
                  <Text className={styles.plotStage}>
                    {ready ? '✓ 可收获' : `${stage + 1}/4`}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={styles.plotEmptyIcon}>➕</Text>
                  <Text className={styles.plotEmptyText}>点此种植</Text>
                </>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.synthesisCard}>
        <View className={styles.synInfo}>
          <Text className={styles.synTitle}>🏺 花盆合成</Text>
          <Text className={styles.synDesc}>3个陶土花盆 → 1个陶瓷花盆</Text>
        </View>
        <View className={styles.synBtn} onClick={handleSynth}>
          <Text className={styles.synBtnText}>前往合成</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default GardenPage;
