export enum MultiplayerEvent {
  GAME_STATE = 'GameState',
  PLAYER_STATE = 'PlayerState',
  ROOM_LEADER = 'RoomLeader',
  PLAYER_JOINED_GAME = 'PlayerJoinedGame',
  PLAYER_LEFT_GAME = 'PlayerLeftGame',
  SET_MAP = 'SetMap',
  PING = 'Ping'
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

export interface SetMapPayload {
  startPoint: Position;
}

export interface RoomLeaderPayload {
  secret: string;
}

export interface PlayerJoinedGamePayload {
  playerId: string;
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
