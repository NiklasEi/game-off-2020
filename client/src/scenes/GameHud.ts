import * as Phaser from 'phaser';

import { sceneEvents } from '../events/EventCenter';
import LaserGroup from '../laser/Laser';

export default class GameHud extends Phaser.Scene {
  private ping!: Phaser.GameObjects.Text;
  private fps!: Phaser.GameObjects.Text;
  private coolDownLeft?: number;
  private coolDownRight?: number;
  private leftLaserCharging!: Phaser.GameObjects.Image;
  private rightLaserCharging!: Phaser.GameObjects.Image;
  private readonly frames: number[] = [];

  constructor() {
    super({ key: 'gameHud' });
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
    this.ping = this.add.text(1125, 10, '');
    this.fps = this.add.text(10, 10, '');

    sceneEvents.on('update-ping', this.updatePing, this);
    sceneEvents.on('new-frame', this.updateFps, this);

    this.leftLaserCharging = this.add.image(this.game.renderer.width / 2 - 20, this.game.renderer.height - 40, 'laser');
    this.leftLaserCharging.setAngle(-90);
    this.rightLaserCharging = this.add.image(
      this.game.renderer.width / 2 + 20,
      this.game.renderer.height - 40,
      'laser'
    );
    this.rightLaserCharging.setAngle(-90);
    sceneEvents.on(
      'laser-fire-left',
      (rechargedIn: number) => {
        this.coolDownLeft = rechargedIn;
      },
      this
    );
    sceneEvents.on(
      'laser-fire-right',
      (rechargedIn: number) => {
        this.coolDownRight = rechargedIn;
      },
      this
    );

    // the lasers are on cool down when the game starts
    const timestamp = Date.now().valueOf();
    this.coolDownLeft = timestamp + LaserGroup.LASER_COOL_DOWN;
    this.coolDownRight = timestamp + LaserGroup.LASER_COOL_DOWN;

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('update-ping', this.updatePing, this);
      if (this.coolDownLeft) {
        clearTimeout(this.coolDownLeft);
      }
      if (this.coolDownRight) {
        clearTimeout(this.coolDownRight);
      }
    });
  }
}
