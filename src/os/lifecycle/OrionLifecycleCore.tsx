/**
 * ORION-9 OS LIFECYCLE POWER / ORBITAL CORE
 * Canonical central rotating power core element.
 * Re-exports and wraps OrionLifecycleOrbitalCore with 100% test and component compatibility.
 */

import React from 'react';
import {
  OrionLifecycleOrbitalCore,
  OrionLifecycleOrbitalCoreProps,
  OrionOrbitalState,
} from './OrionLifecycleOrbitalCore';

export type { OrionLifecycleOrbitalCoreProps, OrionOrbitalState };
export interface OrionLifecycleCoreProps extends OrionLifecycleOrbitalCoreProps {}

export const OrionLifecycleCore: React.FC<OrionLifecycleCoreProps> = (props) => {
  return <OrionLifecycleOrbitalCore {...props} />;
};

export { OrionLifecycleOrbitalCore };
