import * as Phaser from 'phaser';
import { GameMode } from '../session/GameMode';
import { Session } from '../session/Session';
import { sceneEvents } from '../events/EventCenter';

export default class MainMenu extends Phaser.Scene {
  private singlePlayButton!: Phaser.GameObjects.Image;
  private multiPlayButton!: Phaser.GameObjects.Image;
  private session?: Session;

  constructor() {
    super('mainMenu');
  }

  init(data: any) {
    this.session = data.session;
  }

  create() {
    this.addControls((this.game.renderer.height * 2) / 3 + 64);
    this.singlePlayButton = this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 3, 'start-button');
    this.singlePlayButton.setInteractive();
    this.singlePlayButton.on('pointerdown', () => {
      this.singlePlayButton.setTint(0x808080);
    });
    this.singlePlayButton.on('pointerup', () => {
      this.scene.start('game', { mode: GameMode.SINGLE_PLAYER });
    });

    this.multiPlayButton = this.add.image(
      this.game.renderer.width / 2,
      (this.game.renderer.height * 2) / 3,
      'start-button'
    );
    this.multiPlayButton.setInteractive();
    this.multiPlayButton.on('pointerdown', () => {
      this.multiPlayButton.setTint(0x808080);
    });
    this.multiPlayButton.on('pointerup', () => {
      const codeInput = document.getElementById('gameCode');
      if (codeInput !== null) {
        const code = (codeInput as HTMLFormElement).value;
        this.session?.connect(code);

        sceneEvents.once('join-game', ({ ok, reason }: { ok: boolean; reason?: string }) => {
          if (ok) {
            this.scene.start('game', { mode: GameMode.MULTI_PLAYER, code, session: this.session });
          } else {
            this.multiPlayButton.clearTint();
            const codeCaption = document.getElementById('codeCaption');
            if (codeCaption !== null && reason !== undefined) {
              codeCaption.innerText = reason;
            }
          }
        });
      } else {
        const codeCaption = document.getElementById('codeCaption');
        if (codeCaption !== null) {
          codeCaption.innerText = 'Please supply a game code';
        }
      }
    });
  }

  private addControls(height: number) {
    this.add.text(this.game.renderer.width / 2 - 106, height + 16, 'move');
    this.add.text(this.game.renderer.width / 2 + 39, height, 'W / ⬆️');
    this.add.text(this.game.renderer.width / 2 - 16, height + 32, 'A / ⬅️    S / ️⬇    D / ➡️');
    this.add.text(this.game.renderer.width / 2 - 106, height + 80, 'shoot');
    this.add.text(this.game.renderer.width / 2 + 39, height + 80, 'space');
  }
}
