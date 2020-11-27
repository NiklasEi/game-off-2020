import { GameScene } from '../scenes/GameScene';
import {
  GameStatePayload,
  JoinGameAnswerPayload,
  MultiplayerEvent,
  PlayerJoinedGamePayload,
  PlayerLeftGamePayload,
  PlayerStateInboundPayload,
  PlayerStateOutboundPayload,
  RoomLeaderPayload,
  SetMapPayload,
  SignedGameStatePayload
} from '../networking/MultiplayerEvent';
import { sceneEvents } from '../events/EventCenter';

declare const SERVER_HOST: string;

export class Session {
  private socket?: WebSocket;
  private gameScene?: GameScene;
  public isRoomLeader: boolean = false;
  private secret?: string;
  private gameInitialized = false;
  private readonly playerJoinedEvents: PlayerJoinedGamePayload[] = [];
  private readonly playerLeftEvents: PlayerLeftGamePayload[] = [];
  private pingIntervalId?: number;
  private mapState?: SetMapPayload;
  private gameCode?: string;
  public connected: boolean = false;

  constructor() {
    this.establishMultiPlayerSession();
    sceneEvents.once('start-game', this.sendStartGame, this);
  }

  public connect(gameCode: string) {
    this.gameCode = gameCode;
    this.sendEvent(MultiplayerEvent.JOIN_GAME, { code: this.gameCode });
  }

  private establishMultiPlayerSession() {
    const { location } = window;
    const proto = location.protocol.startsWith('https') ? 'wss' : 'ws';
    /* global SERVER_HOST */
    const wsUri = `${proto}://${SERVER_HOST}/ws/`;

    this.socket = new WebSocket(wsUri);
    this.setEvents();
  }

  private getCurrentPing() {
    this.sendEvent(MultiplayerEvent.PING, { timestamp: Date.now().valueOf() });
  }

  private setEvents() {
    if (this.socket === undefined) {
      console.error('Tried to set events on an undefined websocket');
      return;
    }
    this.socket.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('Connected to Server');
      this.connected = true;
      sceneEvents.emit('server-connected');
    };

    this.socket.onmessage = (ev) => {
      const text = ev.data as string;
      if (text.startsWith('Event ')) {
        this.handleEvent(text.replace(/^Event /, ''));
      }
    };

    this.socket.onclose = () => {
      // eslint-disable-next-line no-console
      console.log('Disconnected from Server');
      this.connected = false;
      if (this.pingIntervalId !== undefined) {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = undefined;
      }
      this.gameScene?.disconnectSession();
    };
  }

  public initializeGame(gameScene: GameScene) {
    this.gameScene = gameScene;
    this.gameInitialized = true;
    this.playerJoinedEvents.forEach((event) => gameScene.addNewPlayer(event));
    this.playerLeftEvents.forEach((event) => gameScene.removePlayer(event));
    if (this.mapState !== undefined) {
      gameScene.setMap(this.mapState);
    }
    setInterval(() => gameScene.sendGameEvents(), 100);
    this.pingIntervalId = setInterval(this.getCurrentPing.bind(this), 2000);
  }

  private sendEvent(event: MultiplayerEvent, payload: any) {
    if (this.socket === undefined) {
      console.warn('Tried to send text over an undefined websocket');
      return;
    }
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

  public sendStartGame() {
    if (this.secret !== undefined) {
      this.sendEvent(MultiplayerEvent.START_GAME, { secret: this.secret });
    }
  }

  public sendPlayerStateEvent(payload: PlayerStateOutboundPayload) {
    this.sendEvent(MultiplayerEvent.PLAYER_STATE, payload);
  }

  private handleEvent(message: string) {
    const matches = message.match(/^([a-zA-Z]+):/);
    if (matches === null || matches.length < 1) {
      // eslint-disable-next-line no-console
      console.error(`Unable to find event identifier for "${message}"`);
      return;
    }
    const event = matches[1];
    // if (event !== MultiplayerEvent.PING) {
    //   console.log(message);
    // }
    const payload = JSON.parse(message.replace(/^[a-zA-Z]+:/, ''));
    switch (event) {
      case MultiplayerEvent.GAME_STATE: {
        const state = payload as GameStatePayload;
        if (this.isRoomLeader) {
          // eslint-disable-next-line no-console
          console.warn('got game state as room leader O.o');
        }
        this.gameScene?.updateGameState(state);
        break;
      }
      case MultiplayerEvent.ROOM_LEADER: {
        const state = payload as RoomLeaderPayload;
        this.secret = state.secret;
        this.isRoomLeader = true;
        sceneEvents.emit('is-room-leader');
        break;
      }
      case MultiplayerEvent.PLAYER_JOINED_GAME: {
        const state = payload as PlayerJoinedGamePayload;
        if (this.gameInitialized) {
          this.gameScene?.addNewPlayer(state);
        } else {
          this.playerJoinedEvents.push(state);
        }
        break;
      }
      case MultiplayerEvent.PLAYER_LEFT_GAME: {
        const state = payload as PlayerLeftGamePayload;
        if (this.gameInitialized) {
          this.gameScene?.removePlayer(state);
        } else {
          this.playerLeftEvents.push(state);
        }
        break;
      }
      case MultiplayerEvent.PLAYER_STATE: {
        const state = payload as PlayerStateInboundPayload;
        this.gameScene?.updatePlayer(state);
        break;
      }
      case MultiplayerEvent.SET_MAP: {
        this.mapState = payload as SetMapPayload;
        if (this.gameInitialized) {
          this.gameScene?.setMap(this.mapState);
        }
        break;
      }
      case MultiplayerEvent.START_GAME: {
        sceneEvents.emit('start-game');
        break;
      }
      case MultiplayerEvent.JOIN_GAME: {
        const answer = payload as JoinGameAnswerPayload;
        sceneEvents.emit('join-game', answer);
        break;
      }
      case MultiplayerEvent.PING: {
        const state = payload as { timestamp: number };
        sceneEvents.emit('update-ping', Date.now().valueOf() - state.timestamp);
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
