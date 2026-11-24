import { pterosaurPose } from './pterosaur-motion';

const eyeAnchors = [
  { x: 200 / 543, y: 245 / 724 },
  { x: 207 / 543, y: 248 / 724 },
  { x: 209 / 543, y: 249 / 724 },
  { x: 211 / 543, y: 249 / 724 }
];

export function drawPterosaurArt(
  ctx: CanvasRenderingContext2D, sprite: HTMLImageElement,
  x: number, flightY: number, size: number, timeSeconds: number, offsetSeconds: number
) {
  if (!sprite.complete || !sprite.naturalWidth) return;
  const frameWidth = sprite.naturalWidth / 4;
  const frameHeight = sprite.naturalHeight;
  const width = 105 * size;
  const height = width * frameHeight / frameWidth;
  const pose = pterosaurPose(timeSeconds, offsetSeconds);
  const frame = pose.blend < 0.5 ? pose.frame : pose.nextFrame;
  const eye = eyeAnchors[frame];

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (size > 1) ctx.filter = 'saturate(0.35) brightness(0.82)';
  ctx.drawImage(
    sprite, frame * frameWidth, 0, frameWidth, frameHeight,
    x + 12 - width * eye.x, flightY - 12 * size - height * eye.y, width, height
  );
  ctx.restore();
}
