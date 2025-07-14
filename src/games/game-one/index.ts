import { Application, Assets } from 'pixi.js';
import { getOptions } from './options';
import { initApp } from '../../initApp';
import { GameContainer } from './GameContainer';

export function StartGame() {
  initApp(getOptions())
    .then((app: Application) => {
      Assets.loadBundle('default').then(() => {
        const gameContainer = new GameContainer(app, {});
        app.stage.addChild(gameContainer);
      });
    })
    .catch(error => {
      console.error('Error initializing application:', error);
    });
}
