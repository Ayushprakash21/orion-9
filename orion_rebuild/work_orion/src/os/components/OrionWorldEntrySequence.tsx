import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionWorldEntrySequenceProps { onComplete: () => void; isAdmin?: boolean; }

const USER_SYSTEMS = ['IDENTITY','DATA FABRIC','INTELLIGENCE','DECISION','WORKFLOW','WORLD MODEL'];
const ADMIN_SYSTEMS = ['IDENTITY','PRIVILEGE','GOVERNANCE','AUDIT','CONTROL PLANE','WORLD MODEL'];

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
      if (e >= 6900) {
        if (!done.current) { done.current = true; onComplete(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const stars = useMemo(() => Array.from({ length: 95 }, (_, i) => ({ left:`${(i*43)%100}%`, top:`${(i*67+13)%100}%`, size:1+(i%3)*.6, delay:`${(i%13)*.08}s` })), []);
  const verified = elapsed >= 700;
  const fabric = elapsed >= 1500;
  const build = elapsed >= 2350;
  const launch = elapsed >= 5000;
  const pct = Math.min(100, Math.floor((elapsed / 6900) * 100));

  return (
    <div className={`orion-cinematic orion-world-entry ${isAdmin ? 'admin' : 'user'} ${launch ? 'is-launching' : ''}`} style={{ ['--entry-accent' as string]: accent }} role="status" aria-live="polite">
      <div className="oc-noise" /><div className="oc-vignette" />
      <div className="oc-stars">{stars.map((s,i)=><i key={i} style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay}} />)}</div>

      <div className={`owe-dimension ${fabric ? 'active' : ''}`}>
        <div className="owe-plane plane-a" /><div className="owe-plane plane-b" /><div className="owe-plane plane-c" />
        <div className="owe-horizon" />
      </div>

      <div className={`owe-core ${fabric ? 'active' : ''} ${launch ? 'launch' : ''}`}>
        <div className="owe-aura" /><div className="owe-ring ring-a" /><div className="owe-ring ring-b" /><div className="owe-ring ring-c" />
        <div className="owe-core-disc"><BrandLogo sizePreset="sm" variant="mark" /></div>
      </div>

      <div className={`owe-auth ${verified ? 'active' : ''}`}>
        <span className="owe-auth-dot" /> {isAdmin ? 'CONTROL PRIVILEGE VERIFIED' : 'OPERATOR IDENTITY VERIFIED'}
      </div>

      <div className={`owe-title ${fabric ? 'active' : ''} ${launch ? 'launch' : ''}`}>
        <BrandLogo sizePreset="md" variant="full" />
        <span>{isAdmin ? 'CONTROL PLANE INGRESS' : 'OPERATIONAL WORLD INGRESS'}</span>
        <b>{isAdmin ? 'ENTERING PRIVILEGED SYSTEM SPACE' : 'ENTERING ORION-9 INTELLIGENCE SPACE'}</b>
      </div>

      <div className={`owe-systems ${build ? 'active' : ''}`}>
        <div className="owe-systems-head"><span>SESSION FABRIC</span><b>{pct}%</b></div>
        {systems.map((s,i)=><div key={s} className="owe-system" style={{ animationDelay:`${i*110}ms` }}><span>{String(i+1).padStart(2,'0')}</span><b>{s}</b><em>SYNC</em></div>)}
      </div>

      <div className={`owe-status ${build ? 'active' : ''}`}>
        <span>{isAdmin ? 'CONTROL PLANE' : 'WORLD MODEL'}</span>
        <b>{launch ? 'OPENING' : build ? 'CONSTRUCTING' : verified ? 'AUTHENTICATED' : 'AUTHENTICATING'}</b>
      </div>

      <div className={`owe-gate ${launch ? 'active' : ''}`} />
      <div className={`owe-edge-flash ${launch ? 'active' : ''}`} />
    </div>
  );
};
