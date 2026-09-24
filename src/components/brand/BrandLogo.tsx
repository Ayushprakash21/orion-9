import React, { useState, useEffect } from 'react';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandingConfig } from '../../types/auth';
import { OrionMark } from './OrionLogo';
import { cn } from '../../lib/utils';

export const AUTHORITATIVE_DEFAULT_LOGO = '/orion-9-official-logo.png';

export interface BrandLogoProps {
  sizePreset?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  size?: number; // legacy/fallback
  variant?: 'mark' | 'full' | 'full-descriptor';
  className?: string;
  adminBadge?: boolean;
}

const getSizing = (preset?: string, fallbackSize: number = 28) => {
  switch (preset) {
    case 'xs': return { width: 'auto', height: '18px', maxHeight: '18px', maxWidth: '40px', markSize: 18 }; // system bar
    case 'sm': return { width: 'auto', height: '28px', maxHeight: '28px', maxWidth: '60px', markSize: 28 }; // sidebar
    case 'md': return { width: 'clamp(120px, 12vw, 160px)', height: 'auto', maxHeight: '70px', maxWidth: '180px', markSize: 60 }; 
    case 'lg': return { width: 'clamp(160px, 18vw, 240px)', height: 'auto', maxHeight: '120px', maxWidth: '260px', markSize: 100 }; // login, init
    case 'xl': return { width: 'clamp(190px, 20vw, 280px)', height: 'auto', maxHeight: '140px', maxWidth: '300px', markSize: 120 }; // power on
    case 'hero': return { width: 'clamp(220px, 24vw, 340px)', height: 'auto', maxHeight: '180px', maxWidth: '380px', markSize: 150 };
    default: return { maxWidth: `${fallbackSize * 2.8}px`, maxHeight: `${fallbackSize}px`, width: 'auto', height: `${fallbackSize}px`, markSize: fallbackSize };
  }
};

const isCustomTenantLogo = (source?: string | null): boolean => {
  if (!source) return false;
  const trimmed = source.trim();
  if (
    trimmed === '' ||
    trimmed === '/orion-9-logo.png' ||
    trimmed === '/orion-9-brand-logo.png' ||
    trimmed === '/orion-9-official-logo.png' ||
    trimmed === '/orion-9-logo-cropped.png' ||
    trimmed === '/orion-9-logo-transparent-v2.png'
  ) {
    return false;
  }
  return true;
};

const preloadedLogos = new Set<string>();

/**
 * Ensures the logo asset is fully loaded and decoded in memory before rendering,
 * preventing progressive top-to-bottom scanline reveals or partial decoding artifacts.
 */
export const preloadLogoImage = async (url: string): Promise<void> => {
  if (!url || typeof window === 'undefined' || typeof Image === 'undefined' || preloadedLogos.has(url)) return;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    const onReady = () => {
      preloadedLogos.add(url);
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      onReady();
    } else {
      img.onload = onReady;
      img.onerror = () => resolve();
    }
  });
};

// Eagerly preload default canonical logo at module load time
if (typeof window !== 'undefined') {
  preloadLogoImage(AUTHORITATIVE_DEFAULT_LOGO).catch(() => {});
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
        const source = (config.logo || config.logoUrl || '').trim() || AUTHORITATIVE_DEFAULT_LOGO;
        await preloadLogoImage(source);
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

  const rawLogo = branding.logo || branding.logoUrl;
  const isCustomLogo = isCustomTenantLogo(rawLogo);
  const logoSource = (rawLogo && typeof rawLogo === 'string' && rawLogo.trim()) 
    ? rawLogo.trim() 
    : AUTHORITATIVE_DEFAULT_LOGO;

  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION-9';
  const appTagline = branding.description || branding.tagline || 'AI Supply Chain Operating System';
  
  const hasCustomLogoWithText = Boolean(isCustomLogo && rawLogo && !imgError && (branding.logoIncludesName || branding.logoIncludesWordmark));

  useEffect(() => {
    setImgError(false);
    if (logoSource) {
      preloadLogoImage(logoSource).catch(() => {});
    }
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
            loading="eager"
            decoding="async"
            style={{ 
              width: sizing.width || 'auto', 
              height: sizing.height || 'auto',
              maxWidth: sizing.maxWidth || '100%',
              maxHeight: sizing.maxHeight,
              objectFit: 'contain'
            }}
            className="orion-brand-image shrink-0"
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
          {/* Orion-9 name horizontally aligned with logo */}
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
          {/* Subtitle aligned directly below Orion-9 */}
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
