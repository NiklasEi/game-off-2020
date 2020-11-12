import { GameScene } from '../scenes/GameScene';
import {
  GameStatePayload,
  MultiplayerEvent,
  PlayerJoinedGamePayload,
  PlayerStateInboundPayload,
  PlayerStateOutboundPayload,
  RoomLeaderPayload,
  SignedGameStatePayload
} from './MultiplayerEvent';

export class Session {
  private socket: WebSocket;
  private readonly gameScene: GameScene;
  public isRoomLeader: boolean = false;
  private secret?: string;
  private gameInitialized = false;
  private readonly playerJoinedEvents: PlayerJoinedGamePayload[] = [];

  constructor(gameScene: GameScene) {
    this.gameScene = gameScene;
    const { location } = window;
    const proto = location.protocol.startsWith('https') ? 'wss' : 'ws';
    const wsUri = `${proto}://localhost:8080/ws/`;

    this.socket = new WebSocket(wsUri);
    this.setEvents();
  }

  private setEvents() {
    this.socket.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('Connected to Server');
    };

    this.socket.onmessage = (ev) => {
      const text = ev.data as string;
      if (text.startsWith('Event ')) {
        this.handleGameEvent(text.replace(/^Event /, ''));
      }
    };

    this.socket.onclose = () => {
      // eslint-disable-next-line no-console
      console.log('Disconnected from Server');
      this.gameScene.disconnectSession();
    };
  }

  public send(text: string) {
    this.socket.send(text);
  }

  public initializedGame() {
    this.gameInitialized = true;
    this.playerJoinedEvents.forEach((event) => this.gameScene.addNewPlayer(event));
  }

  private sendEvent(event: MultiplayerEvent, payload: any) {
    this.socket.send(`Event ${event}:${JSON.stringify(payload, undefined, 0)}`);
  }

  public sendGameStateEvent(payload: GameStatePayload) {
    if (this.secret !== undefined) {
      const signedPayload: SignedGameStatePayload = {
        ...payload,
        secret: this.secret
      };
      this.sendEvent(MultiplayerEvent.GAME_STATE, signedPayload);
    }
  }

  public sendPlayerStateEvent(payload: PlayerStateOutboundPayload) {
    this.sendEvent(MultiplayerEvent.PLAYER_STATE, payload);
  }

  private handleGameEvent(message: string) {
    const matches = message.match(/^([a-zA-Z]+):/);
    if (matches === null || matches.length < 1) {
      // eslint-disable-next-line no-console
      console.error(`Unable to find event identifier for "${message}"`);
      return;
    }
    const event = matches[1];
    const payload = JSON.parse(message.replace(/^[a-zA-Z]+:/, ''));
    switch (event) {
      case MultiplayerEvent.GAME_STATE: {
        const state = payload as GameStatePayload;
        if (this.isRoomLeader) {
          // eslint-disable-next-line no-console
          console.warn('got game state as room leader O.o');
        }
        this.gameScene.updateGameState(state);
        break;
      }
      case MultiplayerEvent.ROOM_LEADER: {
        const state = payload as RoomLeaderPayload;
        this.secret = state.secret;
        this.isRoomLeader = true;
        break;
      }
      case MultiplayerEvent.PLAYER_JOINED_GAME: {
        const state = payload as PlayerJoinedGamePayload;
        if (this.gameInitialized) {
          this.gameScene.addNewPlayer(state);
        } else {
          this.playerJoinedEvents.push(state);
        }
        break;
      }
      case MultiplayerEvent.PLAYER_STATE: {
        const state = payload as PlayerStateInboundPayload;
        this.gameScene.updatePlayer(state);
        break;
      }

      default: {
        // eslint-disable-next-line no-console
        console.error(`Couldn't handle event "${event}"`);
        return;
      }
    }
  }
}