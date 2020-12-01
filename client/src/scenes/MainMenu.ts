import * as Phaser from 'phaser';
import { GameMode } from '../session/GameMode';
import { Session } from '../session/Session';
import { sceneEvents } from '../events/EventCenter';
import { JoinGameAnswerPayload } from '../networking/MultiplayerEvent';
import { assetKeys, events, scenes } from '../utils/constants';

export default class MainMenu extends Phaser.Scene {
  private singlePlayButton!: Phaser.GameObjects.Image;
  private joinMultiPlayButton!: Phaser.GameObjects.Image;
  private createButton!: Phaser.GameObjects.Image;
  private session?: Session;

  constructor() {
    super(scenes.mainMenu);
  }

  init(data: any) {
    this.session = data.session;
  }

  create() {
    const background = this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, assetKeys.menu.background);
    background.scale = 0.7;
    const controls = this.add.image(this.game.renderer.width / 2, 700, assetKeys.menu.controls);
    this.singlePlayButton = this.add.image(this.game.renderer.width / 2, 200, assetKeys.menu.start);
    this.singlePlayButton.setInteractive();
    this.singlePlayButton.on('pointerdown', () => {
      this.singlePlayButton.setTint(0x808080);
    });
    this.singlePlayButton.on('pointerup', () => {
      this.scene.start(scenes.gameScene, { mode: GameMode.SINGLE_PLAYER });
    });
    this.createButton = this.add.image(this.game.renderer.width / 2, 300, assetKeys.menu.createUniverse);
    this.createButton.setTint(0x808080);

    const join = this.add.image(this.game.renderer.width / 2, 400, assetKeys.menu.joinUniverse);
    this.joinMultiPlayButton = this.add.image(this.game.renderer.width / 2 + 113, 400, assetKeys.menu.play);
    this.joinMultiPlayButton.setTint(0x808080);

    const enableMultiPlayer = () => {
      this.createButton.clearTint();
      this.createButton.setInteractive();
      this.createButton.on('pointerdown', () => {
        this.createButton.setTint(0x808080);
      });
      this.createButton.on('pointerup', () => {
        this.session?.createGame();
      });

      this.joinMultiPlayButton.clearTint();
      this.joinMultiPlayButton.setInteractive();
      this.joinMultiPlayButton.on('pointerdown', () => {
        this.joinMultiPlayButton.setTint(0x808080);
      });
      this.joinMultiPlayButton.on('pointerup', () => {
        const codeInput = document.getElementById('gameCode');
        if (codeInput !== null && (codeInput as HTMLFormElement).value !== '') {
          const code = (codeInput as HTMLFormElement).value;
          this.session?.connect(code);
        } else {
          this.joinMultiPlayButton.clearTint();
          const codeCaption = document.getElementById('codeCaption');
          if (codeCaption !== null) {
            codeCaption.innerText = 'code missing';
          }
        }
      });

      sceneEvents.on(events.joinGame, ({ ok, reason, playerType, code, spawn }: JoinGameAnswerPayload) => {
        if (ok) {
          this.scene.start(scenes.gameScene, {
            mode: GameMode.MULTI_PLAYER,
            session: this.session,
            playerType,
            code,
            spawn
          });
        } else {
          this.joinMultiPlayButton.clearTint();
          const codeCaption = document.getElementById('codeCaption');
          if (codeCaption !== null && reason !== undefined) {
            codeCaption.innerText = reason;
          }
        }
      });
    };

    if (this.session?.connected) {
      enableMultiPlayer();
    } else {
      sceneEvents.once(events.serverConnected, enableMultiPlayer);
    }
  }
}
