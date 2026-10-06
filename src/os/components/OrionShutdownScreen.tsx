import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Power } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { shutdownVariants } from '../motion/OrionMotionVariants';
import { isReducedMotionPreferred } from '../motion/OrionMotion';
import { useSupplyChain } from '../../store/SupplyChainContext';

interface OrionShutdownScreenProps {
  onComplete?: () => void;
}

export const OrionShutdownScreen: React.FC<OrionShutdownScreenProps> = ({ onComplete }) => {
  const supplyChain = useSupplyChain();
  const isReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);

  const [phase, setPhase] = useState<'initial' | 'network' | 'nodes' | 'orbital' | 'core' | 'final' | 'terminated'>('initial');

  useEffect(() => {
    if (isReduced) {
      setPhase('terminated');
      if (onComplete) onComplete();
      return;
    }

    const t1 = setTimeout(() => setPhase('network'), 300);
    const t2 = setTimeout(() => setPhase('nodes'), 700);
    const t3 = setTimeout(() => setPhase('orbital'), 1100);
    const t4 = setTimeout(() => setPhase('core'), 1500);
    const t5 = setTimeout(() => setPhase('final'), 2000);
    const t6 = setTimeout(() => {
      setPhase('terminated');
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete, isReduced]);

  return (
    <motion.div
      variants={shutdownVariants}
      initial="initial"
      animate={phase === 'terminated' || phase === 'final' ? 'closing' : 'initial'}
      className="fixed inset-0 w-screen h-screen min-h-screen min-w-full bg-[#03060E] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
    >
      <div className="relative z-20 w-[min(90vw,1100px)] h-[min(90vh,800px)] flex flex-col items-center justify-between pointer-events-none">
        {/* Branding Zone */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center pt-[5%] h-[25%] w-full"
        >
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <BrandLogo
              sizePreset="xl"
              variant="mark"
              className="justify-center h-24 sm:h-32 drop-shadow-[0_0_18px_rgba(0,242,254,0.18)]"
            />
            <p className="font-mono text-red-500/60 text-xs sm:text-sm tracking-[0.3em] uppercase max-w-[80vw] leading-tight">
              SYSTEM SHUTDOWN
            </p>
          </div>
        </motion.div>

        {/* Core Visualization Zone */}
        <div className="relative flex flex-col items-center justify-center h-[60%] w-full">
          <motion.div
            animate={{
              scale:
                phase === 'initial' || phase === 'network'
                  ? 1
                  : phase === 'nodes'
                  ? 0.9
                  : phase === 'orbital'
                  ? 0.75
                  : phase === 'core'
                  ? 0.5
                  : 0.1,
              opacity: phase === 'final' || phase === 'terminated' ? 0 : 1,
              filter: phase === 'final' || phase === 'terminated' ? 'blur(16px)' : 'blur(0px)',
            }}
            transition={{ duration: 0.8 }}
            className="relative flex items-center justify-center"
          >
            {/* Collapsing Rings with Motion */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute w-48 h-48 rounded-full border border-red-500/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute w-36 h-36 rounded-full border border-red-500/20 bg-red-500/5 shadow-[0_0_60px_rgba(239,68,68,0.25)]"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute w-28 h-28 rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.35)]"
            />

            <div className="relative w-20 h-20 rounded-full bg-black flex items-center justify-center border border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <Power className={`w-8 h-8 text-red-500 ${phase === 'core' || phase === 'final' ? 'animate-pulse opacity-50' : ''}`} />
            </div>
          </motion.div>
        </div>

        {/* Status Feed Zone */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-end pb-[5%] h-[15%] w-full"
        >
          <div className="flex flex-col items-center gap-2 text-center font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase">
            <span className={phase === 'initial' || phase === 'network' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}>
              TERMINATING ACTIVE PROCESSES
            </span>
            <span className={phase === 'nodes' || phase === 'orbital' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}>
              DISCONNECTING DATA FABRIC & SUPPLY CHAIN TELEMETRY
            </span>
            <span className={phase === 'core' || phase === 'final' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}>
              SAVING SESSION STATE & CLOSING ENVIRONMENT
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
