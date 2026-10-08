import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BrowserWebRuntimeProps {
  url: string;
  generation?: number;
  title?: string;
  isLoading?: boolean;
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
  onLoadStart,
  onLoad,
  onLoadComplete,
  onLoadError,
  onError,
  onBlocked,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    onLoadStart?.();
    let mounted = true;

    // Safety timeout: if iframe takes longer than 15s to load, check or notify
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [url, generation]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
    onLoadComplete?.();

    // In a browser environment, cross-origin iframes that refuse embedding via X-Frame-Options
    // or CSP will trigger a load event with an about:blank or empty contentDocument,
    // but cross-origin security prevents accessing contentDocument directly.
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.location.href === 'about:blank' && url !== 'about:blank') {
        onBlocked?.();
      }
    } catch {
      // Cross-origin access threw DOMException: standard security behavior for cross-origin sites
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    onLoadError?.('Failed to load page content');
    onError?.('Failed to load page content');
  };

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
