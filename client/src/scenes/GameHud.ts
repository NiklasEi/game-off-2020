import * as Phaser from 'phaser';

import { sceneEvents } from '../events/EventCenter';

export default class GameHud extends Phaser.Scene {
  private ping?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'gameHud' });
  }

  public updatePing(pingInMilliseconds: number) {
    this.ping?.setText(`${pingInMilliseconds}ms`);
  }

  create() {
    this.ping = this.add.text(725, 10, '');

    sceneEvents.on('update-ping', this.updatePing, this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('update-ping', this.updatePing, this);
    });
  }
}