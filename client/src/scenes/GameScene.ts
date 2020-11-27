import * as Phaser from 'phaser';
import { Session } from '../session/Session';
import {
  GameStatePayload,
  PlanetType,
  PlayerJoinedGamePayload,
  PlayerLeftGamePayload,
  PlayerStateInboundPayload,
  PlayerType,
  SetMapPayload
} from '../networking/MultiplayerEvent';
import { tileSize } from '../utils/constants';
import { GameMode } from '../session/GameMode';
import LaserGroup from '../laser/Laser';
import Vector2 = Phaser.Math.Vector2;
import { sceneEvents } from '../events/EventCenter';

interface Control {
  W: any;
  A: any;
  S: any;
  D: any;
}

export class GameScene extends Phaser.Scene {
  private spaceShip!: Phaser.Physics.Matter.Image;
  private spaceShipEmitterLeft!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spaceShipEmitterRight!: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly leftEngine = new Vector2(-52, -28);
  private readonly rightEngine = new Vector2(-52, 28);
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private angularVelocity: number = 0;
  private players: Phaser.Physics.Matter.Image[] = [];
  private session?: Session;
  private keys!: Control;
  private gameMode: GameMode = GameMode.SINGLE_PLAYER;
  private playerType?: PlayerType;
  private laserGroup?: LaserGroup;

  constructor() {
    super({
      key: 'game',
      physics: {
        arcade: {
          debug: false,
          gravity: { y: 0 }
        },
        matter: {
          debug: true,
          gravity: false
        }
      }
    });
  }

  public preload() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  public disconnectSession() {
    this.session = undefined;
  }

  public init(data: any) {
    this.gameMode = data.mode;
    this.session = data.session;
    this.playerType = data.playerType;
  }

  public async create() {
    this.scene.run('gameHud');
    // prepare map
    const map = this.make.tilemap({ key: 'space' });
    const backgroundTileset = map.addTilesetImage('background', 'background-tile', tileSize, tileSize, 0, 0);
    const spaceTileset = map.addTilesetImage('stars', 'stars-tiles', tileSize, tileSize, 1, 2);
    map.createStaticLayer('background', backgroundTileset);
    map.createStaticLayer('stars', spaceTileset);
    this.keys = this.input.keyboard.addKeys('W,S,A,D') as Control;

    const particles = this.add.particles('fire');
    const emitterConfig = {
      speed: 10,
      on: false,
      lifespan: 400,
      alpha: 1000,
      maxParticles: 100,
      scale: { start: 1.0, end: 0 },
      blendMode: 'ADD'
    };
    this.spaceShipEmitterLeft = particles.createEmitter(emitterConfig);
    this.spaceShipEmitterRight = particles.createEmitter(emitterConfig);

    // The player and its settings
    const spaceShipShape = this.cache.json.get('spaceship-shape');
    const playerSpaceShipKey = this.getPlayerImageKeyFromType(this.playerType);
    this.spaceShip = this.matter.add.image(7 * tileSize, 7 * tileSize, playerSpaceShipKey, undefined, {
      vertices: spaceShipShape.spaceship,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0
    });
    this.matter.world.setBounds(5 * tileSize, 5 * tileSize, 197 * tileSize, 197 * tileSize);
    this.cameras.main.startFollow(this.spaceShip, true);
    this.cameras.main.zoom = 0.5;

    this.laserGroup = new LaserGroup(this);
    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    if (this.gameMode === GameMode.SINGLE_PLAYER) {
      console.log('Single player is not yet fully supported');
    } else {
      if (this.session === undefined) {
        console.error('No session for multi player game!');
      }
      this.session?.initializeGame(this);
    }
  }

  public update() {
    const cursors = this.cursors;
    if (cursors === undefined) return;

    const timeStamp = Date.now().valueOf();
    sceneEvents.emit('new-frame', timeStamp);

    const speedUpperThreshold = 10;
    const speedDelta = 0.1;
    const currentSpeed = this.spaceShip.body.velocity;
    const totalCurrentSpeed = Math.sqrt(currentSpeed.x ** 2 + currentSpeed.y ** 2);
    const rotation = this.spaceShip.rotation;
    const velocityDeltaVector = new Vector2(speedDelta, 0).rotate(rotation);

    const angularDelta = 0.001;
    const angularVelocityLowerThreshold = 0.01;
    const angularVelocityUpperThreshold = 0.2;
    this.spaceShipEmitterLeft.on = false;
    this.spaceShipEmitterRight.on = false;

    if (cursors.left?.isDown || this.keys.A.isDown) {
      this.angularVelocity = this.angularVelocity - angularDelta;
    } else if (cursors.right?.isDown || this.keys.D.isDown) {
      this.angularVelocity = this.angularVelocity + angularDelta;
    }
    if (cursors.up?.isDown || this.keys.W.isDown) {
      this.spaceShipEmitterLeft.on = true;
      this.spaceShipEmitterRight.on = true;
      const leftEnginePosition = this.leftEngine.clone().rotate(rotation);
      const rightEnginePosition = this.rightEngine.clone().rotate(rotation);
      this.spaceShipEmitterLeft.setPosition(
        this.spaceShip.x + leftEnginePosition.x,
        this.spaceShip.y + leftEnginePosition.y
      );
      this.spaceShipEmitterRight.setPosition(
        this.spaceShip.x + rightEnginePosition.x,
        this.spaceShip.y + rightEnginePosition.y
      );
      this.spaceShip.setVelocity(currentSpeed.x + velocityDeltaVector.x, currentSpeed.y + velocityDeltaVector.y);
    } else if (cursors.down?.isDown || this.keys.S.isDown) {
      if (totalCurrentSpeed < speedDelta) {
        this.spaceShip.setVelocity(0, 0);
      } else {
        const ySpeedDelta = speedDelta * (Math.abs(currentSpeed.y) / totalCurrentSpeed);
        const xSpeedDelta = speedDelta * (Math.abs(currentSpeed.x) / totalCurrentSpeed);
        this.spaceShip.setVelocity(
          currentSpeed.x > 0 ? currentSpeed.x - xSpeedDelta : currentSpeed.x + xSpeedDelta,
          currentSpeed.y > 0 ? currentSpeed.y - ySpeedDelta : currentSpeed.y + ySpeedDelta
        );
      }
      if (this.angularVelocity > angularVelocityLowerThreshold) {
        this.angularVelocity -= angularDelta;
      } else if (this.angularVelocity < -angularVelocityLowerThreshold) {
        this.angularVelocity += angularDelta;
      } else {
        this.angularVelocity = 0;
      }
    }
    if (this.angularVelocity > angularVelocityUpperThreshold) {
      this.angularVelocity = angularVelocityUpperThreshold;
    }
    if (this.angularVelocity < -angularVelocityUpperThreshold) {
      this.angularVelocity = -angularVelocityUpperThreshold;
    }
    this.spaceShip.setAngularVelocity(this.angularVelocity);
    if (totalCurrentSpeed > speedUpperThreshold) {
      this.spaceShip.setVelocity(
        currentSpeed.x * (speedUpperThreshold / totalCurrentSpeed),
        currentSpeed.y * (speedUpperThreshold / totalCurrentSpeed)
      );
    }

    if (cursors.space?.isDown) {
      this.shootLaser();
    }
  }

  public sendGameEvents() {
    if (this.session !== undefined) {
      this.session.sendPlayerStateEvent({
        position: {
          x: this.spaceShip.x,
          y: this.spaceShip.y
        },
        velocity: {
          x: this.spaceShip.body.velocity.x,
          y: this.spaceShip.body.velocity.y
        },
        rotation: this.spaceShip.rotation,
        angularVelocity: this.angularVelocity
      });
    }
  }

  addNewPlayer(payload: PlayerJoinedGamePayload) {
    console.log(`New player ${payload.playerId}`);
    const spaceShipShape = this.cache.json.get('spaceship-shape');
    const playerSpaceShipKey = this.getPlayerImageKeyFromType(payload.playerType);
    const player = this.matter.add.image(7 * tileSize, 7 * tileSize, playerSpaceShipKey, undefined, {
      vertices: spaceShipShape.spaceship,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0
    });
    player.name = payload.playerId;
    this.players.push(player);
  }

  removePlayer(payload: PlayerLeftGamePayload) {
    console.log(`Remove player ${payload.playerId}`);
    this.players = this.players.filter((player) => {
      if (player.name === payload.playerId) {
        player.destroy();
        return true;
      }
      return false;
    });
  }

  updatePlayer(payload: PlayerStateInboundPayload) {
    const player = this.players.find((player) => player.name === payload.playerId);
    if (player === undefined) return;
    player.x = payload.position.x;
    player.y = payload.position.y;
    player.setVelocityX(payload.velocity.x);
    player.setVelocityY(payload.velocity.y);
    player.setAngularVelocity(payload.angularVelocity);
    player.setRotation(payload.rotation);
  }

  shootLaser() {
    if (this.laserGroup) {
      const velocity = new Vector2(900, 0).rotate(this.spaceShip.rotation);
      this.laserGroup.fireLaser(this.spaceShip.x, this.spaceShip.y - 20, velocity);
    }
  }

  public updateGameState(payload: GameStatePayload) {
    console.log(`update state ${payload}`);
  }

  public setMap(payload: SetMapPayload) {
    payload.planets.forEach((planetData) => {
      const key = this.getPlanetImageKeyFromType(planetData.planetType);
      const planet = this.matter.add.image(planetData.position.x, planetData.position.y, key);
      planet.setCircle(planetData.radius);
      planet.setStatic(true);
    });
  }

  private getPlanetImageKeyFromType(planetType: PlanetType) {
    switch (planetType) {
      case PlanetType.EARTH: {
        return 'planet-earth';
      }
      case PlanetType.GAS: {
        return 'planet-gas';
      }
      case PlanetType.RED: {
        return 'planet-red';
      }
      case PlanetType.WHITE: {
        return 'planet-white';
      }
      case PlanetType.YELLOW: {
        return 'planet-yellow';
      }
      default: {
        console.warn(`Unknown planet type ${planetType}, falling back to earth...`);
        return 'planet-earth';
      }
    }
  }

  private getPlayerImageKeyFromType(playerType?: PlayerType) {
    switch (playerType) {
      case PlayerType.YELLOW: {
        return 'spaceship-yellow';
      }
      default: {
        console.warn(`Unknown player type ${playerType}, falling back to yellow...`);
        return 'spaceship-yellow';
      }
    }
  }
}
