import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseMig31 } from '../src/dragon.ts';

test('MiG-31 replaces the dragon only after 2,000 points', () => {
  assert.equal(shouldUseMig31(0), false);
  assert.equal(shouldUseMig31(2000), false);
  assert.equal(shouldUseMig31(2001), true);
});
