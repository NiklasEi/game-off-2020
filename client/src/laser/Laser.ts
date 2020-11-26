import * as Phaser from 'phaser';
import Vector2 = Phaser.Math.Vector2;
import { sceneEvents } from '../events/EventCenter';

enum LaserToShoot {
  LEFT,
  RIGHT,
  NONE
}

class LaserGroup extends Phaser.Physics.Arcade.Group {
  private readonly shootingCoolDown = 500;
  private readonly laserCoolDown = 10000;
  private leftLastFire = Date.now().valueOf();
  private rightLastFire = Date.now().valueOf();
  private readonly leftLaser = new Vector2(60, -27);
  private readonly rightLaser = new Vector2(60, 26);

  constructor(scene: Phaser.Scene) {
    // Call the super constructor, passing in a world and a scene
    super(scene.physics.world, scene);

    // Initialize the group
    this.createMultiple({
      classType: Laser, // This is the class we create just below
      active: false,
      visible: false,
      key: 'laser'
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
    if (timestamp - this.leftLastFire > this.laserCoolDown) {
      this.leftLastFire = timestamp;
      laserToShoot = LaserToShoot.LEFT;
      sceneEvents.emit('laser-fire-left', timestamp + this.laserCoolDown);
    } else if (timestamp - this.rightLastFire > this.laserCoolDown) {
      this.rightLastFire = timestamp;
      laserToShoot = LaserToShoot.RIGHT;
      sceneEvents.emit('laser-fire-right', timestamp + this.laserCoolDown);
    }
    if (laserToShoot === LaserToShoot.NONE) {
      return;
    }
    const rotation = velocity.angle();
    const laserPosition =
      laserToShoot === LaserToShoot.RIGHT
        ? this.rightLaser.clone().rotate(rotation)
        : this.leftLaser.clone().rotate(rotation);
    // Get the first available sprite in the group
    const laser = this.getFirstDead(true);
    if (laser) {
      laser.fire(x + laserPosition.x, y + laserPosition.y, velocity);
    }
  }
}

class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'laser');
  }

  fire(x: number, y: number, velocity: Vector2) {
    this.body.reset(x, y);

    this.setActive(true);
    this.setVisible(true);
    this.setRotation(velocity.angle() + Math.PI / 2);

    this.setVelocity(velocity.x, velocity.y);
  }
}

export default LaserGroup;
