import React, { useState, useEffect } from 'react';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandingConfig } from '../../types/auth';
import { OrionMark } from './OrionLogo';
import { cn } from '../../lib/utils';

export interface BrandLogoProps {
  sizePreset?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  size?: number; // legacy/fallback
  variant?: 'mark' | 'full' | 'full-descriptor';
  className?: string;
  adminBadge?: boolean;
}

const getSizing = (preset?: string, fallbackSize: number = 28) => {
  switch (preset) {
    case 'xs': return { width: 'auto', height: '14px', maxHeight: '14px', markSize: 14 }; // system bar
    case 'sm': return { width: 'auto', height: '24px', maxHeight: '24px', markSize: 24 }; // sidebar
    case 'md': return { width: 'clamp(100px, 10vw, 150px)', height: 'auto', maxHeight: '60px', markSize: 48 }; 
    case 'lg': return { width: 'clamp(150px, 14vw, 220px)', height: 'auto', maxHeight: '100px', markSize: 80 }; // login, init
    case 'xl': return { width: 'clamp(170px, 16vw, 240px)', height: 'auto', maxHeight: '120px', markSize: 100 }; // power on
    case 'hero': return { width: 'clamp(200px, 20vw, 300px)', height: 'auto', maxHeight: '160px', markSize: 120 };
    default: return { maxWidth: `${fallbackSize * 2.8}px`, maxHeight: `${fallbackSize}px`, width: 'auto', height: 'auto', markSize: fallbackSize };
  }
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  sizePreset,
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
      try {
        const config = await brandingRepository.getBranding();
        if (mounted) {
          setBranding(config);
        }
      } catch (err) {
        console.warn('BrandLogo load warning:', err);
      }
    };
    
    loadBranding().catch(() => {});
    const handleUpdate = () => {
      loadBranding().catch(() => {});
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
  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION SCM OS';
  const appTagline = branding.description || branding.tagline || 'AI Supply Chain Operating System';
  
  const hasCustomLogoWithText = Boolean(logoSource && !imgError && (branding.logoIncludesName || branding.logoIncludesWordmark));

  useEffect(() => {
    setImgError(false);
  }, [logoSource]);

  const sizing = getSizing(sizePreset, size);

  return (
    <div className={cn("flex items-center gap-3 select-none min-w-0 box-border", variant !== 'mark' && "w-full", className)}>
      {/* Vertically centered logo */}
      <div className="shrink-0 flex items-center justify-center">
        {logoSource && !imgError ? (
          <img 
            src={logoSource} 
            alt={appName} 
            style={{ 
              width: variant === 'mark' ? sizing.markSize : sizing.width, 
              height: variant === 'mark' ? sizing.markSize : sizing.height,
              maxWidth: sizing.maxWidth || '100%',
              maxHeight: sizing.maxHeight,
              objectFit: 'contain'
            }}
            className="shrink-0 rounded"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <OrionMark size={sizing.markSize} className="shrink-0" />
        )}
      </div>

      {/* If custom logo contains wordmark/text, render only adminBadge if requested to avoid duplicate text */}
      {hasCustomLogoWithText && adminBadge && variant !== 'mark' && (
        <span className="text-[9px] font-mono font-semibold bg-[#00F2FE]/10 text-[#00F2FE] px-1 py-0.5 rounded border border-[#00F2FE]/30 shrink-0 leading-none uppercase">
          ADMIN
        </span>
      )}
      
      {variant !== 'mark' && !hasCustomLogoWithText && (
        <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden leading-none">
          {/* Orion SCM OS name horizontally aligned with logo */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-mono font-bold tracking-wider text-os-text-primary text-sm whitespace-nowrap leading-none truncate">
              {appName}
            </span>
            {adminBadge && (
              <span className="text-[9px] font-mono font-semibold bg-[#00F2FE]/10 text-[#00F2FE] px-1 py-0.5 rounded border border-[#00F2FE]/30 shrink-0 leading-none uppercase">
                ADMIN
              </span>
            )}
          </div>
          {/* Subtitle aligned directly below Orion SCM OS */}
          {variant === 'full-descriptor' && (
            <span 
              className="text-[9px] font-mono text-os-text-muted tracking-wider uppercase mt-1.5 whitespace-nowrap leading-none truncate block" 
              title={appTagline}
            >
              {appTagline}
            </span>
          )}
        </div>
      )}

      {variant === 'mark' && adminBadge && (
        <span className="text-[9px] font-mono font-semibold bg-[#00F2FE]/10 text-[#00F2FE] px-1 py-0.5 rounded border border-[#00F2FE]/30 shrink-0 leading-none uppercase">
          ADMIN
        </span>
      )}
    </div>
  );
};
