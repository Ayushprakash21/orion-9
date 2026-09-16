import React from 'react';

interface OrionMarkProps {
  size?: number;
  className?: string;
}

export const OrionMark: React.FC<OrionMarkProps> = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="o9-primary" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12" stroke="url(#o9-primary)" strokeWidth="3" strokeDasharray="50 15" strokeLinecap="round" transform="rotate(-45 16 16)" />
      <circle cx="16" cy="16" r="4" fill="url(#o9-primary)" opacity="0.8" />
    </svg>
  );
};
