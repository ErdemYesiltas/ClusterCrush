import { Container, ContainerOptions, Application, Sprite, Assets, Text } from 'pixi.js';
import { Board, HUD } from '../../core';
import { gsap } from 'gsap';
import { CrushGameEvent, crushGameLogic, CrushGameType } from '../../core/CrushGameState';
import { ActorRef, createActor } from 'xstate';

export class GameContainer extends Container {
  actor!: ActorRef<CrushGameType, any, CrushGameEvent>;
  constructor(
    public app: Application,
    options?: ContainerOptions,
  ) {
    super(options);
    this.label = 'GameContainer';

    // common animations
    const commonAnims = {
      idle: (visual: Sprite) => {
        return new Promise<void>(resolve => {
          gsap.fromTo(visual, { alpha: 0 }, { alpha: 1, duration: 1, onComplete: resolve });
        });
      },
      cascade: (visual: Sprite) => {
        return new Promise<void>(resolve => {
          const sound = Assets.get('remove-symbol');
          gsap.fromTo(
            visual,
            { alpha: 1 },
            {
              alpha: 0,
              duration: 0.5,
              onStart: () => {
                if (sound) {
                  sound.play();
                }
              },
              onComplete: () => {
                resolve();
              },
            },
          );
        });
      },
    };

    // create board
    const board = new Board(app, {
      x: 396,
      y: 40,
      scale: 0.65,
      rows: 5,
      columns: 5,
      cellSize: 150,
      cellTexture: 'cell',
      symbols: {
        b: {
          visualType: 'sprite',
          visualOptions: {
            texture: 'gem-blue',
            anchor: 0.5,
            x: 75,
            y: 75,
          },
          animations: commonAnims,
        },
        g: {
          visualType: 'sprite',
          visualOptions: {
            texture: 'gem-green',
            anchor: 0.5,
            scale: 0.9,
            x: 75,
            y: 75,
          },
          animations: commonAnims,
        },
        p: {
          visualType: 'sprite',
          visualOptions: {
            texture: 'gem-pink',
            anchor: 0.5,
            x: 75,
            y: 75,
          },
          animations: commonAnims,
        },
        y: {
          visualType: 'sprite',
          visualOptions: {
            texture: 'gem-yellow',
            anchor: 0.5,
            scale: { x: 1, y: 1.5 },
            x: 75,
            y: 75,
          },
          animations: commonAnims,
        },
      },
      maskOpts: {
        x: 0,
        y: 0,
        width: 750,
        height: 750,
      },
    });
    this.addChild(board);

    // create HUD
    const hud = new HUD();
    this.addChild(hud);

    // create game state machine
    const customGameLogic = crushGameLogic.provide({});
    this.actor = createActor(customGameLogic, {
      input: {
        board,
        hud,
        maxMoves: 25,
        winCheckFn: (moves: number, score: number) => {
          return moves <= 25 && score >= 500;
        },
        minWinCount: 3,
        calcScoreFn: (moves: number) => Math.pow(moves, 2) * 10,
      },
    }) as ActorRef<CrushGameType, any, CrushGameEvent>;
    this.actor.subscribe(snapshot => {
      switch (snapshot.value) {
        case 'gameOver':
          this.showGameOver();
          break;
        case 'gameWon':
          this.showGameWon();
          break;
      }
    });
    this.actor.start();

    console.log(app);
  }

  getPopup(): { header: Text; content: Text; modal: Sprite; button: Sprite } {
    const modal = this.app.make.sprite({
      texture: 'modal',
      anchor: 0.5,
      x: this.app.renderer.width / 2,
      y: this.app.renderer.height / 2,
    });

    const header = this.app.make.text({
      text: '',
      anchor: 0.5,
      y: -80,
      style: {
        fontSize: 24,
        fill: 0xffffff,
      },
    });

    modal.addChild(header);

    const content = this.app.make.text({
      text: '!',
      anchor: 0.5,
      style: {
        fontSize: 16,
        fill: 0xffffff,
      },
    });

    modal.addChild(content);

    const button = this.app.make.sprite({
      texture: 'button',
      cursor: 'pointer',
      eventMode: 'static',
      label: 'PopupButton',
      scale: 0.5,
      x: -60,
      y: 50,
    });
    modal.addChild(button);

    // button text
    const buttonText = new Text({
      text: '',
      x: 140,
      y: 35,
      style: {
        fontSize: 30,
        fill: 0xffffff,
      },
    });
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);

    return { header, content, modal, button };
  }

  showGameOver(): void {
    const { header, content, modal, button } = this.getPopup();
    header.text = 'GAME OVER';
    content.text = 'You have run out of moves. Try again!';
    (button.children[0] as Text).text = 'Restart';
    button.on('pointerup', () => {
      this.actor.send({ type: 'RESTART_CLICKED' });
      this.removeChild(modal);
    });

    gsap.fromTo(modal, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
    this.addChild(modal);
  }

  showGameWon(): void {
    const context = this.actor.getSnapshot().context;
    const { header, content, modal, button } = this.getPopup();
    header.text = 'GAME WON';
    content.text = `You have completed the game! \n YourScore: ${context.score} \n Moves Left: ${context.maxMoves - context.currentMove}`;
    (button.children[0] as Text).text = 'Play Again';
    button.on('pointerup', () => {
      this.actor.send({ type: 'RESTART_CLICKED' });
      this.removeChild(modal);
    });

    gsap.fromTo(modal, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
    this.addChild(modal);
  }
}
