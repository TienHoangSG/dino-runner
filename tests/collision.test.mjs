import test from 'node:test';
import assert from 'node:assert/strict';
import { hitsGroundObstacle } from '../src/collision.ts';

const volcano = { x: 180, w: 64, h: 48, volcano: true, flying: false };
const grounded = (left, right) => ({ left, right, top: 285, bottom: 346 });

test('volcano does not collide in its empty upper corners', () => {
  // This overlaps the old broad rectangle but sits left of the visible slope.
  assert.equal(hitsGroundObstacle({ left: 184, right: 195, top: 287, bottom: 318 }, volcano), false);
});

test('volcano collides with its visible centre and sloped base', () => {
  assert.equal(hitsGroundObstacle(grounded(205, 220), volcano), true);
  assert.equal(hitsGroundObstacle(grounded(190, 205), volcano), true);
});

test('volcano remains safe while the T-rex clears it from above', () => {
  assert.equal(hitsGroundObstacle({ left: 205, right: 220, top: 220, bottom: 270 }, volcano), false);
});

test('stump keeps its compact rectangular collision region', () => {
  const stump = { x: 180, w: 48, h: 44, volcano: false, flying: false };
  assert.equal(hitsGroundObstacle(grounded(190, 205), stump), true);
  assert.equal(hitsGroundObstacle(grounded(170, 185), stump), false);
});
