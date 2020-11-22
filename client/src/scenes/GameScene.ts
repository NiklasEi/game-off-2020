import * as Phaser from 'phaser';
import { Session } from '../networking/Session';
import {
  GameStatePayload,
  PlayerJoinedGamePayload,
  PlayerLeftGamePayload,
  PlayerStateInboundPayload
} from '../networking/MultiplayerEvent';
import { tileSize } from '../utils/constants';
import Vector2 = Phaser.Math.Vector2;

interface Control {
  W: any;
  A: any;
  S: any;
  D: any;
}

export class GameScene extends Phaser.Scene {
  private spaceShip!: Phaser.Physics.Matter.Image;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly gameOver = false;
  private angularVelocity: number = 0;
  private players: any[] = [];
  private session?: Session;
  private keys!: Control;

  constructor() {
    super('game');
    this.session = new Session(this);
  }

  public preload() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  public disconnectSession() {
    this.session = undefined;
  }

  public create() {
    this.scene.run('gameHud');
    // prepare map
    const map = this.make.tilemap({ key: 'space' });
    const tileset = map.addTilesetImage('space', 'spacetiles', tileSize, tileSize, 1, 2);
    map.createStaticLayer('background', tileset);
    this.keys = this.input.keyboard.addKeys('W,S,A,D') as Control;

    // The player and its settings
    const spaceShipShape = this.cache.json.get('spaceship-shape');
    console.log(spaceShipShape.spaceship);
    this.spaceShip = this.matter.add.image(100, 450, 'spaceship', undefined, {
      vertices: spaceShipShape.spaceship,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0
    });
    this.matter.world.setBounds(0, 0, 3200, 3200);
    this.cameras.main.startFollow(this.spaceShip, true);

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    this.session?.initializedGame();
    setInterval(() => this.sendGameEvents(), 100);
  }

  public update() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.gameOver) {
      return;
    }
    const speed = 10;
    const speedDelta = 1;
    const cursors = this.cursors;
    if (cursors === undefined) return;
    const angularDelta = 0.001;
    const currentSpeed = this.spaceShip.body.velocity;
    const angularVelocityLowerThreshold = 0.01;
    const angularVelocityUpperThreshold = 0.2;

    const velocityVector = new Vector2(speed, 0).rotate(this.spaceShip.rotation);

    if (cursors.left?.isDown || this.keys.A.isDown) {
      this.angularVelocity = this.angularVelocity - angularDelta;
    } else if (cursors.right?.isDown || this.keys.D.isDown) {
      this.angularVelocity = this.angularVelocity + angularDelta;
    }
    if (cursors.up?.isDown || this.keys.W.isDown) {
      this.spaceShip.setVelocity(velocityVector.x, velocityVector.y);
    } else if (cursors.down?.isDown || this.keys.S.isDown) {
      const totalSpeed = Math.sqrt(currentSpeed.x ** 2 + currentSpeed.y ** 2);
      if (totalSpeed < speedDelta) {
        this.spaceShip.setVelocity(0, 0);
      } else {
        const ySpeedDelta = speedDelta * (Math.abs(currentSpeed.y) / totalSpeed);
        const xSpeedDelta = speedDelta * (Math.abs(currentSpeed.x) / totalSpeed);
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
  }

  private sendGameEvents() {
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
    const player = this.matter.add.image(100, 450, 'spaceship', undefined, {
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
    console.log(`update ${payload.playerId}`);
    const player = this.players.find((player) => player.name === payload.playerId);
    if (player === undefined) return;
    player.x = payload.position.x;
    player.y = payload.position.y;
    player.setVelocityX(payload.velocity.x);
    player.setVelocityY(payload.velocity.y);
    player.setAngularVelocity(payload.angularVelocity);
    player.setRotation(payload.rotation);
  }

  public updateGameState(payload: GameStatePayload) {
    console.log(`update state ${payload}`);
  }
}
