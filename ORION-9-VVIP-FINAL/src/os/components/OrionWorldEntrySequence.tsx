import React,{useEffect,useMemo,useRef,useState} from 'react';
import {BrandLogo} from '../../components/brand/BrandLogo';
interface Props{onComplete:()=>void;isAdmin?:boolean}
const USER=['IDENTITY','WORKSPACE','EVENTS','WORLD MODEL','DECISIONS','ACTIONS'];
const ADMIN=['IDENTITY','PRIVILEGE','GOVERNANCE','AUDIT','CONTROL PLANE','POLICY'];
export const OrionWorldEntrySequence:React.FC<Props>=({onComplete,isAdmin=false})=>{
 const [elapsed,setElapsed]=useState(0); const start=useRef<number|null>(null); const done=useRef(false);
 useEffect(()=>{let raf=0;const tick=(t:number)=>{if(start.current===null)start.current=t;const e=t-start.current;setElapsed(e);if(e>=6400){if(!done.current){done.current=true;onComplete()}return}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[onComplete]);
 const systems=isAdmin?ADMIN:USER; const nodes=useMemo(()=>Array.from({length:18},(_,i)=>{const a=i/18*Math.PI*2;return{x:50+Math.cos(a)*(30+(i%3)*4),y:50+Math.sin(a)*(25+(i%2)*5)}}),[]);
 const accepted=elapsed>500, field=elapsed>1300, map=elapsed>2200, live=elapsed>3500, handoff=elapsed>5350;
 return <main className={`orion-cinematic orion-world-v3 ${isAdmin?'admin':'user'}`} role="status" aria-live="polite">
   <div className="ow3-depth"/><div className="ow3-constellation">{nodes.map((n,i)=><i key={i} style={{left:`${n.x}%`,top:`${n.y}%`,animationDelay:`${i*70}ms`}}/> )}</div>
   <svg className={`ow3-lines ${map?'on':''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M4 62 C24 20 35 82 50 48 S77 20 96 58"/><path d="M8 32 C30 72 42 18 57 50 S78 82 94 28"/><path d="M14 84 C33 42 44 70 61 44 S80 34 90 74"/></svg>
   <div className={`ow3-core ${accepted?'on':''}`}><div className="ow3-core-shell"/><div className="ow3-core-light"/><BrandLogo sizePreset="hero" variant="full" className="ow3-center-logo"/></div>
   <header className={`ow3-header ${accepted?'on':''}`}><span className="ow3-dot"/><span>{isAdmin?'PRIVILEGED CHANNEL':'SECURE SESSION'} / IDENTITY ACCEPTED</span></header>
   <section className={`ow3-center-label ${field?'on':''}`} aria-hidden="true"><span>{isAdmin?'CONTROL INTELLIGENCE':'ORION INTELLIGENCE'}</span><b>{isAdmin?'GOVERNANCE SPACE':'OPERATIONAL SPACE'}</b></section>
   <section className={`ow3-system-map ${live?'on':''}`}><div className="ow3-map-head"><span>SESSION FABRIC</span><b>{Math.min(100,Math.floor(elapsed/6400*100))}%</b></div>{systems.map((s,i)=><div key={s} className="ow3-row" style={{animationDelay:`${i*140}ms`}}><span>{String(i+1).padStart(2,'0')}</span><b>{s}</b><em>BOUND</em></div>)}</section>
   <div className="ow3-side"><span>{isAdmin?'CONTROL PLANE':'WORLD MODEL'}</span><b>{handoff?'ACTIVE':live?'SYNCHRONIZING':'ASSEMBLING'}</b></div>
   <div className={`ow3-handoff ${handoff?'on':''}`}><i/><span>ENTERING ORION WORLD</span></div>
 </main>;
};
