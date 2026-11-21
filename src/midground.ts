/** A quiet middle layer separates the detailed valley from playable foreground objects. */
export function drawMidground(ctx: CanvasRenderingContext2D, distance: number) {
  const drift = -((distance * 0.08) % 240);
  // Lift the dark lower edge of the valley before adding the contrast layer.
  const haze = ctx.createLinearGradient(0, 260, 0, 350);
  haze.addColorStop(0, 'rgba(236, 225, 157, 0.06)');
  haze.addColorStop(1, 'rgba(205, 211, 126, 0.32)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 255, 1000, 95);
  const ridge = ctx.createLinearGradient(0, 255, 0, 350);
  ridge.addColorStop(0, 'rgba(111, 147, 94, 0.22)');
  ridge.addColorStop(1, 'rgba(72, 112, 70, 0.36)');
  ctx.fillStyle = ridge;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  for (let x = -40; x <= 1040; x += 16) {
    const y = 278 + Math.sin((x - drift) / 96) * 9 + Math.sin((x - drift) / 39) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(1000, 350);
  ctx.closePath();
  ctx.fill();

  // Sparse, low silhouettes preserve a clean contrast zone around obstacles.
  ctx.fillStyle = 'rgba(53, 97, 61, 0.34)';
  for (let index = 0; index < 11; index++) {
    const x = ((index * 113 + drift) % 1200 + 1200) % 1200 - 80;
    const height = 18 + (index % 3) * 8;
    ctx.beginPath();
    ctx.moveTo(x, 350);
    ctx.quadraticCurveTo(x + 4, 350 - height, x + 8, 350);
    ctx.quadraticCurveTo(x + 16, 350 - height * 0.72, x + 22, 350);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(236, 246, 199, 0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 1000; x += 12) {
    const y = 279 + Math.sin((x - drift) / 96) * 9 + Math.sin((x - drift) / 39) * 3;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
