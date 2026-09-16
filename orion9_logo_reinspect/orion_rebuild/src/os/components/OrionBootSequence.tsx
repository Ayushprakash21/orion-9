import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionBootSequenceProps { onComplete: () => void; }

const BOOT_STAGES = [
  ['POWER BUS', 'STABLE'],
  ['MEMORY FABRIC', 'MOUNTED'],
  ['WORLD MODEL', 'RESTORED'],
  ['COGNITIVE FABRIC', 'ONLINE'],
  ['DECISION LAYER', 'READY'],
];

const ORBITS = [230, 310, 405];

export function OrionBootSequence({ onComplete }: OrionBootSequenceProps) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= 8200) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const particles = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    left: `${(i * 47 + 11) % 100}%`,
    top: `${(i * 71 + 9) % 100}%`,
    delay: `${(i % 20) * 0.12}s`,
    size: 1 + (i % 2),
  })), []);

  const stage = Math.min(BOOT_STAGES.length, Math.max(0, Math.floor((elapsed - 800) / 1250) + 1));
  const progress = Math.min(100, Math.floor((elapsed / 8200) * 100));
  const reveal = elapsed >= 6100;
  const depart = elapsed >= 7500;

  return (
    <div className={`orion-cinematic orion-boot-v4 ${depart ? 'depart' : ''}`} role="status" aria-live="polite">
      <div className="boot-v4-atmosphere" />
      <div className="boot-v4-grid" />
      <div className="boot-v4-stars">{particles.map((p, i) => <i key={i} style={{ left:p.left, top:p.top, width:p.size, height:p.size, animationDelay:p.delay }} />)}</div>
      <div className="boot-v4-sweep" />

      <header className="boot-v4-header">
        <span>ORION-9 / SYSTEM START</span>
        <span>SECURE LOCAL SESSION</span>
      </header>

      <section className="boot-v4-core" aria-hidden="true">
        <div className="boot-v4-core-aura" />
        {ORBITS.map((size, i) => <div key={size} className={`boot-v4-orbit orbit-${i}`} style={{ width:size, height:size }} />)}
        <div className="boot-v4-crosshair" />
        <div className={`boot-v4-core-light ${reveal ? 'reveal' : ''}`} />
        <div className={`boot-v4-logo ${reveal ? 'reveal' : ''}`}><BrandLogo sizePreset="sm" variant="mark" /></div>
      </section>

      <section className="boot-v4-intro">
        <div className="boot-v4-eyebrow">COGNITIVE OPERATING ENVIRONMENT</div>
        <h1>{elapsed < 1800 ? 'WAKING THE SYSTEM' : elapsed < 3900 ? 'BUILDING THE WORLD MODEL' : elapsed < 6100 ? 'ESTABLISHING INTELLIGENCE' : 'ORION-9 ONLINE'}</h1>
        <p>{elapsed < 1800 ? 'Power architecture is stable. Preparing the intelligence substrate.' : elapsed < 3900 ? 'Reconstructing the spatial model and operational memory.' : elapsed < 6100 ? 'Connecting perception, reasoning and decision layers.' : 'The environment is ready for authenticated entry.'}</p>
      </section>

      <aside className="boot-v4-status">
        <div className="boot-v4-status-head"><span>INITIALIZATION</span><b>{progress}%</b></div>
        {BOOT_STAGES.map(([name, value], i) => (
          <div className={`boot-v4-status-row ${i < stage ? 'online' : ''}`} key={name}>
            <span>{String(i + 1).padStart(2, '0')}</span><b>{name}</b><em>{i < stage ? value : 'STANDBY'}</em>
          </div>
        ))}
      </aside>

      <footer className="boot-v4-footer">
        <span>NO USER INTERFACE LOADED</span>
        <span className="boot-v4-dots">● ● ●</span>
        <span>{depart ? 'ENTERING ORION-9' : 'AWAITING ENVIRONMENT'}</span>
      </footer>
    </div>
  );
}
