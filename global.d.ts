import { AudioLayer } from './src/plugins/audio/AudioLayer';
import { AssetsManifest } from 'pixi.js';
import { GameObjectBuilder } from './src/plugins/game-object/GameObjectBuilder';
import type { ResizeOptions } from './src/plugins/resize/ResizePlugin';
import { StorageWrapper } from './src/plugins/storage/StorageWrapper';
import { HowlerGlobal } from 'howler';

// Global type definitions for the project
declare global {
  interface Window {
    // Add any global window properties here
    __PIXI_APP__?: any;
  }
}
declare module 'pixi.js' {
  interface ContainerOptions {
    type?: string;
    children?: { [key: string]: ContainerOptions };
  }
  interface Application {
    options?: Partial<ApplicationOptions>;
    audio: {
      bgm: AudioLayer;
      sfx: AudioLayer;
      master: HowlerGlobal;
      getMasterVolume: () => number;
      setMasterVolume: (volume: number) => void;
    };
    storage: StorageWrapper;
    make: GameObjectBuilder;
  }
  interface ApplicationOptions {
    resizeOpts?: ResizeOptions;
    parentId?: string;
    /** The HTML element or window to automatically resize the application to */
    resizeTo?: Window | HTMLElement | null;
    manifest?: string | AssetsManifest;
    debug: boolean;
  }
}
