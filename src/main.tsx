import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { createForest, drawForest } from './forest';
import { drawMidground } from './midground';
import { drawGround } from './ground';
import { createDistantDragon } from './dragon';
import { swipeDirection } from './swipe';
import { canPterosaurJump, pterosaurLandingHeight } from './jump';
import { tallRockOutline, rockOutline, hitsGroundObstacle } from './collision';
import { drawUfo, shouldSpawnUfo, ufoScaleForFlightMode } from './ufo';
import { backgroundModeFromStored, type BackgroundMode } from './background';
import { canRestartAfterGameOver } from './restart';
import { loadLeaderboard, saveBestScore, type Ranking } from './leaderboard';
import { languageFromStored, messages, type Language } from './i18n';
import { FLAP_CYCLE_SECONDS } from './pterosaur-motion';
import { drawPterosaurArt } from './pterosaur-art';

const bestKey = (name: string) => `fern-best:${name.toLocaleLowerCase('vi')}`;

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try { return languageFromStored(localStorage.getItem('fern-language')); } catch { return 'vi'; }
  });
  const t = messages[language];
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('fern-language', language); } catch { /* Storage may be unavailable. */ }
  }, [language]);
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
  const [playerName, setPlayerName] = useState(() => { try { return localStorage.getItem('fern-player-name') || ''; } catch { return ''; } });
  const [nameDraft, setNameDraft] = useState(playerName);
  const playerNameRef = useRef(playerName);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingError, setRankingError] = useState<'unavailable' | 'saveFailed' | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const leaderboardOpenRef = useRef(false);
  const pauseGame = useRef<() => void>(() => { /* Initialized by the game effect. */ });
  const leaderboardButton = useRef<HTMLButtonElement>(null);
  const closeLeaderboardButton = useRef<HTMLButtonElement>(null);
  const refreshRankings = () => loadLeaderboard().then(entries => { setRankings(entries); setRankingError(null); }).catch(() => setRankingError('unavailable'));
  useEffect(() => { void refreshRankings(); }, []);
  useEffect(() => {
    if (!leaderboardOpen) return;
    closeLeaderboardButton.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { leaderboardOpenRef.current = false; setLeaderboardOpen(false); leaderboardButton.current?.focus(); }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [leaderboardOpen]);
  const openLeaderboard = () => {
    pauseGame.current();
    leaderboardOpenRef.current = true;
    setLeaderboardOpen(true);
    void refreshRankings();
  };
  const closeLeaderboard = () => {
    leaderboardOpenRef.current = false;
    setLeaderboardOpen(false);
    leaderboardButton.current?.focus();
  };
  const savePlayerName = (event: React.FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 24 || /[<>]/u.test(name) || Array.from(name).some(char => char.charCodeAt(0) < 32)) return;
    playerNameRef.current = name;
    setPlayerName(name);
    try { setBest(Number(localStorage.getItem(bestKey(name))) || 0); } catch { setBest(0); }
    try { localStorage.setItem('fern-player-name', name); } catch { /* Storage may be unavailable. */ }
  };
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(() => {
    try { return backgroundModeFromStored(localStorage.getItem('fern-background')); } catch { return 'simple'; }
  });
  const detailedBackground = useRef(backgroundMode === 'detailed');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(bestKey(playerName))) || 0; } catch { return 0; } });
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
    const stump = new Image();
    stump.src = '/weathered-stump.png';
    const pterosaur = new Image();
    pterosaur.src = '/pterosaur-orange-flight.png';
    const mountainLandscape = new Image();
    mountainLandscape.src = '/prehistoric-mountain-valley.png';
    const mountainPass = new Image();
    mountainPass.src = '/prehistoric-mountain-pass.png';
    let animationTime = 0;
    let flapTime = 0;
    let extraJumpUsed = false;
    let jumpPulse = 0;
    let obstaclePair: boolean[] = [];
    let nextLavaRock = Math.random() < 0.5;
    let obstacles: { x: number; w: number; h: number; tall: boolean; lavaRock: boolean; flying: boolean; ufo: boolean; flightY: number; flightMode: number; size: number; flapOffset: number }[] = [];
    const change = (value: string) => { mode = value; setPhase(value); };
    pauseGame.current = () => { if (mode === 'playing') change('paused'); };
    action.current = (usedRestartButton = false) => {
      if (!playerNameRef.current || leaderboardOpenRef.current) return;
      if (mode === 'paused') { change('playing'); return; }
      if (mode === 'over' && !canRestartAfterGameOver(performance.now() - gameOverAt, usedRestartButton)) return;
      if (mode !== 'playing') { extraJumpUsed = false; jumpPulse = 0; duck.current = false; y = 0; velocity = 0; distance = 0; speed = 280; wait = 1.5; obstacles = []; obstaclePair = []; nextLavaRock = Math.random() < 0.5; setScore(0); change('playing'); }
      if (y === 0 && !duck.current) {
        velocity = 650;
      } else if (canPterosaurJump(y, extraJumpUsed, obstacles)) {
        velocity = 650;
        extraJumpUsed = true;
        jumpPulse = 0.28;
      }
    };
    const key = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (['Space', 'ArrowUp'].includes(event.code) && !event.repeat) { event.preventDefault(); action.current(); }
    };
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
        flapTime += dt;
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
          const lavaRock = !flying && nextLavaRock;
          if (!flying) nextLavaRock = !nextLavaRock;
          const flightMode = Math.floor(Math.random() * 5);
          const baseSize = Math.random() < 0.5 ? 0.75 : 1.1;
          const ufo = flying && shouldSpawnUfo(Math.floor(distance / 10), Math.random());
          const size = baseSize * (ufo ? ufoScaleForFlightMode(flightMode) : 1);
          const tall = !flying && Math.random() < 0.35;
          obstacles.push({
            x: 1000, w: flying ? 58 : lavaRock ? 64 : 48,
            h: flying ? 35 : (lavaRock ? 40 : 44) + (tall ? 7 : 0),
            tall, lavaRock, flying, ufo, flightMode, size,
            flapOffset: flying && !ufo ? Math.random() * FLAP_CYCLE_SECONDS : 0,
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
          setBest(previous => { const next = Math.max(previous, result); try { localStorage.setItem(bestKey(playerNameRef.current), String(next)); } catch { /* Storage may be unavailable. */ } return next; });
          void saveBestScore(playerNameRef.current, result)
            .then(() => refreshRankings())
            .catch(() => setRankingError('saveFailed'));
        }
      }
      const detailed = detailedBackground.current && mountainLandscape.complete && mountainLandscape.naturalWidth > 0;
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
          ctx.globalAlpha = 0.24;
          ctx.drawImage(mountainPass, 0, 0, 1000, 420);
          ctx.restore();
        }
        drawMidground(ctx, distance);
      }
      drawForest(ctx, forest, distance, detailed);
      drawGround(ctx, distance, obstacles);
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
          else drawPterosaurArt(ctx, pterosaur, o.x, bodyY, o.size, flapTime, o.flapOffset);
        } else if (o.lavaRock) {
          ctx.save();
          ctx.translate(o.x, top);
          ctx.scale(o.w / 64, o.h / 40);
          // Draw the buried crust first so its upper edge joins the exposed rock.
          polygon([[2,34],[60,35],[56,43],[46,50],[27,54],[14,49],[8,42]], '#382922');
          polygon([[13,39],[45,38],[39,45],[27,50],[16,46]], '#534037');
          polygon([[30,39],[34,40],[29,44],[29,48],[27,44]], '#a65231');
          if (o.tall) {
            polygon(tallRockOutline.map(([x, y]) => [x, y]), '#302839');
            polygon([[0,29],[5,21],[29,0],[24,15],[10,28]], '#64566a');
            polygon([[29,0],[42,2],[57,15],[40,12],[24,15]], '#89788a');
            polygon([[24,15],[40,12],[34,28],[20,40],[10,28]], '#4a4154');
            polygon([[40,12],[57,15],[64,31],[50,25],[34,28]], '#574556');
          } else {
            polygon(rockOutline.map(([x, y]) => [x, y]), '#392b2b');
            polygon([[0,27],[8,13],[23,2],[32,8],[20,19],[9,22]], '#725249');
            polygon([[23,2],[40,0],[55,7],[46,13],[32,8]], '#936953');
            polygon([[9,22],[20,19],[33,24],[28,35],[13,40],[2,34]], '#523a34');
            polygon([[46,13],[55,7],[64,23],[60,35],[49,29]], '#493437');
          }
          const fissures = new Path2D(o.tall
            ? 'M28 5 L24 15 L31 20 L34 28 L43 34 L46 38 M34 28 L48 24 L56 28 M31 20 L19 22 L12 29'
            : 'M8 15 L20 17 L30 10 L35 16 L33 23 L43 28 L48 37 M33 23 L23 27 L18 35 M43 28 L51 21 L59 22');
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#ba4124';
          ctx.lineWidth = 3;
          ctx.stroke(fissures);
          ctx.strokeStyle = o.tall ? '#ffda78' : '#ffab44';
          ctx.lineWidth = 1.2;
          ctx.stroke(fissures);

          // Stagger the wisps so each fades out before starting again.
          for (let i = 0; i < 7; i++) {
            const age = (animationTime * 0.55 + i / 7) % 1;
            const smokeX = 28 + (i % 3) * 3 + 10 * age + 3 * Math.sin(age * 6 + i);
            const smokeY = 8 - 43 * age;
            const radius = 3 + 7 * age;
            const haze = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, radius);
            haze.addColorStop(0, 'rgba(96,87,83,0.55)');
            haze.addColorStop(1, 'rgba(96,87,83,0)');
            ctx.fillStyle = haze;
            ctx.globalAlpha = Math.sin(Math.PI * age);
            ctx.fillRect(smokeX - radius, smokeY - radius, radius * 2, radius * 2);
          }
          ctx.restore();
        } else if (stump.complete && stump.naturalWidth) {
          // The trunk flares into roots 56% down the sprite, at grass level.
          const height = o.h / 0.56;
          const width = height * stump.naturalWidth / stump.naturalHeight;
          ctx.save();
          ctx.translate(o.x + o.w / 2, top);
          if (o.tall) {
            // A snapped side limb and silvered bark distinguish the elder stump.
            ctx.scale(-1, 1);
            polygon([[9,24],[20,18],[24,9],[31,8],[28,21],[16,35]], '#514941');
            polygon([[17,25],[23,19],[27,10],[29,10],[26,21]], '#948577');
            polygon([[24,9],[28,7],[31,8],[27,11]], '#ddc59c');
            ctx.filter = 'saturate(0.32) brightness(0.9)';
          }
          ctx.drawImage(stump, -width / 2, 0, width, height);
          ctx.restore();
        } else {
          // Keep the obstacle visible while the artwork loads.
          polygon([[o.x+6,350],[o.x+7,top+5],[o.x+16,top],[o.x+23,top+9],
            [o.x+o.w-7,top+4],[o.x+o.w-5,350]], '#68442d');
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
    <header><a href="./" className="brand">fern run<span>↗</span></a><span className="tag">{t.tagline}</span></header>

    <section ref={gameContainer} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()} className={expanded ? `game expanded${rotateLayout ? " force-landscape" : ""}` : "game"}>


      <div className="level"><span className="level-copy">{t.level} {Math.floor(score / 500) + 1}<span className="speed-hint"> · {t.speedHint}</span></span><div className="game-options"><div className="background-options" role="group" aria-label={t.backgroundLabel}><span>{t.background}</span><select aria-label={t.backgroundLabel} value={backgroundMode} onChange={event => setBackgroundMode(event.target.value as BackgroundMode)}><option value="simple">{t.simple}</option><option value="detailed">{t.detailed}</option></select></div><div className="language-switch" role="group" aria-label={t.languageLabel}><button type="button" lang="vi" className={language === 'vi' ? 'active' : ''} aria-pressed={language === 'vi'} onClick={() => setLanguage('vi')}>VI</button><button type="button" lang="en" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button></div><button ref={leaderboardButton} className="leaderboard-button" type="button" onClick={openLeaderboard} aria-haspopup="dialog" aria-expanded={leaderboardOpen}>★ {t.leaderboard}</button></div></div>
      <div className="scorebar"><span>{phase === 'playing' ? t.playing : phase === 'over' ? t.over : phase === 'paused' ? t.paused : t.ready}</span><div>{t.score} <strong>{String(score).padStart(4,'0')}</strong><span>{t.best} <strong>{String(best).padStart(4,'0')}</strong></span></div></div>
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
        <canvas ref={canvas} width="1000" height="420" aria-label={t.canvasLabel} />
        {!playerName ? <div className="overlay name-overlay" onPointerDown={event => event.stopPropagation()}><form onSubmit={savePlayerName}><h2>{t.nameHeading}</h2><label htmlFor="player-name">{t.nameLabel}</label><input id="player-name" required maxLength={24} autoComplete="nickname" enterKeyHint="done" placeholder={t.namePlaceholder} value={nameDraft} onChange={event => setNameDraft(event.target.value)} /><button type="submit">{t.continue} ↗</button></form></div> : phase !== 'playing' && <div className="overlay"><div><h2>{phase === 'over' ? t.retryHeading : phase === 'paused' ? t.pauseHeading : t.readyHeading}</h2><button onPointerDown={event => { event.stopPropagation(); action.current(true); }} onClick={event => event.stopPropagation()}>{phase === 'over' ? t.restart : phase === 'paused' ? t.resume : t.start} ↗</button></div></div>}
        <button className="fullscreen-button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); void toggleFullscreen(); }} aria-label={expanded ? t.exitFullscreen : t.fullscreen} title={expanded ? t.exitFullscreen : t.fullscreen}><span aria-hidden="true">{expanded ? '⊡' : '⛶'}</span></button>
      </div>
      {leaderboardOpen && <div className="leaderboard-backdrop" onClick={closeLeaderboard}><section className="leaderboard-dialog" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title" onClick={event => event.stopPropagation()}><div className="leaderboard-heading"><div><p className="eyebrow">FERN RUN · TOP 10</p><h2 id="leaderboard-title">{t.leaderboard}</h2></div><button ref={closeLeaderboardButton} type="button" className="leaderboard-close" onClick={closeLeaderboard} aria-label={t.closeLeaderboard}>×</button></div><p className="leaderboard-player">{playerName ? `${t.player}: ${playerName}` : t.enterNameHint}</p>{rankingError && <p role="status">{rankingError === 'saveFailed' ? t.saveFailed : t.rankingsUnavailable} <button onClick={() => void refreshRankings()}>{t.tryAgain}</button></p>}<ol>{rankings.map((entry, index) => <li key={`${entry.name}-${index}`} className={entry.name.toLocaleLowerCase('vi') === playerName.toLocaleLowerCase('vi') ? 'current-player' : ''}><span>{entry.name}</span><strong>{entry.score}</strong></li>)}</ol>{!rankingError && rankings.length === 0 && <p>{t.emptyLeaderboard}</p>}</section></div>}

    </section>
    <section className="play-guide" aria-label={t.controlsTitle}>
      <p className="eyebrow">{t.controlsTitle}</p>
      <div className="guide-items">
        <div className="guide-item"><span className="guide-icon" aria-hidden="true">↑</span><div><strong>{t.jumpAction}</strong><span className="guide-desktop"><kbd>SPACE</kbd> {t.or} <kbd>↑</kbd></span><span className="guide-touch">{t.tapOrSwipeUp}</span></div></div>
        <div className="guide-item"><span className="guide-icon" aria-hidden="true">↓</span><div><strong>{t.duckAction}</strong><span className="guide-desktop">{t.holdDown} <kbd>↓</kbd></span><span className="guide-touch">{t.swipeDownHold}</span></div></div>
      </div>
      <p className="guide-note">{t.releaseToStand}</p>
    </section>
    <section className="intro"><div><p className="eyebrow">DINO RUNNER</p><h1>{t.introFirst} <em>{t.introSecond}</em></h1></div><p>{t.introLineOne}<br/>{t.introLineTwo}</p></section>
    <footer><span>{t.footer}</span><span>FERN RUN</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
