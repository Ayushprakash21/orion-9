import React, { useEffect, useState } from 'react';
import { BrandLogo } from './brand/BrandLogo';
import { brandingRepository } from '../repositories/BrandingRepository';
import { BrandingConfig } from '../types/auth';
import { cn } from '../lib/utils';

export interface LoadingScreenProps {
  message?: string;
  isFadingOut?: boolean;
  className?: string;
}

/**
 * Independent full-screen Orion SCM OS loading screen.
 * - Occupies 100vw × 100vh with position: fixed, z-index: 99999
 * - Locks application body/html scrollbars during loading
 * - Renders ONLY the single configured application logo, title, and enterprise loader
 * - Completely isolated from sidebar, header, navigation, and dashboard
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'INITIALIZING SYSTEM...',
  isFadingOut = false,
  className = '',
}) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());

  // Lock out any application scrollbars while loading screen is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Synchronize branding config if updated
  useEffect(() => {
    const handleUpdate = () => {
      const config = brandingRepository.getBrandingSync();
      setBranding(config);
    };

    window.addEventListener('orion-branding-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('orion-branding-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const appName = branding.applicationName || branding.appName || 'Orion SCM OS';
  const logoSource = branding.logo || branding.logoUrl;
  const hasCustomLogoWithText = Boolean(logoSource && branding.logoIncludesName);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
      }}
      className={cn(
        "fixed inset-0 w-screen h-screen z-[99999] flex flex-col items-center justify-center bg-[#0A0A0A] text-[#F5F5F5] select-none overflow-hidden m-0 p-0 box-border transition-opacity duration-300 ease-out",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center select-none">
        {/* Centered single configured Orion SCM OS logo with gentle fade/scale entrance */}
        <div className="flex items-center justify-center mb-6 animate-logo-fade-scale">
          <BrandLogo size={hasCustomLogoWithText ? 72 : 56} variant="mark" className="justify-center" />
        </div>

        {/* Render text only if logo does not already contain the wordmark/text */}
        {!hasCustomLogoWithText && (
          <>
            {/* Orion SCM OS Title */}
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-[0.25em] text-[#F5F5F5] uppercase animate-text-fade-in">
              {appName}
            </h1>

            {/* AI SUPPLY CHAIN OPERATING SYSTEM subtitle */}
            <p className="text-xs sm:text-sm font-sans text-[#888888] tracking-[0.05em] mt-1.5 animate-text-fade-in">
              AI SUPPLY CHAIN OPERATING SYSTEM
            </p>
          </>
        )}

        {/* Animated loading indicator */}
        <div className="mt-8 flex flex-col items-center">
          {/* Continuously animating indeterminate progress line */}
          <div
            className="w-48 sm:w-56 h-[2px] bg-[#1E1E1E] rounded-full overflow-hidden relative"
            role="progressbar"
            aria-label="Loading progress"
          >
            <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-[#E5E5E5] to-transparent rounded-full animate-indeterminate-bar" />
          </div>

          {/* INITIALIZING SYSTEM... with subtle opacity/pulse */}
          <span className="mt-4 text-[10px] sm:text-[11px] font-mono text-[#A1A1A1] tracking-[0.2em] uppercase animate-pulse-subtle">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
