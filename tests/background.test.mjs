import test from 'node:test';
import assert from 'node:assert/strict';
import { backgroundModeFromStored } from '../src/background.ts';

test('simple background is the default', () => {
  assert.equal(backgroundModeFromStored(null), 'simple');
  assert.equal(backgroundModeFromStored('anything-else'), 'simple');
});

test('detailed background restores only when explicitly selected', () => {
  assert.equal(backgroundModeFromStored('detailed'), 'detailed');
});
