import { circleIntersectsCircle, circleIntersectsRect, lineIntersectsRect } from "./utils.js";

export const hitCircle = (a, b) => circleIntersectsCircle(a, b);
export const hitRect = (circle, rect) => circleIntersectsRect(circle, rect);

export const hasLineOfSight = (from, to, walls) => {
  for (const wall of walls) {
    if (lineIntersectsRect(from.x, from.y, to.x, to.y, wall)) {
      return false;
    }
  }
  return true;
};
