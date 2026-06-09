import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Tile } from '@/types/game';
import { getTileEmoji, getTileColor } from '@/utils/gameLogic';
import styles from './index.module.scss';

interface GameBoardProps {
  board: Tile[][];
  selectedTile: Tile | null;
  onTileSelect: (tile: Tile) => void;
  disabled?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedTile,
  onTileSelect,
  disabled = false
}) => {
  const boardSize = board.length;
  const tileSize = Math.floor(680 / boardSize);

  return (
    <View
      className={styles.board}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, ${tileSize}rpx)`,
        gap: '4rpx'
      }}
    >
      {board.map((row, rowIdx) =>
        row.map((tile, colIdx) => (
          <View
            key={tile.id}
            className={classnames(
              styles.tile,
              tile.type === -1 && styles.empty,
              selectedTile?.row === rowIdx && selectedTile?.col === colIdx && styles.selected,
              tile.isMatched && styles.matched,
              disabled && styles.disabled
            )}
            style={{
              width: `${tileSize}rpx`,
              height: `${tileSize}rpx`,
              backgroundColor: tile.type !== -1 ? getTileColor(tile.type) : 'transparent'
            }}
            onClick={() => !disabled && tile.type !== -1 && onTileSelect(tile)}
          >
            {tile.type !== -1 && (
              <Text
                className={styles.tileEmoji}
                style={{ fontSize: `${Math.floor(tileSize * 0.55)}rpx` }}
              >
                {getTileEmoji(tile.type)}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );
};

export default GameBoard;
