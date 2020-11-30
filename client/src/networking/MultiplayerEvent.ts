export enum MultiplayerEvent {
  GAME_STATE = 'GameState',
  PLAYER_STATE = 'PlayerState',
  ROOM_LEADER = 'RoomLeader',
  PLAYER_JOINED_GAME = 'PlayerJoinedGame',
  PLAYER_LEFT_GAME = 'PlayerLeftGame',
  SET_MAP = 'SetMap',
  PING = 'Ping',
  JOIN_GAME = 'JoinGame',
  START_GAME = 'StartGame',
  CREATE_GAME = 'CreateGame'
}

export interface PlayerStateInboundPayload extends PlayerStateOutboundPayload {
  playerId: string;
}

export interface PlayerStateOutboundPayload extends Entity {
  emitting: boolean;
  missile?: Entity;
  damageDealt?: number;
  laserShots: {
    remove?: string[];
    add?: NamedEntity[];
  };
}

export interface SignedGameStatePayload extends GameStatePayload {
  secret: string;
}

export interface GameStatePayload {
  otherLaserShots?: Entity[];
  asteroids?: {
    remove?: string[];
    add?: NamedEntity[];
  };
}

export interface StartGamePayload {
  secret: string;
}

export interface JoinGameAnswerPayload {
  ok: boolean;
  reason?: string;
  code?: string;
  playerType?: PlayerType;
  spawn?: Position;
}

export interface SetMapPayload {
  planets: Planet[];
  enemyPlanet: Planet;
}

export interface Planet {
  position: Position;
  radius: number;
  planetType: PlanetType;
}

export enum PlanetType {
  EARTH = 'EARTH',
  RED = 'RED',
  YELLOW = 'YELLOW',
  GAS = 'GAS',
  WHITE = 'WHITE'
}

export enum PlayerType {
  YELLOW = 'YELLOW',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  RED = 'RED',
  GRAY = 'GRAY',
  LIGHTBLUE = 'LIGHTBLUE',
  ORANGE = 'ORANGE',
  PINK = 'PINK',
  PURPLE = 'PURPLE',
  TURQUOISE = 'TURQUOISE'
}

export interface RoomLeaderPayload {
  secret: string;
}

export interface PlayerJoinedGamePayload {
  playerId: string;
  playerType: PlayerType;
  spawn: Position;
}

export interface PlayerLeftGamePayload {
  playerId: string;
}

export interface EntityWithId extends Entity {
  id: string;
}

export interface NamedEntity extends Entity {
  name: string;
}

export interface Entity {
  position: Position;
  velocity: Velocity;
  rotation: number;
  angularVelocity: number;
  dead?: boolean;
}

export type Velocity = Position;
export interface Position {
  x: number;
  y: number;
}
