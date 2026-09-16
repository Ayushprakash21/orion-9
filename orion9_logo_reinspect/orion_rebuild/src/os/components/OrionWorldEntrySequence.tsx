import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionWorldEntrySequenceProps { onComplete: () => void; isAdmin?: boolean; }

const USER_CHANNELS = ['IDENTITY', 'MEMORY', 'INTELLIGENCE', 'DECISION', 'WORLD MODEL'];
const ADMIN_CHANNELS = ['IDENTITY', 'PRIVILEGE', 'GOVERNANCE', 'DECISION', 'CONTROL PLANE'];

export const OrionWorldEntrySequence: React.FC<OrionWorldEntrySequenceProps> = ({ onComplete, isAdmin = false }) => {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const accent = isAdmin ? '#79d7ff' : '#00f2fe';
  const channels = isAdmin ? ADMIN_CHANNELS : USER_CHANNELS;

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= 7600) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const particles = useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    angle: (i * 137.5) % 360,
    radius: 8 + ((i * 29) % 48),
    delay: `${(i % 24) * 0.08}s`,
    size: 1 + (i % 3 === 0 ? 1 : 0),
  })), []);

  const verified = elapsed >= 650;
  const forming = elapsed >= 1500;
  const connected = elapsed >= 3000;
  const ready = elapsed >= 5700;
  const pct = Math.min(100, Math.floor((elapsed / 7600) * 100));

  return (
    <div className={`orion-cinematic orion-world-v5 ${isAdmin ? 'admin' : 'user'}`} style={{ ['--entry-accent' as string]: accent }} role="status" aria-live="polite">
      <div className="world-v5-field" />
      <div className="world-v5-grid" />
      <div className="world-v5-horizon" />
      <div className="world-v5-particles" aria-hidden="true">
        {particles.map((p, i) => <i key={i} style={{ ['--a' as string]: `${p.angle}deg`, ['--r' as string]: `${p.radius}vw`, ['--d' as string]: p.delay, width:p.size, height:p.size }} />)}
      </div>

      <div className={`world-v5-core ${forming ? 'forming' : ''}`} aria-hidden="true">
        <div className="world-v5-core-glow" />
        <div className="world-v5-core-sphere"><BrandLogo sizePreset="sm" variant="mark" /></div>
        <div className="world-v5-ring r1" /><div className="world-v5-ring r2" /><div className="world-v5-ring r3" />
        <div className="world-v5-network n1" /><div className="world-v5-network n2" /><div className="world-v5-network n3" />
      </div>

      <div className={`world-v5-auth ${verified ? 'show' : ''}`}>
        <span /> {isAdmin ? 'PRIVILEGED IDENTITY ACCEPTED' : 'IDENTITY ACCEPTED'}
      </div>

      <div className="world-v5-title">
        <span>ORION-9</span>
        <b>{isAdmin ? 'CONTROL INTELLIGENCE' : 'COGNITIVE INTELLIGENCE'}</b>
        <em>{ready ? 'ENVIRONMENT READY' : connected ? 'WORLD MODEL CONNECTED' : forming ? 'INTELLIGENCE FORMING' : 'SESSION VERIFIED'}</em>
      </div>

      <div className={`world-v5-channel-panel ${connected ? 'show' : ''}`}>
        <div className="world-v5-panel-head"><span>SESSION FABRIC</span><b>{pct}%</b></div>
        {channels.map((name, i) => <div className={`world-v5-channel ${elapsed >= 3000 + i * 390 ? 'online' : ''}`} key={name}><span>{String(i+1).padStart(2,'0')}</span><b>{name}</b><i /></div>)}
      </div>

      <div className="world-v5-footer"><span>SECURE SESSION</span><span>•</span><span>{isAdmin ? 'ADMINISTRATIVE SPACE' : 'OPERATIONAL SPACE'}</span></div>
    </div>
  );
};
