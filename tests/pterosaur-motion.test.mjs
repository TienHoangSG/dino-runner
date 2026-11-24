import test from 'node:test';
import assert from 'node:assert/strict';
import { FLAP_CYCLE_SECONDS, PTEROSAUR_STAGES, pterosaurPose } from '../src/pterosaur-motion.ts';

test('ten flight stages use only the four original sprite frames', () => {
  assert.equal(PTEROSAUR_STAGES.length, 10);
  for (const stage of PTEROSAUR_STAGES) {
    assert.ok(Number.isInteger(stage.frame) && stage.frame >= 0 && stage.frame < 4);
    assert.ok(Number.isInteger(stage.nextFrame) && stage.nextFrame >= 0 && stage.nextFrame < 4);
  }
  assert.deepEqual([...new Set(PTEROSAUR_STAGES.map(stage => stage.frame))].sort(), [0, 1, 2, 3]);
  assert.ok(Math.abs(PTEROSAUR_STAGES.reduce((total, stage) => total + stage.duration, 0) - FLAP_CYCLE_SECONDS / 2) < 1e-9);
});

test('the transitions only interpolate the original poses', () => {
  const pose = pterosaurPose(0.115);
  assert.equal(pose.frame, 0);
  assert.equal(pose.nextFrame, 1);
  assert.ok(pose.blend > 0 && pose.blend < 1);
});

test('horizontal wing poses dominate the cycle', () => {
  const levelFlightSeconds = PTEROSAUR_STAGES
    .filter(stage => stage.frame === stage.nextFrame && [1, 3].includes(stage.frame))
    .reduce((total, stage) => total + stage.duration, 0);
  assert.ok(2 * levelFlightSeconds > FLAP_CYCLE_SECONDS / 2);
});

test('independent phase offsets loop without changing flight height', () => {
  assert.deepEqual(pterosaurPose(FLAP_CYCLE_SECONDS), pterosaurPose(0));
  assert.deepEqual(pterosaurPose(0, 0.8), pterosaurPose(0.8));
});

test('return stroke retraces every pose, including the turnaround and loop seam', () => {
  const turn = FLAP_CYCLE_SECONDS / 2;
  for (const pivot of [turn, FLAP_CYCLE_SECONDS]) {
    for (const delta of [0.001, 0.035, 0.12, 0.18, 0.38, 0.77, 1.31]) {
      const before = pterosaurPose(pivot - delta);
      const after = pterosaurPose(pivot + delta);
      assert.equal(before.frame, after.frame);
      assert.equal(before.nextFrame, after.nextFrame);
      assert.ok(Math.abs(before.blend - after.blend) < 1e-10);
    }
  }
  assert.ok(pterosaurPose(turn).blend > 0.9999);
});
