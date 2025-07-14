/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Sprite, SpriteOptions, Texture } from 'pixi.js';
import { ISymbolVisual } from '../../interfaces';
import { getApp } from '../../../initApp';

export class SpriteVisual implements ISymbolVisual {
  public displayObject: Sprite;
  private processedAnims: { [key: string]: Texture | ((instance: any) => Promise<void>) } = {};
  private texture: Texture;

  constructor(
    options: SpriteOptions,
    anims: {
      [key: string]: string[] | Texture[] | Texture | string | ((instance: any) => Promise<void>);
    } = {},
  ) {
    if (typeof options.texture === 'string') {
      options.texture = Texture.from(options.texture);
    }
    this.displayObject = new Sprite(options);
    getApp().make.applyProperties(this.displayObject, options, undefined, {
      texture: true,
    });
    // Store the original texture for reference when stopping animations
    this.texture = this.displayObject.texture;
    // Initialize the animation textures map
    this.processedAnims = {};
    // Process each animation definition
    for (const animKey in anims) {
      const animValue = anims[animKey];
      let textureToSet: Texture = Texture.EMPTY; // Default to empty texture

      // Process animation value based on its type
      if (typeof animValue === 'string') {
        // If animation value is a string, convert it to a texture
        textureToSet = Texture.from(animValue);
      } else if (animValue instanceof Texture) {
        // If animation value is already a Texture, use it directly
        textureToSet = animValue;
      } else if (Array.isArray(animValue) && animValue.length > 0) {
        // If animation value is an array, use the first element
        // (sprites can only display one texture at a time)
        const firstElement = animValue[0];
        if (typeof firstElement === 'string') {
          // Convert string path to texture
          textureToSet = Texture.from(firstElement);
        } else if (firstElement instanceof Texture) {
          // Use texture directly
          textureToSet = firstElement;
        }
      } else if (typeof animValue === 'function') {
        // If animation value is a function, store it directly
        this.processedAnims[animKey] = animValue;
        continue; // Skip setting texture for function animations
      }
      // Store the texture for this animation name
      this.processedAnims[animKey] = textureToSet;
    }
  }

  /**
   * Sets the position of the sprite
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  setPos(x: number, y: number): void {
    this.displayObject.x = x;
    this.displayObject.y = y;
  }

  setVisible(visible: boolean): void {
    this.displayObject.visible = visible;
  }

  playAnim(animName: string, _loop: boolean, animSpeed?: number, onComplete?: () => void): void {
    const animTexture = this.processedAnims[animName];
    if (animTexture && animTexture instanceof Texture) {
      this.displayObject.texture = animTexture;
      if (onComplete) onComplete();
    } else if (typeof animTexture === 'function') {
      // If the animation is a function, call it with the instance
      animTexture(this.displayObject)
        .then(() => {
          if (onComplete) onComplete();
        })
        .catch(error => {
          console.error(`Error executing animation function for ${animName}:`, error);
        });
    }
  }

  stopAnim(): void {
    this.displayObject.texture = this.texture;
  }

  destroy(): void {
    this.displayObject.destroy();
  }
}
