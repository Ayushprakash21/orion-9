import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionBootSequenceProps { onComplete: () => void; }

const PHASES = [
  ['POWER BUS', 'ENERGIZING'],
  ['MEMORY FABRIC', 'RESTORING'],
  ['INTELLIGENCE', 'AWAKENING'],
  ['DECISION FABRIC', 'SYNCHRONIZING'],
  ['WORLD MODEL', 'MAPPING'],
  ['ORION-9', 'ONLINE'],
];

const NODES = [
  ['SUPPLIERS', 16, 37], ['MATERIALS', 28, 58], ['PROCUREMENT', 19, 76],
  ['DATA', 48, 20], ['INTELLIGENCE', 67, 31], ['DECISION', 79, 51],
  ['RISK', 72, 72], ['CUSTOMERS', 86, 77], ['LOGISTICS', 58, 82],
  ['INVENTORY', 38, 78], ['WAREHOUSE', 30, 37],
];

export function OrionBootSequence({ onComplete }: OrionBootSequenceProps) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = (time: number) => {
      if (start.current === null) start.current = time;
      const e = time - start.current;
      setElapsed(e);
      if (e >= 7600) {
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

  const stars = useMemo(
    () => Array.from({ length: 85 }, (_, i) => ({
      left: `${(i * 47) % 100}%`,
      top: `${(i * 71 + 9) % 100}%`,
      delay: `${(i % 17) * 80}ms`,
    })),
    [],
  );

  const network = elapsed >= 900;
  const core = elapsed >= 1900;
  const fabric = elapsed >= 3000;
  const online = elapsed >= 6000;
  const phaseIndex = Math.min(PHASES.length - 1, Math.floor(elapsed / 1050));
  const progress = Math.min(100, Math.floor((elapsed / 7600) * 100));

  return (
    <div className={`orion-boot-v2 ${online ? 'online' : ''}`} role="status" aria-live="polite">
      <div className="boot-v2-stars">
        {stars.map((s, i) => <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay }} />)}
      </div>
      <div className={`boot-v2-grid ${network ? 'active' : ''}`} />
      <div className="boot-v2-horizon" />

      <header className={`boot-v2-header ${network ? 'active' : ''}`}>
        <div className="boot-v2-brand">
          <BrandLogo sizePreset="sm" variant="mark" />
          <div>
            <b>ORION-9</b>
            <span>COGNITIVE SUPPLY CHAIN OPERATING SYSTEM</span>
          </div>
        </div>
        <div className="boot-v2-progress"><span>INITIALIZATION</span><b>{String(progress).padStart(3, '0')}%</b></div>
      </header>

      <section className={`boot-v2-world ${network ? 'active' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M4 52 C20 28 29 77 46 49 S73 21 96 50" />
          <path d="M8 25 C25 59 39 17 51 50 S76 83 93 30" />
          <path d="M7 79 C27 47 37 84 51 51 S77 31 94 75" />
          <path d="M51 4 C34 25 68 35 51 51 S38 76 51 96" />
          <path d="M19 8 C31 28 42 41 51 51 S70 72 82 92" />
        </svg>
        {NODES.map(([name, x, y], i) => (
          <div key={String(name)} className="boot-v2-node" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 110}ms` }}>
            <i /><span>{name}</span>
          </div>
        ))}
      </section>

      <section className={`boot-v2-core ${core ? 'active' : ''}`} aria-hidden="true">
        <div className="boot-v2-core-ring ring-a" />
        <div className="boot-v2-core-ring ring-b" />
        <div className="boot-v2-core-ring ring-c" />
        <div className="boot-v2-core-line line-a" />
        <div className="boot-v2-core-line line-b" />
        <div className="boot-v2-core-disc"><BrandLogo sizePreset="sm" variant="mark" /></div>
      </section>

      <div className={`boot-v2-phase ${fabric ? 'active' : ''}`}>
        <span>{PHASES[phaseIndex][0]}</span>
        <strong>{PHASES[phaseIndex][1]}</strong>
        <em>SYSTEM PATH {String(phaseIndex + 1).padStart(2, '0')} / {String(PHASES.length).padStart(2, '0')}</em>
      </div>

      <div className={`boot-v2-console ${fabric ? 'active' : ''}`}>
        <div className="boot-v2-console-head"><span>ORION KERNEL</span><b>LIVE</b></div>
        {PHASES.map(([a, b], i) => (
          <div className={`boot-v2-line ${i <= phaseIndex ? 'done' : ''}`} key={a}>
            <span>{String(i + 1).padStart(2, '0')}</span><b>{a}</b><em>{i <= phaseIndex ? b : 'WAIT'}</em>
          </div>
        ))}
      </div>

      <div className={`boot-v2-online ${online ? 'active' : ''}`}>
        <span>●</span> ORION-9 SYSTEM OPERATIONAL
      </div>
    </div>
  );
}
