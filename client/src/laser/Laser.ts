import * as Phaser from 'phaser';

class LaserGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    // Call the super constructor, passing in a world and a scene
    super(scene.physics.world, scene);

    // Initialize the group
    this.createMultiple({
      classType: Laser, // This is the class we create just below
      frameQuantity: 30, // Create 30 instances in the pool
      active: false,
      visible: false,
      key: 'laser'
    });
  }

  fireLaser(x: number, y: number) {
    // Get the first available sprite in the group
    const laser = this.getFirstDead(false);
    if (laser) {
      laser.fire(x, y);
    }
  }
}

class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'laser');
  }

  fire(x: number, y: number) {
    this.body.reset(x, y);

    this.setActive(true);
    this.setVisible(true);

    this.setVelocityY(-900);
  }
}

export default LaserGroup;
