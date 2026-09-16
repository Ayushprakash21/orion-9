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

/** Physical power-on sequence. Separate visual language from authenticated entry. */
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
      if (e >= 7000) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const stars = useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, top: `${(i * 61 + 7) % 100}%`, size: 1 + (i % 3) * .55,
  })), []);
  const p = elapsed / 7000;
  const core = elapsed >= 500;
  const field = elapsed >= 1200;
  const network = elapsed >= 2000;
  const systems = elapsed >= 2700;
  const ready = elapsed >= 5900;
  const lineCount = Math.min(BOOT_LINES.length, Math.max(0, Math.floor((elapsed - 2500) / 500) + 1));

  return (
    <div className={`orion-cinematic orion-boot-v2 ${ready ? 'ready' : ''}`} role="status" aria-live="polite">
      <div className="ob2-stars">{stars.map((s,i)=><i key={i} style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:`${(i%17)*.09}s`}} />)}</div>
      <div className={`ob2-scan scan-a ${field ? 'on' : ''}`} />
      <div className={`ob2-scan scan-b ${network ? 'on' : ''}`} />

      <div className={`ob2-core ${core ? 'on' : ''}`}>
        <div className="ob2-core-halo" />
        <div className="ob2-ring r1" /><div className="ob2-ring r2" /><div className="ob2-ring r3" />
        <div className="ob2-core-disc"><BrandLogo sizePreset="sm" variant="mark" /></div>
      </div>

      <div className={`ob2-network ${network ? 'on' : ''}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="orionBootTraceV2" x1="0" x2="1"><stop offset="0" stopColor="#00f2fe" stopOpacity="0"/><stop offset=".5" stopColor="#00f2fe" stopOpacity=".75"/><stop offset="1" stopColor="#00f2fe" stopOpacity="0"/></linearGradient></defs>
          <path d="M0 50 C18 13 34 85 50 50 S82 14 100 50" />
          <path d="M0 27 C22 67 36 20 50 50 S80 80 100 27" />
          <path d="M0 75 C20 42 37 80 50 50 S78 18 100 75" />
          <path d="M50 0 C35 26 65 35 50 50 S34 76 50 100" />
        </svg>
        {NODES.map(([name,x,y], i) => <div key={String(name)} className="ob2-node" style={{left:`${x}%`,top:`${y}%`,animationDelay:`${i*65}ms`}}><b /><span>{name}</span></div>)}
      </div>

      <div className={`ob2-brand ${field ? 'on' : ''}`}>
        <BrandLogo sizePreset="lg" variant="full" />
        <span>ORION-9</span>
        <b>AI-NATIVE SUPPLY CHAIN OPERATING SYSTEM</b>
      </div>

      <div className={`ob2-console ${systems ? 'on' : ''}`}>
        <div className="ob2-console-head"><span>POWER SEQUENCE</span><b>{Math.min(100, Math.floor((elapsed / 7000) * 100))}%</b></div>
        {BOOT_LINES.slice(0,lineCount).map(([a,b],i)=><div className="ob2-console-row" key={i}><span>{a}</span><b>{b}</b><em>OK</em></div>)}
      </div>

      <div className={`ob2-status ${systems ? 'on' : ''}`}>
        <span>{ready ? 'SYSTEM OPERATIONAL' : 'POWER BUS / COGNITIVE FABRIC'}</span>
        <b>{ready ? 'ORION-9 ONLINE' : elapsed < 1200 ? 'ENERGIZING' : elapsed < 2700 ? 'BUILDING WORLD MODEL' : 'BRINGING SYSTEMS ONLINE'}</b>
      </div>
    </div>
  );
}
