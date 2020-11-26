import * as Phaser from 'phaser';
import { Session } from '../session/Session';

export default class Preloader extends Phaser.Scene {
  private readonly session: Session;

  constructor() {
    super('preloader');
    this.session = new Session();
  }

  preload() {
    // map
    this.load.image('background-tile', 'assets/map/background.png');
    this.load.image('stars-tiles', 'assets/map/stars_tileset_extruded.png');
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
    this.load.image('laser', 'assets/laser.png');

    // menu
    this.load.image('start-button', 'assets/mainMenu/start.jpeg');
    this.load.image('restart-button', 'assets/mainMenu/restart.jpeg');
  }

  create() {
    this.scene.start('mainMenu', { session: this.session });
  }
}
