import * as Phaser from 'phaser';

import { sceneEvents } from '../events/EventCenter';

export default class GameHud extends Phaser.Scene {
  private ping?: Phaser.GameObjects.Text;
  private readonly coolDownLeft?: number;
  private readonly coolDownRight?: number;

  constructor() {
    super({ key: 'gameHud' });
  }

  public updatePing(pingInMilliseconds: number) {
    this.ping?.setText(`${pingInMilliseconds}ms`);
  }

  create() {
    this.ping = this.add.text(1125, 10, '');

    sceneEvents.on('update-ping', this.updatePing, this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off('update-ping', this.updatePing, this);
      if (this.coolDownLeft) {
        clearTimeout(this.coolDownLeft);
      }
      if (this.coolDownRight) {
        clearTimeout(this.coolDownRight);
      }
    });
  }
}
