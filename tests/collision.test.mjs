import test from 'node:test';
import assert from 'node:assert/strict';
import { hitsGroundObstacle } from '../src/collision.ts';

const lavaRock = { x: 180, w: 64, h: 40, lavaRock: true, flying: false };
const grounded = (left, right) => ({ left, right, top: 285, bottom: 346 });

test('lavaRock does not collide in its empty upper corners', () => {
  // This overlaps the old broad rectangle but sits left of the visible slope.
  assert.equal(hitsGroundObstacle({ left: 184, right: 195, top: 287, bottom: 314 }, lavaRock), false);
});

test('lavaRock collides with its visible centre and sloped base', () => {
  assert.equal(hitsGroundObstacle(grounded(205, 220), lavaRock), true);
  assert.equal(hitsGroundObstacle(grounded(190, 205), lavaRock), true);
});

test('lavaRock remains safe while the T-rex clears it from above', () => {
  assert.equal(hitsGroundObstacle({ left: 205, right: 220, top: 220, bottom: 270 }, lavaRock), false);
});

test('stump keeps its compact rectangular collision region', () => {
  const stump = { x: 180, w: 48, h: 44, lavaRock: false, flying: false };
  assert.equal(hitsGroundObstacle(grounded(190, 205), stump), true);
  assert.equal(hitsGroundObstacle(grounded(170, 185), stump), false);
});

test('lava rock collision follows the lower bevel', () => {
  assert.equal(hitsGroundObstacle({ left: 180, right: 184, top: 348, bottom: 350 }, lavaRock), false);
  assert.equal(hitsGroundObstacle({ left: 208, right: 215, top: 348, bottom: 350 }, lavaRock), true);
});
