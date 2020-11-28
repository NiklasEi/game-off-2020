import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;
import { sceneEvents } from '../events/EventCenter';
import { GameScene } from '../scenes/GameScene';
import { bodyLabels, events } from '../utils/constants';

enum LaserToShoot {
  LEFT,
  RIGHT,
  NONE
}

class LaserGroup {
  public static readonly LASER_COOL_DOWN = 1000;
  private readonly shootingCoolDown = 500;
  private leftLastFire = Date.now().valueOf();
  private rightLastFire = Date.now().valueOf();
  private readonly leftLaser = new Vector2(80, -27);
  private readonly rightLaser = new Vector2(80, 26);
  private readonly gameScene: GameScene;

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
    sceneEvents.once(events.startGame, () => {
      const timestamp = Date.now().valueOf();
      this.leftLastFire = Date.now().valueOf();
      this.rightLastFire = Date.now().valueOf();
      sceneEvents.emit(events.laserFireLeft, timestamp + LaserGroup.LASER_COOL_DOWN);
      sceneEvents.emit(events.laserFireRight, timestamp + LaserGroup.LASER_COOL_DOWN);
    });
  }

  fireLaser(x: number, y: number, velocity: Vector2) {
    const timestamp = Date.now().valueOf();
    let laserToShoot = LaserToShoot.NONE;
    if (
      timestamp - this.rightLastFire < this.shootingCoolDown ||
      timestamp - this.leftLastFire < this.shootingCoolDown
    ) {
      return;
    }
    if (timestamp - this.leftLastFire > LaserGroup.LASER_COOL_DOWN) {
      this.leftLastFire = timestamp;
      laserToShoot = LaserToShoot.LEFT;
      sceneEvents.emit(events.laserFireLeft, timestamp + LaserGroup.LASER_COOL_DOWN);
      if (timestamp - this.rightLastFire > LaserGroup.LASER_COOL_DOWN) {
        sceneEvents.emit(events.laserFireRight, timestamp + this.shootingCoolDown);
      }
    } else if (timestamp - this.rightLastFire > LaserGroup.LASER_COOL_DOWN) {
      this.rightLastFire = timestamp;
      laserToShoot = LaserToShoot.RIGHT;
      sceneEvents.emit(events.laserFireRight, timestamp + LaserGroup.LASER_COOL_DOWN);
    }
    if (laserToShoot === LaserToShoot.NONE) {
      return;
    }
    const rotation = velocity.angle();
    const laserPosition =
      laserToShoot === LaserToShoot.RIGHT
        ? this.rightLaser.clone().rotate(rotation)
        : this.leftLaser.clone().rotate(rotation);

    const laser = this.gameScene.matter.add.image(x + laserPosition.x, y + laserPosition.y, 'laser-shot', undefined, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: bodyLabels.ownLaserShot
    });
    laser.setRotation(velocity.angle() + Math.PI / 2);
    laser.setVelocity(velocity.x, velocity.y);
  }
}

export default LaserGroup;
