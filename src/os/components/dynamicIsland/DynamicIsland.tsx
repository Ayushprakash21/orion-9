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
    activeNotification,
    metrics,
    toggleExpanded,
    collapse,
    togglePin,
    setIsHovered,
    handleAction,
    dismissActivity,
    dismissNotification,
  } = useDynamicIslandState();

  const containerRef = useRef<HTMLDivElement>(null);
  const supplyChain = useOptionalSupplyChain();
  const isReducedMotion = isReducedMotionPreferred(
    supplyChain?.settings?.reducedMotion ?? supplyChain?.settings?.personalization?.reducedMotion
  );

  // Authoritative Dynamic Island Availability Lifecycle Signal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ORION_DYNAMIC_ISLAND_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('orion:dynamic-island-availability', { detail: { available: true } }));
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__ORION_DYNAMIC_ISLAND_MOUNTED__ = false;
        window.dispatchEvent(new CustomEvent('orion:dynamic-island-availability', { detail: { available: false } }));
      }
    };
  }, []);

  // Synchronize expanded state with System Bar separator and surface bridge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ORION_DYNAMIC_ISLAND_EXPANDED__ = isExpanded;
      window.dispatchEvent(new CustomEvent('orion:dynamic-island-state', { detail: { isExpanded } }));
    }
  }, [isExpanded]);

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

  // Support Escape to collapse and global orion:dynamic-island-toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        collapse();
      }
    };
    const handleToggleEvent = () => {
      toggleExpanded();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('orion:dynamic-island-toggle', handleToggleEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('orion:dynamic-island-toggle', handleToggleEvent);
    };
  }, [isExpanded, collapse, toggleExpanded]);

  if (isFullscreenHidden || presentationMode === 'disabled') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Orion-9 Dynamic Island System Telemetry"
      data-testid="dynamic-island-root"
      data-dynamic-island="true"
      data-surface-state={surfaceState}
      data-presentation-mode={presentationMode}
      data-expanded={isExpanded ? 'true' : 'false'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: 10010 }}
      className="relative z-[10010] flex flex-col items-center pointer-events-auto"
    >
      <AnimatePresence initial={false}>
        {!isExpanded ? (
          <DynamicIslandCapsule
            key="capsule"
            activity={activity}
            surfaceState={surfaceState}
            presentationMode={presentationMode}
            metrics={metrics}
            primaryEvent={primaryEvent}
            activeNotification={activeNotification}
            isExpanded={false}
            isCompactOverMaximized={isCompactOverMaximized}
            isReducedMotion={isReducedMotion}
            onToggleExpand={toggleExpanded}
            onDismissNotification={dismissNotification}
          />
        ) : (
          <DynamicIslandExpanded
            key="expanded"
            activity={activity}
            activities={activities}
            metrics={metrics}
            isPinned={isPinned}
            isReducedMotion={isReducedMotion}
            activeNotification={activeNotification}
            onTogglePin={togglePin}
            onCollapse={collapse}
            onAction={handleAction}
            onDismissActivity={dismissActivity}
            onDismissNotification={dismissNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
