import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { getFlowerById } from '@/data/flowers';
import styles from './index.module.scss';

const GardenPage: React.FC = () => {
  const { plantSlots, collectedFlowerIds } = useUserStore();

  const occupiedCount = plantSlots.filter((s) => s.occupied).length;
  const totalSlots = plantSlots.length;
  const flowerTypes = new Set(plantSlots.filter((s) => s.occupied).map((s) => s.flowerId)).size;

  const handlePlotClick = (slotId: number) => {
    const slot = plantSlots.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.occupied) {
      const flower = getFlowerById(slot.flowerId!);
      Taro.showModal({
        title: flower?.name || '花朵',
        content: `生长阶段：${(slot.growthStage || 0) + 1}/4\n${flower?.meaning || ''}`,
        confirmText: '收获',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm && slot.growthStage === 3) {
            Taro.showToast({ title: '收获成功！', icon: 'success' });
          } else if (res.confirm) {
            Taro.showToast({ title: '尚未成熟', icon: 'none' });
          }
        }
      });
    } else {
      Taro.showActionSheet({
        itemList: ['种植玫瑰', '种植向日葵', '种植郁金香', '种植樱花'],
        success: () => {
          Taro.showToast({ title: '种植成功！', icon: 'success' });
        }
      });
    }
  };

  const handleShare = () => {
    Taro.showShareMenu && Taro.showShareMenu({ withShareTicket: true });
    Taro.showToast({ title: '请点击右上角分享', icon: 'none' });
  };

  const handleSynth = () => {
    Taro.navigateTo({ url: '/pages/backpack/index' });
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
        <View className={styles.actionBtn}>
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
          return (
            <View
              key={slot.id}
              className={classnames(styles.plotSlot, slot.occupied && styles.occupied)}
              onClick={() => handlePlotClick(slot.id)}
            >
              {slot.occupied ? (
                <>
                  <Text className={styles.plotFlower}>{stageEmoji[slot.growthStage || 0]}</Text>
                  <Text className={styles.plotStage}>
                    {slot.growthStage === 3 ? '✓ 成熟' : `${(slot.growthStage || 0) + 1}/4`}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={styles.plotEmptyIcon}>➕</Text>
                  <Text className={styles.plotEmptyText}>空位</Text>
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
