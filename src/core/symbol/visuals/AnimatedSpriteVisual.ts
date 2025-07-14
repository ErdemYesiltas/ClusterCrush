/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { AnimatedSprite, AnimatedSpriteOptions, Texture } from 'pixi.js';
import { ISymbolVisual } from '../../interfaces';
import { getApp } from '../../../initApp';

export class AnimatedSpriteVisual implements ISymbolVisual {
  public displayObject: AnimatedSprite;
  private processedAnims: { [key: string]: Texture[] | ((instance: any) => Promise<void>) };

  constructor(
    options: AnimatedSpriteOptions,
    anims: {
      [key: string]: string[] | Texture[] | Texture | string | ((instance: any) => Promise<void>);
    },
  ) {
    this.processedAnims = {};
    let firstAnimTextures: Texture[] = [Texture.EMPTY];
    let isFirstAnim = true;

    for (const animKey in anims) {
      const animValue = anims[animKey];
      let texturesToSet: Texture[] = [Texture.EMPTY];

      if (typeof animValue === 'string') {
        texturesToSet = [Texture.from(animValue)];
      } else if (animValue instanceof Texture) {
        texturesToSet = [animValue];
      } else if (Array.isArray(animValue) && animValue.length > 0) {
        if (typeof animValue[0] === 'string') {
          texturesToSet = (animValue as string[]).map(textureKey => Texture.from(textureKey));
        } else if (animValue[0] instanceof Texture) {
          texturesToSet = animValue as Texture[];
        }
      }
      // Store the processed textures for this animation
      this.processedAnims[animKey] = texturesToSet;

      // Keep track of the first valid animation for initial display
      if (
        isFirstAnim &&
        texturesToSet.length > 0 &&
        !(texturesToSet.length === 1 && texturesToSet[0] === Texture.EMPTY)
      ) {
        firstAnimTextures = texturesToSet;
        isFirstAnim = false;
      }
    }

    // Create the animated sprite with the first animation's textures
    this.displayObject = new AnimatedSprite(firstAnimTextures);
    // Apply properties from the options to the display object
    getApp().make.applyProperties(this.displayObject, options, undefined, {
      textures: true,
    });
  }

  setPos(x: number, y: number): void {
    this.displayObject.x = x;
    this.displayObject.y = y;
  }
  setVisible(visible: boolean): void {
    this.displayObject.visible = visible;
  }
  playAnim(animName: string, loop: boolean, animSpeed?: number, onComplete?: () => void): void {
    const animValue = this.processedAnims[animName];
    if (animValue && Array.isArray(animValue) && animValue.length > 0) {
      this.displayObject.textures = animValue;
      this.displayObject.loop = loop;
      this.displayObject.onComplete = onComplete || undefined;
      this.displayObject.gotoAndPlay(0);
      if (animSpeed !== undefined) {
        this.displayObject.animationSpeed = animSpeed;
      }
    } else if (typeof animValue === 'function') {
      console.warn(`Animation "${animName}" not found or empty for AnimatedSpriteVisual.`);
      animValue(this.displayObject).then(() => {
        if (onComplete) onComplete();
      });
    }
  }
  stopAnim(): void {
    this.displayObject.stop(); // First stop the animation
    if (this.displayObject.onComplete) {
      this.displayObject.onComplete(); // Then call the callback
    }
    this.displayObject.onComplete = undefined; // Finally clear the callback
  }
  destroy(): void {
    this.displayObject.destroy();
  }
}
