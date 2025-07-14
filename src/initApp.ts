import { Application, ApplicationOptions, Assets, extensions } from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { GameObjectPlugin } from './plugins/game-object/GameObjectPlugin';

// register the PixiPlugin with GSAP
gsap.registerPlugin(PixiPlugin);

// replace resize plugin with the one from the project
//extensions.remove(ResizePlugin);
//extensions.add(CustomResizePlugin);
extensions.add(GameObjectPlugin);

// Initialize the PixiJS application
let app: Application;

export async function initApp(options?: Partial<ApplicationOptions>): Promise<Application> {
  app = new Application();
  return new Promise<Application>((resolve, reject) => {
    try {
      app.options = options;

      if (options?.debug === true) {
        window.__PIXI_APP__ = app;
      }

      // Initialize the application
      app.init(options).then(() => {
        // Append the application canvas to the document body or specified parent
        if (options && options.parentId && document.getElementById(options.parentId)) {
          document.getElementById(options.parentId)!.appendChild(app.canvas);
        } else {
          document.body.appendChild(app.canvas);
        }
        Assets.init({ manifest: options?.manifest, basePath: 'assets' }).then(() => {
          console.log('Assets initialized successfully!');
          resolve(app);
        });
      });
    } catch (error) {
      console.error('Error initializing application:', error);
      reject(error);
    }
  });
}

export function getApp(): Application {
  if (!app) {
    throw new Error('Application has not been initialized. Call initApp() first.');
  }
  return app;
}
