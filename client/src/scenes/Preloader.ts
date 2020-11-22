import * as Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('preloader');
  }

  preload() {
    // map
    this.load.image('spacetiles', 'assets/map/space-tileset-extruded.png');
    this.load.tilemapTiledJSON('space', 'assets/map/space.json');

    this.load.image('sky', 'assets/sky.png');
    this.load.image('spaceship', 'assets/spaceship.png');
    this.load.json('spaceship-shape', 'assets/spaceship.json');

    this.load.image('start-button', 'assets/mainMenu/start.jpeg');
    this.load.image('restart-button', 'assets/mainMenu/restart.jpeg');
  }

  create() {
    this.scene.start('mainMenu');
  }
}
