/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { assign, setup, StateFrom } from 'xstate';
import { Board } from './Board';
import { CascadeSymbol } from './symbol/CascadeSymbol';

// Helpers

// Helper function to get symbol ID at position
const getSymbolId = (context: CrushGameContext, col: number, row: number): string | null => {
  const symbol = context.board.symbolList[col]?.[row];
  return symbol ? symbol.id : null;
};

// Helper function to convert col,row to index
const getIndex = (context: CrushGameContext, col: number, row: number): number => {
  return row * (context.board.options.columns ?? 5) + col;
};

// HUD interface
export interface HUD {
  updateScore: (score: number) => void;
  updateMoves: (moves: number) => void;
  activateRestartButton(value: boolean): void;
}

// Input configuration
export interface CrushGameInput {
  board: Board;
  hud: HUD;
  maxMoves?: number;
  winCheckFn?: (moves: number, score: number) => boolean;
  minWinCount?: number;
  calcScoreFn?: (moves: number) => number;
}

// Context type
export interface CrushGameContext {
  board: Board;
  hud: HUD;
  currentMove: number;
  score: number;
  maxMoves: number;
  winCheckFn: (moves: number, score: number) => boolean;
  minWinCount: number;
  calcScoreFn: (moves: number) => number;
  isGameOver: boolean;
  gameWon: boolean;
  possibleWins: { [symId: string]: number[] };
}

// Event types
export type CrushGameEvent =
  | { type: 'START' }
  | { type: 'SYMBOL_DROPPED'; symbol: CascadeSymbol; dropInfo: { row: number; column: number; index: number } }
  | { type: 'WINS_CHECKED'; hasWins: boolean; winData?: { winIndices: number[]; insertSymbols: string[] } }
  | { type: 'CASCADE_DONE' }
  | { type: 'RESET' }
  | { type: 'RESTART_CLICKED' };

// Default functions
const defaultWinCheckFn = (moves: number, score: number) => moves <= 25 && score >= 1000;
const defaultCalcScoreFn = (moves: number) => Math.pow(moves, 2) * 10;

// Create the state machine
export const crushGameLogic = setup({
  types: {
    context: {} as CrushGameContext,
    events: {} as CrushGameEvent,
    input: {} as CrushGameInput,
  },
  guards: {
    isGameWon: ({ context }) => context.winCheckFn(context.currentMove, context.score),
    isGameOver: ({ context }) => context.currentMove >= context.maxMoves,
    hasWins: ({ event }) => event.type === 'WINS_CHECKED' && event.hasWins,
  },
  actions: {
    initialize: ({ context, self }) => {
      if (context.board) {
        context.board.removeAllListeners();
        context.board.on('symbol-drag-drop', ({ target, drop }) => {
          self.send({ type: 'SYMBOL_DROPPED', symbol: target, dropInfo: drop });
        });
        context.board.isDisabled = false; // Enable the board
        context.board.start();
      }

      // HUD'dan restart-clicked eventini dinle
      if (context.hud && 'on' in context.hud) {
        (context.hud as any).on('restart-clicked', () => {
          self.send({ type: 'RESTART_CLICKED' });
        });
      }
      if (context.hud) {
        context.hud.activateRestartButton(true);
      }
    },
    resetGame: assign(({ context }) => {
      if (context.board) {
        context.board.isDisabled = false; // Enable the board
        context.board.start();
        context.hud?.updateScore(0);
        context.hud?.updateMoves(context.maxMoves);
      }

      if (context.hud) {
        context.hud.activateRestartButton(true);
      }
      return {
        currentMove: 0,
        score: 0,
        isGameOver: false,
        gameWon: false,
      };
    }),
    incrementMove: assign(({ context }) => {
      const newMove = context.currentMove + 1;
      context.hud?.updateMoves?.(context.maxMoves - newMove);
      return {
        currentMove: newMove,
      };
    }),
    checkForWins: assign(({ context, self, event }) => {
      // Sadece SYMBOL_DROPPED eventi için çalış
      if (event.type !== 'SYMBOL_DROPPED' || !event.symbol) {
        self.send({ type: 'WINS_CHECKED', hasWins: false });
        return {};
      }

      const droppedSymbolId = event.symbol.id;
      const { row, column } = event.dropInfo;
      const rows = context.board.options.rows ?? 5;
      const columns = context.board.options.columns ?? 5;

      if (!droppedSymbolId) {
        // Symbol ID bulunamadı, drag drop'u reset et
        context.board.resetDragDropSymbolPosition(event.symbol);
        self.send({ type: 'WINS_CHECKED', hasWins: false });
        return {};
      }

      // Hedef pozisyondaki sembolün ID'sini kontrol et
      const targetSymbolId = getSymbolId(context, column, row);

      // Eğer aynı ID'ye sahip semboller swap edilmeye çalışılıyorsa, win verme
      if (droppedSymbolId === targetSymbolId) {
        console.log('Same symbol IDs, no win allowed:', droppedSymbolId, '===', targetSymbolId);
        context.board.resetDragDropSymbolPosition(event.symbol);
        self.send({ type: 'WINS_CHECKED', hasWins: false });
        return {};
      }

      // ÖNCE WIN KONTROLÜ YAP - board'u henüz değiştirme
      let hasWin = false;
      const winIndices: number[] = [];

      // Geçici helper function - bırakılan pozisyonda dropped symbol var gibi davran
      const getSymbolIdWithDrop = (col: number, r: number): string | null => {
        if (col === column && r === row) {
          return droppedSymbolId; // Bırakılan pozisyonda dropped symbol var
        }
        return getSymbolId(context, col, r); // Diğer pozisyonlarda normal symbol
      };

      // Yatay (horizontal) win kontrolü - bırakılan noktadan başla
      const horizontalIndices: number[] = [];

      // Merkez nokta (bırakılan nokta)
      horizontalIndices.push(getIndex(context, column, row));

      // Sola doğru say
      for (let col = column - 1; col >= 0; col--) {
        const symbolId = getSymbolIdWithDrop(col, row);
        if (symbolId === droppedSymbolId) {
          horizontalIndices.unshift(getIndex(context, col, row)); // Başa ekle
        } else {
          break; // Kesinti varsa dur
        }
      }

      // Sağa doğru say
      for (let col = column + 1; col < columns; col++) {
        const symbolId = getSymbolIdWithDrop(col, row);
        if (symbolId === droppedSymbolId) {
          horizontalIndices.push(getIndex(context, col, row)); // Sona ekle
        } else {
          break; // Kesinti varsa dur
        }
      }

      // Yatay win kontrolü
      if (horizontalIndices.length >= context.minWinCount) {
        console.log('Horizontal win found!', horizontalIndices);
        winIndices.push(...horizontalIndices);
        hasWin = true;
      }

      // Dikey (vertical) win kontrolü - bırakılan noktadan başla
      const verticalIndices: number[] = [];

      // Merkez nokta (bırakılan nokta)
      verticalIndices.push(getIndex(context, column, row));

      // Yukarı doğru say
      for (let r = row - 1; r >= 0; r--) {
        const symbolId = getSymbolIdWithDrop(column, r);
        if (symbolId === droppedSymbolId) {
          verticalIndices.unshift(getIndex(context, column, r)); // Başa ekle
        } else {
          break; // Kesinti varsa dur
        }
      }

      // Aşağı doğru say
      for (let r = row + 1; r < rows; r++) {
        const symbolId = getSymbolIdWithDrop(column, r);
        if (symbolId === droppedSymbolId) {
          verticalIndices.push(getIndex(context, column, r)); // Sona ekle
        } else {
          break; // Kesinti varsa dur
        }
      }

      // Dikey win kontrolü
      if (verticalIndices.length >= context.minWinCount) {
        console.log('Vertical win found!', verticalIndices);
        winIndices.push(...verticalIndices);
        hasWin = true;
      }

      // Duplicate index'leri kaldır (merkez nokta hem yatay hem dikey'de olabilir)
      const uniqueWinIndices = [...new Set(winIndices)];

      if (hasWin && uniqueWinIndices.length > 0) {
        // Win var, ŞIMDI sembolü board'a yerleştir
        console.log('Win found! Placing symbol and starting cascade. Indices:', uniqueWinIndices);

        context.board.handleSymbolDrop(event.symbol, event.dropInfo);

        // Random semboller üret
        const insertSymbols = context.board.randomSymbolIds(uniqueWinIndices.length);

        // Score'u güncelle
        const newScore = context.score + context.calcScoreFn(context.currentMove);
        console.log(`New score: ${newScore}`);
        context.hud?.updateScore(newScore);
        context.score = newScore;

        self.send({ type: 'WINS_CHECKED', hasWins: true, winData: { winIndices: uniqueWinIndices, insertSymbols } });
        return {
          score: newScore,
        };
      } else {
        // Win yok, drag drop symbol'ü eski pozisyonuna geri döndür (board'u hiç değiştirmediğimiz için sadece visual reset)
        console.log('No win found, resetting symbol position');
        context.board.resetDragDropSymbolPosition(event.symbol);
        self.send({ type: 'WINS_CHECKED', hasWins: false });
        return {};
      }
    }),
    processCascade: ({ context, event, self }) => {
      if (context.board && event.type === 'WINS_CHECKED' && event.hasWins) {
        console.log('Processing cascade...');
        // Cascade'i tetikle
        context.board
          .cascade(event.winData?.winIndices ?? [], event.winData?.insertSymbols ?? [], 'cascade')
          .then(() => {
            self.send({ type: 'CASCADE_DONE' });
          });
      }
    },
    findPossibleWins: assign(({ context }) => {
      const possibleWins: { [symId: string]: number[] } = {};
      const rows = context.board.options.rows ?? 5;
      const columns = context.board.options.columns ?? 5;

      // dragDropSymbols dizisindeki sembol ID'lerini al
      console.log(
        'dragDropSymbols:',
        context.board.dragDropSymbols.map(s => s.id),
      );
      console.log(
        'dragDropSymbols details:',
        context.board.dragDropSymbols.map((symbol, index) => ({
          index,
          symbol,
          id: symbol.id,
          symbolData: symbol
            ? {
                name: symbol.name,
                uid: symbol.uid,
              }
            : null,
        })),
      );

      const dragDropSymbolIds = context.board.dragDropSymbols.map(symbol => symbol.id).filter(Boolean) as string[];

      console.log('dragDropSymbolIds:', dragDropSymbolIds);

      // Sadece dragDropSymbols'deki ID'lere göre filtreleme yap
      const targetSymbolIds = new Set(dragDropSymbolIds);

      // Her target symbol için olası win pozisyonlarını bul
      targetSymbolIds.forEach(targetSymbolId => {
        const winIndices: number[] = [];

        // Yatay (horizontal) win kontrolü - minWinCount kadar grup şeklinde kontrol et
        for (let row = 0; row < rows; row++) {
          for (let startCol = 0; startCol <= columns - context.minWinCount; startCol++) {
            let targetSymbolCount = 0;
            const groupIndices: number[] = [];

            // minWinCount kadar grup al
            for (let i = 0; i < context.minWinCount; i++) {
              const col = startCol + i;
              const symbolId = getSymbolId(context, col, row);
              groupIndices.push(getIndex(context, col, row));

              if (symbolId === targetSymbolId) {
                targetSymbolCount++;
              }
            }

            // Eğer minWinCount-1 kadar target symbol varsa, bu bir olası win'dir
            if (targetSymbolCount === context.minWinCount - 1) {
              winIndices.push(...groupIndices);
            }
          }
        }

        // Dikey (vertical) win kontrolü - minWinCount kadar grup şeklinde kontrol et
        for (let col = 0; col < columns; col++) {
          for (let startRow = 0; startRow <= rows - context.minWinCount; startRow++) {
            let targetSymbolCount = 0;
            const groupIndices: number[] = [];

            // minWinCount kadar grup al
            for (let i = 0; i < context.minWinCount; i++) {
              const row = startRow + i;
              const symbolId = getSymbolId(context, col, row);
              groupIndices.push(getIndex(context, col, row));

              if (symbolId === targetSymbolId) {
                targetSymbolCount++;
              }
            }

            // Eğer minWinCount-1 kadar target symbol varsa, bu bir olası win'dir
            if (targetSymbolCount === context.minWinCount - 1) {
              winIndices.push(...groupIndices);
            }
          }
        }

        // Duplicate index'leri kaldır ve sadece varsa kaydet
        if (winIndices.length > 0) {
          possibleWins[targetSymbolId] = [...new Set(winIndices)];
        }
      });

      console.log('Possible wins found:', possibleWins);
      return {
        possibleWins,
      };
    }),
    setGameWon: assign(() => ({
      isGameOver: true,
      gameWon: true,
    })),
    setGameOver: assign(() => ({
      isGameOver: true,
      gameWon: false,
    })),
    disableGame: ({ context }) => {
      if (context.board) {
        if (context.board.dragDropTarget) {
          context.board.resetDragDropSymbolPosition(context.board.dragDropTarget);
          context.board.dragDropTarget = null;
        }
        context.board.isDisabled = true;
      }

      if (context.hud) {
        context.hud.activateRestartButton(false); // Disable restart button
      }
    },
  },
}).createMachine({
  id: 'crushGame',
  initial: 'initialize',
  context: ({ input }) => {
    return {
      possibleWins: {},
      board: input.board,
      hud: input.hud,
      currentMove: 0,
      score: 0,
      maxMoves: input.maxMoves || 25,
      winCheckFn: input.winCheckFn || defaultWinCheckFn,
      minWinCount: input.minWinCount || 3,
      calcScoreFn: input.calcScoreFn || defaultCalcScoreFn,
      isGameOver: false,
      gameWon: false,
    };
  },
  states: {
    initialize: {
      entry: 'initialize',
      always: { target: 'reset' },
    },
    reset: {
      entry: ['resetGame', 'findPossibleWins'],
      always: { target: 'playing' },
    },
    playing: {
      on: {
        SYMBOL_DROPPED: 'processing',
        RESET: 'reset',
        RESTART_CLICKED: 'reset',
      },
    },
    processing: {
      entry: 'incrementMove',
      on: {
        RESTART_CLICKED: 'reset',
      },
      always: [
        { target: 'gameWon', guard: 'isGameWon' },
        { target: 'gameOver', guard: 'isGameOver' },
        { target: 'checkingWins' },
      ],
    },
    checkingWins: {
      entry: 'checkForWins',
      on: {
        WINS_CHECKED: [{ target: 'cascading', guard: 'hasWins' }, { target: 'playing' }],
        RESTART_CLICKED: 'reset',
      },
    },
    cascading: {
      entry: 'processCascade',
      on: {
        CASCADE_DONE: {
          target: 'playing',
          actions: 'findPossibleWins',
        },
        RESTART_CLICKED: 'reset',
      },
    },
    gameWon: {
      entry: ['setGameWon', 'disableGame'],
      on: {
        RESET: 'reset',
        RESTART_CLICKED: 'reset',
      },
    },
    gameOver: {
      entry: ['setGameOver', 'disableGame'],
      on: {
        RESET: 'reset',
        RESTART_CLICKED: 'reset',
      },
    },
  },
});

export type CrushGameType = StateFrom<typeof crushGameLogic>;
