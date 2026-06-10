import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { getFlowerById } from '@/data/flowers';
import styles from './index.module.scss';

interface SeedOption {
  seedItemId: string;
  flowerId: number;
  name: string;
  emoji: string;
  count: number;
}

const POT_HARVEST_MAP: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2
};

const GardenPage: React.FC = () => {
  const {
    plantSlots,
    collectedFlowerIds,
    items,
    plantFlower,
    harvestFlower,
    checkAndUpdatePlantGrowth,
    upgradeSlotPot,
    expandGardenSlot,
    careForPlant,
    careAllPlants,
    batchHarvestAllReady
  } = useUserStore();

  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshGrowth = () => {
    checkAndUpdatePlantGrowth();
    setTick((t) => t + 1);
  };

  useDidShow(() => {
    checkAndUpdatePlantGrowth();
    setTick((t) => t + 1);
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        refreshGrowth();
      }, 3000);
    }
  });

  useDidHide(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const totalSlots = plantSlots.length;
  const plantedCount = plantSlots.filter((s) => s.occupied).length;
  const harvestableCount = plantSlots.filter((s) => s.occupied && (s.growthStage || 0) === 3).length;

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

  const clayPotCount = useMemo(() => {
    const found = items.find((i) => i.id === 'pot_clay');
    return found?.count || 0;
  }, [items]);

  const porcelainPotCount = useMemo(() => {
    const found = items.find((i) => i.id === 'pot_porcelain');
    return found?.count || 0;
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

  const openSlotMenu = (slotId: number) => {
    const slot = plantSlots.find((s) => s.id === slotId);
    if (!slot) return;
    const currentPotLevel = slot.potLevel || 0;

    const items: string[] = [
      '🌱 种植花种',
      `🪴 此格升级陶土 (库存×${clayPotCount})${currentPotLevel >= 1 ? ' ✓已装备' : ''}`,
      `🏺 此格升级陶瓷 (库存×${porcelainPotCount})${currentPotLevel >= 2 ? ' ✓已装备' : ''}`
    ];

    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          openPlantSheet(slotId);
        } else if (res.tapIndex === 1) {
          handleUpgradeClay(slotId);
        } else if (res.tapIndex === 2) {
          handleUpgradePorcelain(slotId);
        }
      }
    });
  };

  const handleUpgradeClay = (slotId: number) => {
    const result = upgradeSlotPot(slotId, 'pot_clay');
    if (result.success) {
      Taro.showToast({ title: '升级成功，成长+20%', icon: 'success' });
    } else {
      if (result.message.includes('数量不足')) {
        Taro.showToast({ title: '陶土花盆不足，去【背包-花盆】合成获取', icon: 'none', duration: 2500 });
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    }
  };

  const handleUpgradePorcelain = (slotId: number) => {
    const result = upgradeSlotPot(slotId, 'pot_porcelain');
    if (result.success) {
      Taro.showToast({ title: '升级成功，成长+50% 收获翻倍', icon: 'success' });
    } else {
      if (result.message.includes('数量不足')) {
        Taro.showToast({ title: '陶瓷花盆不足，去【背包-花盆】合成获取', icon: 'none', duration: 2500 });
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    }
  };

  const handleExpandGarden = () => {
    const result = expandGardenSlot('pot_clay');
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
    } else {
      if (result.message.includes('数量不足')) {
        Taro.showToast({ title: '花盆不足，去【背包-花盆】合成获取', icon: 'none', duration: 2500 });
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    }
  };

  const handleCareWaterAll = () => {
    const result = careAllPlants('water');
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none', duration: 2000 });
  };

  const handleCareFertilizerAll = () => {
    const result = careAllPlants('fertilizer');
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none', duration: 2000 });
  };

  const handleBatchHarvest = () => {
    const result = batchHarvestAllReady();
    Taro.showModal({
      title: result.success ? '🎉 批量收获成功' : '🌾 花园收获',
      content: result.message,
      showCancel: false,
      confirmText: '知道了'
    });
  };

  const handleCareSingle = (slotId: number, type: 'water' | 'fertilizer') => {
    const result = careForPlant(slotId, type);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none', duration: 2000 });
  };

  const handlePlotClick = (slotId: number) => {
    const slot = plantSlots.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.occupied) {
      const flower = getFlowerById(slot.flowerId!);
      const stage = slot.growthStage || 0;
      const isReady = stage === 3;
      const potLevel = slot.potLevel || 0;
      const harvestMultiplier = POT_HARVEST_MAP[potLevel] || 1;
      const rewardN = (flower?.harvestReward || 1) * harvestMultiplier;

      if (isReady) {
        Taro.showModal({
          title: `${flower?.emoji || '🌸'} ${flower?.name || '花朵'}`,
          content: `生长阶段：${stage + 1}/4 ✅已成熟可收获\n\n花语：${flower?.meaning || ''}\n\n预计获得：${rewardN} 个花种`,
          confirmText: '🌾 收获',
          showCancel: true,
          cancelText: '关闭',
          success: (res) => {
            if (res.confirm) {
              const result = harvestFlower(slotId);
              if (result.success) {
                Taro.showToast({
                  title: `收获成功，花种+${result.reward || 1}`,
                  icon: 'success'
                });
              }
            }
          }
        });
      } else {
        const waterItem = items.find((i) => i.id === 'care_water');
        const fertItem = items.find((i) => i.id === 'care_fertilizer');
        const labels = [
          `💧 浇水 -20s (库存×${waterItem?.count || 0})`,
          `🧪 施肥 -60s (库存×${fertItem?.count || 0})`,
          '查看详情'
        ];
        Taro.showActionSheet({
          itemList: labels,
          success: (res) => {
            if (res.tapIndex === 0) {
              handleCareSingle(slotId, 'water');
            } else if (res.tapIndex === 1) {
              handleCareSingle(slotId, 'fertilizer');
            } else if (res.tapIndex === 2) {
              Taro.showModal({
                title: `${flower?.emoji || '🌸'} ${flower?.name || '花朵'}`,
                content: `生长阶段：${stage + 1}/4\n\n花语：${flower?.meaning || ''}\n\n预计成熟后可获得 ${rewardN} 个花种`,
                showCancel: false,
                confirmText: '知道了'
              });
            }
          }
        });
      }
    } else {
      openSlotMenu(slotId);
    }
  };

  const handlePlotLongPress = (slotId: number) => {
    const slot = plantSlots.find((s) => s.id === slotId);
    if (!slot) return;
    if (!slot.occupied) {
      openSlotMenu(slotId);
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

  const getPotIcon = (potLevel: number | undefined) => {
    if (!potLevel || potLevel === 0) return null;
    if (potLevel === 1) return '🪴';
    if (potLevel === 2) return '🏺';
    return null;
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
          <Text className={styles.statValue}>{totalSlots}</Text>
          <Text className={styles.statLabel}>总格子</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{plantedCount}</Text>
          <Text className={styles.statLabel}>已种植</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.harvestableValue)}>{harvestableCount}</Text>
          <Text className={styles.statLabel}>可收获</Text>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.actionBtn} onClick={handleCareWaterAll}>
          <Text>💧</Text>
          <Text className={styles.actionBtnText}>一键浇水</Text>
        </View>
        <View className={styles.actionBtn} onClick={handleCareFertilizerAll}>
          <Text>🧪</Text>
          <Text className={styles.actionBtnText}>批量施肥</Text>
        </View>
        <View
          className={classnames(styles.actionBtn, harvestableCount > 0 && styles.highlight)}
          onClick={handleBatchHarvest}
        >
          <Text>�</Text>
          <Text className={styles.actionBtnText}>批量收获{harvestableCount > 0 ? `(${harvestableCount})` : ''}</Text>
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
          const potIcon = getPotIcon(slot.potLevel);
          return (
            <View
              key={slot.id}
              className={classnames(
                styles.plotSlot,
                slot.occupied && styles.occupied,
                ready && styles.ready
              )}
              onClick={() => handlePlotClick(slot.id)}
              onLongPress={() => handlePlotLongPress(slot.id)}
            >
              {slot.occupied ? (
                <>
                  <Text className={styles.plotFlower}>{stageEmoji[stage]}</Text>
                  <Text className={classnames(styles.plotStage, ready && styles.plotStageReady)}>
                    {ready ? '可收获' : `${stage + 1}/4`}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={styles.plotEmptyIcon}>➕</Text>
                  <Text className={styles.plotEmptyText}>点此种植</Text>
                </>
              )}
              {potIcon && (
                <Text className={styles.plotPotIcon}>{potIcon}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.expandCard}>
        <View className={styles.expandInfo}>
          <Text className={styles.expandTitle}>🏗️ 扩建花园</Text>
          <Text className={styles.expandDesc}>消耗1个陶土花盆，扩建1个新格子</Text>
        </View>
        <View className={styles.expandBtn} onClick={handleExpandGarden}>
          <Text className={styles.expandBtnText}>扩建花园</Text>
        </View>
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
