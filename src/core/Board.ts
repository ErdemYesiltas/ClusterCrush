/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Application,
  Container,
  DestroyOptions,
  FederatedPointerEvent,
  Graphics,
  Texture,
  TilingSprite,
} from 'pixi.js';
import { BoardOptions, SymbolOptions } from './interfaces';
import { CascadeSymbol, SymbolPool } from './symbol';
import { gsap } from 'gsap';

export class Board extends Container {
  symbolList: CascadeSymbol[][] = [];
  dragDropSymbols: CascadeSymbol[] = [];
  dragDropTarget: CascadeSymbol | null = null;
  options!: BoardOptions;
  background!: TilingSprite;
  dragDropBg!: TilingSprite;
  private _pool: SymbolPool;
  private _symConf: BoardOptions['symbols'];
  private _maskObject: Graphics | null = null;
  private _isDisabled: boolean = false;

  constructor(
    public app: Application,
    options?: BoardOptions,
  ) {
    super(options);
    this.label = 'BoardContainer';

    options = options || {};

    // apply other properties from the app.make
    app.make.applyProperties(this, options);

    // fill options
    this.options = {
      rows: options.rows || 5,
      columns: options.columns || 5,
      cellSize: options.cellSize || 100,
      cellTexture: options.cellTexture || 'default-tile',
      optionCount: options.optionCount || 3,
      symbols: options.symbols || {},
    };

    // set symbol configuration
    this._symConf = options.symbols || {};

    // create symbol pool
    const symbolFactory = SymbolPool.createSymbolFactory(this._symConf);
    this._pool = new SymbolPool(symbolFactory, this._symConf);

    // create background
    this.background = app.make.tilingSprite({
      texture:
        typeof this.options.cellTexture === 'string'
          ? Texture.from(this.options.cellTexture)
          : this.options.cellTexture,
      width: (this.options.columns ?? 5) * (this.options.cellSize ?? 100),
      height: (this.options.rows ?? 5) * (this.options.cellSize ?? 100),
    });
    this.addChild(this.background);

    // create drag symbols background
    this.dragDropBg = app.make.tilingSprite({
      x: this.background.width / 2,
      y: this.background.height + 90,
      anchor: 0.5,
      texture:
        typeof this.options.cellTexture === 'string'
          ? Texture.from(this.options.cellTexture)
          : this.options.cellTexture,
      width: (this.options.optionCount ?? 3) * (this.options.cellSize ?? 100),
      height: this.options.cellSize ?? 100,
    });
    this.addChild(this.dragDropBg);

    // set mask if provided
    if (options.maskOpts) {
      this.createMask(options.maskOpts);
    }

    this.showMask(false); // Hide mask by default

    // allow interaction on the stage
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointerup', this.onDragEnd, this);
    app.stage.on('pointerupoutside', this.onDragEnd, this);

    // start the board
    //this.start();
  }
  start(): void {
    // pick random symbols for drag and drop area
    this.pickRandomSymbolsForDragDrop();

    // Fetch symbols and initialize the board
    this.fetchSymbolList();

    this.emit('board-ready', this);
  }

  randomSymbolIds(count: number): string[] {
    const symbolKeys = Object.keys(this.options.symbols || {});
    if (symbolKeys.length === 0) {
      console.warn('No symbols available in options.');
      return [];
    }
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(symbolKeys[Math.floor(Math.random() * symbolKeys.length)]);
    }

    return ids;
  }

  fetchSymbolList(): void {
    const rows = this.options.rows ?? 5;
    const columns = this.options.columns ?? 5;
    const cellSize = this.options.cellSize ?? 100;

    // Clear existing symbols if symbolList is not empty
    if (this.symbolList.length > 0) {
      for (let col = 0; col < this.symbolList.length; col++) {
        if (this.symbolList[col]) {
          for (let row = 0; row < this.symbolList[col].length; row++) {
            const symbol = this.symbolList[col][row];
            if (symbol) {
              // Remove from display hierarchy
              if (this.children.includes(symbol as any)) {
                this.removeChild(symbol as any);
              }
              // Return to pool
              this._pool.return(symbol);
            }
          }
        }
      }
    }

    // Initialize fresh symbolList
    this.symbolList = [];

    // Create new symbols
    for (let col = 0; col < columns; col++) {
      this.symbolList[col] = [];
      for (let row = 0; row < rows; row++) {
        const symbolId = this.randomSymbolIds(1)[0];
        const symbol = this._pool.get(symbolId, this._symConf?.[symbolId]);
        if (symbol) {
          // Store the symbol ID on the symbol for later reference
          this.symbolList[col][row] = symbol;
          this.addChild(symbol);
          symbol.setPos(col * cellSize, row * cellSize);
        }
      }
    }
  }

  pickRandomSymbolsForDragDrop(): void {
    if (this.dragDropSymbols.length > 0) {
      // Clear existing drag and drop symbols
      this.dragDropSymbols.forEach(symbol => {
        if (this.children.includes(symbol as any)) {
          this.removeChild(symbol as any);
        }
        this._pool.return(symbol);
        this.clearDragDropSymbol(symbol);
      });
    }
    const symbolKeys = Object.keys(this.options.symbols || {});
    if (symbolKeys.length === 0) {
      console.warn('No symbols available in options.');
      return;
    }

    const cellSize = this.options.cellSize ?? 100;
    const count = this.options.optionCount ?? 3;
    this.dragDropSymbols = [];

    for (let i = 0; i < count; i++) {
      const symbolId = this.randomSymbolIds(1)[0];
      const symbol = this._pool.get(symbolId, this._symConf?.[symbolId]);
      if (symbol) {
        this.dragDropSymbols.push(symbol);
        this.addChild(symbol);
        symbol.setPos(this.dragDropBg.x + (i - count / 2) * cellSize, this.dragDropBg.y - cellSize / 2);
        this.addDragDropToSymbol(symbol);
      }
    }
  }

  addDragDropToSymbol(symbol: CascadeSymbol): void {
    symbol.eventMode = 'static'; // Make it static for drag and drop
    symbol.cursor = 'pointer'; // Change cursor to pointer for interaction
    symbol.on('pointerdown', this.onDragStart, this);
  }

  clearDragDropSymbol(symbol: CascadeSymbol): void {
    symbol.eventMode = 'none'; // Disable interaction
    symbol.cursor = 'default'; // Reset cursor
    symbol.off('pointerdown', this.onDragStart, this);
  }

  onDragMove(event: FederatedPointerEvent) {
    if (this.dragDropTarget) {
      this.dragDropTarget.parent.toLocal(event.global, undefined, this.dragDropTarget.position);
      this.dragDropTarget.position.x -= (this.options.cellSize ?? 100) / 2; // Adjust X position for visual effect
      this.dragDropTarget.position.y -= (this.options.cellSize ?? 100) / 2; // Adjust Y position for visual effect
    }
  }

  onDragStart(event: FederatedPointerEvent) {
    if (event.target instanceof CascadeSymbol) {
      this.dragDropTarget = event.target;
      this.dragDropTarget.zIndex = 1000; // Bring to front during drag
      this.app.stage.on('pointermove', this.onDragMove, this);
    }
  }

  onDragEnd(event: FederatedPointerEvent) {
    if (this.dragDropTarget instanceof CascadeSymbol) {
      this.dragDropTarget.zIndex = 0; // Reset zIndex after drag
      this.app.stage.off('pointermove', this.onDragMove, this);

      // Check if dropped on board
      const dropInfo = this.getDropPositionInfo(event);
      if (dropInfo) {
        this.emit('symbol-drag-drop', { target: this.dragDropTarget, drop: dropInfo });

        //this.handleSymbolDrop(this.dragDropTarget, dropInfo);
      } else {
        this.resetDragDropSymbolPosition(this.dragDropTarget);
      }

      this.dragDropTarget = null;
    }
  }

  private getDropPositionInfo(event: FederatedPointerEvent): { row: number; column: number; index: number } | null {
    const cellSize = this.options.cellSize ?? 100;
    const columns = this.options.columns ?? 5;
    const rows = this.options.rows ?? 5;

    // Event'in global pozisyonunu board'un local koordinatına çevir
    const localPosition = this.toLocal(event.global);

    // Hangi hücreye bırakıldığını hesapla
    const column = Math.floor(localPosition.x / cellSize);
    const row = Math.floor(localPosition.y / cellSize);

    // Board sınırları içinde mi kontrol et
    if (column >= 0 && column < columns && row >= 0 && row < rows) {
      const index = row * columns + column;
      return { row, column, index };
    }

    return null;
  }

  handleSymbolDrop(draggedSymbol: CascadeSymbol, dropInfo: { row: number; column: number; index: number }): void {
    const { row, column } = dropInfo;

    // Mevcut pozisyondaki sembolü al
    const existingSymbol = this.symbolList[column]?.[row];

    if (existingSymbol) {
      // Mevcut sembolü drag drop alanına taşı
      const dragIndex = this.dragDropSymbols.indexOf(draggedSymbol);
      if (dragIndex !== -1) {
        // Dragged symbol'ı board'a yerleştir
        this.symbolList[column][row] = draggedSymbol;
        draggedSymbol.zIndex = 0; // Reset zIndex after drop
        draggedSymbol.setPos(column * (this.options.cellSize ?? 100), row * (this.options.cellSize ?? 100));

        // Mevcut sembolü drag drop alanına yerleştir
        this.dragDropSymbols[dragIndex] = existingSymbol;
        existingSymbol.zIndex = 1000; // Bring existing symbol to front during drop
        this.resetDragDropSymbolPosition(existingSymbol, dragIndex);

        // Drag drop özelliklerini güncelle
        this.clearDragDropSymbol(draggedSymbol);
        this.addDragDropToSymbol(existingSymbol);
      }
    }
  }

  resetDragDropSymbolPosition(symbol: CascadeSymbol, index?: number): void {
    const cellSize = this.options.cellSize ?? 100;
    const count = this.options.optionCount ?? 3;

    // Eğer index verilmemişse, sembolün drag drop array'indeki pozisyonunu bul
    if (index === undefined) {
      index = this.dragDropSymbols.indexOf(symbol);
    }

    if (index !== -1) {
      const targetX = this.dragDropBg.x + (index - count / 2) * cellSize;
      const targetY = this.dragDropBg.y - cellSize / 2;

      // Sembolü eski pozisyonuna animate et
      gsap.to(symbol, {
        x: targetX,
        y: targetY,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }

  showMask(value: boolean) {
    this.background.mask = value && this._maskObject ? this._maskObject : null;
    if (this._maskObject) {
      this._maskObject.visible = value;
    }
  }

  cascade(
    extract: number[],
    insert: string[],
    animationName: string = 'cascade',
    cascadeConfigs?: {
      dropDuration?: number;
      staggerDelay?: number;
      easing?: gsap.EaseString;
    },
  ): Promise<void> {
    this.showMask(true); // Show mask during cascade
    const columns = this.options.columns ?? 5;
    const rows = this.options.rows ?? 5;
    const insertExtractByColumn: Record<number, Array<{ extract: number; insert: string }>> = {};
    extract.forEach((ext, index) => {
      const col = ext % columns;

      if (!insertExtractByColumn[col]) insertExtractByColumn[col] = [];
      insertExtractByColumn[col].push({ extract: Math.floor(ext / rows), insert: insert[index] });
    });

    const columnPromises: Promise<void>[] = [];
    for (const col in insertExtractByColumn) {
      insertExtractByColumn[col].sort((a, b) => a.extract - b.extract);
      columnPromises.push(
        this.playCascadeByColumn(
          parseInt(col),
          insertExtractByColumn[col].map(s => s.extract),
          insertExtractByColumn[col].map(s => s.insert),
          animationName,
          cascadeConfigs,
        ),
      );
    }

    return new Promise(resolve => {
      Promise.all(columnPromises).then(() => {
        this.showMask(false); // Hide mask after cascade completion
        resolve();
      });
    });
  }

  private async playCascadeByColumn(
    column: number,
    extract: number[] = [],
    insert: string[] = [],
    animationName: string = 'win-cascade',
    cascadeConfigs?: {
      dropDuration?: number;
      staggerDelay?: number;
      easing?: gsap.EaseString;
    },
  ): Promise<void> {
    const symbols = this.symbolList[column] || [];
    const config = this.getCascadeConfig(cascadeConfigs);

    // Step 1: Play win animations for symbols to be removed
    await this.playWinAnimations(symbols, extract, animationName);

    // Step 2: Remove winning symbols and prepare for new ones
    const symbolsToRemove = this.removeWinningSymbols(symbols, extract);

    // Step 3: Create and add new symbols
    const newSymbols = this.createNewSymbols(insert, column);
    symbols.splice(0, 0, ...newSymbols);

    // Step 4: Ensure correct symbol count
    this.normalizeSymbolCount(symbols, column);

    // Step 5: Animate symbols dropping to final positions
    await this.animateSymbolsDrop(symbols, config);

    // Step 6: Clean up removed symbols
    this.cleanupRemovedSymbols(symbolsToRemove);

    // Step 7: Update the main symbolList with current symbols
    this.symbolList[column] = symbols;
  }

  private getCascadeConfig(cascadeConfigs?: {
    dropDuration?: number;
    staggerDelay?: number;
    easing?: gsap.EaseString;
  }) {
    return {
      cellSize: this.options.cellSize ?? 100,
      duration: cascadeConfigs?.dropDuration || 0.3,
      stagger: cascadeConfigs?.staggerDelay || 0.04,
      easing: cascadeConfigs?.easing || 'power1',
    };
  }

  private playWinAnimations(symbols: CascadeSymbol[], extract: number[], animationName: string): Promise<void> {
    const winningSymbols = extract.map(i => symbols[i]).filter(Boolean) as CascadeSymbol[];

    return new Promise<void>(resolve => {
      let completedCount = 0;
      const total = winningSymbols.length;

      // If no symbols to animate, resolve immediately
      if (total === 0) {
        resolve();
        return;
      }

      winningSymbols.forEach(symbol => {
        // Make sure symbol is visible before playing animation
        symbol.setVisible(true);

        try {
          symbol.playAnim(animationName, false, 1, () => {
            symbol.setVisible(false);
            completedCount++;
            if (completedCount === total) {
              resolve();
            }
          });
        } catch (error) {
          console.error(`Cascade animation error for symbol:`, error);
          symbol.setVisible(false);
          completedCount++;
          if (completedCount === total) {
            resolve();
          }
        }
      });
    });
  }

  private removeWinningSymbols(symbols: CascadeSymbol[], extract: number[]): CascadeSymbol[] {
    const symbolsToRemove: CascadeSymbol[] = [];

    for (const index of extract) {
      if (symbols[index]) {
        const removedSymbol = symbols.splice(index, 1)[0];
        removedSymbol.setVisible(false);
        symbolsToRemove.push(removedSymbol);
      }
    }

    return symbolsToRemove;
  }

  private createNewSymbols(insert: string[], column: number): CascadeSymbol[] {
    const cellSize = this.options.cellSize ?? 100;

    return insert.map(id => {
      const symbolConfig = (this._symConf?.[id] ?? {}) as SymbolOptions;
      const symbol = this._pool.get(id, symbolConfig);

      // Store the symbol ID on the symbol for later reference
      symbol.id = id;

      // Position new symbol above the visible area with correct X position
      symbol.setPos(column * cellSize, -cellSize);
      this.addChild(symbol as any);

      return symbol;
    });
  }

  private normalizeSymbolCount(symbols: CascadeSymbol[], column: number): void {
    const requiredCount = this.options.rows ?? 5;

    if (symbols.length > requiredCount) {
      // Remove excess symbols from the end
      const excessSymbols = symbols.splice(requiredCount);
      excessSymbols.forEach(sym => {
        this._pool.return(sym);
        this.removeChild(sym as any);
      });
    } else if (symbols.length < requiredCount) {
      // Add random symbols to fill the gap at the END of the column
      const cellSize = this.options.cellSize ?? 100;
      while (symbols.length < requiredCount) {
        const randomSymId = this.randomSymbolIds(1)[0];
        const symbolConfig = (this._symConf?.[randomSymId] ?? {}) as SymbolOptions;
        const symbol = this._pool.get(randomSymId, symbolConfig);

        // Position the new symbol at the bottom of the column with correct X position
        symbol.setPos(column * cellSize, symbols.length * cellSize);
        symbol.setVisible(true);
        this.addChild(symbol as any);
        symbols.push(symbol); // Add to the end, not beginning
      }
    }
  }

  private async animateSymbolsDrop(symbols: CascadeSymbol[], config: any): Promise<void> {
    const timeline = gsap.timeline();

    return new Promise<void>(resolve => {
      let animationCount = 0;

      symbols.forEach((symbol, index) => {
        const finalY = index * config.cellSize;
        const currentY = symbol.y ?? 0;
        const needsAnimation = Math.abs(currentY - finalY) > 1;

        if (needsAnimation) {
          symbol.setVisible(true);
          animationCount++;

          // Determine start position
          const startY = currentY <= finalY ? currentY : -config.cellSize;

          timeline.fromTo(
            symbol,
            { y: startY },
            {
              y: finalY,
              duration: config.duration,
              ease: config.easing,
            },
            (symbols.length - index) * config.stagger,
          );
        } else {
          // No animation needed, just position it
          symbol.setPos(symbol.x, finalY);
          symbol.setVisible(true);
        }
      });

      if (animationCount === 0) {
        resolve();
      } else {
        timeline.call(() => {
          resolve();
        });
      }
    });
  }

  private cleanupRemovedSymbols(symbolsToRemove: CascadeSymbol[]): void {
    symbolsToRemove.forEach(symbol => {
      if (this.children.includes(symbol as any)) {
        this.removeChild(symbol as any);
      }
      this._pool.return(symbol);
    });
  }

  private createMask(maskConfig: BoardOptions['maskOpts']): void {
    // Remove existing mask if present
    if (this.mask) {
      this.removeChild(this.mask as any);
      (this.mask as any)?.destroy?.();
      this.mask = null;
      this._maskObject = null;
    }

    // Create new mask if needed
    if (maskConfig) {
      const maskGraphic = new Graphics();
      const x = maskConfig.x ?? 0;
      const y = maskConfig.y ?? 0;
      const width = maskConfig.width ?? (this.options.cellSize ?? 100) * (this.options.columns ?? 5);
      const height = maskConfig.height ?? (this.options.cellSize ?? 100) * (this.options.rows ?? 5);
      maskGraphic.rect(x, y, width, height);
      maskGraphic.fill(0xffffff);
      this._maskObject = maskGraphic;
      this.background.mask = this._maskObject;
      this.addChild(maskGraphic as any);
    }
  }

  destroy(options?: DestroyOptions): void {
    this.app.stage.eventMode = 'none'; // Disable interaction on the stage
    this.app.stage.off('pointerup', this.onDragEnd, this);
    this.app.stage.off('pointerupoutside', this.onDragEnd, this);
    this.app.stage.off('pointermove', this.onDragMove, this);
    this.symbolList.forEach(column => {
      column.forEach(symbol => {
        if (symbol) {
          this._pool.return(symbol);
          this.removeChild(symbol as any);
        }
      });
    });
    this.symbolList = [];

    this.dragDropSymbols.forEach(symbol => {
      if (symbol) {
        this._pool.return(symbol);
        this.removeChild(symbol as any);
      }
    });
    this.dragDropSymbols = [];

    if (this.dragDropTarget) {
      this.clearDragDropSymbol(this.dragDropTarget);
    }
    this.dragDropTarget = null;

    this._pool.destroy(); // Destroy the symbol pool

    super.destroy(options);
  }

  // getter and setter
  get isDisabled(): boolean {
    return this._isDisabled;
  }
  set isDisabled(value: boolean) {
    this.alpha = value ? 0.5 : 1;
    this._isDisabled = value;
    this.interactiveChildren = !value; // Disable interaction on children if board is disabled
  }
}
