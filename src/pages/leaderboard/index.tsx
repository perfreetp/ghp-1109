import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { friendLeaderboard, globalLeaderboard } from '@/data/leaderboard';
import { LeaderboardUser } from '@/types/game';
import styles from './index.module.scss';

type TabType = 'friend' | 'global';

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('friend');

  const tabs = [
    { id: 'friend' as TabType, label: '👫 好友排行' },
    { id: 'global' as TabType, label: '🌍 全服排行' }
  ];

  const data = activeTab === 'friend' ? friendLeaderboard : globalLeaderboard;
  const topThree = data.slice(0, 3);
  const restList = data.slice(3);

  return (
    <ScrollView scrollY className='pageContainer'>
      <View className={styles.tabHeader}>
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

      <View className={styles.topThree}>
        {topThree.map((user, idx) => (
          <View
            key={user.userId}
            className={classnames(styles.topRankCard, styles[`rank${idx + 1}`])}
          >
            <Text className={styles.rankBadge}>{['🥇', '🥈', '🥉'][idx]}</Text>
            <Image className={styles.rankAvatar} src={user.avatar} mode="aspectFill" />
            <Text className={styles.rankNickname}>{user.nickname}</Text>
            <Text className={styles.rankLevel}>Lv.{user.level}</Text>
            <Text className={styles.rankScore}>{user.score.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View className={styles.rankList}>
        {restList.map((user: LeaderboardUser) => (
          <View
            key={user.userId}
            className={classnames(styles.rankItem, user.isSelf && styles.self)}
          >
            <Text className={styles.rankNum}>{user.rank}</Text>
            <Image className={styles.rankItemAvatar} src={user.avatar} mode="aspectFill" />
            <View className={styles.rankItemInfo}>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text className={styles.rankItemNickname}>{user.nickname}</Text>
                {user.isFriend && !user.isSelf && <Text className={styles.friendTag}>好友</Text>}
                {user.isSelf && <Text className={styles.selfTag}>我</Text>}
              </View>
              <Text className={styles.rankItemLevel}>Lv.{user.level}</Text>
            </View>
            <Text className={styles.rankItemScore}>{user.score.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default LeaderboardPage;
