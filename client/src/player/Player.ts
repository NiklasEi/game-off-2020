import { PlayerStateInboundPayload } from '../networking/MultiplayerEvent';

export interface Player {
  id: string;
  packets: PlayerStateInboundPayload[];
}
