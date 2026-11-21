import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldSpawnUfo, ufoScaleForFlightMode } from '../src/ufo.ts';

test('UFOs are unavailable at or before 2,000 points', () => {
  assert.equal(shouldSpawnUfo(1999, 0), false);
  assert.equal(shouldSpawnUfo(2000, 0), false);
});

test('UFO replaces only some flying obstacles after 2,000 points', () => {
  assert.equal(shouldSpawnUfo(2001, 0), true);
  assert.equal(shouldSpawnUfo(2001, 0.199), true);
  assert.equal(shouldSpawnUfo(2001, 0.2), false);
});

test('only a very-high UFO doubles in size', () => {
  assert.equal(ufoScaleForFlightMode(3), 1);
  assert.equal(ufoScaleForFlightMode(4), 2);
});
