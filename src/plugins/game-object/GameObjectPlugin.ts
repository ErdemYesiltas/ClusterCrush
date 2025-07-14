import { Application, ExtensionMetadata, ExtensionType } from 'pixi.js';
import { GameObjectBuilder } from './GameObjectBuilder';

export class GameObjectPlugin {
  /** @ignore */
  public static extension: ExtensionMetadata = ExtensionType.Application;

  public static init(): void {
    const app = this as unknown as Application;
    app.make = new GameObjectBuilder();
  }

  public static destroy(): void {
    const app = this as unknown as Application;
    app.make = null as unknown as Application['make'];
  }
}
