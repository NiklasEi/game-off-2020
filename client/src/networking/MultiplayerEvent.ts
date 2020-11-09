export enum MultiplayerEvent {
  COLLECT_STAR = 'CollectStar',
  GAME_STATE = 'GameState',
  PLAYER_STATE = 'PlayerState',
  ROOM_LEADER = 'RoomLeader',
  PLAYER_JOINED_GAME = 'PlayerJoinedGame'
}

export interface PlayerStateInboundPayload extends PlayerStateOutboundPayload {
  playerId: string;
}

export type PlayerStateOutboundPayload = Entity;

export interface GameStatePayload {
  stars: Entity[];
}

export interface RoomLeaderPayload {
  secret: string;
}

export interface PlayerJoinedGamePayload {
  playerId: string;
}

export interface Entity {
  position: Position;
  velocity: Velocity;
}

interface Velocity {
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}
