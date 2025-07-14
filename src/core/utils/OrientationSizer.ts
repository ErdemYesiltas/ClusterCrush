import { Application } from 'pixi.js';

function calculateSize(
  availWidth: number,
  availHeight: number,
  gameWidth: number,
  gameHeight: number,
  minWidth: number,
  minHeight: number,
) {
  let width = 0,
    height = 0,
    x = 0,
    y = 0;
  if (gameHeight / gameWidth > availHeight / availWidth) {
    if (minHeight / gameWidth > availHeight / availWidth) {
      height = (availHeight * gameHeight) / minHeight;
      width = (height * gameWidth) / gameHeight;
    } else {
      width = availWidth;
      height = (width * gameHeight) / gameWidth;
    }
  } else {
    if (gameHeight / minWidth > availHeight / availWidth) {
      height = availHeight;
      width = (height * gameWidth) / gameHeight;
    } else {
      width = (availWidth * gameWidth) / minWidth;
      height = (width * gameHeight) / gameWidth;
    }
  }

  x = Math.round((availWidth - width) / 2);
  y = Math.round((availHeight - height) / 2);
  const scale = Math.min(width / height, height / width);
  width = Math.round(width);
  height = Math.round(height);

  console.log(`Resize: ${width}x${height} at position (${x}, ${y}) with scale ${scale}`);
  return { x, y, scale, width, height };
}

export type ResizeOptions = {
  forceOrientation?: 'landscape' | 'portrait' | 'auto';
  landscape?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
  };
  portrait?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
  };
  delay?: number;
};

export function OrientationSizer(app: Application) {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  const orientation =
    app.options?.resizeOpts?.forceOrientation && app.options?.resizeOpts?.forceOrientation !== 'auto'
      ? app.options?.resizeOpts?.forceOrientation
      : canvasWidth >= canvasHeight
        ? 'landscape'
        : 'portrait';

  const opts =
    app.options?.resizeOpts && app.options?.resizeOpts[orientation] ? app.options?.resizeOpts[orientation] : {};

  const { x, y, width, height } = calculateSize(
    globalThis.innerWidth, //canvasWidth,
    globalThis.innerHeight, //canvasHeight,
    opts.width || app.renderer.width,
    opts.height || app.renderer.height,
    opts.minWidth || app.renderer.width,
    opts.minHeight || app.renderer.height,
  );

  const element = app.renderer.canvas;
  if (element) {
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.margin = `${y}px ${x}px`;
  }

  window.scrollTo(0, 0);

  app.renderer.resize(opts.width || app.renderer.width, opts.height || app.renderer.height);
}
