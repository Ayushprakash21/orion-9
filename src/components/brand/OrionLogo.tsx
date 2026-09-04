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
      {/* Orbital O with integrated subtle 9 geometry */}
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" className="text-[#F5F5F5]" />
      <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" className="text-[#B3B3B3]" />
      <path d="M19.5 15.5L24 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-[#F5F5F5]" />
    </svg>
  );
};


