import { ApplicationOptions, isMobile } from 'pixi.js';
import type { ResizeOptions } from '../../plugins/resize/ResizePlugin';
import manifestBundle from './manifest.json';

export function getOptions(): Partial<ApplicationOptions> {
  const gameOptions: Partial<ApplicationOptions> = {
    width: 1280,
    height: 720,
    parentId: 'game-container',
    manifest: manifestBundle,
    debug: true,
    antialias: true,
    resolution: 1,
    sharedTicker: true,
  };
  // desktop options
  const resizeOptions: ResizeOptions = {
    forceOrientation: 'landscape',
    landscape: {},
    portrait: {},
    delay: 250,
  };
  // mobile options
  if (isMobile.any) {
    resizeOptions.forceOrientation = 'auto';
    resizeOptions.landscape = {
      minWidth: 800,
      minHeight: 600,
    };
    resizeOptions.portrait = {
      minWidth: 600,
      minHeight: 800,
    };
  }
  gameOptions.resizeOpts = resizeOptions;
  return gameOptions;
}
