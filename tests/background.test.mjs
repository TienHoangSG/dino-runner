import test from 'node:test';
import assert from 'node:assert/strict';
import { backgroundModeFromStored } from '../src/background.ts';

test('detailed background is the safe default', () => {
  assert.equal(backgroundModeFromStored(null), 'detailed');
  assert.equal(backgroundModeFromStored('anything-else'), 'detailed');
});

test('simple background restores only when explicitly selected', () => {
  assert.equal(backgroundModeFromStored('simple'), 'simple');
});
