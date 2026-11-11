/**
 * ORION-9 DYNAMIC ISLAND SYSTEM SURFACE
 * Single persistent bezel-anchored telemetry pill & interactive expansion panel.
 * UX interaction model inspired by Astraeus (https://github.com/Icetist/Astraeus),
 * engineered natively in React + Motion 2.0 with zero idle re-render churn.
 */

import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useDynamicIslandState } from './useDynamicIslandState';
import { useOptionalSupplyChain } from '../../../store/SupplyChainContext';
import { isReducedMotionPreferred } from '../../motion/OrionMotion';
import { DynamicIslandCapsule } from './DynamicIslandCapsule';
import { DynamicIslandExpanded } from './DynamicIslandExpanded';

export const DynamicIsland: React.FC = React.memo(() => {
  const {
    presentationMode,
    surfaceState,
    isExpanded,
    isPinned,
    isCompactOverMaximized,
    isFullscreenHidden,
    activity,
    activities,
    primaryEvent,
    metrics,
    toggleExpanded,
    collapse,
    togglePin,
    setIsHovered,
    handleAction,
    dismissActivity,
  } = useDynamicIslandState();

  const containerRef = useRef<HTMLDivElement>(null);
  const supplyChain = useOptionalSupplyChain();
  const isReducedMotion = isReducedMotionPreferred(
    supplyChain?.settings?.reducedMotion ?? supplyChain?.settings?.personalization?.reducedMotion
  );

  // Outside click to collapse when unpinned
  useEffect(() => {
    if (!isExpanded || isPinned) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isExpanded, isPinned, collapse]);

  if (isFullscreenHidden || presentationMode === 'disabled') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Orion-9 Dynamic Island System Telemetry"
      data-surface-state={surfaceState}
      data-presentation-mode={presentationMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-40 flex flex-col items-center pointer-events-auto"
    >
      <DynamicIslandCapsule
        activity={activity}
        surfaceState={surfaceState}
        presentationMode={presentationMode}
        metrics={metrics}
        primaryEvent={primaryEvent}
        isExpanded={isExpanded}
        isCompactOverMaximized={isCompactOverMaximized}
        onToggleExpand={toggleExpanded}
      />

      <AnimatePresence>
        {isExpanded && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 z-[120]">
            <DynamicIslandExpanded
              activity={activity}
              activities={activities}
              metrics={metrics}
              isPinned={isPinned}
              isReducedMotion={isReducedMotion}
              onTogglePin={togglePin}
              onCollapse={collapse}
              onAction={handleAction}
              onDismissActivity={dismissActivity}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
