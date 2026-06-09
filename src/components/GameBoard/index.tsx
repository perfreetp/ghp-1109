import React, { useRef, useState } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Tile } from '@/types/game';
import { getTileEmoji, getTileColor } from '@/utils/gameLogic';
import styles from './index.module.scss';

interface GameBoardProps {
  board: Tile[][];
  selectedTile: Tile | null;
  onTileSelect: (tile: Tile) => void;
  onSwipe?: (fromTile: Tile, toTile: Tile) => void;
  disabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  tileRow: number;
  tileCol: number;
}

const SWIPE_THRESHOLD = 30;

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedTile,
  onTileSelect,
  onSwipe,
  disabled = false
}) => {
  const boardSize = board.length;
  const tileSize = Math.floor(680 / boardSize);

  const touchRef = useRef<TouchState | null>(null);
  const [swipingTile, setSwipingTile] = useState<{ row: number; col: number; dir: string } | null>(null);

  const handleTouchStart = (row: number, col: number, e: any) => {
    if (disabled) return;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    if (!touch) return;
    touchRef.current = {
      startX: touch.clientX ?? touch.pageX ?? 0,
      startY: touch.clientY ?? touch.pageY ?? 0,
      tileRow: row,
      tileCol: col
    };
    setSwipingTile({ row, col, dir: '' });
  };

  const handleTouchMove = (e: any) => {
    if (!touchRef.current || disabled) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const { startX, startY } = touchRef.current;
    const dx = (touch.clientX ?? touch.pageX ?? 0) - startX;
    const dy = (touch.clientY ?? touch.pageY ?? 0) - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    let dir = '';
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }
    setSwipingTile((prev) => (prev ? { ...prev, dir } : null));
  };

  const handleTouchEnd = (row: number, col: number, e: any) => {
    if (!touchRef.current) return;
    const ts = touchRef.current;
    touchRef.current = null;
    setSwipingTile(null);

    if (disabled) return;
    const tile = board[ts.tileRow]?.[ts.tileCol];
    if (!tile || tile.type === -1) return;

    const touch = e.changedTouches?.[0];
    if (!touch) {
      onTileSelect(tile);
      return;
    }
    const endX = touch.clientX ?? touch.pageX ?? 0;
    const endY = touch.clientY ?? touch.pageY ?? 0;
    const dx = endX - ts.startX;
    const dy = endY - ts.startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      if (ts.tileRow === row && ts.tileCol === col) {
        onTileSelect(tile);
      }
      return;
    }

    if (!onSwipe) {
      onTileSelect(tile);
      return;
    }

    let targetRow = ts.tileRow;
    let targetCol = ts.tileCol;
    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (targetRow < 0 || targetRow >= boardSize || targetCol < 0 || targetCol >= boardSize) {
      onTileSelect(tile);
      return;
    }
    const targetTile = board[targetRow][targetCol];
    if (!targetTile || targetTile.type === -1) {
      onTileSelect(tile);
      return;
    }
    onSwipe(tile, targetTile);
  };

  const getSwipeStyle = (row: number, col: number) => {
    if (!swipingTile || swipingTile.row !== row || swipingTile.col !== col || !swipingTile.dir) {
      return undefined;
    }
    const offset = Math.min(tileSize * 0.45, 35);
    switch (swipingTile.dir) {
      case 'left':
        return { transform: `translateX(-${offset}rpx)` };
      case 'right':
        return { transform: `translateX(${offset}rpx)` };
      case 'up':
        return { transform: `translateY(-${offset}rpx)` };
      case 'down':
        return { transform: `translateY(${offset}rpx)` };
      default:
        return undefined;
    }
  };

  return (
    <View
      className={styles.board}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, ${tileSize}rpx)`,
        gap: '4rpx'
      }}
      onTouchMove={handleTouchMove as any}
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
              backgroundColor: tile.type !== -1 ? getTileColor(tile.type) : 'transparent',
              ...getSwipeStyle(rowIdx, colIdx)
            }}
            onTouchStart={(e) => handleTouchStart(rowIdx, colIdx, e)}
            onTouchEnd={(e) => handleTouchEnd(rowIdx, colIdx, e)}
            onTouchCancel={() => {
              touchRef.current = null;
              setSwipingTile(null);
            }}
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
