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
    this.load.image('spaceship-yellow', 'assets/spaceship/yellow.png');
    this.load.json('spaceship-shape', 'assets/spaceship/spaceship.json');
    this.load.image('fire', 'assets/particles/fire.png');
    this.load.image('laser-shot', 'assets/spaceship/laser-shot.png');

    // asteroids
    this.load.image('asteroid-1', 'assets/particles/astroid1.png')
    this.load.image('asteroid-2', 'assets/particles/astroid2.png')
    this.load.image('asteroid-3', 'assets/particles/astroid3.png')
    this.load.image('asteroid-4', 'assets/particles/astroid4.png')
    this.load.image('asteroid-5', 'assets/particles/astroid5.png')
    this.load.image('asteroid-6', 'assets/particles/astroid6.png')

    // menu
    this.load.image('start-button', 'assets/mainMenu/start.jpeg');
    this.load.image('restart-button', 'assets/mainMenu/restart.jpeg');

    // HUD
    this.load.image('laser', 'assets/spaceship/laser.png');
    this.load.image('spaceship-icon', 'assets/icon.png');
  }

  create() {
    this.scene.start('mainMenu', { session: this.session });
  }
}
