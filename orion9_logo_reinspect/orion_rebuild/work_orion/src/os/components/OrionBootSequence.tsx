import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionBootSequenceProps { onComplete: () => void; }

const BOOT_LINES = [
  ['CORE', 'IGNITION VECTOR LOCKED'],
  ['DATA', 'FABRIC SYNCHRONIZED'],
  ['WORLD', 'MODEL RECONSTRUCTED'],
  ['INTEL', 'COGNITIVE FABRIC ONLINE'],
  ['DECISION', 'ENGINE ARMED'],
  ['RISK', 'GUARDRAILS ACTIVE'],
  ['ORION-9', 'SYSTEM OPERATIONAL'],
];

const NODES = [
  ['DATA', 50, 16], ['INTELLIGENCE', 29, 28], ['SUPPLIERS', 13, 47],
  ['MATERIALS', 24, 72], ['PROCUREMENT', 41, 86], ['INVENTORY', 58, 86],
  ['WAREHOUSE', 76, 72], ['LOGISTICS', 87, 48], ['CUSTOMERS', 76, 28],
  ['DECISION', 68, 17], ['RISK', 86, 63], ['AUDIT', 64, 72],
];

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
      if (e >= 7600) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const stars = useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, top: `${(i * 61 + 7) % 100}%`,
    size: 1 + (i % 3) * 0.55, delay: `${(i % 17) * 0.09}s`,
  })), []);

  const p = elapsed / 7600;
  const lineCount = Math.min(BOOT_LINES.length, Math.max(0, Math.floor((elapsed - 2700) / 470) + 1));
  const world = elapsed >= 1600;
  const network = elapsed >= 2350;
  const systems = elapsed >= 2700;
  const opening = elapsed >= 6250;

  return (
    <div className={`orion-cinematic orion-boot ${opening ? 'is-opening' : ''}`} role="status" aria-live="polite">
      <div className="oc-noise" />
      <div className="oc-vignette" />
      <div className="oc-stars">{stars.map((s, i) => <i key={i} style={{ left:s.left, top:s.top, width:s.size, height:s.size, animationDelay:s.delay }} />)}</div>

      <div className={`oc-scan oc-scan-a ${world ? 'active' : ''}`} />
      <div className={`oc-scan oc-scan-b ${world ? 'active' : ''}`} />

      <div className={`oc-core-stage ${world ? 'active' : ''}`} style={{ transform: `translate(-50%,-50%) scale(${0.72 + Math.min(p * 0.62, 0.62)})` }}>
        <div className="oc-core-halo" />
        <div className="oc-core-shell"><div className="oc-core-grid" /><BrandLogo sizePreset="sm" variant="mark" className="oc-core-logo" /></div>
        <div className="oc-core-beam" />
      </div>

      <div className={`oc-world-lattice ${network ? 'active' : ''} ${opening ? 'depart' : ''}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="bootTrace" x1="0" x2="1"><stop offset="0" stopColor="#00f2fe" stopOpacity="0"/><stop offset=".5" stopColor="#00f2fe" stopOpacity=".8"/><stop offset="1" stopColor="#00f2fe" stopOpacity="0"/></linearGradient></defs>
          <path d="M0 50 C18 13 34 85 50 50 S82 14 100 50" /><path d="M0 27 C22 67 36 20 50 50 S80 80 100 27" /><path d="M0 75 C20 42 37 80 50 50 S78 18 100 75" />
          <path d="M50 0 C35 26 65 35 50 50 S34 76 50 100" /><path d="M12 0 C30 25 41 38 50 50 S70 75 88 100" />
        </svg>
        {NODES.map(([name,x,y], i) => <div key={String(name)} className="oc-node" style={{ left:`${x}%`, top:`${y}%`, animationDelay:`${i * 70}ms` }}><b /> <span>{name}</span></div>)}
      </div>

      <div className={`oc-brand-lock ${world ? 'active' : ''} ${opening ? 'depart' : ''}`}>
        <BrandLogo sizePreset="lg" variant="full" className="oc-brand-logo" />
        <div className="oc-brand-name">ORION-9</div>
        <div className="oc-brand-sub">COGNITIVE SUPPLY CHAIN OPERATING SYSTEM</div>
      </div>

      <div className={`oc-console ${systems ? 'active' : ''}`}>
        <div className="oc-console-head"><span>SYSTEM INITIALIZATION</span><span>{Math.min(100, Math.floor(elapsed / 76))}%</span></div>
        {BOOT_LINES.slice(0, lineCount).map(([a,b], i) => <div className="oc-console-line" key={i}><span>{a}</span><b>{b}</b><em>OK</em></div>)}
      </div>

      <div className={`oc-boot-title ${opening ? 'depart' : ''}`}>
        <span>{elapsed < 900 ? 'POWER VECTOR' : elapsed < 1900 ? 'ORION CORE' : elapsed < 3000 ? 'WORLD MODEL' : 'COGNITIVE FABRIC'}</span>
        <strong>{elapsed < 900 ? 'IGNITION' : elapsed < 1900 ? 'AWAKENING' : elapsed < 3000 ? 'RECONSTRUCTION' : 'ONLINE'}</strong>
      </div>

      <div className={`oc-open-flare ${opening ? 'active' : ''}`} />
    </div>
  );
}
