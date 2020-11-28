import * as Phaser from 'phaser';
import { Session } from '../session/Session';
import { assetKeys, scenes } from '../utils/constants';

export default class Preloader extends Phaser.Scene {
  private readonly session: Session;

  constructor() {
    super(scenes.preloader);
    this.session = new Session();
  }

  preload() {
    // map
    this.load.image(assetKeys.map.tiles.stars, 'assets/map/stars_tileset_extruded.png');
    this.load.tilemapTiledJSON(assetKeys.map.space, 'assets/map/space.json');

    // planets
    this.load.image(assetKeys.planets.earth, 'assets/map/planets/earth.png');
    this.load.image(assetKeys.planets.gas, 'assets/map/planets/gas.png');
    this.load.image(assetKeys.planets.red, 'assets/map/planets/red.png');
    this.load.image(assetKeys.planets.white, 'assets/map/planets/white.png');
    this.load.image(assetKeys.planets.yellow, 'assets/map/planets/yellow.png');

    // space ship
    this.load.image(assetKeys.ship.yellow, 'assets/spaceship/yellow.png');
    this.load.json(assetKeys.ship.shape, 'assets/spaceship/spaceship.json');
    this.load.image(assetKeys.ship.fire, 'assets/particles/fire.png');
    this.load.image(assetKeys.ship.laserShot, 'assets/spaceship/laser-shot.png');

    // menu
    this.load.image(assetKeys.menu.start, 'assets/mainMenu/start.jpeg');
    this.load.image(assetKeys.menu.controls, 'assets/mainMenu/controls.png');
    this.load.image(assetKeys.menu.createUniverse, 'assets/mainMenu/createButton.png');
    this.load.image(assetKeys.menu.joinUniverse, 'assets/mainMenu/joinButton.png');
    this.load.image(assetKeys.menu.play, 'assets/mainMenu/playButton.png');

    // HUD
    this.load.image(assetKeys.hud.laser, 'assets/spaceship/laser.png');
    this.load.image(assetKeys.hud.icon, 'assets/icon.png');
    this.load.image(assetKeys.hud.roomCode, 'assets/mainMenu/roomCode.png');
  }

  create() {
    this.scene.start(scenes.mainMenu, { session: this.session });
  }
}
