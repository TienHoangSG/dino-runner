import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { createForest, drawForest } from './forest';
import { drawGround } from './ground';

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const action = useRef(() => { /* Initialized by the game effect. */ });
  const restart = useRef(() => { /* Initialized by the game effect. */ });
  const duck = useRef(false);
  const [phase, setPhase] = useState('ready');
  const [continues, setContinues] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('fern-best')) || 0; } catch { return 0; } });
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    const forest = createForest();
    let mode = 'ready', y = 0, velocity = 0, distance = 0, speed = 280, wait = 1.5, last = 0, frame = 0;
    const sprite = new Image();
    sprite.src = '/trex-motion.png';
    let animationTime = 0;
    let continueAvailable = true;
    let obstaclePair: boolean[] = [];
    let nextVolcano = Math.random() < 0.5;
    let obstacles: { x: number; w: number; h: number; volcano: boolean; flying: boolean; flightY: number; flightMode: number }[] = [];
    const change = (value: string) => { mode = value; setPhase(value); };
    action.current = () => {
      if (mode === 'revive') {
        continueAvailable = false;
        setContinues(0);
        duck.current = false;
        y = 0;
        velocity = 0;
        obstacles = [];
        wait = 2;
        change('playing');
        return;
      }
      if (mode === 'paused') { change('playing'); return; }
      if (mode !== 'playing') { continueAvailable = true; setContinues(1); duck.current = false; y = 0; velocity = 0; distance = 0; speed = 280; wait = 1.5; obstacles = []; obstaclePair = []; nextVolcano = Math.random() < 0.5; setScore(0); change('playing'); }
      if (y === 0 && !duck.current) velocity = 650;
    };
    restart.current = () => {
      change('ready');
      action.current();
    };
    const key = (event: KeyboardEvent) => { if (['Space', 'ArrowUp'].includes(event.code) && !event.repeat) { event.preventDefault(); action.current(); } };
    const down = (event: KeyboardEvent) => { if (event.code === 'ArrowDown') { event.preventDefault(); duck.current = true; } };
    const up = (event: KeyboardEvent) => { if (event.code === 'ArrowDown') duck.current = false; };
    const blur = () => { duck.current = false; if (mode === 'playing') change('paused'); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    const visibility = () => { if (document.hidden && mode === 'playing') change('paused'); };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    const draw = (time: number) => {
      const dt = Math.min((time - last) / 1000 || 0, 0.035); last = time;
      if (mode === 'playing') {
        animationTime += dt * speed / 280;
        distance += speed * dt; speed = Math.min(680, 280 + Math.floor(distance / 5000) * 40);
        velocity -= 1750 * dt; y = Math.max(0, y + velocity * dt); if (y === 0) velocity = 0;
        wait -= dt;
        if (wait <= 0) {
          // A shuffled pair keeps air and ground balanced, with runs capped at two.
          if (obstaclePair.length === 0) {
            obstaclePair = Math.random() < 0.5 ? [true, false] : [false, true];
          }
          const flying = obstaclePair.pop()!;
          const volcano = !flying && nextVolcano;
          if (!flying) nextVolcano = !nextVolcano;
          const flightMode = Math.floor(Math.random() * 3);
          obstacles.push({
            x: 1000, w: flying ? 58 : volcano ? 64 : 48,
            h: flying ? 35 : volcano ? 48 : 44,
            volcano, flying, flightMode,
            flightY: [301, 286, 330][flightMode]
          });
          wait = 1.25 + Math.random() * 0.7;
        }
        obstacles.forEach(o => o.x -= speed * dt);
        obstacles = obstacles.filter(o => o.x > -80);
        setScore(Math.floor(distance / 10));
        const crouching = duck.current && y === 0;
        const playerTop = 350 - y - (crouching ? 29 : 65);
        if (obstacles.some(o => {
          const left = o.flying ? o.x + 8 : o.x + 6;
          const right = o.flying ? o.x + 53 : o.x + o.w - 6;
          if (170 <= left || 120 >= right) return false;
          // Use spatial overlap for every flight height, including during jumps.
          const bob = Math.sin(animationTime * Math.PI * 5) * 1.5;
          const top = o.flying ? o.flightY + bob - 9 : 350 - o.h + 5;
          const bottom = o.flying ? o.flightY + bob + 7 : 350;
          return playerTop < bottom && 346 - y > top;
        })) {
          duck.current = false;
          change(continueAvailable ? 'revive' : 'over');
          const result = Math.floor(distance / 10);
          setBest(previous => { const next = Math.max(previous, result); try { localStorage.setItem('fern-best', String(next)); } catch { /* Storage may be unavailable. */ } return next; });
        }
      }
      const sky = ctx.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, '#edb999'); sky.addColorStop(1, '#f5dec0'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 1000, 420);
      ctx.fillStyle = '#ffe9b9'; ctx.beginPath(); ctx.arc(780, 95, 46, 0, Math.PI * 2); ctx.fill();
      [0,1,2].forEach(layer => {
        ctx.fillStyle = ['#c0bb9b','#91a18a','#617e70'][layer];
        ctx.beginPath(); ctx.moveTo(0, 350);
        for (let x = 0; x <= 1020; x += 10) ctx.lineTo(x, 230 + layer * 30 + Math.sin((x + distance * (layer + 1) * 0.12) / (140 - layer * 25)) * (36 - layer * 5));
        ctx.lineTo(1000,420); ctx.lineTo(0,420); ctx.fill();
      });
      drawForest(ctx, forest, distance);
      drawGround(ctx, distance);
      const polygon = (points: number[][], color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        points.forEach(([x, yy], index) => { if (index === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); });
        ctx.closePath();
        ctx.fill();
      };
      obstacles.forEach(o => {
        const top = 350 - o.h;
        if (o.flying) {
          const wingBeat = Math.sin(animationTime * Math.PI * 5);
          const bodyY = o.flightY + Math.sin(animationTime * Math.PI * 5) * 1.5;
          ctx.save();
          ctx.translate(o.x + 12, bodyY);
          ctx.scale(0.8, 0.8);
          ctx.lineJoin = 'round';
          ctx.lineWidth = 1.5;
          const wing = (rootX: number, reach: number, depth: number, color: string) => {
            const tipY = -8 - wingBeat * depth;
            ctx.beginPath();
            ctx.moveTo(rootX, 0);
            ctx.quadraticCurveTo(rootX + reach * 0.3, tipY * 0.45 - 8, rootX + reach, tipY);
            ctx.quadraticCurveTo(rootX + reach * 0.75, tipY + 16, rootX + reach * 0.52, tipY * 0.55 + 12);
            ctx.quadraticCurveTo(rootX + reach * 0.2, 16, rootX + 10, 7);
            ctx.closePath();
            ctx.fillStyle = color; ctx.fill();
            ctx.strokeStyle = '#214b50'; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rootX, 0); ctx.lineTo(rootX + reach, tipY);
            ctx.moveTo(rootX + 7, 4); ctx.lineTo(rootX + reach * 0.72, tipY * 0.7 + 6);
            ctx.strokeStyle = '#9b743d'; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.lineWidth = 1.5;
          };
          wing(28, -30, 35, '#d7aa60');
          ctx.beginPath();
          ctx.moveTo(11,-7);
          ctx.quadraticCurveTo(27,-9,40,-2);
          ctx.lineTo(57,4);
          ctx.lineTo(46,9);
          ctx.quadraticCurveTo(27,12,12,2);
          ctx.closePath();
          ctx.fillStyle = '#167f96'; ctx.fill(); ctx.strokeStyle = '#214b50'; ctx.stroke();
          polygon([[5,-10],[14,-16],[26,-19],[20,-9],[24,-4],[10,0]], '#167f96');
          ctx.strokeStyle = '#214b50';
          ctx.beginPath(); ctx.moveTo(5,-10); ctx.lineTo(26,-19); ctx.lineTo(20,-9); ctx.stroke();
          polygon([[7,-8],[-15,3],[12,-1]], '#e7bd6c');
          ctx.beginPath(); ctx.moveTo(-15,3); ctx.lineTo(10,-4); ctx.stroke();
          ctx.fillStyle = '#102f3d'; ctx.beginPath(); ctx.arc(11,-8,2,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff5d8'; ctx.beginPath(); ctx.arc(10.5,-8.5,0.7,0,Math.PI*2); ctx.fill();
          wing(32, 31, 43, '#f2d18b');
          ctx.strokeStyle = '#795a34'; ctx.lineWidth = 1.4;
          for (let toe = 0; toe < 3; toe++) {
            ctx.beginPath(); ctx.moveTo(48,6); ctx.lineTo(57+toe*3,12+toe*2); ctx.stroke();
          }
          ctx.restore();
        } else if (o.volcano) {
          const center = o.x + o.w / 2;
          polygon([[o.x-3,348],[o.x+12,333],[center-10,top],[center+9,top],[o.x+o.w-12,332],[o.x+o.w+3,348],[center+10,352],[center-12,352]], '#643124');
          polygon([[o.x+6,346],[center-10,top+3],[center-3,top+8],[center-10,330],[center-5,349]], '#86452e');
          polygon([[center+9,top+2],[o.x+o.w-7,346],[center+13,343],[center+4,top+12]], '#492a25');
          polygon([[center-11,top],[center+10,top],[center+16,top+17],[center+8,top+13],[center+6,top+28],[center+2,top+10],[center-3,top+20],[center-5,top+9],[center-17,top+23]], '#ee621d');
          ctx.strokeStyle = '#fa8c29'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(center-5,top+13); ctx.lineTo(center-13,top+29); ctx.lineTo(center-19,342);
          ctx.moveTo(center+7,top+19); ctx.lineTo(center+14,top+32); ctx.lineTo(center+17,346); ctx.stroke();
          ctx.fillStyle = '#ffc749'; ctx.beginPath(); ctx.ellipse(center,top+1,10,3,0,0,Math.PI*2); ctx.fill();
          for (let i = 0; i < 4; i++) {
            const drift = (animationTime * 20 + i * 9) % 36;
            ctx.fillStyle = 'rgba(180,188,181,' + (0.6 * (1-drift/36)) + ')';
            ctx.beginPath(); ctx.arc(center+Math.sin(i+animationTime)*7,top-7-drift,5+drift/5,0,Math.PI*2); ctx.fill();
          }
        } else {
          const x = o.x, w = o.w;
          polygon([[x-7,350],[x+5,338],[x+7,top+3],[x+12,top+12],[x+17,top],[x+23,top+14],[x+31,top+6],[x+34,top+18],[x+w-5,top+8],[x+w-4,337],[x+w+8,350],[x+29,346],[x+15,352]], '#503324');
          polygon([[x+8,top+9],[x+13,top+17],[x+17,top+3],[x+20,top+18],[x+17,337],[x+9,346]], '#ab8151');
          polygon([[x+26,top+16],[x+31,top+9],[x+34,top+22],[x+30,342],[x+22,349]], '#926641');
          ctx.strokeStyle = '#36291f'; ctx.lineWidth = 1.4;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.moveTo(x+10+i*8,top+20); ctx.quadraticCurveTo(x+7+i*8,329,x+9+i*8,344); ctx.stroke();
          }
          polygon([[x+12,338],[x-7,350],[x+8,347],[x+19,335]], '#765334');
          polygon([[x+31,336],[x+25,351],[x+34,347],[x+w+8,350],[x+w-4,340]], '#765334');
          [[8,17,5],[29,24,6],[39,35,5],[16,37,6],[4,40,4]].forEach(([mx,my,r]) => {
            ctx.fillStyle = '#5f8b32'; ctx.beginPath(); ctx.ellipse(x+mx,top+my,r,r*1.3,0.3,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#9dbb50'; ctx.beginPath(); ctx.ellipse(x+mx-1,top+my-2,r*0.65,r*0.7,0.3,0,Math.PI*2); ctx.fill();
          });
        }
      });
      const base = 350-y;
      ctx.fillStyle = '#173f3630';
      ctx.beginPath(); ctx.ellipse(139,350,34-y*0.05,5,0,0,Math.PI*2); ctx.fill();
      const crouching = duck.current && y === 0;
      if (sprite.complete && sprite.naturalWidth) {
        const cellWidth = sprite.naturalWidth / 4;
        const cellHeight = sprite.naturalHeight / 2;
        const column = mode === 'playing' && y === 0 ? Math.floor(animationTime * 11) % 4 : 0;
        const row = crouching ? 1 : 0;
        // Both poses use one uniform scale, including their transparent padding.
        const size = 132;
        const height = size * cellHeight / cellWidth;
        const baseline = crouching ? 0.79 : 0.83;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          sprite, column * cellWidth, row * cellHeight, cellWidth, cellHeight,
          66, base - height * baseline, size, height
        );
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <main>
    <header><a href="./" className="brand">fern run<span>↗</span></a><span className="tag">Một chuyến chạy qua rừng cổ đại</span></header>
    <section className="intro"><p className="eyebrow">DINO RUNNER</p><h1>Bước nhảy nhỏ.<br/><em>Cuộc phiêu lưu dài.</em></h1><p>Vượt qua núi lửa và gốc cây, đuổi theo hoàng hôn.<br/>Bạn sẽ chạy được bao xa?</p></section>
    <section className="game">
      <div className="level">CẤP {Math.floor(score / 500) + 1} · Tăng tốc mỗi 500 điểm · Còn {continues} lượt tiếp tục</div>
      <div className="scorebar"><span>{phase === 'playing' ? 'ĐANG CHẠY' : phase === 'revive' ? 'CÒN MỘT CƠ HỘI' : phase === 'over' ? 'KẾT THÚC' : phase === 'paused' ? 'TẠM DỪNG' : 'SẴN SÀNG'}</span><div>ĐIỂM <strong>{String(score).padStart(4,'0')}</strong><span>KỶ LỤC <strong>{String(best).padStart(4,'0')}</strong></span></div></div>
      <div className="stage" onPointerDown={e => { e.preventDefault(); action.current(); }}>
        <canvas ref={canvas} width="1000" height="420" aria-label="Game T-rex nhảy qua núi lửa và đá" />
        {phase !== 'playing' && <div className="overlay"><div><h2>{phase === 'revive' ? 'Bạn còn một mạng!' : phase === 'over' ? 'Thử thêm một lần?' : phase === 'paused' ? 'Hít thở một chút.' : 'Rừng đang chờ bạn.'}</h2><button>{phase === 'revive' ? 'Tiếp tục với điểm hiện tại ↗' : phase === 'over' ? 'Chơi lại ↗' : phase === 'paused' ? 'Tiếp tục ↗' : 'Bắt đầu chạy ↗'}</button>{phase === 'revive' && <button className="restart-button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); restart.current(); }}>Bắt đầu lại từ đầu ↻</button>}</div></div>}
      </div>
      <div className="controls"><span><kbd>SPACE</kbd> hoặc <kbd>↑</kbd> để nhảy</span><span>Giữ <kbd>↓</kbd> để cúi né Pterosaur bay cao, nhảy qua khi bay thấp</span></div>
      <div className="touch-controls">
        <button onClick={() => action.current()}>Nhảy ↑</button>
        <button onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); duck.current = true; }} onPointerUp={() => { duck.current = false; }} onPointerCancel={() => { duck.current = false; }} onLostPointerCapture={() => { duck.current = false; }}>Giữ để cúi ↓</button>
      </div>
    </section><footer><span>Chạy. Nhảy. Và đi xa hơn một chút.</span><span>REACT × CANVAS</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
