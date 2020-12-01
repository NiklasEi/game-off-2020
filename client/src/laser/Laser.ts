import * as Phaser from 'phaser';
import { sceneEvents } from '../events/EventCenter';
import { GameScene } from '../scenes/GameScene';
import { assetKeys, bodyLabels, events } from '../utils/constants';
import { GameMode } from '../session/GameMode';
import Vector2 = Phaser.Math.Vector2;
import { NamedEntity } from '../networking/MultiplayerEvent';

enum LaserToShoot {
  LEFT,
  RIGHT,
  NONE
}

class LaserGroup {
  public static readonly LASER_COOL_DOWN = 8000;
  private readonly shootingCoolDown = 80;
  private leftLastFire = Date.now().valueOf();
  private rightLastFire = Date.now().valueOf();
  private readonly leftLaser = new Vector2(80, -27);
  private readonly rightLaser = new Vector2(80, 26);
  private readonly gameScene: GameScene;
  private readonly ownLaserShots: Phaser.Physics.Matter.Image[] = [];
  private toRemove: string[] = [];
  private toAdd: Phaser.Physics.Matter.Image[] = [];

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
    sceneEvents.on(
      events.removeOwnLaserShot,
      (name: string) => {
        this.toRemove.push(name);
      },
      this
    );
    sceneEvents.once(events.startGame, () => {
      const timestamp = Date.now().valueOf();
      this.leftLastFire = Date.now().valueOf();
      this.rightLastFire = Date.now().valueOf();
      sceneEvents.emit(events.laserFireLeft, timestamp + LaserGroup.LASER_COOL_DOWN);
      sceneEvents.emit(events.laserFireRight, timestamp + LaserGroup.LASER_COOL_DOWN);
    });
  }

  public getLaserShotsUpdate(): {
    remove?: string[];
    add?: NamedEntity[];
  } {
    const toAdd =
      this.toAdd.length > 0
        ? this.toAdd.map((image) => ({
            position: {
              x: image.body.position.x,
              y: image.body.position.y
            },
            velocity: {
              x: image.body.velocity.x,
              y: image.body.velocity.y
            },
            rotation: image.rotation,
            angularVelocity: 0,
            name: image.name
          }))
        : undefined;
    this.toAdd = [];
    const toRemove = this.toRemove.length > 0 ? [...this.toRemove] : undefined;
    this.toRemove = [];
    return {
      remove: toRemove,
      add: toAdd
    };
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
      if (timestamp - this.rightLastFire < this.shootingCoolDown) {
        sceneEvents.emit(events.laserFireRight, timestamp + this.shootingCoolDown);
      }
    } else if (timestamp - this.rightLastFire > LaserGroup.LASER_COOL_DOWN) {
      this.rightLastFire = timestamp;
      laserToShoot = LaserToShoot.RIGHT;
      sceneEvents.emit(events.laserFireRight, timestamp + LaserGroup.LASER_COOL_DOWN);
      if (timestamp - this.leftLastFire < this.shootingCoolDown) {
        sceneEvents.emit(events.laserFireLeft, timestamp + this.shootingCoolDown);
      }
    }
    if (laserToShoot === LaserToShoot.NONE) {
      return;
    }
    const rotation = velocity.angle();
    const laserPosition =
      laserToShoot === LaserToShoot.RIGHT
        ? this.rightLaser.clone().rotate(rotation)
        : this.leftLaser.clone().rotate(rotation);

    const laser = this.gameScene.matter.add.image(
      x + laserPosition.x,
      y + laserPosition.y,
      assetKeys.ship.laserShot,
      undefined,
      {
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
        label: bodyLabels.ownLaserShot
      }
    );
    laser.setRotation(velocity.angle());
    laser.setVelocity(velocity.x, velocity.y);
    if (this.gameScene.gameMode === GameMode.MULTI_PLAYER) {
      laser.name = `${timestamp}`;
      this.ownLaserShots.push(laser);
      this.toAdd.push(laser);
    }
  }
}

export default LaserGroup;
