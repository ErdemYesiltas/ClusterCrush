import { Application, Assets, Graphics } from 'pixi.js';
import { getOptions } from './options';
import { initApp } from '../../initApp';
import { GameContainer } from './GameContainer';

export function StartGame() {
  initApp(getOptions())
    .then((app: Application) => {
      const progressBar = new Graphics();
      progressBar.rect(0, 0, 0, 20);
      progressBar.fill(0x34e1eb);
      progressBar.x = (app.screen.width - 400) / 2;
      progressBar.y = app.screen.height / 2;
      app.stage.addChild(progressBar);

      Assets.loadBundle('default', progress => {
        progressBar.clear();
        progressBar.rect(0, 0, 400 * progress, 20);
        progressBar.fill(0x34e1eb);
      }).then(() => {
        app.stage.removeChild(progressBar);
        const gameContainer = new GameContainer(app, {});
        app.stage.addChild(gameContainer);
      });
    })
    .catch(error => {
      console.error('Error initializing application:', error);
    });
}
