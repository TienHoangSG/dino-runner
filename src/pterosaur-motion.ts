type SourceFrame = 0 | 1 | 2 | 3;
type Stage = { duration: number; frame: SourceFrame; nextFrame: SourceFrame };

// The four original frames are the only art source. Short transition stages
// time the switch between poses; horizontal flight occupies most of the cycle.
export const PTEROSAUR_STAGES: readonly Stage[] = [
  { duration: 0.08, frame: 0, nextFrame: 0 },
  { duration: 0.07, frame: 0, nextFrame: 1 },
  { duration: 0.20, frame: 1, nextFrame: 1 },
  { duration: 0.07, frame: 1, nextFrame: 2 },
  { duration: 0.08, frame: 2, nextFrame: 2 },
  { duration: 0.07, frame: 2, nextFrame: 3 },
  { duration: 0.42, frame: 3, nextFrame: 3 },
  { duration: 0.12, frame: 3, nextFrame: 1 },
  { duration: 0.32, frame: 1, nextFrame: 1 },
  { duration: 0.24, frame: 1, nextFrame: 0 }
];

const forwardSeconds = PTEROSAUR_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
export const FLAP_CYCLE_SECONDS = 2 * forwardSeconds;

export function pterosaurPose(timeSeconds: number, offsetSeconds = 0) {
  const elapsed = ((timeSeconds + offsetSeconds) % FLAP_CYCLE_SECONDS + FLAP_CYCLE_SECONDS) % FLAP_CYCLE_SECONDS;
  const phase = Math.min(elapsed, FLAP_CYCLE_SECONDS - elapsed);
  let start = 0;
  for (const stage of PTEROSAUR_STAGES) {
    if (phase < start + stage.duration) {
      const progress = Math.max(0, Math.min(1, (phase - start) / stage.duration));
      const blend = stage.frame === stage.nextFrame ? 0 : progress * progress * (3 - 2 * progress);
      return { frame: stage.frame, nextFrame: stage.nextFrame, blend };
    }
    start += stage.duration;
  }
  const last = PTEROSAUR_STAGES[PTEROSAUR_STAGES.length - 1];
  return { frame: last.frame, nextFrame: last.nextFrame, blend: 1 };
}
