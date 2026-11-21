export function createDistantDragon() {
  const sprite = new Image();
  sprite.src = '/dragon-transparent-motion.png';

  return (ctx: CanvasRenderingContext2D, time: number, distance: number) => {
    if (!sprite.complete || !sprite.naturalWidth) return;
    const cycle = time % 9;
    const flameTime = cycle - 7.5;
    const frame = Math.floor(time * 5) % 4;
    const cellWidth = sprite.naturalWidth / 4;
    const cellHeight = sprite.naturalHeight / 2;
    const width = 165;
    const height = width * cellHeight / cellWidth;
    const appearanceInterval = 1400 / 0.3;
    const x = ((distance * 1.03 + 450) % appearanceInterval + appearanceInterval) % appearanceInterval - 200;
    const smooth = (value: number) => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    };
    const descent = cycle >= 5.8 ? smooth((cycle - 5.8) / 1.7) : 1 - smooth(cycle / 1.8);
    const y = 38 + Math.sin(time * 0.85) * 10 + descent * 125;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    const drawFrame = () => ctx.drawImage(sprite, frame * cellWidth, 0, cellWidth, cellHeight, 0, 0, width, height);
    const tailStart = width * 0.65;
    const tailTop = height * 0.51;
    const tailBottom = height * 0.67;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.rect(tailStart, tailTop, width - tailStart, tailBottom - tailTop);
    ctx.clip('evenodd');
    drawFrame();
    ctx.restore();
    // Bend the distal tail progressively, with no displacement at its root.
    const segments = 24;
    const segmentWidth = (width - tailStart) / segments;
    for (let segment = 0; segment < segments; segment++) {
      const progress = segment / (segments - 1);
      const wave = (Math.sin(time * 4.2 - progress * 2.4) * 11 + Math.sin(time * 2.1 - progress * 4) * 4) * progress * progress;
      ctx.save();
      ctx.translate(0, wave);
      ctx.beginPath();
      ctx.rect(tailStart + segment * segmentWidth, tailTop, segmentWidth + 0.3, tailBottom - tailTop);
      ctx.clip();
      drawFrame();
      ctx.restore();
    }

    // Overlay fire on the same flight frames so the dragon never changes identity.
    if (flameTime >= 0) {
      const strength = Math.sin(flameTime / 1.5 * Math.PI);
      const mouthX = width * 0.09;
      const mouthY = height * 0.65;
      const length = strength * (42 + Math.sin(time * 29) * 3);
      const gradient = ctx.createLinearGradient(mouthX, mouthY, mouthX - Math.max(1, length), mouthY + 9);
      gradient.addColorStop(0, '#fff6b0');
      gradient.addColorStop(0.35, '#ffbc37');
      gradient.addColorStop(0.75, '#ef5c19');
      gradient.addColorStop(1, 'rgba(230,66,12,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(mouthX, mouthY - 1);
      ctx.quadraticCurveTo(mouthX - length * 0.5, mouthY - 7 * strength, mouthX - length, mouthY + 12 * strength);
      ctx.quadraticCurveTo(mouthX - length * 0.65, mouthY + 3 * strength, mouthX - length * 0.85, mouthY + 17 * strength);
      ctx.quadraticCurveTo(mouthX - length * 0.3, mouthY + 11 * strength, mouthX, mouthY + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
}
