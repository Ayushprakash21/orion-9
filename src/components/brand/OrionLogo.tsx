import React from 'react';

interface OrionLogoProps {
  size?: number;
  variant?: 'mark' | 'full' | 'full-descriptor';
  className?: string;
}

export const OrionMark: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => {
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

export const OrionLogo: React.FC<OrionLogoProps> = ({ size = 28, variant = 'full', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <OrionMark size={size} />
      {variant !== 'mark' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tracking-wider text-[#F5F5F5] text-sm">ORION-9</span>
          </div>
          {variant === 'full-descriptor' && (
            <span className="text-[9px] font-mono text-[#777777] uppercase tracking-[0.15em] mt-0.5">
              AI SUPPLY CHAIN OS
            </span>
          )}
        </div>
      )}
    </div>
  );
};
