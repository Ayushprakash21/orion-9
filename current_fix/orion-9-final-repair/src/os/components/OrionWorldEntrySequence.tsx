import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionWorldEntrySequenceProps { onComplete: () => void; isAdmin?: boolean; }

const USER_SYSTEMS = ['IDENTITY','DATA FABRIC','INTELLIGENCE','DECISION','WORKFLOW','WORLD MODEL'];
const ADMIN_SYSTEMS = ['IDENTITY','PRIVILEGE','GOVERNANCE','AUDIT','CONTROL PLANE','WORLD MODEL'];

/**
 * Authenticated world-entry sequence.
 * Deliberately avoids flashes, camera zooms, white-out gates and scale explosions.
 * The feeling is created by layered system construction and directional telemetry.
 */
export const OrionWorldEntrySequence: React.FC<OrionWorldEntrySequenceProps> = ({ onComplete, isAdmin = false }) => {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const systems = isAdmin ? ADMIN_SYSTEMS : USER_SYSTEMS;
  const accent = isAdmin ? '#7dd3fc' : '#00f2fe';

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= 6200) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    left: `${(i * 43) % 100}%`, top: `${(i * 67 + 13) % 100}%`, size: 1 + (i % 3) * .55,
  })), []);

  const identity = elapsed >= 450;
  const fabric = elapsed >= 1100;
  const nodes = elapsed >= 1800;
  const systemsReady = elapsed >= 2400;
  const handoff = elapsed >= 5200;
  const pct = Math.min(100, Math.floor((elapsed / 6200) * 100));

  return (
    <div
      className={`orion-entry-v2 ${isAdmin ? 'admin' : 'user'}`}
      style={{ ['--entry-accent' as string]: accent }}
      role="status"
      aria-live="polite"
    >
      <div className="oe2-stars" aria-hidden="true">
        {stars.map((s, i) => <i key={i} style={{ left:s.left, top:s.top, width:s.size, height:s.size, animationDelay:`${(i%15)*.11}s` }} />)}
      </div>

      <div className="oe2-field" aria-hidden="true">
        <div className={`oe2-orbit orbit-one ${fabric ? 'on' : ''}`} />
        <div className={`oe2-orbit orbit-two ${fabric ? 'on' : ''}`} />
        <div className={`oe2-orbit orbit-three ${nodes ? 'on' : ''}`} />
        <div className={`oe2-axis axis-a ${nodes ? 'on' : ''}`} />
        <div className={`oe2-axis axis-b ${nodes ? 'on' : ''}`} />
        <div className={`oe2-core ${identity ? 'on' : ''}`}>
          <div className="oe2-core-inner" />
          <BrandLogo sizePreset="sm" variant="mark" />
        </div>
        {nodes && Array.from({length: 12}, (_, i) => {
          const angle = i * 30;
          const radius = 235 + (i % 3) * 38;
          const x = 50 + Math.cos(angle * Math.PI / 180) * radius / 10;
          const y = 50 + Math.sin(angle * Math.PI / 180) * radius / 10;
          return <span key={i} className="oe2-node" style={{left:`${x}%`, top:`${y}%`, animationDelay:`${i*70}ms`}} />;
        })}
      </div>

      <div className={`oe2-header ${identity ? 'on' : ''}`}>
        <span className="oe2-live-dot" />
        <span>{isAdmin ? 'PRIVILEGED SESSION VERIFIED' : 'OPERATOR SESSION VERIFIED'}</span>
      </div>

      <div className={`oe2-center-copy ${fabric ? 'on' : ''}`}>
        <BrandLogo sizePreset="md" variant="full" />
        <span>{isAdmin ? 'CONTROL PLANE ACCESS' : 'ORION-9 OPERATIONAL SPACE'}</span>
        <b>{isAdmin ? 'SECURE GOVERNANCE FABRIC ESTABLISHED' : 'COGNITIVE SUPPLY CHAIN FABRIC ESTABLISHED'}</b>
      </div>

      <div className={`oe2-console ${systemsReady ? 'on' : ''}`}>
        <div className="oe2-console-head"><span>SESSION CONSTRUCTION</span><b>{pct}%</b></div>
        {systems.map((s, i) => <div className="oe2-console-row" key={s} style={{animationDelay:`${i*120}ms`}}><span>{String(i+1).padStart(2,'0')}</span><b>{s}</b><em>READY</em></div>)}
      </div>

      <div className={`oe2-status ${systemsReady ? 'on' : ''}`}>
        <span>{isAdmin ? 'CONTROL PLANE' : 'WORLD MODEL'}</span>
        <b>{handoff ? 'SESSION ESTABLISHED' : systemsReady ? 'ASSEMBLING' : identity ? 'VERIFYING' : 'ESTABLISHING'}</b>
      </div>

      <div className={`oe2-handoff ${handoff ? 'on' : ''}`} aria-hidden="true">
        <div className="oe2-handoff-line" />
      </div>
    </div>
  );
};
