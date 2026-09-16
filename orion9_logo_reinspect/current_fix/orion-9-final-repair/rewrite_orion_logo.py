new_content = """import React from 'react';

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
        <linearGradient id="o9-metallic" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="o9-cyan" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Infinity / O9 Monogram */}
      <path d="M16 15 C 19 9, 27 9, 27 15 C 27 21, 19 21, 16 15 C 13 9, 5 9, 5 15 C 5 21, 13 21, 16 15 Z" stroke="url(#o9-metallic)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M27 15 V 24" stroke="url(#o9-cyan)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
};
"""

with open('src/components/brand/OrionLogo.tsx', 'w') as f:
    f.write(new_content)
