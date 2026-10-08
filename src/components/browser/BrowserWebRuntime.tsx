/**
 * ORION-9 BROWSER WEB RUNTIME
 * 
 * Controlled, sandboxed iframe compatibility viewer for web deployments.
 * 
 * ABSOLUTE RULES:
 * - Minimal, intentional sandbox: sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
 * - ZERO bypass of X-Frame-Options or CSP frame-ancestors.
 * - ZERO arbitrary proxying or security downgrades.
 * - Explicit navigation state machine: IDLE -> NAVIGATING -> LOADED | BLOCKED | ERROR.
 * - Never fake PAGE_LOADED with arbitrary setTimeouts.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WebNavigationState } from './BrowserTypes';

export interface BrowserWebRuntimeProps {
  url: string;
  generation?: number;
  title?: string;
  isLoading?: boolean;
  onNavigationStateChange?: (state: WebNavigationState) => void;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (err?: string) => void;
  onError?: (err: string) => void;
  onBlocked?: () => void;
}

export const BrowserWebRuntime: React.FC<BrowserWebRuntimeProps> = ({
  url,
  generation = 0,
  title,
  isLoading: propIsLoading,
  onNavigationStateChange,
  onLoadStart,
  onLoad,
  onLoadComplete,
  onLoadError,
  onError,
  onBlocked,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [navState, setNavState] = useState<WebNavigationState>('NAVIGATING');

  const updateState = (state: WebNavigationState) => {
    setNavState(state);
    onNavigationStateChange?.(state);
  };

  useEffect(() => {
    updateState('NAVIGATING');
    onLoadStart?.();
    let mounted = true;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[BROWSER:WEB]', `Navigating sandboxed iframe to: ${url}`);
    }

    // Safety timeout: bounded timeout to prevent infinite spinner on unresponsive or blocked destinations
    const timeout = setTimeout(() => {
      if (mounted) {
        updateState('ERROR');
        onLoadError?.('Timed out waiting for webpage to load');
      }
    }, 12000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [url, generation]);

  const handleIframeLoad = () => {
    // In standard browsers, cross-origin iframes refusing embedding trigger a load event with about:blank
    // or inaccessible contentDocument.
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.location.href === 'about:blank' && url !== 'about:blank') {
        updateState('BLOCKED');
        onBlocked?.();
        return;
      }
    } catch {
      // Cross-origin restriction: typical browser security response
    }

    updateState('LOADED');
    onLoad?.();
    onLoadComplete?.();
  };

  const handleIframeError = () => {
    updateState('ERROR');
    onLoadError?.('Failed to load page content');
    onError?.('Failed to load page content');
  };

  const isLoading = navState === 'NAVIGATING';

  return (
    <div className="relative w-full h-full flex-1 bg-white overflow-hidden">
      {isLoading && (
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center bg-os-bg/60 backdrop-blur-xs"
          role="status"
          aria-label="Loading web content"
        >
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-os-surface border border-os-border shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin text-os-accent" />
            <span className="text-xs text-os-text-muted">Loading webpage...</span>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        key={`${url}-${generation}`}
        src={url}
        data-testid="browser-web-runtime-iframe"
        title="Web Page Content"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        className={cn(
          "w-full h-full border-0 select-auto transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
};
