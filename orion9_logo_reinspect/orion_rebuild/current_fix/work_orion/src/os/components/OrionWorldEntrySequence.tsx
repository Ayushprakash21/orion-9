import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionWorldEntrySequenceProps {
  onComplete: () => void;
  isAdmin?: boolean;
}

/**
 * Post-authentication ingress.
 * Intentionally avoids flashes, white screens and scale/zoom transitions.
 * The scene is a controlled "system becoming a world": mesh -> systems -> identity
 * -> access channel -> quiet hand-off to the application.
 */
const USER_SYSTEMS = ['IDENTITY', 'DATA FABRIC', 'INTELLIGENCE', 'DECISION', 'WORKFLOW', 'WORLD MODEL'];
const ADMIN_SYSTEMS = ['IDENTITY', 'PRIVILEGE', 'GOVERNANCE', 'AUDIT', 'CONTROL PLANE', 'WORLD MODEL'];

export const OrionWorldEntrySequence: React.FC<OrionWorldEntrySequenceProps> = ({
  onComplete,
  isAdmin = false,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const systems = isAdmin ? ADMIN_SYSTEMS : USER_SYSTEMS;
  const accent = isAdmin ? '#7dd3fc' : '#00f2fe';

  useEffect(() => {
    let raf = 0;
    const tick = (time: number) => {
      if (start.current === null) start.current = time;
      const e = time - start.current;
      setElapsed(e);
      if (e >= 7200) {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const nodes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: `${8 + ((i * 37) % 84)}%`,
        top: `${10 + ((i * 61) % 76)}%`,
        delay: `${(i % 14) * 90}ms`,
        size: i % 5 === 0 ? 5 : 3,
      })),
    [],
  );

  const mesh = elapsed >= 500;
  const core = elapsed >= 1500;
  const systemsReady = elapsed >= 2800;
  const access = elapsed >= 4700;
  const handoff = elapsed >= 6200;
  const pct = Math.min(100, Math.floor((elapsed / 7200) * 100));

  return (
    <div
      className={`orion-entry-v2 ${isAdmin ? 'admin' : 'user'} ${handoff ? 'handoff' : ''}`}
      style={{ ['--entry-accent' as string]: accent }}
      role="status"
      aria-live="polite"
    >
      <div className="entry-v2-atmosphere" />
      <div className="entry-v2-grid" />
      <div className="entry-v2-scanline" />

      <div className={`entry-v2-header ${mesh ? 'active' : ''}`}>
        <div className="entry-v2-brand">
          <BrandLogo sizePreset="sm" variant="mark" />
          <div>
            <span>ORION-9</span>
            <b>{isAdmin ? 'PRIVILEGED CONTROL CHANNEL' : 'OPERATIONAL INTELLIGENCE CHANNEL'}</b>
          </div>
        </div>
        <div className="entry-v2-telemetry">
          <span className="entry-v2-live-dot" />
          <span>SECURE LINK</span>
          <b>{pct.toString().padStart(3, '0')}%</b>
        </div>
      </div>

      <div className={`entry-v2-field ${mesh ? 'active' : ''}`} aria-hidden="true">
        <div className="entry-v2-orbit orbit-one" />
        <div className="entry-v2-orbit orbit-two" />
        <div className="entry-v2-orbit orbit-three" />
        <div className="entry-v2-axis axis-x" />
        <div className="entry-v2-axis axis-y" />
        {nodes.map((n, i) => (
          <i
            key={i}
            className="entry-v2-node"
            style={{
              left: n.left,
              top: n.top,
              width: n.size,
              height: n.size,
              animationDelay: n.delay,
            }}
          />
        ))}
      </div>

      <div className={`entry-v2-core ${core ? 'active' : ''} ${access ? 'access' : ''}`} aria-hidden="true">
        <div className="entry-v2-core-ring ring-outer" />
        <div className="entry-v2-core-ring ring-middle" />
        <div className="entry-v2-core-ring ring-inner" />
        <div className="entry-v2-core-crosshair" />
        <div className="entry-v2-core-slice slice-a" />
        <div className="entry-v2-core-slice slice-b" />
        <div className="entry-v2-core-disc">
          <BrandLogo sizePreset="sm" variant="mark" />
        </div>
      </div>

      <div className={`entry-v2-readout ${core ? 'active' : ''}`}>
        <span>{isAdmin ? 'AUTHENTICATED / PRIVILEGED' : 'AUTHENTICATED / OPERATOR'}</span>
        <b>{access ? 'ACCESS CHANNEL OPEN' : 'IDENTITY CHANNEL SECURED'}</b>
        <em>{isAdmin ? 'CONTROL PLANE' : 'WORLD MODEL'}</em>
      </div>

      <div className={`entry-v2-system-list ${systemsReady ? 'active' : ''}`}>
        <div className="entry-v2-list-head">
          <span>SYSTEM FABRIC</span>
          <b>ONLINE</b>
        </div>
        {systems.map((name, i) => (
          <div className="entry-v2-system" key={name} style={{ animationDelay: `${i * 120}ms` }}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <b>{name}</b>
            <em>SYNCED</em>
          </div>
        ))}
      </div>

      <div className={`entry-v2-message ${access ? 'active' : ''}`}>
        <span>{isAdmin ? 'AUTHORITY VERIFIED' : 'IDENTITY VERIFIED'}</span>
        <strong>{handoff ? 'SYSTEM READY' : 'BUILDING YOUR WORLD'}</strong>
        <p>{isAdmin ? 'Establishing the control plane around your session.' : 'Establishing the operational world around your session.'}</p>
      </div>

      <div className={`entry-v2-footer ${systemsReady ? 'active' : ''}`}>
        <span>ORION COGNITIVE FABRIC</span>
        <span>•</span>
        <span>{isAdmin ? 'ADMINISTRATIVE SESSION' : 'USER SESSION'}</span>
        <span>•</span>
        <span>NO DATA LEFT UNVERIFIED</span>
      </div>

      <div className={`entry-v2-handoff ${handoff ? 'active' : ''}`} aria-hidden="true" />
    </div>
  );
};
