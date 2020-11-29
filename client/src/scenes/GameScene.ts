import * as Phaser from 'phaser';
import { Session } from '../session/Session';
import {
  GameStatePayload,
  PlanetType,
  PlayerJoinedGamePayload,
  PlayerLeftGamePayload,
  PlayerStateInboundPayload,
  PlayerType,
  Position,
  SetMapPayload
} from '../networking/MultiplayerEvent';
import { assetKeys, bodyLabels, events, scenes, tileSize } from '../utils/constants';
import { GameMode } from '../session/GameMode';
import { sceneEvents } from '../events/EventCenter';
import AsteroidGroup from '../asteroid/AsteroidGroup';
import LaserGroup from '../laser/Laser';
import Vector2 = Phaser.Math.Vector2;

interface Control {
  W: any;
  A: any;
  S: any;
  D: any;
}

export class GameScene extends Phaser.Scene {
  public static UPPER_WORLD_BOUND: number = 5;
  public static LOWER_WORLD_BOUND: number = 95;
  private spaceShip!: Phaser.Physics.Matter.Image;
  private spaceShipEmitterLeft!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spaceShipEmitterRight!: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly leftEngine = new Vector2(-52, -28);
  private readonly rightEngine = new Vector2(-52, 28);
  private lastAsteroid: number = Date.now().valueOf();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private angularVelocity: number = 0;
  private players: Phaser.Physics.Matter.Image[] = [];
  private session?: Session;
  private keys!: Control;
  public gameMode: GameMode = GameMode.SINGLE_PLAYER;
  private code?: string;
  private playerType?: PlayerType;
  public dead: boolean = false;
  public deadSince: number = Date.now().valueOf();
  public deadUntil: number = Date.now().valueOf();
  private spawn: Position = {
    x: 7 * tileSize,
    y: 7 * tileSize
  };
  private laserGroup?: LaserGroup;
  private asteroids?: AsteroidGroup;
  private multiPlayerStarted: boolean = false;
  matterCollision: any;
  public maxHealth: number = 100;
  public health: number = this.maxHealth;

  constructor() {
    super(scenes.gameScene);
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
    this.code = data.code;
    if (data.spawn !== undefined) {
      this.spawn = data.spawn;
    }
    this.playerType = data.playerType;
  }

  public async create() {
    const codeInput = document.getElementById('gameCode');
    if (codeInput !== null) {
      codeInput.style.display = 'none';
    }
    const codeCaption = document.getElementById('codeCaption');
    if (codeCaption !== null) {
      codeCaption.style.display = 'none';
    }
    sceneEvents.once(
      events.startGame,
      () => {
        this.multiPlayerStarted = true;
      },
      this
    );
    this.scene.run(scenes.gameHud, { gameMode: this.gameMode, session: this.session, code: this.code });
    // prepare map
    const map = this.make.tilemap({ key: assetKeys.map.space });
    const spaceTileset = map.addTilesetImage('stars', assetKeys.map.tiles.stars, tileSize, tileSize, 1, 2);
    const asteroidTileset = map.addTilesetImage('asteroids', assetKeys.map.tiles.asteroids, tileSize, tileSize, 1, 2);
    map.createStaticLayer('stars', spaceTileset);
    map.createStaticLayer('asteroids', asteroidTileset);
    this.keys = this.input.keyboard.addKeys('W,S,A,D') as Control;

    const particles = this.add.particles(assetKeys.ship.fire);
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
    const spaceShipShape = this.cache.json.get(assetKeys.ship.shape);
    const playerSpaceShipKey = this.getPlayerImageKeyFromType(this.playerType);
    this.spaceShip = this.matter.add.image(this.spawn.x, this.spawn.y, playerSpaceShipKey, undefined, {
      vertices: spaceShipShape,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: bodyLabels.ownSpaceship
    });
    this.matterCollision.addOnCollideStart({
      objectA: this.spaceShip,
      callback: (eventData: any) => {
        const { bodyB, gameObjectB } = eventData;
        if (bodyB.label === bodyLabels.asteroid) {
          gameObjectB?.destroy();
          if (this.dead) return;
          this.health -= 40;
          if (this.health <= 0) {
            const timestamp = Date.now().valueOf();
            sceneEvents.emit(events.playerDied, timestamp, timestamp + 10000);
            this.dead = true;
          } else {
            sceneEvents.emit(events.updateHealth, this.maxHealth, this.health);
          }
        }
        if (bodyB.label === bodyLabels.ownLaserShot || bodyB.label === bodyLabels.otherLaserShot) {
          gameObjectB?.destroy();
        }
      }
    });
    const bounds = this.matter.world.setBounds(
      GameScene.UPPER_WORLD_BOUND * tileSize,
      GameScene.UPPER_WORLD_BOUND * tileSize,
      (GameScene.LOWER_WORLD_BOUND - GameScene.UPPER_WORLD_BOUND) * tileSize,
      (GameScene.LOWER_WORLD_BOUND - GameScene.UPPER_WORLD_BOUND) * tileSize
    );
    this.matterCollision.addOnCollideStart({
      objectA: Object.values(bounds.walls),
      callback: (eventData: any) => {
        const { bodyB, gameObjectB } = eventData;
        if (bodyB.label === bodyLabels.ownLaserShot || bodyB.label === bodyLabels.asteroid) {
          gameObjectB?.destroy();
        }
      }
    });
    this.cameras.main.startFollow(this.spaceShip, true);
    this.cameras.main.zoom = 0.5;

    this.laserGroup = new LaserGroup(this);
    this.asteroids = new AsteroidGroup(this);

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    sceneEvents.on(
      events.playerDied,
      () => {
        this.spaceShipEmitterRight.on = false;
        this.spaceShipEmitterLeft.on = false;
        this.spaceShip.setTint(0x808080);
        this.spaceShip.setRotation(0);
        this.spaceShip.setAngularVelocity(0);
        this.spaceShip.setVelocity(0, 0);
        this.spaceShip.x = this.spawn.x;
        this.spaceShip.y = this.spawn.y;
      },
      this
    );
    sceneEvents.on(
      events.playerRespawn,
      () => {
        this.health = this.maxHealth;
        this.spaceShip.clearTint();
        this.dead = false;
      },
      this
    );
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
    if (this.gameMode === GameMode.MULTI_PLAYER && !this.multiPlayerStarted) {
      return;
    }

    const timeStamp = Date.now().valueOf();
    if (this.gameMode === GameMode.SINGLE_PLAYER || this.session?.isRoomLeader === true) {
      if (timeStamp - this.lastAsteroid > 500) {
        this.lastAsteroid = timeStamp;
        this.asteroids?.shootAsteroid();
      }
    }

    const cursors = this.cursors;
    if (cursors === undefined) return;

    sceneEvents.emit(events.newFrameTimestamp, timeStamp);

    if (this.dead) {
      this.spaceShip.setRotation(0);
      this.spaceShip.setAngularVelocity(0);
      this.spaceShip.setVelocity(0, 0);
      this.spaceShip.x = this.spawn.x;
      this.spaceShip.y = this.spawn.y;
      return;
    }

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
    if (this.session !== undefined && this.multiPlayerStarted) {
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
    const spaceShipShape = this.cache.json.get(assetKeys.ship.shape);
    const playerSpaceShipKey = this.getPlayerImageKeyFromType(payload.playerType);
    const player = this.matter.add.image(payload.spawn.x, payload.spawn.y, playerSpaceShipKey, undefined, {
      vertices: spaceShipShape,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: bodyLabels.otherSpaceship
    });
    player.name = payload.playerId;
    this.players.push(player);

    this.matterCollision.addOnCollideStart({
      objectA: player,
      callback: (eventData: any) => {
        const { bodyB, gameObjectB } = eventData;
        if (
          bodyB.label === bodyLabels.asteroid ||
          bodyB.label === bodyLabels.ownLaserShot ||
          bodyB.label === bodyLabels.otherLaserShot
        ) {
          gameObjectB?.destroy();
        }
      }
    });
  }

  removePlayer(payload: PlayerLeftGamePayload) {
    console.log(`Remove player ${payload.playerId}`);
    this.players = this.players.filter((player) => {
      if (player.name === payload.playerId) {
        player.destroy();
        return false;
      }
      return true;
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
      const velocity = new Vector2(15, 0).rotate(this.spaceShip.rotation);
      this.laserGroup.fireLaser(this.spaceShip.x, this.spaceShip.y, velocity);
    }
  }

  public updateGameState(payload: GameStatePayload, isRoomLeader: boolean) {
    console.log(`update state ${payload}`);
    if (!isRoomLeader && payload.asteroids !== undefined) {
      this.asteroids?.update(payload.asteroids);
    }
  }

  public setMap(payload: SetMapPayload) {
    const planets: any[] = [];
    payload.planets.forEach((planetData) => {
      const key = this.getPlanetImageKeyFromType(planetData.planetType);
      const planet = this.matter.add.image(planetData.position.x, planetData.position.y, key);
      planet.setCircle(planetData.radius);
      planet.setStatic(true);
      planets.push(planet);
    });
    this.matterCollision.addOnCollideStart({
      objectA: planets,
      callback: (eventData: any) => {
        const { bodyB, gameObjectB } = eventData;
        if (bodyB.label === bodyLabels.asteroid || bodyB.label === bodyLabels.ownLaserShot) {
          gameObjectB?.destroy();
        }
      }
    });
  }

  private getPlanetImageKeyFromType(planetType: PlanetType) {
    switch (planetType) {
      case PlanetType.EARTH: {
        return assetKeys.planets.earth;
      }
      case PlanetType.GAS: {
        return assetKeys.planets.gas;
      }
      case PlanetType.RED: {
        return assetKeys.planets.red;
      }
      case PlanetType.WHITE: {
        return assetKeys.planets.white;
      }
      case PlanetType.YELLOW: {
        return assetKeys.planets.yellow;
      }
      default: {
        console.warn(`Unknown planet type ${planetType}, falling back to earth...`);
        return assetKeys.planets.earth;
      }
    }
  }

  private getPlayerImageKeyFromType(playerType?: PlayerType) {
    switch (playerType) {
      case PlayerType.YELLOW: {
        return assetKeys.ship.yellow;
      }
      case PlayerType.BLUE: {
        return assetKeys.ship.blue;
      }
      case PlayerType.GREEN: {
        return assetKeys.ship.green;
      }
      case PlayerType.RED: {
        return assetKeys.ship.red;
      }
      case PlayerType.GRAY: {
        return assetKeys.ship.gray;
      }
      case PlayerType.LIGHTBLUE: {
        return assetKeys.ship.lightblue;
      }
      case PlayerType.ORANGE: {
        return assetKeys.ship.orange;
      }
      case PlayerType.PINK: {
        return assetKeys.ship.pink;
      }
      case PlayerType.PURPLE: {
        return assetKeys.ship.purple;
      }
      case PlayerType.TURQUOISE: {
        return assetKeys.ship.turquoise;
      }
      default: {
        console.warn(`Unknown player type ${playerType}, falling back to yellow...`);
        return assetKeys.ship.yellow;
      }
    }
  }
}
