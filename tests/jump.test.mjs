import test from 'node:test';
import assert from 'node:assert/strict';
import { canPterosaurJump, pterosaurLandingHeight } from '../src/jump.ts';

for (const size of [0.75, 1.1]) {
  const bird = { flying: true, x: 110, flightY: 286, size };
  const heightAtGap = gap => 346 - (bird.flightY - 9 * size) + gap;

  test('Pterosaur size ' + size + ' allows a jump only directly above its body', () => {
    assert.equal(canPterosaurJump(heightAtGap(0), false, [bird]), true);
    assert.equal(canPterosaurJump(heightAtGap(34), false, [bird]), true);
    assert.equal(canPterosaurJump(heightAtGap(34.1), false, [bird]), false);
    assert.equal(canPterosaurJump(heightAtGap(-0.1), false, [bird]), false);
    assert.equal(canPterosaurJump(heightAtGap(10), false, [{ ...bird, x: 200 }]), false);
    assert.equal(canPterosaurJump(heightAtGap(10), false, [{ ...bird, x: 10 }]), false);
  });

  test('Pterosaur size ' + size + ' cannot grant a third jump or a ground jump', () => {
    assert.equal(canPterosaurJump(heightAtGap(10), true, [bird]), false);
    assert.equal(canPterosaurJump(0, false, [bird]), false);
    assert.equal(canPterosaurJump(heightAtGap(10), false, []), false);
    assert.equal(canPterosaurJump(heightAtGap(10), false, [{ ...bird, flying: false }]), false);
  });
}
test('Only a nearby Pterosaur among mixed obstacles grants the extra jump', () => {
  const ground = { flying: false, x: 110, flightY: 286, size: 1 };
  const distant = { ...ground, flying: true, x: 300 };
  const nearby = { ...ground, flying: true };
  assert.equal(canPterosaurJump(80, false, [ground, distant]), false);
  assert.equal(canPterosaurJump(80, false, [ground, distant, nearby]), true);
});

for (const size of [0.75, 1.1]) {
  test('Landing from above remains safe and enables manual second jump, size ' + size, () => {
    const bird = { flying: true, x: 110, flightY: 286, size };
    const back = bird.flightY - 9 * size;
    const before = 346 - back + 8;
    const after = 346 - back - 12;
    const landing = pterosaurLandingHeight(before, after, -500, [bird]);
    assert.notEqual(landing, null);
    assert.ok(346 - landing < back);
    assert.equal(canPterosaurJump(landing, false, [bird]), true);
    assert.equal(canPterosaurJump(landing, true, [bird]), false);
    assert.notEqual(pterosaurLandingHeight(landing, landing - 2, -30, [bird]), null);
    assert.equal(pterosaurLandingHeight(after, after - 4, -500, [bird]), null);
    assert.equal(pterosaurLandingHeight(before, after, 100, [bird]), null);
    assert.equal(pterosaurLandingHeight(before, after, -500, [{...bird,x:300}]), null);
  });
}
