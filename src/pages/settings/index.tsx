import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

const SettingsPage: React.FC = () => {
  const { profile, updateSettings, completeNewUserGuide } = useUserStore();
  const [localSettings, setLocalSettings] = useState(profile.settings);

  useEffect(() => {
    setLocalSettings(profile.settings);
  }, [profile.settings]);

  const toggleSetting = (key: keyof typeof localSettings) => {
    const newVal = !localSettings[key];
    setLocalSettings({ ...localSettings, [key]: newVal });
    updateSettings({ [key]: newVal });
    console.log(`[SettingsPage] 切换设置: ${key}=${newVal}`);
  };

  const SettingSwitch = ({
    checked,
    onChange
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <View className={classnames(styles.switchTrack, checked && styles.on)} onClick={onChange}>
      <View className={styles.switchThumb} />
    </View>
  );

  const handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？此操作不会影响您的游戏进度。',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  };

  const handleNewGuide = () => {
    Taro.showModal({
      title: '🎮 新手引导',
      content:
        '1. 点击选择方块，再点击相邻方块进行交换\n2. 三个或以上相同图案连成一线即可消除\n3. 连续消除会触发连击，分数翻倍！\n4. 铲子：消除任意单个方块\n5. 浇水壶：消除整行加整列\n6. 完成关卡获得金币和花种，去花园布置吧！',
      showCancel: false,
      confirmText: '知道了'
    });
  };

  return (
    <ScrollView
      scrollY
      className={classnames(styles.pageContainer, localSettings.eyeCareMode && styles.eyeCareMode)}
    >
      <View className={styles.sectionGroup}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>声音与震动</Text>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>🔊</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>音效</Text>
              <Text className={styles.itemDesc}>游戏中的音效和背景音乐</Text>
            </View>
          </View>
          <SettingSwitch
            checked={localSettings.soundEnabled}
            onChange={() => toggleSetting('soundEnabled')}
          />
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>📳</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>震动反馈</Text>
              <Text className={styles.itemDesc}>消除和通关时的震动效果</Text>
            </View>
          </View>
          <SettingSwitch
            checked={localSettings.vibrationEnabled}
            onChange={() => toggleSetting('vibrationEnabled')}
          />
        </View>
      </View>

      <View className={styles.sectionGroup}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>显示</Text>
        </View>
        <View className={styles.settingItem}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>👁️</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>护眼模式</Text>
              <Text className={styles.itemDesc}>减少蓝光，更适合夜间游玩</Text>
            </View>
          </View>
          <SettingSwitch
            checked={localSettings.eyeCareMode}
            onChange={() => toggleSetting('eyeCareMode')}
          />
        </View>
      </View>

      <View className={styles.sectionGroup}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>游戏</Text>
        </View>
        <View className={styles.settingItem} onClick={handleNewGuide}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>💡</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>重新查看新手引导</Text>
              <Text className={styles.itemDesc}>回顾游戏的基本玩法</Text>
            </View>
          </View>
          <Text style={{ fontSize: '32rpx', color: '$color-text-tertiary' }}>›</Text>
        </View>
        <View className={styles.settingItem} onClick={handleClearCache}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>🗑️</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>清除缓存</Text>
              <Text className={styles.itemDesc}>清理 12.5MB 临时文件</Text>
            </View>
          </View>
          <Text style={{ fontSize: '32rpx', color: '$color-text-tertiary' }}>›</Text>
        </View>
      </View>

      <View className={styles.sectionGroup}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>账号</Text>
        </View>
        <View className={styles.settingItem} onClick={() => Taro.showToast({ title: '敬请期待', icon: 'none' })}>
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>🔗</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle}>账号绑定</Text>
              <Text className={styles.itemDesc}>绑定微信，跨设备同步进度</Text>
            </View>
          </View>
          <Text style={{ fontSize: '32rpx', color: '$color-text-tertiary' }}>›</Text>
        </View>
        <View
          className={styles.settingItem}
          onClick={() => Taro.showModal({ title: '退出登录', content: '确定要退出登录吗？', confirmColor: '#E17055' })}
        >
          <View className={styles.itemLeft}>
            <View className={styles.itemIcon}>🚪</View>
            <View className={styles.itemInfo}>
              <Text className={styles.itemTitle} style={{ color: '#E17055' }}>退出登录</Text>
            </View>
          </View>
          <Text style={{ fontSize: '32rpx', color: '$color-text-tertiary' }}>›</Text>
        </View>
      </View>

      <View className={styles.aboutCard}>
        <Text className={styles.logoIcon}>🌸</Text>
        <Text className={styles.appName}>花消消</Text>
        <Text className={styles.appVersion}>v1.0.0</Text>
        <View className={styles.aboutBtn} onClick={() => Taro.showToast({ title: '已是最新版本', icon: 'none' })}>
          <Text className={styles.aboutBtnText}>检查更新</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsPage;
