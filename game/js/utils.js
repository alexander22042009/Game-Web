export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export const normalize = (x, y) => {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
};

export const randomRange = (min, max) => Math.random() * (max - min) + min;

export const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));

export const chance = (p) => Math.random() < p;

export const circleIntersectsCircle = (a, b) => {
  const radius = a.radius + b.radius;
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= radius * radius;
};

export const circleIntersectsRect = (circle, rect) => {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};

export const lineIntersectsRect = (x1, y1, x2, y2, rect) => {
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;

  const intersects = (ax, ay, bx, by, cx, cy, dx, dy) => {
    const denominator = (ax - bx) * (cy - dy) - (ay - by) * (cx - dx);
    if (denominator === 0) {
      return false;
    }
    const t = ((ax - cx) * (cy - dy) - (ay - cy) * (cx - dx)) / denominator;
    const u = -((ax - bx) * (ay - cy) - (ay - by) * (ax - cx)) / denominator;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };

  return (
    intersects(x1, y1, x2, y2, left, top, right, top) ||
    intersects(x1, y1, x2, y2, right, top, right, bottom) ||
    intersects(x1, y1, x2, y2, right, bottom, left, bottom) ||
    intersects(x1, y1, x2, y2, left, bottom, left, top)
  );
};

export const formatSeconds = (seconds) => `${seconds.toFixed(1)}s`;
