import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface NavBarProps {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  title,
  showBack = false,
  rightContent,
  onBack
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      Taro.navigateBack({ delta: 1 }).catch(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      });
    }
  };

  return (
    <View className={styles.navBar}>
      <View className={styles.leftArea}>
        {showBack && (
          <View className={styles.backBtn} onClick={handleBack}>
            <Text className={styles.backIcon}>←</Text>
          </View>
        )}
      </View>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.rightArea}>{rightContent}</View>
    </View>
  );
};

export default NavBar;
