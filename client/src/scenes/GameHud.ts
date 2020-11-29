import * as Phaser from 'phaser';

import { sceneEvents } from '../events/EventCenter';
import LaserGroup from '../laser/Laser';
import { GameMode } from '../session/GameMode';
import { Session } from '../session/Session';
import { assetKeys, events, scenes } from '../utils/constants';

export default class GameHud extends Phaser.Scene {
  private ping!: Phaser.GameObjects.Text;
  private fps!: Phaser.GameObjects.Text;
  private waitingForRoomLeader?: Phaser.GameObjects.Text;
  private pressHereToStartTheGame?: Phaser.GameObjects.Text;
  private inviteOthers?: Phaser.GameObjects.Text;
  private startTheGameButton?: Phaser.GameObjects.Image;
  private coolDownLeft?: number;
  private coolDownRight?: number;
  private leftLaserCharging!: Phaser.GameObjects.Image;
  private rightLaserCharging!: Phaser.GameObjects.Image;
  private readonly frames: number[] = [];
  private gameMode?: GameMode;
  private session?: Session;
  private code?: string;
  private readonly healthBarScale: number = 2;
  private greyHealthBar!: Phaser.GameObjects.Image;
  private redHealthBar!: Phaser.GameObjects.Image;
  private gameStarted: boolean = false;
  private dead: boolean = false;
  private deadSince: number = 0;
  private deadUntil: number = 0;

  constructor() {
    super(scenes.gameHud);
  }

  init(data: any) {
    this.gameMode = data.gameMode;
    this.session = data.session;
    this.code = data.code;
  }

  public updatePing(pingInMilliseconds: number) {
    this.ping.setText(`${pingInMilliseconds}ms`);
  }

  public updateHealth(maxHealth: number, currentHealth: number) {
    if (currentHealth <= 0) {
      this.redHealthBar.scaleX = 0;
      return;
    }
    const scale = (currentHealth / maxHealth) * this.healthBarScale;
    this.redHealthBar.x = this.redHealthBar.x - 100 * (1 - currentHealth / maxHealth);
    this.redHealthBar.scaleX = scale;
  }

  private playerDied(deadSince: number, deadUntil: number) {
    console.log(`dead: ${deadSince} -> ${deadUntil}`);
    this.deadSince = deadSince;
    this.deadUntil = deadUntil;
    this.dead = true;
    this.redHealthBar.scaleX = 0;
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
      this.inviteOthers = this.add.text(400, 170, `Invite others with the code ${this.code}`);
      this.pressHereToStartTheGame = this.add.text(400, 200, 'Click on the blue spaceship below to start the game');
      this.startTheGameButton = this.add.image(600, 300, assetKeys.hud.icon);
      this.startTheGameButton.setInteractive();
      this.startTheGameButton.on('pointerdown', () => {
        sceneEvents.emit(events.startGame);
      });
    } else {
      this.waitingForRoomLeader = this.add.text(430, 200, 'Wait for the room leader to start the game');
    }
  }

  private startGame() {
    this.pressHereToStartTheGame?.destroy();
    this.startTheGameButton?.destroy();
    this.waitingForRoomLeader?.destroy();
    this.inviteOthers?.destroy();
  }

  update() {
    const timestamp = Date.now().valueOf();
    if (this.coolDownRight !== undefined || this.coolDownLeft !== undefined) {
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

    if (this.dead) {
      if (timestamp >= this.deadUntil) {
        sceneEvents.emit(events.playerRespawn);
        this.dead = false;
      } else {
        const diff = this.deadUntil - timestamp;
        const totalDiff = this.deadUntil - this.deadSince;

        this.redHealthBar.scaleX = 2 * (1 - diff / totalDiff);
        // this.redHealthBar.x = this.redHealthBar.x - 100 * (1 - diff/totalDiff);
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

    this.greyHealthBar = this.add.image(this.game.renderer.width / 2, 40, assetKeys.hud.grayBar);
    this.greyHealthBar.scaleX = this.healthBarScale;
    this.greyHealthBar.scaleY = 0.5;
    this.redHealthBar = this.add.image(this.game.renderer.width / 2, 40, assetKeys.hud.redBar);
    this.redHealthBar.scaleX = this.healthBarScale;
    this.redHealthBar.scaleY = 0.5;
    sceneEvents.on(events.updateHealth, this.updateHealth, this);
    sceneEvents.on(events.playerDied, this.playerDied, this);

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

    this.leftLaserCharging = this.add.image(
      this.game.renderer.width / 2 - 20,
      this.game.renderer.height - 40,
      assetKeys.hud.laser
    );
    this.leftLaserCharging.setAngle(-90);
    this.rightLaserCharging = this.add.image(
      this.game.renderer.width / 2 + 20,
      this.game.renderer.height - 40,
      assetKeys.hud.laser
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
