import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { createForest, drawForest } from './forest';
import { drawMidground } from './midground';
import { drawGround } from './ground';
import { createDistantDragon } from './dragon';
import { swipeDirection } from './swipe';
import { canPterosaurJump, pterosaurLandingHeight } from './jump';
import { hitsGroundObstacle } from './collision';
import { drawUfo, shouldSpawnUfo, ufoScaleForFlightMode } from './ufo';
import { backgroundModeFromStored, type BackgroundMode } from './background';
import { canRestartAfterGameOver } from './restart';

function App() {
  const gameContainer = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [rotateLayout, setRotateLayout] = useState(false);
  useEffect(() => {
    const updateOrientation = () => {
      const touchDevice = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
      setRotateLayout(touchDevice && window.innerHeight > window.innerWidth);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    screen.orientation?.addEventListener('change', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      screen.orientation?.removeEventListener('change', updateOrientation);
    };
  }, []);
  const canvas = useRef<HTMLCanvasElement>(null);
  const action = useRef<(usedRestartButton?: boolean) => void>(() => { /* Initialized by the game effect. */ });
  const duck = useRef(false);
  const gesture = useRef<{ id: number; x: number; y: number; direction: string | null } | null>(null);
  const [phase, setPhase] = useState('ready');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(() => {
    try { return backgroundModeFromStored(localStorage.getItem('fern-background')); } catch { return 'detailed'; }
  });
  const detailedBackground = useRef(backgroundMode === 'detailed');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('fern-best')) || 0; } catch { return 0; } });
  useEffect(() => {
    const container = gameContainer.current;
    const preventSelection = (event: Event) => event.preventDefault();
    container?.addEventListener('selectstart', preventSelection);
    return () => container?.removeEventListener('selectstart', preventSelection);
  }, []);
  useEffect(() => {
    detailedBackground.current = backgroundMode === 'detailed';
    try { localStorage.setItem('fern-background', backgroundMode); } catch { /* Storage may be unavailable. */ }
  }, [backgroundMode]);
  useEffect(() => {
    const syncFullscreen = () => {
      setExpanded(document.fullscreenElement === gameContainer.current);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && !document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      window.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);
  const toggleFullscreen = async () => {
    if (expanded) {
      if (document.fullscreenElement) await document.exitFullscreen();
      screen.orientation?.unlock?.();
      setExpanded(false);
      return;
    }
    setExpanded(true);
    try {
      if (gameContainer.current?.requestFullscreen) {
        await gameContainer.current.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
        try { await orientation.lock?.('landscape'); } catch { /* Manual rotation remains available. */ }
      }
    } catch { /* The expanded layout also works when native fullscreen is unavailable. */ }
  };
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    const forest = createForest();
    const drawDragon = createDistantDragon();
    let mode = 'ready', y = 0, velocity = 0, distance = 0, speed = 280, wait = 1.5, last = 0, frame = 0, gameOverAt = 0;
    const sprite = new Image();
    sprite.src = '/trex-motion.png';
    const pterosaur = new Image();
    pterosaur.src = '/pterosaur-orange-flight.png';
    const mountainLandscape = new Image();
    mountainLandscape.src = '/prehistoric-mountain-valley.png';
    const mountainPass = new Image();
    mountainPass.src = '/prehistoric-mountain-pass.png';
    let animationTime = 0;
    let extraJumpUsed = false;
    let jumpPulse = 0;
    let obstaclePair: boolean[] = [];
    let nextVolcano = Math.random() < 0.5;
    let obstacles: { x: number; w: number; h: number; volcano: boolean; flying: boolean; ufo: boolean; flightY: number; flightMode: number; size: number }[] = [];
    const drawPterosaur = (x: number, flightY: number, size: number, phase = 0) => {
          if (pterosaur.complete && pterosaur.naturalWidth) {
            const frameWidth = pterosaur.naturalWidth / 4;
            const frameHeight = pterosaur.naturalHeight;
            const flightFrame = Math.floor(animationTime * 4.5 + phase) % 4;
            // Register frames by the eye, rather than the changing wing bounds.
            const eyeAnchors = [
              { x: 200 / 543, y: 245 / 724 },
              { x: 207 / 543, y: 248 / 724 },
              { x: 209 / 543, y: 249 / 724 },
              { x: 211 / 543, y: 249 / 724 }
            ];
            const eye = eyeAnchors[flightFrame];
            const width = 105 * size;
            const height = width * frameHeight / frameWidth;
            ctx.save();
            if (size > 1) ctx.filter = 'saturate(0.35) brightness(0.82)';
            ctx.drawImage(
              pterosaur, flightFrame * frameWidth, 0, frameWidth, frameHeight,
              x + 12 - width * eye.x, flightY - 12 * size - height * eye.y, width, height
            );
            ctx.restore();
          }
    };
    const change = (value: string) => { mode = value; setPhase(value); };
    action.current = (usedRestartButton = false) => {
      if (mode === 'paused') { change('playing'); return; }
      if (mode === 'over' && !canRestartAfterGameOver(performance.now() - gameOverAt, usedRestartButton)) return;
      if (mode !== 'playing') { extraJumpUsed = false; jumpPulse = 0; duck.current = false; y = 0; velocity = 0; distance = 0; speed = 280; wait = 1.5; obstacles = []; obstaclePair = []; nextVolcano = Math.random() < 0.5; setScore(0); change('playing'); }
      if (y === 0 && !duck.current) {
        velocity = 650;
      } else if (canPterosaurJump(y, extraJumpUsed, obstacles)) {
        velocity = 650;
        extraJumpUsed = true;
        jumpPulse = 0.28;
      }
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
        const previousHeight = y;
        velocity -= 1750 * dt; y = Math.max(0, y + velocity * dt); if (y === 0) { velocity = 0; extraJumpUsed = false; }
        jumpPulse = Math.max(0, jumpPulse - dt);
        wait -= dt;
        if (wait <= 0) {
          // A shuffled pair keeps air and ground balanced, with runs capped at two.
          if (obstaclePair.length === 0) {
            obstaclePair = Math.random() < 0.5 ? [true, false] : [false, true];
          }
          const flying = obstaclePair.pop()!;
          const volcano = !flying && nextVolcano;
          if (!flying) nextVolcano = !nextVolcano;
          const flightMode = Math.floor(Math.random() * 5);
          const baseSize = Math.random() < 0.5 ? 0.75 : 1.1;
          const ufo = flying && shouldSpawnUfo(Math.floor(distance / 10), Math.random());
          const size = baseSize * (ufo ? ufoScaleForFlightMode(flightMode) : 1);
          obstacles.push({
            x: 1000, w: flying ? 58 : volcano ? 64 : 48,
            h: flying ? 35 : volcano ? 48 : 44,
            volcano, flying, ufo, flightMode, size,
            flightY: [301, 286, 330, 145, 70][flightMode]
          });
          wait = 1.25 + Math.random() * 0.7;
        }
        obstacles.forEach(o => o.x -= speed * dt);
        obstacles = obstacles.filter(o => o.x > -80);
        const landingHeight = pterosaurLandingHeight(previousHeight, y, velocity, obstacles);
        if (landingHeight !== null) {
          y = landingHeight;
          velocity = 0;
        }
        setScore(Math.floor(distance / 10));
        const crouching = duck.current && y === 0;
        const playerTop = 350 - y - (crouching ? 29 : 65);
        if (obstacles.some(o => {
          if (!o.flying) return hitsGroundObstacle({ left: 120, right: 170, top: playerTop, bottom: 346 - y }, o);
          const left = o.x + 29 - 22 * o.size;
          const right = o.x + 29 + 22 * o.size;
          if (170 <= left || 120 >= right) return false;
          // Use spatial overlap for every flight height, including during jumps.
          const bob = 0;
          const top = o.flightY + bob - 9 * o.size;
          const bottom = o.flightY + bob + 7 * o.size;
          return playerTop < bottom && 346 - y > top;
        })) {
          duck.current = false;
          gameOverAt = performance.now();
          change('over');
          const result = Math.floor(distance / 10);
          setBest(previous => { const next = Math.max(previous, result); try { localStorage.setItem('fern-best', String(next)); } catch { /* Storage may be unavailable. */ } return next; });
        }
      }
      const detailed = detailedBackground.current && mountainLandscape.complete && mountainLandscape.naturalWidth;
      if (detailed) {
        ctx.drawImage(mountainLandscape, 0, 0, 1000, 420);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, '#edb999'); sky.addColorStop(1, '#f5dec0'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 1000, 420);
        ctx.fillStyle = '#ffe9b9'; ctx.beginPath(); ctx.arc(780, 95, 46, 0, Math.PI * 2); ctx.fill();
        [0,1,2].forEach(layer => {
          ctx.fillStyle = ['#c0bb9b','#91a18a','#617e70'][layer];
          ctx.beginPath(); ctx.moveTo(0, 350);
          for (let x = 0; x <= 1020; x += 10) ctx.lineTo(x, 230 + layer * 30 + Math.sin((x + distance * (layer + 1) * 0.12) / (140 - layer * 25)) * (36 - layer * 5));
          ctx.lineTo(1000,420); ctx.lineTo(0,420); ctx.fill();
        });
      }
      drawDragon(ctx, animationTime, distance);
      if (detailed) {
        if (mountainPass.complete && mountainPass.naturalWidth) {
          ctx.save();
          ctx.globalAlpha = 0.78;
          ctx.drawImage(mountainPass, 0, 0, 1000, 420);
          ctx.restore();
        }
        drawMidground(ctx, distance);
      }
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
          const bodyY = o.flightY;
          if (o.ufo) drawUfo(ctx, o.x, bodyY, animationTime, o.size);
          else drawPterosaur(o.x, bodyY, o.size);
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
          // Broad root flare anchors the obstacle to the running surface.
          ctx.fillStyle = '#263f2a40';
          ctx.beginPath(); ctx.ellipse(x+w/2,351,w/2+10,3,0,0,Math.PI*2); ctx.fill();
          polygon([[x-7,350],[x+5,338],[x+7,top+5],[x+12,top+13],[x+16,top],[x+21,top+10],[x+27,top+7],[x+31,top+17],[x+w-6,top+3],[x+w-4,336],[x+w+8,350],[x+29,347],[x+16,352]], '#3c291f');
          const wood = ctx.createLinearGradient(x,0,x+w,0);
          wood.addColorStop(0,'#6a442b'); wood.addColorStop(0.4,'#a1784b'); wood.addColorStop(0.65,'#64402a'); wood.addColorStop(1,'#38271e');
          ctx.fillStyle = wood;
          ctx.beginPath(); ctx.moveTo(x+8,top+15); ctx.lineTo(x+16,top+4);
          ctx.lineTo(x+21,top+15); ctx.lineTo(x+29,top+12); ctx.lineTo(x+33,top+23);
          ctx.lineTo(x+w-7,top+12); ctx.lineTo(x+w-6,337); ctx.lineTo(x+31,347);
          ctx.lineTo(x+15,347); ctx.lineTo(x+7,339); ctx.closePath(); ctx.fill();
          polygon([[x+12,top+14],[x+16,top+2],[x+20,top+12],[x+18,top+21]], '#d3b17a');
          polygon([[x+w-13,top+17],[x+w-6,top+4],[x+w-6,top+15],[x+w-11,top+27]], '#b99863');
          ctx.strokeStyle = '#402b20'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 5; i++) {
            const bx = x+10+i*7;
            ctx.beginPath(); ctx.moveTo(bx,top+22+i%2*3);
            ctx.bezierCurveTo(bx-4,top+30,bx+3,337,bx-3,346); ctx.stroke();
          }
          ctx.fillStyle = '#2b231b'; ctx.beginPath();
          ctx.ellipse(x+27,top+29,4,8,-0.15,0,Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#be925b'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(x+27,top+29,6,10,-0.15,0.2,Math.PI*1.5); ctx.stroke();
          polygon([[x+11,335],[x+2,345],[x-7,350],[x+8,347],[x+18,338]], '#926540');
          polygon([[x+31,337],[x+24,352],[x+33,348],[x+w+8,350],[x+w-4,339]], '#765034');
          ctx.strokeStyle = '#c29960'; ctx.lineWidth = 1;
          ctx.beginPath();ctx.moveTo(x+11,340);ctx.lineTo(x+1,347);
          ctx.moveTo(x+32,341);ctx.lineTo(x+29,348);ctx.stroke();
          [[8,22,4],[17,37,5],[38,32,4],[4,40,4]].forEach(([mx,my,r]) => {
            ctx.fillStyle = '#496e2d'; ctx.beginPath(); ctx.ellipse(x+mx,top+my,r+2,r*1.2,0.3,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#87a744'; ctx.beginPath(); ctx.ellipse(x+mx-1,top+my-2,r,r*0.8,0.3,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#b4c568'; ctx.beginPath(); ctx.arc(x+mx-2,top+my-3,1,0,Math.PI*2);ctx.fill();
          });
        }
      });
      const base = 350-y;
      if (jumpPulse > 0) {
        ctx.save();
        ctx.globalAlpha = jumpPulse / 0.28;
        ctx.strokeStyle = '#fff2be';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(140, base + 4, 12 + (0.28 - jumpPulse) * 60, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
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

    <section ref={gameContainer} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()} className={expanded ? `game expanded${rotateLayout ? " force-landscape" : ""}` : "game"}>


      <div className="level">CẤP {Math.floor(score / 500) + 1} · Tăng tốc mỗi 500 điểm</div>
      <div className="scorebar"><span>{phase === 'playing' ? 'ĐANG CHẠY' : phase === 'over' ? 'KẾT THÚC' : phase === 'paused' ? 'TẠM DỪNG' : 'SẴN SÀNG'}</span><div>ĐIỂM <strong>{String(score).padStart(4,'0')}</strong><span>KỶ LỤC <strong>{String(best).padStart(4,'0')}</strong></span></div></div>
      <div className="stage" onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        if (event.pointerType === 'mouse') { action.current(); return; }
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: null };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId || current.direction) return;
        const direction = swipeDirection(event.clientX - current.x, event.clientY - current.y, expanded && rotateLayout);
        if (!direction) return;
        current.direction = direction;
        if (direction === 'jump') action.current();
        else duck.current = true;
      }} onPointerUp={event => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        gesture.current = null;
        if (current.direction === 'duck') duck.current = false;
        else if (!current.direction) action.current();
      }} onPointerCancel={() => { gesture.current = null; duck.current = false; }}
      onLostPointerCapture={() => { gesture.current = null; duck.current = false; }}>
        <canvas ref={canvas} width="1000" height="420" aria-label="Game T-rex nhảy qua núi lửa và đá" />
        {phase !== 'playing' && <div className="overlay"><div><h2>{phase === 'over' ? 'Thử thêm một lần?' : phase === 'paused' ? 'Hít thở một chút.' : 'Rừng đang chờ bạn.'}</h2><button onPointerDown={event => { event.stopPropagation(); action.current(true); }} onClick={event => event.stopPropagation()}>{phase === 'over' ? 'Chơi lại ↗' : phase === 'paused' ? 'Tiếp tục ↗' : 'Bắt đầu chạy ↗'}</button></div></div>}
        <button className="fullscreen-button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); void toggleFullscreen(); }} aria-label={expanded ? "Thoát toàn màn hình" : "Toàn màn hình"} title={expanded ? "Thoát toàn màn hình" : "Toàn màn hình"}><span aria-hidden="true">{expanded ? '⊡' : '⛶'}</span></button>
      </div>
      <div className="controls"><span><kbd>SPACE</kbd> hoặc <kbd>↑</kbd> để nhảy</span><span>Giữ <kbd>↓</kbd> để cúi</span></div>
      <div className="background-options" role="group" aria-label="Kiểu nền">
        <span>Nền</span>
        <button className={backgroundMode === 'detailed' ? 'active' : ''} aria-pressed={backgroundMode === 'detailed'} onClick={() => setBackgroundMode('detailed')}>Chi tiết</button>
        <button className={backgroundMode === 'simple' ? 'active' : ''} aria-pressed={backgroundMode === 'simple'} onClick={() => setBackgroundMode('simple')}>Đơn giản</button>
      </div>

    </section>
    <p className="swipe-guide">Vuốt lên để nhảy · Vuốt xuống và giữ để cúi · Nhấc tay để đứng lên</p>
    <section className="intro"><div><p className="eyebrow">DINO RUNNER</p><h1>Chạy vào <em>kỷ tiền sử.</em></h1></div><p>Nhảy qua vật cản. Cúi né Pterosaur.<br/>Lập kỷ lục của riêng bạn.</p></section>
    <footer><span>Mỗi 500 điểm, cuộc đua nhanh hơn.</span><span>FERN RUN</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
