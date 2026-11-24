import test from 'node:test';
import assert from 'node:assert/strict';
import { languageFromStored, messages } from '../src/i18n.ts';

test('Vietnamese stays the default; only a saved English choice selects English', () => {
  assert.equal(languageFromStored(null), 'vi');
  assert.equal(languageFromStored('unknown'), 'vi');
  assert.equal(languageFromStored('vi'), 'vi');
  assert.equal(languageFromStored('en'), 'en');
});

test('both languages cover every visible message', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.vi).sort());
  for (const language of ['vi', 'en']) {
    for (const [key, value] of Object.entries(messages[language])) {
      assert.ok(value.trim(), `${language}.${key} is empty`);
    }
  }
});
