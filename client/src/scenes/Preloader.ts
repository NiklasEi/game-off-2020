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
    this.load.image(assetKeys.map.tiles.asteroids, 'assets/map/asteroids_tileset_extruded.png');
    this.load.tilemapTiledJSON(assetKeys.map.space, 'assets/map/space.json');

    // planets
    this.load.image(assetKeys.planets.earth, 'assets/map/planets/earth.png');
    this.load.image(assetKeys.planets.gas, 'assets/map/planets/gas.png');
    this.load.image(assetKeys.planets.red, 'assets/map/planets/red.png');
    this.load.image(assetKeys.planets.white, 'assets/map/planets/white.png');
    this.load.image(assetKeys.planets.yellow, 'assets/map/planets/yellow.png');
    this.load.image(assetKeys.planets.evil, 'assets/map/planets/evil.png');

    // space ship
    this.load.image(assetKeys.ship.blue, 'assets/spaceship/blue.png');
    this.load.image(assetKeys.ship.gray, 'assets/spaceship/gray.png');
    this.load.image(assetKeys.ship.green, 'assets/spaceship/green.png');
    this.load.image(assetKeys.ship.lightblue, 'assets/spaceship/lightblue.png');
    this.load.image(assetKeys.ship.orange, 'assets/spaceship/orange.png');
    this.load.image(assetKeys.ship.pink, 'assets/spaceship/pink.png');
    this.load.image(assetKeys.ship.purple, 'assets/spaceship/purple.png');
    this.load.image(assetKeys.ship.red, 'assets/spaceship/red.png');
    this.load.image(assetKeys.ship.turquoise, 'assets/spaceship/turquoise.png');
    this.load.image(assetKeys.ship.yellow, 'assets/spaceship/yellow.png');

    this.load.json(assetKeys.ship.shape, 'assets/spaceship/spaceship.json');
    this.load.image(assetKeys.ship.fire, 'assets/particles/fire.png');
    this.load.image(assetKeys.ship.laserShot, 'assets/spaceship/laser-shot.png');
    this.load.image(assetKeys.enemyRocket, 'assets/particles/missle.png');
    this.load.image(assetKeys.enemyRocketParticles, 'assets/particles/fire.png');

    // asteroids
    this.load.image(assetKeys.asteroid.one, 'assets/particles/astroid1.png');
    this.load.image(assetKeys.asteroid.two, 'assets/particles/astroid2.png');
    this.load.image(assetKeys.asteroid.three, 'assets/particles/astroid3.png');
    this.load.image(assetKeys.asteroid.four, 'assets/particles/astroid4.png');
    this.load.image(assetKeys.asteroid.five, 'assets/particles/astroid5.png');
    this.load.image(assetKeys.asteroid.six, 'assets/particles/astroid6.png');

    // menu
    this.load.image(assetKeys.menu.start, 'assets/mainMenu/playSinglePlayerButton.png');
    this.load.image(assetKeys.menu.controls, 'assets/mainMenu/controls.png');
    this.load.image(assetKeys.menu.createUniverse, 'assets/mainMenu/createButton.png');
    this.load.image(assetKeys.menu.joinUniverse, 'assets/mainMenu/joinButton.png');
    this.load.image(assetKeys.menu.play, 'assets/mainMenu/playButton.png');
    this.load.image(assetKeys.menu.background, 'assets/map/stars_tileset.png');

    // HUD
    this.load.image(assetKeys.hud.laser, 'assets/hud/laser.png');
    this.load.image(assetKeys.hud.icon, 'assets/icon.png');
    this.load.image(assetKeys.hud.roomCode, 'assets/mainMenu/roomCode.png');
    this.load.image(assetKeys.hud.redBar, 'assets/hud/redBar.png');
    this.load.image(assetKeys.hud.grayBar, 'assets/hud/grayBar.png');
    this.load.image(assetKeys.hud.missileWarning, 'assets/hud/warning.png');

    // icons
    this.load.image(assetKeys.icons.blue, 'assets/icons/blue.png');
    this.load.image(assetKeys.icons.gray, 'assets/icons/pink.png');
    this.load.image(assetKeys.icons.green, 'assets/icons/green.png');
    this.load.image(assetKeys.icons.lightblue, 'assets/icons/lightblue.png');
    this.load.image(assetKeys.icons.orange, 'assets/icons/orange.png');
    this.load.image(assetKeys.icons.pink, 'assets/icons/pink.png');
    this.load.image(assetKeys.icons.purple, 'assets/icons/purple.png');
    this.load.image(assetKeys.icons.red, 'assets/icons/red.png');
    this.load.image(assetKeys.icons.turquoise, 'assets/icons/turquoise.png');
    this.load.image(assetKeys.icons.yellow, 'assets/icons/yellow.png');
  }

  create() {
    this.scene.start(scenes.mainMenu, { session: this.session });
  }
}
