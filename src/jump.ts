type FlyingObstacle = { flying: boolean; x: number; flightY: number; size: number };

// Only the body directly beneath the feet can support a second jump.
export function canPterosaurJump(height: number, used: boolean, obstacles: FlyingObstacle[]) {
  if (height <= 0 || used) return false;
  const feet = 346 - height;
  return obstacles.some(obstacle => {
    if (!obstacle.flying) return false;
    const back = obstacle.flightY - 9 * obstacle.size;
    const gap = back - feet;
    const left = obstacle.x + 29 - 22 * obstacle.size;
    const right = obstacle.x + 29 + 22 * obstacle.size;
    return gap >= 0 && gap <= 34 && 163 >= left && 114 <= right;
  });
}

// Sweep the feet through the frame so fast falls cannot skip the bird's back.
export function pterosaurLandingHeight(previousHeight: number, height: number, velocity: number, obstacles: FlyingObstacle[]) {
  if (height <= 0 || velocity > 0) return null;
  const previousFeet = 346 - previousHeight;
  const feet = 346 - height;
  const bird = obstacles.find(obstacle => {
    if (!obstacle.flying) return false;
    const back = obstacle.flightY - 9 * obstacle.size;
    const left = obstacle.x + 29 - 22 * obstacle.size;
    const right = obstacle.x + 29 + 22 * obstacle.size;
    return 163 >= left && 114 <= right && previousFeet <= back && feet >= back;
  });
  return bird ? 346 - (bird.flightY - 9 * bird.size) + 0.5 : null;
}
