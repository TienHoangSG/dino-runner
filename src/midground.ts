/** A quiet middle layer separates the detailed valley from playable foreground objects. */
export function drawMidground(ctx: CanvasRenderingContext2D, distance: number) {
  // A distinct parallax ridge: fast enough to reveal movement, slow enough to stay restful.
  const drift = -((distance * 0.13) % 720);
  const terrainNoise = (cell: number) => ((cell * cell * 13 + cell * 17) % 13 - 6) * 0.72;
  const ridgeY = (x: number) => {
    const shifted = x - drift;
    const coordinate = shifted / 18;
    const cell = Math.floor(coordinate);
    const fraction = coordinate - cell;
    // Blend adjacent terrain samples so irregular rock contours never step between frames.
    const eased = fraction * fraction * (3 - 2 * fraction);
    const uneven = terrainNoise(cell) * (1 - eased) + terrainNoise(cell + 1) * eased;
    return 238 + Math.sin(shifted / 142) * 28 + Math.sin(shifted / 57) * 8 + uneven;
  };
  // Lift the dark lower edge of the valley before adding the moving contrast layer.
  const haze = ctx.createLinearGradient(0, 210, 0, 350);
  haze.addColorStop(0, 'rgba(236, 225, 157, 0.06)');
  haze.addColorStop(1, 'rgba(205, 211, 126, 0.32)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 210, 1000, 140);
  const ridge = ctx.createLinearGradient(0, 205, 0, 350);
  ridge.addColorStop(0, 'rgba(73, 121, 107, 0.5)');
  ridge.addColorStop(1, 'rgba(48, 101, 73, 0.48)');
  ctx.fillStyle = ridge;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  for (let x = -40; x <= 1040; x += 8) {
    // Broad foothills, with a lightly uneven rock contour instead of a smooth wave.
    ctx.lineTo(x, ridgeY(x));
  }
  ctx.lineTo(1000, 350);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(217, 238, 190, 0.46)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 1000; x += 8) {
    const y = ridgeY(x) + 1;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
