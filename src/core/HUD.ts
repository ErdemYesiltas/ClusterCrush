import { Container, Sprite, Text } from 'pixi.js';

export class HUD extends Container {
  private _score: number = 0;
  private _remainMoves: number = 0;
  private _scoreText: Text;
  private _remainMovesText: Text;
  private _restartButton: Container;

  constructor() {
    super();

    // score text
    this._scoreText = new Text({
      text: `Score: ${this._score}`,
      x: 400,
      y: 20,
      style: {
        fontSize: 12,
        fill: 0xffffff,
      },
    });
    this.addChild(this._scoreText);

    // remain moves text
    this._remainMovesText = new Text({
      text: `Moves Left: ${this._remainMoves}`,
      x: 800,
      y: 20,
      style: {
        fontSize: 12,
        fill: 0xffffff,
      },
    });
    this.addChild(this._remainMovesText);

    // restart button
    this._restartButton = new Container({
      scale: 0.75,
      x: 640,
      y: 670,
      cursor: 'pointer',
      eventMode: 'static',
      label: 'RestartButton',
    });
    this.addChild(this._restartButton);
    this._restartButton.on('pointerup', () => {
      this.emit('restart-clicked');
    });
    // button texture
    const restartIcon = Sprite.from('button');
    restartIcon.anchor.set(0.5);
    this._restartButton.addChild(restartIcon);

    // button text
    const restartText = new Text({
      text: 'Restart',
      style: {
        fontSize: 16,
        fill: 0xffffff,
      },
    });
    restartText.anchor.set(0.5);
    this._restartButton.addChild(restartText);
  }

  updateScore(score: number): void {
    this._score = score;
    this._scoreText.text = `Score: ${this._score}`;
  }

  updateMoves(remainMoves: number): void {
    this._remainMoves = remainMoves;
    this._remainMovesText.text = `Moves Left: ${this._remainMoves}`;
  }

  activateRestartButton(value: boolean): void {
    this._restartButton.interactive = value;
    this._restartButton.alpha = value ? 1 : 0.5;
  }
}
