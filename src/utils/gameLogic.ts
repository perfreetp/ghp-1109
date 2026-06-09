import { Tile } from '@/types/game';

const TILE_EMOJIS = ['🌹', '🌻', '🌷', '🌸', '💐', '🌺'];
const TILE_COLORS = ['#FF6B6B', '#FFD93D', '#E85C90', '#FFB6C8', '#7EC8A3', '#DA77F2'];

export function generateBoard(size: number, tileTypes: number): Tile[][] {
  const board: Tile[][] = [];
  for (let row = 0; row < size; row++) {
    board[row] = [];
    for (let col = 0; col < size; col++) {
      let type: number;
      do {
        type = Math.floor(Math.random() * tileTypes);
      } while (hasInitialMatch(board, row, col, type));
      board[row][col] = {
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        type,
        row,
        col,
        isMatched: false,
        isSelected: false
      };
    }
  }
  return board;
}

function hasInitialMatch(board: Tile[][], row: number, col: number, type: number): boolean {
  if (col >= 2 && board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) {
    return true;
  }
  if (row >= 2 && board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) {
    return true;
  }
  return false;
}

export function findMatches(board: Tile[][]): Tile[] {
  const size = board.length;
  const matches: Set<string> = new Set();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 2; col++) {
      const type = board[row][col].type;
      if (board[row][col + 1].type === type && board[row][col + 2].type === type) {
        matches.add(`${row}-${col}`);
        matches.add(`${row}-${col + 1}`);
        matches.add(`${row}-${col + 2}`);
        let k = col + 3;
        while (k < size && board[row][k].type === type) {
          matches.add(`${row}-${k}`);
          k++;
        }
      }
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size - 2; row++) {
      const type = board[row][col].type;
      if (board[row + 1][col].type === type && board[row + 2][col].type === type) {
        matches.add(`${row}-${col}`);
        matches.add(`${row + 1}-${col}`);
        matches.add(`${row + 2}-${col}`);
        let k = row + 3;
        while (k < size && board[k][col].type === type) {
          matches.add(`${k}-${col}`);
          k++;
        }
      }
    }
  }

  const matchedTiles: Tile[] = [];
  matches.forEach((key) => {
    const [r, c] = key.split('-').map(Number);
    if (board[r] && board[r][c]) {
      matchedTiles.push(board[r][c]);
    }
  });

  return matchedTiles;
}

export function swapTiles(board: Tile[][], tile1: Tile, tile2: Tile): Tile[][] {
  const newBoard = board.map((row) => row.map((tile) => ({ ...tile })));
  const temp = { ...newBoard[tile1.row][tile1.col] };
  newBoard[tile1.row][tile1.col] = {
    ...newBoard[tile2.row][tile2.col],
    row: tile1.row,
    col: tile1.col
  };
  newBoard[tile2.row][tile2.col] = {
    ...temp,
    row: tile2.row,
    col: tile2.col
  };
  return newBoard;
}

export function removeMatches(board: Tile[][], matches: Tile[]): Tile[][] {
  const newBoard = board.map((row) => row.map((tile) => ({ ...tile })));
  matches.forEach((match) => {
    newBoard[match.row][match.col] = {
      ...newBoard[match.row][match.col],
      isMatched: true,
      type: -1
    };
  });
  return newBoard;
}

export function dropTiles(board: Tile[][], tileTypes: number): Tile[][] {
  const size = board.length;
  const newBoard = board.map((row) => row.map((tile) => ({ ...tile })));

  for (let col = 0; col < size; col++) {
    let writeRow = size - 1;
    for (let row = size - 1; row >= 0; row--) {
      if (newBoard[row][col].type !== -1) {
        if (row !== writeRow) {
          newBoard[writeRow][col] = {
            ...newBoard[row][col],
            row: writeRow,
            col
          };
          newBoard[row][col] = {
            id: `${row}-${col}-${Date.now()}-${Math.random()}`,
            type: -1,
            row,
            col,
            isMatched: false,
            isSelected: false
          };
        }
        writeRow--;
      }
    }
    for (let row = writeRow; row >= 0; row--) {
      newBoard[row][col] = {
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        type: Math.floor(Math.random() * tileTypes),
        row,
        col,
        isMatched: false,
        isSelected: false
      };
    }
  }

  return newBoard;
}

export function areAdjacent(tile1: Tile, tile2: Tile): boolean {
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function calculateScore(matches: Tile[], combo: number): number {
  const baseScore = matches.length * 10;
  const comboMultiplier = 1 + (combo - 1) * 0.5;
  return Math.floor(baseScore * comboMultiplier);
}

export function calculateStars(score: number, stars1: number, stars2: number, stars3: number): number {
  if (score >= stars3) return 3;
  if (score >= stars2) return 2;
  if (score >= stars1) return 1;
  return 0;
}

export function getTileEmoji(type: number): string {
  return TILE_EMOJIS[type] || '❓';
}

export function getTileColor(type: number): string {
  return TILE_COLORS[type] || '#CCCCCC';
}

export function hasPossibleMoves(board: Tile[][]): boolean {
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (col < size - 1) {
        const swapped = swapTiles(board, board[row][col], board[row][col + 1]);
        if (findMatches(swapped).length > 0) return true;
      }
      if (row < size - 1) {
        const swapped = swapTiles(board, board[row][col], board[row + 1][col]);
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }
  return false;
}
