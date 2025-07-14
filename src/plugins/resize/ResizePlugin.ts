import { Application, ApplicationOptions, ExtensionMetadata, ExtensionType } from 'pixi.js';

import { resize } from './resize';

// Custom utility type:
export type DeepRequired<T> = Required<{
  [K in keyof T]: DeepRequired<T[K]>;
}>;

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

export class CustomResizePlugin {
  /** @ignore */
  public static extension: ExtensionMetadata = ExtensionType.Application;

  private static _resizeId: NodeJS.Timeout | null;
  private static _resizeTo: Window | HTMLElement | null;
  private static _cancelResize: (() => void) | null;

  /**
   * Initialize the plugin with scope of application instance
   * @param {object} [options] - See application options
   */
  public static init(options: ApplicationOptions): void {
    const app = this as unknown as Application;

    Object.defineProperty(
      app,
      'resizeTo',
      /**
       * The HTML element or window to automatically resize the
       * renderer's view element to match width and height.
       */
      {
        configurable: true,
        set(dom: Window | HTMLElement) {
          globalThis.removeEventListener('resize', app.queueResize);
          this._resizeTo = dom;
          if (dom) {
            globalThis.addEventListener('resize', app.queueResize);
            app.resize();
          }
        },
        get() {
          return this._resizeTo;
        },
      },
    );

    app.queueResize = (): void => {
      if (!this._resizeTo) {
        return;
      }
      this._cancelResize!();

      // Throttle resize events per raf
      this._resizeId = setTimeout(() => app.resize!(), app.options?.resizeOpts?.delay || 100);
    };

    /**
     * Execute an immediate resize on the renderer, this is not
     * throttled and can be expensive to call many times in a row.
     * Will resize only if `resizeTo` property is set.
     */
    app.resize = (): void => {
      if (!this._resizeTo) {
        return;
      }

      // clear queue resize
      this._cancelResize!();

      let canvasWidth: number;
      let canvasHeight: number;

      // Resize to the window
      if (this._resizeTo === globalThis.window) {
        canvasWidth = globalThis.innerWidth;
        canvasHeight = globalThis.innerHeight;
      }
      // Resize to other HTML entities
      else {
        const { clientWidth, clientHeight } = this._resizeTo as HTMLElement;

        canvasWidth = clientWidth;
        canvasHeight = clientHeight;
      }

      const orientation =
        app.options?.resizeOpts?.forceOrientation && app.options?.resizeOpts?.forceOrientation !== 'auto'
          ? app.options?.resizeOpts?.forceOrientation
          : canvasWidth >= canvasHeight
            ? 'landscape'
            : 'portrait';

      const opts =
        app.options?.resizeOpts && app.options?.resizeOpts[orientation] ? app.options?.resizeOpts[orientation] : {};

      const { x, y, width, height } = resize(
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
    };

    this._cancelResize = (): void => {
      if (this._resizeId) {
        clearTimeout(this._resizeId);
        this._resizeId = null;
      }
    };

    this._resizeId = null;
    this._resizeTo = null;
    if (app.options) {
      app.options.resizeOpts = {
        forceOrientation: 'auto',
        landscape: {
          width: app.renderer.width ?? 0,
          height: app.renderer.height ?? 0,
          minWidth: app.renderer.width ?? 0,
          minHeight: app.renderer.height ?? 0,
        },
        portrait: {
          width: app.renderer.height ?? 0,
          height: app.renderer.width ?? 0,
          minWidth: app.renderer.height ?? 0,
          minHeight: app.renderer.width ?? 0,
        },
        delay: 100,
        ...options.resizeOpts,
      };
    }
    app.resizeTo = options.resizeTo || (null as unknown as Window | HTMLElement);
  }

  /**
   * Clean up the ticker, scoped to application
   */
  public static destroy(): void {
    const app = this as unknown as Application;

    globalThis.removeEventListener('resize', app.queueResize);
    this._cancelResize!();
    this._cancelResize = null;
    app.queueResize = null as unknown as () => void;
    app.resizeTo = null as unknown as Window | HTMLElement;
    app.resize = null as unknown as () => void;
  }
}
