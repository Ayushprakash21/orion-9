import React from 'react';

export interface OrionGoldenGateHeroCardProps {
  onClose?: () => void;
  className?: string;
}

/**
 * DEPRECATED: Enterprise Control Tower interface has been unified
 * directly into the Orion-9 Dynamic Island expanded surface.
 * Duplicate independent desktop window/hero rendering is completely removed.
 */
export const OrionGoldenGateHeroCard: React.FC<OrionGoldenGateHeroCardProps> = () => {
  return null;
};

export const OrionPulsarHeroCard = OrionGoldenGateHeroCard;
export default OrionGoldenGateHeroCard;
