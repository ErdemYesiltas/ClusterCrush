/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { AnimatedSpriteOptions, ContainerOptions, Sprite, SpriteOptions, Texture, ViewContainer } from 'pixi.js';

export interface ISymbolVisual {
  /**
   * The display object that will be rendered.
   * ViewContainer might be more appropriate than DisplayObject
   */
  displayObject: ViewContainer;
  cover?: Sprite;

  /**
   * Sets the position of the visual element.
   * @param x - X coordinate position
   * @param y - Y Coordinate position
   */
  setPos(x: number, y: number): void;

  /**
   * Sets the visibility of the visual element.
   * @param visible - Whether the visual should be visible
   */
  setVisible(visible: boolean): void;

  /**
   * Plays an animation on the visual element.
   * @param animName - Name of the animation to play
   * @param loop - Whether the animation should loop
   * @param onComplete - Optional callback when animation completes
   * @param animSpeed - Animation speed multiplier (optional, default: 1)
   */
  playAnim(animName: string, loop: boolean, animSpeed?: number, onComplete?: () => void): void;

  /**
   * Stops the currently playing animation.
   */
  stopAnim(): void;

  /**
   * Cleans up resources used by the visual element.
   */
  destroy(): void;
}

export interface SymbolOptions extends ContainerOptions {
  visualType?: 'sprite' | 'animatedSprite';
  visualOptions?:
    | (Omit<SpriteOptions, 'texture'> & { texture: string | Texture })
    | (Omit<AnimatedSpriteOptions, 'textures'> & { textures: string[] | Texture[] });
  animations?: { [key: string]: string[] | Texture[] | string | ((instance: any) => Promise<void>) };
  symName?: string;
  description?: string;
  payouts?: { [count: string]: number };
  isWild?: boolean;
  isScatter?: boolean;
  isBonus?: boolean;
  [key: string]: unknown; // Diğer özel özellikler
}

export interface BoardOptions extends ContainerOptions {
  rows?: number;
  columns?: number;
  cellSize?: number;
  cellTexture?: string | Texture;
  optionCount?: number;
  symbols?: {
    [symbolId: string]: SymbolOptions;
  };
  maskOpts?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}
