import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';

interface OrionBootSequenceProps {
  onComplete: () => void;
}

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
  const isReduced = useIsReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (isReduced) {
      setElapsed(2000);
      if (!done.current) {
        done.current = true;
        onComplete();
      }
      return;
    }

    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= 2000) {
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
  }, [onComplete, isReduced]);

  const dust = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: (i * 47) % 100, y: (i * 71 + 11) % 100, d: (i % 19) * 0.08 })),
    []
  );

  const pct = Math.min(100, Math.floor((elapsed / 2000) * 100));
  const stage = Math.min(6, Math.floor((elapsed / 330)));
  const core = elapsed > 750, topology = elapsed > 1100, ready = elapsed > 1700;

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
      transition={{ duration: isReduced ? 0.1 : 0.6, ease: ORION_EASE }}
      className={`orion-cinematic orion-boot-v3 ${ready ? 'is-ready' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="ob3-noise" />
      <div className="ob3-grid" />
      <div className="ob3-dust">
        {dust.map((p, i) => (
          <i key={i} style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}s` }} />
        ))}
      </div>
      <div className="ob3-rail ob3-rail-a" />
      <div className="ob3-rail ob3-rail-b" />

      {/* Core Component with Motion rotation */}
      <motion.section
        initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }}
        animate={{ opacity: core ? 1 : 0, scale: core ? 1 : 0.6, filter: core ? 'blur(0px)' : 'blur(12px)' }}
        transition={{ duration: 0.8, ease: ORION_EASE }}
        className={`ob3-core ${core ? 'on' : ''}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="ob3-core-outer"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="ob3-core-mid"
        />
        <div className="ob3-core-mark">
          <BrandLogo sizePreset="hero" variant="full" className="ob3-center-logo" />
        </div>
        <span className="ob3-core-tick t1" />
        <span className="ob3-core-tick t2" />
        <span className="ob3-core-tick t3" />
        <span className="ob3-core-tick t4" />
      </motion.section>

      {/* Topology */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: topology ? 1 : 0, scale: topology ? 1 : 0.96 }}
        transition={{ duration: 0.6, ease: ORION_EASE }}
        className={`ob3-topology ${topology ? 'on' : ''}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M4 50 L18 24 L34 16 L50 32 L66 18 L82 31 L96 50 L82 62 L69 79 L50 68 L30 80 L18 64 Z" />
          <path d="M18 24 L30 80 M34 16 L50 68 M66 18 L69 79 M82 31 L50 32 M18 64 L50 32 L96 50" />
        </svg>
        {SIGNALS.map(([name, x, y], i) => (
          <span key={name} className="ob3-signal" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 90}ms` }}>
            <b />
            {name}
          </span>
        ))}
      </motion.section>

      {/* Interpolated Progress Bar */}
      <div className="ob3-progress">
        <div className="ob3-progress-head">
          <span>SYSTEM ASSEMBLY</span>
          <b>{String(pct).padStart(3, '0')}%</b>
        </div>
        <div className="ob3-progress-line">
          <motion.i
            initial={{ width: '0%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Sequential Stages List */}
      <section className="ob3-stage-list">
        {BOOT_STAGES.map((s, i) => (
          <motion.div
            key={s[0]}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: i <= stage ? 1 : 0.3, x: i <= stage ? 0 : -8 }}
            transition={{ duration: 0.4, ease: ORION_EASE }}
            className={`ob3-stage ${i < stage ? 'done' : ''} ${i === stage ? 'current' : ''}`}
          >
            <span>{s[0]}</span>
            <b>{s[1]}</b>
            <em>{i < stage ? s[2] : i === stage ? 'ACTIVE' : 'STANDBY'}</em>
          </motion.div>
        ))}
      </section>

      <div className="ob3-status">
        <span>{ready ? 'SYSTEM READY' : 'BUILDING COGNITIVE FABRIC'}</span>
        <b>
          {ready
            ? 'ORION-9 ONLINE'
            : stage < 2
            ? 'ESTABLISHING POWER'
            : stage < 4
            ? 'CONSTRUCTING WORLD MODEL'
            : 'ALIGNING DECISION SPACE'}
        </b>
      </div>

      <div className={`ob3-horizon ${ready ? 'on' : ''}`}>
        <span>SESSION GATE</span>
        <i />
      </div>
    </motion.main>
  );
}
