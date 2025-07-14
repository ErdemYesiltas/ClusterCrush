import { Container, FederatedPointerEvent } from 'pixi.js';
import { SymbolEvent } from '../events';
import { ISymbolVisual, SymbolOptions } from '../interfaces';

export class CascadeSymbol extends Container {
  public id: string;
  public visual: ISymbolVisual;

  public symName?: string;
  public description?: string;

  private _options: SymbolOptions;
  public isAnimating: boolean = false;

  constructor(id: string, visual: ISymbolVisual, options: SymbolOptions) {
    super();
    this.id = id;
    this.visual = visual;
    this._options = options;

    // Initialize properties from options
    this.symName = options.symName || id;
    this.description = options.description;

    this.addChild(this.visual.displayObject);
    if (this.visual.cover) {
      this.addChild(this.visual.cover);
    }

    // Add interaction handling if enabled
    if (this._options?.interactive) {
      this.on('pointertap', this.handlePointerTap, this);
    }
    this.playAnim('idle'); // Play the idle animation by default
  }

  private handlePointerTap(event: FederatedPointerEvent): void {
    this.emit(SymbolEvent.CLICK, this, event);
  }

  setPos(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  playAnim(animName: string, loop: boolean = false, animSpeed: number = 1, onComplete?: () => void): void {
    this.isAnimating = true;
    this.emit(SymbolEvent.ANIMATION_START, this, animName, loop);
    this.visual.playAnim(animName, loop, animSpeed, () => {
      this.isAnimating = false;
      this.emit(SymbolEvent.ANIMATION_COMPLETE, this, animName);
      // If not looping and not the idle animation, return to idle
      if (!loop && animName !== 'idle') {
        // Use different animation speeds based on symbol type
        this.playAnim('idle', false);
      }
      if (onComplete) onComplete();
    });
  }

  stopAnim(): void {
    this.visual.stopAnim();
    this.isAnimating = false;
  }

  destroy(): void {
    if (this._options?.interactive) {
      this.off('pointertap', this.handlePointerTap, this);
    }
    this.emit(SymbolEvent.DESTROY, this);
    this.visual.destroy();
    super.destroy({ children: true });
  }

  public reset(): void {
    this.stopAnim();
    this.setVisible(false); // Make invisible when returning to the pool
    this.isAnimating = false;
    this.alpha = 1;
    this.scale.set(1);
    this.playAnim('idle', false, 1, undefined); // Return to idle animation when reset
  }
}
