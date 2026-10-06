/**
 * ORION-9 OS LIFECYCLE TRANSITION WRAPPER
 * High-performance Framer Motion wrapper for OS lifecycle screens.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { osLifecycleVariants } from './OrionMotionVariants';
import { isReducedMotionPreferred } from './OrionMotion';
import { useSupplyChain } from '../../store/SupplyChainContext';

interface OrionLifecycleTransitionProps {
  children: React.ReactNode;
  stageKey: string;
  className?: string;
  reducedMotion?: boolean;
}

export const OrionLifecycleTransition: React.FC<OrionLifecycleTransitionProps> = ({
  children,
  stageKey,
  className = 'w-full h-full min-h-screen',
  reducedMotion,
}) => {
  const supplyChain = useSupplyChain();
  const settingReducedMotion = supplyChain?.settings?.reducedMotion;
  const isReduced = isReducedMotionPreferred(reducedMotion ?? settingReducedMotion);

  if (isReduced) {
    return (
      <div key={stageKey} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stageKey}
        variants={osLifecycleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
