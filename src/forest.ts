type Plant = { x: number; kind: number; size: number; layer: number };

type Palette = { dark: string; mid: string; light: string; stem: string };

const nearPalette: Palette = {
  dark: '#456d4d', mid: '#66915c', light: '#91af70', stem: '#6b5b3f'
};
const farPalette: Palette = {
  dark: '#5d8279', mid: '#83a391', light: '#a8baa0', stem: '#797e69'
};

export function createForest() {
  return Array.from({ length: 12 }, (_, index): Plant => ({
    x: (index % 6) * 250 + Math.random() * 70,
    kind: Math.floor(Math.random() * 4),
    size: 0.65 + Math.random() * 0.55,
    layer: Math.floor(index / 6)
  }));
}

function leaflet(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const width = Math.max(1.8, length * 0.31);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.42, -width, length, -width * 0.1);
  ctx.quadraticCurveTo(length * 0.55, width * 0.7, 0, 0);
  ctx.fill();
  ctx.strokeStyle = '#365d453f';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(length * 0.82, 0);
  ctx.stroke();
  ctx.restore();
}

function frond(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number, controlX: number, controlY: number,
  tipX: number, tipY: number, pairs: number, maxLeaf: number, palette: Palette
) {
  ctx.strokeStyle = palette.stem;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
  ctx.stroke();

  for (let index = 1; index <= pairs; index++) {
    const t = index / (pairs + 1);
    const inverse = 1 - t;
    const x = inverse * inverse * baseX + 2 * inverse * t * controlX + t * t * tipX;
    const y = inverse * inverse * baseY + 2 * inverse * t * controlY + t * t * tipY;
    const dx = 2 * inverse * (controlX - baseX) + 2 * t * (tipX - controlX);
    const dy = 2 * inverse * (controlY - baseY) + 2 * t * (tipY - controlY);
    const angle = Math.atan2(dy, dx);
    const length = maxLeaf * Math.pow(Math.sin(Math.PI * t), 0.7);
    leaflet(ctx, x, y, angle - 1.06, length, index % 3 === 0 ? palette.light : palette.mid);
    leaflet(ctx, x, y, angle + 1.06, length * 0.92, index % 2 ? palette.dark : palette.mid);
  }
}

function trunk(ctx: CanvasRenderingContext2D, height: number, bottomWidth: number, palette: Palette) {
  const wood = ctx.createLinearGradient(-bottomWidth, 0, bottomWidth, 0);
  wood.addColorStop(0, '#6b533d');
  wood.addColorStop(0.45, '#a1845d');
  wood.addColorStop(1, '#614e3a');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(-bottomWidth, 0);
  ctx.bezierCurveTo(-bottomWidth * 0.7, -height * 0.33, -4, -height * 0.75, -4, -height);
  ctx.lineTo(4, -height);
  ctx.bezierCurveTo(5, -height * 0.72, bottomWidth * 0.7, -height * 0.36, bottomWidth, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.stem;
  ctx.lineWidth = 1;
  for (let y = -13; y > -height + 8; y -= 13) {
    const half = 4 + (bottomWidth - 4) * (1 + y / height);
    ctx.beginPath();
    ctx.moveTo(-half, y);
    ctx.quadraticCurveTo(0, y + 4, half, y - 1);
    ctx.stroke();
  }
}

function palm(ctx: CanvasRenderingContext2D, palette: Palette, variant: number) {
  trunk(ctx, 145, 10, palette);
  // Each crown frond has a separate curved midrib and paired narrow leaflets.
  for (let index = 0; index < 9; index++) {
    const spread = (index - 4) / 4;
    const variation = Math.sin(variant * 0.017 + index * 2.1);
    frond(ctx, 0, -145, spread * (36 + variation * 4), -188 + Math.abs(spread) * 12 + variation * 5,
      spread * (81 + variation * 9), -176 + Math.abs(spread) * 56 + variation * 6,
      10, 26 + variation * 2, palette);
  }
  ctx.fillStyle = palette.dark;
  ctx.beginPath(); ctx.ellipse(0, -145, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function fern(ctx: CanvasRenderingContext2D, palette: Palette) {
  ctx.fillStyle = palette.stem;
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  for (let index = 0; index < 7; index++) {
    const spread = (index - 3) / 3;
    const reach = Math.abs(spread);
    frond(ctx, 0, -2, spread * 20, -58 + reach * 12,
      spread * 76, -81 + reach * 30, 8, 19 - reach * 2, palette);
  }
  // One young frond curls at the center, a recognizable fern detail.
  ctx.strokeStyle = palette.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, -4);
  ctx.bezierCurveTo(12, -31, 17, -50, 9, -54);
  ctx.bezierCurveTo(2, -59, 0, -48, 7, -47);
  ctx.stroke();
}

function cycad(ctx: CanvasRenderingContext2D, palette: Palette) {
  trunk(ctx, 66, 15, palette);
  ctx.fillStyle = '#8b704c';
  for (let y = -9; y > -59; y -= 10) {
    ctx.beginPath(); ctx.moveTo(-12, y); ctx.lineTo(-3, y - 6); ctx.lineTo(4, y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, y - 3); ctx.lineTo(2, y - 8); ctx.lineTo(-4, y - 4); ctx.fill();
  }
  for (let index = 0; index < 9; index++) {
    const spread = (index - 4) / 4;
    frond(ctx, 0, -68, spread * 29, -99 + Math.abs(spread) * 8,
      spread * 60, -96 + Math.abs(spread) * 45, 7, 17, palette);
  }
}

function broadLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, tipX: number, tipY: number, width: number, color: string) {
  const centerX = (x + tipX) / 2;
  const centerY = (y + tipY) / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(centerX - width, centerY - width * 0.25, tipX, tipY);
  ctx.quadraticCurveTo(centerX + width, centerY + width * 0.25, x, y);
  ctx.fill();
  ctx.strokeStyle = '#315b4259';
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tipX, tipY); ctx.stroke();
  for (const t of [0.38, 0.58, 0.75]) {
    const vx = x + (tipX - x) * t;
    const vy = y + (tipY - y) * t;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx - width * (1 - t) * 0.65, vy - width * (1 - t) * 0.25);
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + width * (1 - t) * 0.65, vy + width * (1 - t) * 0.25);
    ctx.stroke();
  }
}

function broadleafShrub(ctx: CanvasRenderingContext2D, palette: Palette) {
  for (let index = 0; index < 7; index++) {
    const spread = (index - 3) / 3;
    const tipX = spread * 57;
    const tipY = -52 - (1 - Math.abs(spread)) * 13;
    ctx.strokeStyle = palette.stem;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(spread * 14, -32, tipX * 0.55, tipY * 0.72);
    ctx.stroke();
    broadLeaf(ctx, tipX * 0.55, tipY * 0.72, tipX, tipY, 17,
      index % 3 === 0 ? palette.light : index % 2 ? palette.dark : palette.mid);
    if (index % 2 === 0) {
      broadLeaf(ctx, spread * 12, -27, tipX * 0.8 + 14, tipY + 10, 11, palette.mid);
    }
  }
}

export function drawForest(ctx: CanvasRenderingContext2D, plants: Plant[], distance: number, subdued = false) {
  plants.forEach(plant => {
    const far = plant.layer === 0;
    const x = ((plant.x - distance * (far ? 0.15 : 0.35)) % 1500 + 1500) % 1500 - 200;
    ctx.save();
    ctx.translate(x, far ? 320 : 347);
    ctx.scale(plant.size * (far ? 0.8 : 1), plant.size * (far ? 0.8 : 1));
    ctx.transform(1, 0, Math.sin(plant.x * 0.021) * 0.035, 1, 0, 0);
    ctx.globalAlpha = subdued ? (far ? 0.26 : 0.5) : (far ? 0.45 : 0.8);
    const palette = far ? farPalette : nearPalette;
    if (plant.kind === 0) palm(ctx, palette, plant.x);
    else if (plant.kind === 1) fern(ctx, palette);
    else if (plant.kind === 2) cycad(ctx, palette);
    else broadleafShrub(ctx, palette);
    ctx.restore();
  });
}
