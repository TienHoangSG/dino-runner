import test from 'node:test';
import assert from 'node:assert/strict';
import { canRestartAfterGameOver, RESTART_BUTTON_WINDOW } from '../src/restart.ts';

test('only the replay button can restart during the five-second safety window', () => {
  assert.equal(canRestartAfterGameOver(0, false), false);
  assert.equal(canRestartAfterGameOver(RESTART_BUTTON_WINDOW - 1, false), false);
  assert.equal(canRestartAfterGameOver(800, true), true);
});

test('any game tap can restart once the safety window ends', () => {
  assert.equal(canRestartAfterGameOver(RESTART_BUTTON_WINDOW, false), true);
});
