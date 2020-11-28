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

export type PlayerStateOutboundPayload = Entity;

export interface SignedGameStatePayload extends GameStatePayload {
  secret: string;
}

export interface GameStatePayload {
  _stuff: any;
}

export interface StartGamePayload {
  secret: string;
}

export interface JoinGameAnswerPayload {
  ok: boolean;
  reason?: string;
  code?: string;
  playerType: PlayerType;
}

export interface SetMapPayload {
  startPoint: Position;
  planets: Planet[];
}

interface Planet {
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
  YELLOW = 'YELLOW'
}

export interface RoomLeaderPayload {
  secret: string;
}

export interface PlayerJoinedGamePayload {
  playerId: string;
  playerType: PlayerType;
}

export interface PlayerLeftGamePayload {
  playerId: string;
}

export interface EntityWithId extends Entity {
  id: string;
}

export interface Entity {
  position: Position;
  velocity: Velocity;
  rotation: number;
  angularVelocity: number;
}

type Velocity = Position;
interface Position {
  x: number;
  y: number;
}
