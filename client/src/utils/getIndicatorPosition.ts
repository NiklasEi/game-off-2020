import Vector2 = Phaser.Math.Vector2;
import { dimensions, zoom } from './constants';

enum Segment {
  Up = 'UP',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  DOWN = 'DOWN'
}

export function getIndicatorPosition(position: Vector2): { x: number; y: number; angle: number; active: boolean } {
  const segment = getSegment(position);
  let scale;
  let active;
  switch (segment) {
    case Segment.DOWN:
      active = position.y > dimensions.height / (zoom * 2);
      scale = dimensions.height / 2 / position.y;
      position.scale(scale);
      position = position.add(new Vector2(0, -35));
      return { x: position.x, y: position.y, active, angle: position.angle() };
    case Segment.Up:
      active = position.y < -dimensions.height / (zoom * 2);
      scale = -(dimensions.height / 2) / position.y;
      position.scale(scale);
      position = position.add(new Vector2(0, 35));
      return { x: position.x, y: position.y, active, angle: position.angle() };
    case Segment.RIGHT:
      active = position.x > dimensions.width / (zoom * 2);
      scale = dimensions.width / 2 / position.x;
      position.scale(scale);
      position = position.add(new Vector2(-35, 0));
      return { x: position.x, y: position.y, active, angle: position.angle() };
    case Segment.LEFT:
      active = position.x < -dimensions.width / (zoom * 2);
      scale = -(dimensions.width / 2) / position.x;
      position.scale(scale);
      position = position.add(new Vector2(35, 0));
      return { x: position.x, y: position.y, active, angle: position.angle() };
  }
}

function getSegment(position: Vector2) {
  const bottomLeftCorner = new Vector2(-dimensions.width / 2, dimensions.height / 2).angle();
  const bottomRightCorner = new Vector2(dimensions.width / 2, dimensions.height / 2).angle();
  const topLeftCorner = -bottomLeftCorner;
  const topRightCorner = -bottomRightCorner;
  let angle = position.angle();
  if (angle > Math.PI) {
    angle = angle - 2 * Math.PI;
  }
  if (angle < topLeftCorner) {
    return Segment.LEFT;
  } else if (angle < topRightCorner) {
    return Segment.Up;
  } else if (angle > bottomLeftCorner) {
    return Segment.LEFT;
  } else if (angle > bottomRightCorner) {
    return Segment.DOWN;
  } else {
    return Segment.RIGHT;
  }
}
