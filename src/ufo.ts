/** UFOs only enter the obstacle rotation after the player proves they can survive the early run. */
export function shouldSpawnUfo(score: number, roll: number) {
  return score > 2000 && roll < 0.2;
}

export function ufoScaleForFlightMode(flightMode: number) {
  // Mode 4 is the very-high foreground lane, so its UFO can fill open sky.
  return flightMode === 4 ? 2 : 1;
}

let sprite: HTMLImageElement | null = null;

function getSprite() {
  if (!sprite) {
    sprite = new Image();
    sprite.src = '/ufo-detailed.png';
  }
  return sprite;
}

/** A detailed saucer with restrained hover motion, rim-light pulse and scanner glow. */
export function drawUfo(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, size: number) {
  const asset = getSprite();
  const centreX = x + 29;
  const width = 72 * size;
  const height = width * (asset.naturalHeight || 1) / (asset.naturalWidth || 1.775);
  const hover = Math.sin(time * 1.45) * 1.2;
  const tilt = Math.sin(time * 0.72) * 0.012;
  const lightPulse = 0.4 + (Math.sin(time * 3.2) + 1) * 0.18;

  ctx.save();
  ctx.translate(centreX, y + hover);
  ctx.rotate(tilt);
  const scanner = ctx.createRadialGradient(0, height * 0.2, 1, 0, height * 0.28, width * 0.44);
  scanner.addColorStop(0, `rgba(104, 242, 234, ${lightPulse})`);
  scanner.addColorStop(1, 'rgba(104, 242, 234, 0)');
  ctx.fillStyle = scanner;
  ctx.beginPath();
  ctx.ellipse(0, height * 0.28, width * 0.42, height * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  if (asset.complete && asset.naturalWidth) {
    ctx.drawImage(asset, -width / 2, -height / 2, width, height);
  }
  ctx.globalAlpha = lightPulse;
  ctx.strokeStyle = '#e9fcff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, height * 0.04, width * 0.38, height * 0.11, 0, 0.05 * Math.PI, 0.95 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
