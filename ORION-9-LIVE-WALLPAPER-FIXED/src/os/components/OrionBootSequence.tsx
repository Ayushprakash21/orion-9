import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionBootSequenceProps { onComplete: () => void; }

const BOOT_STAGES = [
  ['01', 'POWER BUS', 'STABLE'],
  ['02', 'EVENT FABRIC', 'BOUND'],
  ['03', 'WORLD MODEL', 'MOUNTED'],
  ['04', 'INTELLIGENCE CORE', 'ONLINE'],
  ['05', 'DECISION PLANE', 'ARMED'],
  ['06', 'ORION-9 KERNEL', 'READY'],
];

const SIGNALS = [
  ['DATA', 18, 24], ['MODEL', 34, 16], ['RISK', 66, 18], ['DECISION', 82, 31],
  ['SUPPLY', 15, 63], ['INVENTORY', 30, 78], ['FLOW', 69, 78], ['LOGISTICS', 86, 62],
];

export function OrionBootSequence({ onComplete }: OrionBootSequenceProps) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  useEffect(() => {
    let raf = 0;
    const tick = (t:number) => {
      if (start.current === null) start.current = t;
      const e=t-start.current; setElapsed(e);
      if (e >= 7200) { if (!done.current) { done.current=true; onComplete(); } return; }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf);
  },[onComplete]);
  const dust=useMemo(()=>Array.from({length:70},(_,i)=>({x:(i*47)%100,y:(i*71+11)%100,d:(i%19)*.08})),[]);
  const pct=Math.min(100,Math.floor(elapsed/7200*100));
  const stage=Math.min(6,Math.floor(elapsed/1000));
  const fabric=elapsed>1400, core=elapsed>2700, topology=elapsed>3900, ready=elapsed>6100;
  return <main className={`orion-cinematic orion-boot-v3 ${ready?'is-ready':''}`} role="status" aria-live="polite">
    <div className="ob3-noise" />
    <div className="ob3-grid" />
    <div className="ob3-dust">{dust.map((p,i)=><i key={i} style={{left:`${p.x}%`,top:`${p.y}%`,animationDelay:`${p.d}s`}} />)}</div>
    <div className="ob3-rail ob3-rail-a"/><div className="ob3-rail ob3-rail-b"/>
    <section className={`ob3-core ${core?'on':''}`}>
      <div className="ob3-core-outer"/><div className="ob3-core-mid"/><div className="ob3-core-inner"/>
      <div className="ob3-core-mark"><BrandLogo sizePreset="hero" variant="mark" /></div>
      <span className="ob3-core-tick t1"/><span className="ob3-core-tick t2"/><span className="ob3-core-tick t3"/><span className="ob3-core-tick t4"/>
    </section>
    <section className={`ob3-topology ${topology?'on':''}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M4 50 L18 24 L34 16 L50 32 L66 18 L82 31 L96 50 L82 62 L69 79 L50 68 L30 80 L18 64 Z"/>
        <path d="M18 24 L30 80 M34 16 L50 68 M66 18 L69 79 M82 31 L50 32 M18 64 L50 32 L96 50"/>
      </svg>
      {SIGNALS.map(([name,x,y],i)=><span key={name} className="ob3-signal" style={{left:`${x}%`,top:`${y}%`,animationDelay:`${i*90}ms`}}><b/>{name}</span>)}
    </section>
    <div className="ob3-progress"><div className="ob3-progress-head"><span>SYSTEM ASSEMBLY</span><b>{String(pct).padStart(3,'0')}%</b></div><div className="ob3-progress-line"><i style={{width:`${pct}%`}}/></div></div>
    <section className="ob3-stage-list">{BOOT_STAGES.map((s,i)=><div key={s[0]} className={`ob3-stage ${i<stage?'done':''} ${i===stage?'current':''}`}><span>{s[0]}</span><b>{s[1]}</b><em>{i<stage?s[2]:i===stage?'ACTIVE':'STANDBY'}</em></div>)}</section>
    <div className="ob3-status"><span>{ready?'SYSTEM READY':'BUILDING COGNITIVE FABRIC'}</span><b>{ready?'ORION-9 ONLINE':stage<2?'ESTABLISHING POWER':stage<4?'CONSTRUCTING WORLD MODEL':'ALIGNING DECISION SPACE'}</b></div>
    <div className={`ob3-horizon ${ready?'on':''}`}><span>SESSION GATE</span><i/></div>
  </main>;
}
