export type PlayerBounds = { left: number; right: number; top: number; bottom: number };
export type GroundObstacle = { x: number; w: number; h: number; tall?: boolean; lavaRock: boolean; flying: boolean };

// Clockwise crust outline in a 64 × 40 local coordinate system.
export const rockOutline = [[0,27],[8,13],[23,2],[40,0],[55,7],[64,23],[60,35],[47,40],[13,40],[2,34]] as const;

export const tallRockOutline = [[0,29],[5,21],[29,0],[42,2],[57,15],[64,31],[54,39],[20,40],[5,36]] as const;

export function hitsGroundObstacle(player: PlayerBounds, obstacle: GroundObstacle) {
  if (obstacle.flying) return false;

  if (!obstacle.lavaRock) {
    return player.right > obstacle.x + 6
      && player.left < obstacle.x + obstacle.w - 6
      && player.top < 350
      && player.bottom > 350 - obstacle.h + 5;
  }

  const left = (player.left - obstacle.x) * 64 / obstacle.w;
  const right = (player.right - obstacle.x) * 64 / obstacle.w;
  const top = (player.top - 350 + obstacle.h) * 40 / obstacle.h;
  const bottom = (player.bottom - 350 + obstacle.h) * 40 / obstacle.h;
  if (right <= 0 || left >= 64 || bottom <= 0 || top >= 40) return false;

  // Reject boxes lying completely outside any edge of the convex crust.
  const outline = obstacle.tall ? tallRockOutline : rockOutline;
  return outline.every(([x, y], index) => {
    const [nx, ny] = outline[(index + 1) % outline.length];
    const dx = nx - x, dy = ny - y;
    const px = dy > 0 ? left : right;
    const py = dx > 0 ? bottom : top;
    return dx * (py - y) - dy * (px - x) > 0;
  });
}
