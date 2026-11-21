export type PlayerBounds = { left: number; right: number; top: number; bottom: number };
export type GroundObstacle = { x: number; w: number; h: number; volcano: boolean; flying: boolean };

/**
 * Collision for objects that sit on the path.  A stump is compact enough for a
 * rectangle, but a volcano is deliberately treated as the tapered rock shape
 * that is drawn on the canvas.  This prevents its empty upper corners from
 * ending a run.
 */
export function hitsGroundObstacle(player: PlayerBounds, obstacle: GroundObstacle) {
  if (obstacle.flying) return false;

  if (!obstacle.volcano) {
    return player.right > obstacle.x + 6
      && player.left < obstacle.x + obstacle.w - 6
      && player.top < 350
      && player.bottom > 350 - obstacle.h + 5;
  }

  const volcanoTop = 350 - obstacle.h;
  const overlapTop = Math.max(player.top, volcanoTop);
  const overlapBottom = Math.min(player.bottom, 350);
  if (overlapBottom <= overlapTop) return false;

  // The cone is narrow at its glowing rim and widens smoothly to the base.
  // Checking its widest point inside the player's vertical slice gives a
  // conservative, continuous collision edge along the visible slopes.
  const depth = Math.max(0, Math.min(1, (overlapBottom - volcanoTop) / obstacle.h));
  const halfWidth = 9 + depth * 19;
  const center = obstacle.x + obstacle.w / 2;
  return player.right > center - halfWidth && player.left < center + halfWidth;
}
