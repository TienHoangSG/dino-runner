type Plant = { x: number; kind: number; size: number; layer: number };

export function createForest() {
  return Array.from({ length: 12 }, (_, index): Plant => ({
    x: (index % 6) * 250 + Math.random() * 70,
    kind: Math.floor(Math.random() * 4),
    size: 0.65 + Math.random() * 0.55,
    layer: Math.floor(index / 6)
  }));
}

export function drawForest(ctx: CanvasRenderingContext2D, plants: Plant[], distance: number) {
  const leaf = (x: number, y: number, length: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.65, -length * 0.35, length, 0);
    ctx.quadraticCurveTo(length * 0.6, length * 0.2, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#638651';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.9, 0);
    ctx.stroke();
    ctx.restore();
  };

  plants.forEach(plant => {
    const far = plant.layer === 0;
    const x = ((plant.x - distance * (far ? 0.15 : 0.35)) % 1500 + 1500) % 1500 - 200;
    ctx.save();
    ctx.translate(x, far ? 320 : 347);
    ctx.scale(plant.size * (far ? 0.8 : 1), plant.size * (far ? 0.8 : 1));
    ctx.globalAlpha = far ? 0.45 : 0.8;
    const green = far ? '#698c72' : '#527d46';
    const light = far ? '#8ba185' : '#87a85a';

    if (plant.kind === 0) {
      // Palm with ringed trunk and long drooping fronds.
      ctx.fillStyle = '#8c7051';
      ctx.beginPath();
      ctx.moveTo(-8, 0); ctx.lineTo(-3, -142);
      ctx.lineTo(5, -145); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#655b42'; ctx.lineWidth = 2;
      for (let y = -12; y > -140; y -= 13) {
        ctx.beginPath(); ctx.moveTo(-5, y); ctx.lineTo(6, y - 2); ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI + i * Math.PI / 7;
        const endX = Math.cos(angle) * 65;
        const endY = -140 + Math.sin(angle) * 33 + 25;
        ctx.strokeStyle = green; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -140);
        ctx.quadraticCurveTo(endX * 0.55, -185, endX, endY); ctx.stroke();
        for (let j = 1; j < 7; j++) {
          const t = j / 7;
          const px = endX * t;
          const py = (1-t)*(1-t)*-140 + 2*(1-t)*t*-185 + t*t*endY;
          leaf(px, py, 20-j, angle + 0.9, j % 2 ? light : green);
          leaf(px, py, 18-j, angle - 0.9, green);
        }
      }
    } else if (plant.kind === 1) {
      // Low fern with individually articulated leaflets.
      for (let i = 0; i < 7; i++) {
        const angle = -Math.PI + 0.2 + i * (Math.PI - 0.4) / 6;
        ctx.save(); ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = green; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(8,-35,0,-70); ctx.stroke();
        for (let j = 1; j < 8; j++) {
          leaf(3,-j*8,20-j*1.7,-0.45,j%2?green:light);
          leaf(3,-j*8,20-j*1.7,Math.PI+0.45,green);
        }
        ctx.restore();
      }
    } else if (plant.kind === 2) {
      ctx.fillStyle = '#947451';
      ctx.beginPath(); ctx.moveTo(-13,0); ctx.lineTo(-7,-66);
      ctx.lineTo(8,-66); ctx.lineTo(14,0); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 9; i++) leaf(0,-62,42+(i%3)*6,-Math.PI+i*Math.PI/8,i%2?green:light);
    } else {
      // Fan-leaf plant.
      for (let i = 0; i < 5; i++) {
        const x = (i-2)*17;
        const y = -45-(i%2)*20;
        ctx.strokeStyle = green; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(x, -20,x,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y);
        ctx.arc(x,y,22,-Math.PI*0.95,-Math.PI*0.05); ctx.closePath();
        ctx.fillStyle = i%2?light:green; ctx.fill();
        ctx.strokeStyle = '#9bb97d'; ctx.lineWidth = 0.8;
        for(let ray=0;ray<5;ray++){
          const angle=-Math.PI*0.9+ray*Math.PI*0.2;
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*20,y+Math.sin(angle)*20);ctx.stroke();
        }
      }
    }
    ctx.restore();
  });
}

