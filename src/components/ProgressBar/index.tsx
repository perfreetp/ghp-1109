import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ProgressBarProps {
  progress: number;
  total: number;
  showText?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  showText = true,
  color,
  size = 'md'
}) => {
  const percent = Math.min(100, Math.max(0, (progress / total) * 100));

  return (
    <View className={styles.wrapper}>
      <View className={classnames(styles.bar, styles[size])}>
        <View
          className={styles.fill}
          style={{
            width: `${percent}%`,
            backgroundColor: color
          }}
        />
      </View>
      {showText && (
        <Text className={styles.text}>
          {progress}/{total}
        </Text>
      )}
    </View>
  );
};

export default ProgressBar;
