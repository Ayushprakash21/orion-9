import React, { useId } from 'react';

interface OrionMarkProps {
  size?: number;
  className?: string;
}

export const OrionMark: React.FC<OrionMarkProps> = ({ size = 28, className = '' }) => {
  const gradientId = useId();

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <circle 
        cx="16" 
        cy="16" 
        r="12" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="3" 
        strokeDasharray="50 15" 
        strokeLinecap="round" 
        transform="rotate(-45 16 16)" 
      />
      <circle 
        cx="16" 
        cy="16" 
        r="4" 
        fill={`url(#${gradientId})`} 
        opacity="0.85" 
      />
    </svg>
  );
};
