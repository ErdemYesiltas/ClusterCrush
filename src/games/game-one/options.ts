import { ApplicationOptions, isMobile } from 'pixi.js';
import manifestBundle from './manifest.json';
import { ResizeOptions } from '../../core/utils/OrientationSizer';

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
    resizeTo: window, // Add this to enable resize plugin
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
      width: 1280,
      height: 720,
      minWidth: 1280,
      minHeight: 720,
    };
    resizeOptions.portrait = {
      width: 720,
      height: 1280,
      minWidth: 720,
      minHeight: 1280,
    };
  }
  gameOptions.resizeOpts = resizeOptions;
  return gameOptions;
}
