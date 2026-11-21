import test from 'node:test';
import assert from 'node:assert/strict';
import { swipeDirection } from '../src/swipe.ts';
test('Vertical swipes map to jump and duck', () => {
  assert.equal(swipeDirection(0,-30,false),'jump');
  assert.equal(swipeDirection(0,30,false),'duck');
  assert.equal(swipeDirection(0,10,false),null);
  assert.equal(swipeDirection(50,25,false),null);
});
test('Swipes follow the rotated landscape game coordinates', () => {
  assert.equal(swipeDirection(30,0,true),'jump');
  assert.equal(swipeDirection(-30,0,true),'duck');
  assert.equal(swipeDirection(5,40,true),null);
});
