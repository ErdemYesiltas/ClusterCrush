/* eslint-disable no-unused-vars */
import { AnimatedSpriteOptions, SpriteOptions, Texture } from 'pixi.js';
import { SymbolOptions, ISymbolVisual, BoardOptions } from '../interfaces';
import { CascadeSymbol } from './CascadeSymbol';
import { AnimatedSpriteVisual } from './visuals/AnimatedSpriteVisual';
import { SpriteVisual } from './visuals/SpriteVisual';

export class SymbolPool {
  private pool: Map<string, CascadeSymbol[]> = new Map();
  private symbolFactory: (id: string, options?: SymbolOptions) => CascadeSymbol;
  private globalSymbolCfg: BoardOptions['symbols'];

  constructor(
    symbolFactory: (id: string, options?: SymbolOptions) => CascadeSymbol,
    globalSymbolCfg: BoardOptions['symbols'],
  ) {
    this.symbolFactory = symbolFactory;
    this.globalSymbolCfg = globalSymbolCfg;
  }

  /**
   * Gets a symbol from the pool or creates a new one if none are available.
   * @param symbolId - The identifier for the symbol type.
   * @param overrideOptions - Optional configuration to override the default settings.
   * @returns A configured symbol instance ready for use.
   */
  public get(symbolId: string, overrideOptions?: SymbolOptions): CascadeSymbol {
    if (!this.pool.has(symbolId)) {
      this.pool.set(symbolId, []);
    }
    const symbols = this.pool.get(symbolId)!;
    let symbol: CascadeSymbol;
    if (symbols.length > 0) {
      symbol = symbols.pop()!;
      // Override options apply (if needed, usually handled in the factory)
    } else {
      const baseSymbolConfigForId = this.globalSymbolCfg?.[symbolId];
      symbol = this.symbolFactory(
        symbolId,
        { ...(baseSymbolConfigForId ?? {}), ...overrideOptions }, // overrideOptions should be passed to the factory here
      );
    }
    symbol.reset(); // Always reset
    symbol.setVisible(true); // Make visible
    symbol.label = `${symbolId}`; // Set the label
    symbol.id = symbolId; // Ensure ID is set
    return symbol;
  }

  /**
   * Returns a symbol to the pool for later reuse.
   * @param symbol - The symbol to return to the pool.
   */
  public return(symbol: CascadeSymbol): void {
    if (!this.pool.has(symbol.id)) {
      this.pool.set(symbol.id, []);
    }
    symbol.reset(); // Reset before returning to pool
    symbol.setVisible(false); // Make invisible
    this.pool.get(symbol.id)!.push(symbol);
  }

  public destroy(): void {
    this.pool.forEach(symbols => {
      symbols.forEach(symbol => symbol.destroy());
    });
    this.pool.clear();
  }

  public static createSymbolFactory(
    globalSymbolConfigMaster: BoardOptions['symbols'],
  ): (id: string, overrideOptions?: SymbolOptions) => CascadeSymbol {
    return (id: string, overrideOptions?: SymbolOptions): CascadeSymbol => {
      const baseConfig = globalSymbolConfigMaster?.[id];
      if (!baseConfig) {
        console.error(
          `Symbol base config not found in globalSymbolConfigMaster for ID: ${id}. Overrides:`,
          overrideOptions,
        );
        // Create a dummy symbol in case of error
        const dummyTexture = Texture.EMPTY;
        const visual: ISymbolVisual = new SpriteVisual(dummyTexture);
        const finalErrorOptions: SymbolOptions = {
          ...(overrideOptions || {}), // Apply overrides if any, but core error props take precedence
          visualType: 'sprite',
          animations: undefined,
          symName: id, // Ensure symName is set
        };
        return new CascadeSymbol(id, visual, finalErrorOptions);
      }

      const mergedConfig = { ...baseConfig, ...overrideOptions };

      const cfgToUse: SymbolOptions = {
        ...mergedConfig,
        symName: mergedConfig.symName || id,
      };

      if (!cfgToUse.visualType) {
        console.error(
          `VisualType not found for ID: ${id} after merge. Base:`,
          baseConfig,
          'Overrides:',
          overrideOptions,
          'Merged and Final cfgToUse (before error):',
          cfgToUse,
        );
        const dummyTexture = Texture.EMPTY;
        const visual: ISymbolVisual = new SpriteVisual(dummyTexture);
        const finalErrorOptions: SymbolOptions = {
          ...cfgToUse,
          symName: cfgToUse.symName,
          visualType: 'sprite',
          animations: undefined,
        };
        return new CascadeSymbol(id, visual, finalErrorOptions);
      }

      let visual: ISymbolVisual;

      switch (cfgToUse.visualType) {
        case 'sprite':
          visual = new SpriteVisual(cfgToUse.visualOptions as SpriteOptions, cfgToUse.animations || {});
          break;
        case 'animatedSprite':
          visual = new AnimatedSpriteVisual(cfgToUse.visualOptions as AnimatedSpriteOptions, cfgToUse.animations || {});
          break;
        default:
          console.warn(`Unknown visual type for symbol ${id}: '${cfgToUse.visualType}'. Using default SpriteVisual.`);
          visual = new SpriteVisual(Texture.EMPTY, cfgToUse.animations || {});
          cfgToUse.visualType = 'sprite';
          cfgToUse.animations = undefined;
          break;
      }
      return new CascadeSymbol(id, visual, cfgToUse);
    };
  }
}
