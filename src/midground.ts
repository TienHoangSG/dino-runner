/** A restrained foothill separates the detailed valley from playable objects. */
export function drawMidground(ctx: CanvasRenderingContext2D, distance: number) {
  // Soften detail and lift the dark valley behind the player and obstacles.
  const veil = ctx.createLinearGradient(0, 205, 0, 350);
  veil.addColorStop(0, 'rgba(221, 230, 198, 0)');
  veil.addColorStop(0.55, 'rgba(218, 228, 195, 0.26)');
  veil.addColorStop(1, 'rgba(218, 228, 195, 0.55)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 205, 1000, 145);

  const ridge = ctx.createLinearGradient(0, 245, 0, 350);
  ridge.addColorStop(0, 'rgba(111, 151, 150, 0.36)');
  ridge.addColorStop(1, 'rgba(105, 143, 135, 0.44)');
  ctx.fillStyle = ridge;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  for (let x = 0; x <= 1000; x += 12) {
    // Broad shapes travel continuously; small high-frequency bumps and outlines
    // caused flicker and competed visually with the moving silhouettes.
    const shifted = x + distance * 0.055;
    const y = 276 + Math.sin(shifted / 175) * 15 + Math.sin(shifted / 67) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(1000, 350);
  ctx.closePath();
  ctx.fill();
}
