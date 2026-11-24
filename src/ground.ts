export function drawGround(ctx: CanvasRenderingContext2D, distance: number, obstacles: readonly { x: number; w: number; h: number; flying: boolean; lavaRock: boolean }[]) {
  ctx.fillStyle = '#81431e';
  ctx.fillRect(0, 350, 1000, 70);
  ctx.beginPath();
  ctx.moveTo(0, 394);
  for (let x = 0; x <= 1010; x += 10) {
    ctx.lineTo(x, 391 + Math.sin((x + distance) / 41) * 5 + Math.sin((x + distance) / 17) * 2);
  }
  ctx.lineTo(1000, 420); ctx.lineTo(0, 420); ctx.closePath();
  ctx.fillStyle = '#66301d'; ctx.fill();

  for (let i = 0; i < 30; i++) {
    const x = ((i * 47 - distance) % 1410 + 1410) % 1410 - 80;
    const y = 365 + (i * 17 % 49);
    ctx.fillStyle = i % 3 === 0 ? '#bd8950' : '#5b2c18';
    ctx.beginPath();
    ctx.ellipse(x, y, 1.5 + i % 3, 1 + i % 2, i, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 15; i++) {
    const x = ((i * 97 - distance) % 1455 + 1455) % 1455 - 50;
    ctx.strokeStyle = '#b99660'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 355); ctx.quadraticCurveTo(x - 4, 361, x + 2, 369);
    ctx.moveTo(x - 1, 361); ctx.lineTo(x - 7, 367);
    ctx.moveTo(x, 365); ctx.lineTo(x + 6, 372); ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const x = ((i * 281 - distance) % 1405 + 1405) % 1405 - 60;
    const y = 382 + i % 2 * 20;
    ctx.save(); ctx.translate(x, y); ctx.rotate(i % 2 ? -0.4 : 0.25);
    ctx.strokeStyle = '#e6d09a'; ctx.fillStyle = '#e6d09a'; ctx.lineWidth = 3;
    if (i % 3 === 0) {
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
      [-11, 11].forEach(end => {
        ctx.beginPath(); ctx.arc(end, -2, 2.8, 0, Math.PI * 2); ctx.arc(end, 2, 2.8, 0, Math.PI * 2); ctx.fill();
      });
    } else if (i % 3 === 1) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for(let step = 0; step < 70; step++) {
        const angle = step * 0.2, radius = step * 0.11;
        const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
        if(step === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0,0,10,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#66301d';
      ctx.beginPath(); ctx.ellipse(-2,-1,3,3,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5,1,2,1.5,0,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // Flat walking edge keeps the visible surface aligned with collision physics.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1000, 420);
  for (const obstacle of obstacles) {
    if (obstacle.flying || obstacle.lavaRock) continue;
    // Expose soil beneath the root crown, including the gaps between roots.
    const center = obstacle.x + obstacle.w / 2;
    const radius = 38 * obstacle.h / 44;
    ctx.moveTo(center + radius, 352);
    ctx.ellipse(center, 352, radius, 15, 0, 0, Math.PI * 2);
    ctx.closePath();
  }
  ctx.clip('evenodd');
  ctx.fillStyle = '#4f651b'; ctx.fillRect(0,350,1000,8);
  ctx.fillStyle = '#8eaf20'; ctx.fillRect(0,350,1000,5);
  for (let i = 0; i < 100; i++) {
    const x = ((i * 13 - distance) % 1300 + 1300) % 1300 - 25;
    const height = 3 + i * 7 % 8;
    ctx.fillStyle = i % 3 ? '#a5c92d' : '#74991b';
    ctx.beginPath(); ctx.moveTo(x-3,351); ctx.lineTo(x-4,350-height);
    ctx.lineTo(x,348); ctx.lineTo(x+3,345-height);
    ctx.lineTo(x+4,351); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
