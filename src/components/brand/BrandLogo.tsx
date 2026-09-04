import React, { useState, useEffect } from 'react';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandingConfig } from '../../types/auth';
import { OrionMark } from './OrionLogo';
import { cn } from '../../lib/utils';

export interface BrandLogoProps {
  size?: number;
  variant?: 'mark' | 'full' | 'full-descriptor';
  className?: string;
  adminBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 28, 
  variant = 'full', 
  className = '',
  adminBadge = false
}) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadBranding = async () => {
      const config = await brandingRepository.getBranding();
      if (mounted) {
        setBranding(config);
      }
    };
    
    loadBranding();

    const handleUpdate = () => {
      loadBranding();
    };

    window.addEventListener('orion-branding-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('orion-branding-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const logoSource = branding.logo || branding.logoUrl;
  const appName = branding.applicationName || branding.appName || 'Orion SCM OS';
  const hasCustomLogoWithText = Boolean(logoSource && !imgError && branding.logoIncludesName);

  useEffect(() => {
    setImgError(false);
  }, [logoSource]);

  return (
    <div className={cn("flex items-center gap-3 select-none min-w-0 w-full box-border", className)}>
      {/* Vertically centered logo */}
      <div className="shrink-0 flex items-center justify-center">
        {logoSource && !imgError ? (
          <img 
            src={logoSource} 
            alt={appName} 
            style={{ maxWidth: size * 2.8, maxHeight: size, width: 'auto', height: 'auto' }}
            className="object-contain shrink-0 rounded"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <OrionMark size={size} className="shrink-0" />
        )}
      </div>

      {/* If custom logo contains wordmark/text, render only adminBadge if requested to avoid duplicate text */}
      {hasCustomLogoWithText && adminBadge && (
        <span className="text-[9px] font-mono font-semibold bg-blue-900/30 text-blue-400 px-1 py-0.5 rounded border border-blue-900/50 shrink-0 leading-none uppercase">
          ADMIN
        </span>
      )}
      
      {variant !== 'mark' && !hasCustomLogoWithText && (
        <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden leading-none">
          {/* Orion SCM OS name horizontally aligned with logo */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-mono font-bold tracking-wider text-[#F5F5F5] text-sm whitespace-nowrap leading-none truncate">
              {appName}
            </span>
            {adminBadge && (
              <span className="text-[9px] font-mono font-semibold bg-blue-900/30 text-blue-400 px-1 py-0.5 rounded border border-blue-900/50 shrink-0 leading-none uppercase">
                ADMIN
              </span>
            )}
          </div>

          {/* Subtitle aligned directly below Orion SCM OS */}
          {variant === 'full-descriptor' && (
            <span 
              className="text-[9px] font-mono text-[#888888] tracking-wider uppercase mt-1.5 whitespace-nowrap leading-none truncate block" 
              title="AI SUPPLY CHAIN OPERATING SYSTEM"
            >
              AI SUPPLY CHAIN OPERATING SYSTEM
            </span>
          )}
        </div>
      )}

      {variant === 'mark' && !hasCustomLogoWithText && adminBadge && (
        <span className="text-[9px] font-mono font-semibold bg-blue-900/30 text-blue-400 px-1 py-0.5 rounded border border-blue-900/50 shrink-0 leading-none uppercase">
          ADMIN
        </span>
      )}
    </div>
  );
};
