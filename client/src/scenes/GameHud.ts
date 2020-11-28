import * as Phaser from 'phaser';

import { sceneEvents } from '../events/EventCenter';
import LaserGroup from '../laser/Laser';
import { GameMode } from '../session/GameMode';
import { Session } from '../session/Session';
import { events } from '../utils/constants';

export default class GameHud extends Phaser.Scene {
  private ping!: Phaser.GameObjects.Text;
  private fps!: Phaser.GameObjects.Text;
  private waitingForRoomLeader!: Phaser.GameObjects.Text;
  private pressHereToStartTheGame!: Phaser.GameObjects.Text;
  private startTheGameButton!: Phaser.GameObjects.Image;
  private coolDownLeft?: number;
  private coolDownRight?: number;
  private leftLaserCharging!: Phaser.GameObjects.Image;
  private rightLaserCharging!: Phaser.GameObjects.Image;
  private readonly frames: number[] = [];
  private gameMode?: GameMode;
  private session?: Session;
  private gameStarted: boolean = false;

  constructor() {
    super({ key: 'gameHud' });
  }

  init(data: any) {
    this.gameMode = data.gameMode;
    this.session = data.session;
  }

  public updatePing(pingInMilliseconds: number) {
    this.ping.setText(`${pingInMilliseconds}ms`);
  }

  public updateFps(timestamp: number) {
    if (this.frames.push(timestamp) > 100) {
      this.frames.shift();
    }
    const first = this.frames[0];
    const last = this.frames[this.frames.length - 1];

    const diffSecs = (last - first) / 1000;
    const fps = this.frames.length / diffSecs;

    this.fps.setText(`${Math.round(fps)} fps`);
  }

  private waitInLobby(isLeader: boolean) {
    if (isLeader) {
      this.pressHereToStartTheGame = this.add.text(400, 200, 'Click on the blue spaceship below to start the game');
      this.startTheGameButton = this.add.image(600, 300, 'spaceship-icon');
      this.startTheGameButton.setInteractive();
      this.startTheGameButton.on('pointerdown', () => {
        sceneEvents.emit(events.startGame);
      });
    } else {
      this.waitingForRoomLeader = this.add.text(430, 200, 'Wait for the room leader to start the game');
    }
  }

  private startGame() {
    this.pressHereToStartTheGame.destroy();
    this.startTheGameButton.destroy();
    this.waitingForRoomLeader.destroy();
  }

  update() {
    if (this.coolDownRight === undefined && this.coolDownLeft === undefined) {
      return;
    }
    const timestamp = Date.now().valueOf();
    if (this.coolDownLeft !== undefined) {
      const diff = this.coolDownLeft - timestamp;
      if (diff < 1) {
        this.coolDownLeft = undefined;
        this.leftLaserCharging.clearTint();
        this.leftLaserCharging.setAlpha(1);
      } else {
        this.leftLaserCharging.setTint(0x808080);
        this.leftLaserCharging.setAlpha(1 - (diff / LaserGroup.LASER_COOL_DOWN) * 0.7);
      }
    }
    if (this.coolDownRight !== undefined) {
      const diff = this.coolDownRight - timestamp;
      if (diff < 1) {
        this.coolDownRight = undefined;
        this.rightLaserCharging.clearTint();
        this.rightLaserCharging.setAlpha(1);
      } else {
        this.rightLaserCharging.setTint(0x808080);
        this.rightLaserCharging.setAlpha(1 - (diff / LaserGroup.LASER_COOL_DOWN) * 0.7);
      }
    }
  }

  create() {
    if (this.gameMode === GameMode.MULTI_PLAYER) {
      const isLeader = this.session ? this.session.isRoomLeader : false;
      this.waitInLobby(isLeader);
    }
    this.ping = this.add.text(1125, 10, '');
    this.fps = this.add.text(10, 10, '');

    sceneEvents.on(events.updatePing, this.updatePing, this);
    sceneEvents.on(events.newFrameTimestamp, this.updateFps, this);

    sceneEvents.on(
      events.playerIsRoomLeader,
      () => {
        if (this.gameStarted || this.gameMode !== GameMode.MULTI_PLAYER) {
          return;
        }
        this.startGame();
        this.waitInLobby(true);
      },
      this
    );

    sceneEvents.once(
      events.startGame,
      () => {
        this.gameStarted = true;
      },
      this
    );

    this.leftLaserCharging = this.add.image(this.game.renderer.width / 2 - 20, this.game.renderer.height - 40, 'laser');
    this.leftLaserCharging.setAngle(-90);
    this.rightLaserCharging = this.add.image(
      this.game.renderer.width / 2 + 20,
      this.game.renderer.height - 40,
      'laser'
    );
    this.rightLaserCharging.setAngle(-90);
    sceneEvents.on(
      events.laserFireLeft,
      (rechargedIn: number) => {
        this.coolDownLeft = rechargedIn;
      },
      this
    );
    sceneEvents.on(
      events.laserFireRight,
      (rechargedIn: number) => {
        this.coolDownRight = rechargedIn;
      },
      this
    );

    // the lasers are on cool down when the game starts
    const timestamp = Date.now().valueOf();
    this.coolDownLeft = timestamp + LaserGroup.LASER_COOL_DOWN;
    this.coolDownRight = timestamp + LaserGroup.LASER_COOL_DOWN;

    sceneEvents.once(events.startGame, this.startGame, this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off(events.updatePing, this.updatePing, this);
      if (this.coolDownLeft) {
        clearTimeout(this.coolDownLeft);
      }
      if (this.coolDownRight) {
        clearTimeout(this.coolDownRight);
      }
    });
  }
}
