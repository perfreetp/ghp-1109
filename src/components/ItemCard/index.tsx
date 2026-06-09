import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { Item } from '@/types/game';
import styles from './index.module.scss';

interface ItemCardProps {
  item: Item;
  showUseBtn?: boolean;
  onUse?: () => void;
  onClick?: () => void;
  selected?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  showUseBtn = false,
  onUse,
  onClick,
  selected = false
}) => {
  const { name, description, type, icon, count, price } = item;

  return (
    <View
      className={classnames(styles.itemCard, selected && styles.selected)}
      onClick={onClick}
    >
      <View className={styles.itemIconWrap}>
        <Text className={styles.itemIcon}>{icon}</Text>
      </View>
      <View className={styles.itemInfo}>
        <Text className={styles.itemName}>{name}</Text>
        <Text className={styles.itemDesc}>{description}</Text>
        {price && (
          <Text className={styles.itemPrice}>💰 {price}</Text>
        )}
      </View>
      <View className={styles.rightArea}>
        <View className={styles.countBadge}>
          <Text className={styles.countText}>×{count}</Text>
        </View>
        {showUseBtn && count > 0 && (
          <View className={styles.useBtn} onClick={(e) => { e.stopPropagation(); onUse && onUse(); }}>
            <Text className={styles.useBtnText}>使用</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ItemCard;
