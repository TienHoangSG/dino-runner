/** Quiet layers create a light playfield in front of the detailed mountain art. */
export function drawMidground(ctx: CanvasRenderingContext2D, distance: number) {
  // Atmospheric haze removes fine texture where the moving hazards appear.
  const haze = ctx.createLinearGradient(0, 175, 0, 350);
  haze.addColorStop(0, 'rgba(231, 238, 227, 0)');
  haze.addColorStop(0.45, 'rgba(231, 238, 227, 0.38)');
  haze.addColorStop(1, 'rgba(235, 241, 220, 0.78)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 175, 1000, 175);

  // Broad, slow contours keep the distant ridge calm in motion.
  ctx.fillStyle = 'rgba(170, 191, 181, 0.52)';
  ctx.beginPath();
  ctx.moveTo(0, 350);
  for (let x = 0; x <= 1000; x += 10) {
    const shifted = x + distance * 0.035;
    ctx.lineTo(x, 264 + Math.sin(shifted / 205) * 13 + Math.sin(shifted / 91) * 4);
  }
  ctx.lineTo(1000, 350);
  ctx.closePath();
  ctx.fill();

  // A nearly uniform strip directly behind the T-rex and obstacles.
  const playfield = ctx.createLinearGradient(0, 286, 0, 350);
  playfield.addColorStop(0, 'rgba(198, 216, 197, 0.91)');
  playfield.addColorStop(1, 'rgba(181, 204, 175, 0.97)');
  ctx.fillStyle = playfield;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  for (let x = 0; x <= 1000; x += 12) {
    const shifted = x + distance * 0.05;
    ctx.lineTo(x, 298 + Math.sin(shifted / 180) * 9 + Math.sin(shifted / 78) * 2);
  }
  ctx.lineTo(1000, 350);
  ctx.closePath();
  ctx.fill();
}
