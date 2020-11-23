import * as Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('preloader');
  }

  preload() {
    // map
    this.load.image('space-tiles', 'assets/map/space-tileset-extruded.png');
    this.load.tilemapTiledJSON('space', 'assets/map/space.json');

    // planets
    this.load.image('planet-earth', 'assets/map/planets/earth.png');
    this.load.image('planet-gas', 'assets/map/planets/gas.png');
    this.load.image('planet-red', 'assets/map/planets/red.png');
    this.load.image('planet-white', 'assets/map/planets/white.png');
    this.load.image('planet-yellow', 'assets/map/planets/yellow.png');

    // space ship
    this.load.image('spaceship', 'assets/spaceship.png');
    this.load.json('spaceship-shape', 'assets/spaceship.json');
    this.load.image('fire', 'assets/particles/fire.png');

    // menu
    this.load.image('start-button', 'assets/mainMenu/start.jpeg');
    this.load.image('restart-button', 'assets/mainMenu/restart.jpeg');
  }

  create() {
    this.scene.start('mainMenu');
  }
}
