import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Shield, Star, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BrowserAddressBarProps {
  currentUrl: string;
  isLoading: boolean;
  securityStatus: 'secure' | 'insecure' | 'internal';
  isBookmarked: boolean;
  onNavigate: (url: string) => void;
  onToggleBookmark: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const BrowserAddressBar: React.FC<BrowserAddressBarProps> = ({
  currentUrl,
  isLoading,
  securityStatus,
  isBookmarked,
  onNavigate,
  onToggleBookmark,
  inputRef: externalRef,
}) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalRef || internalRef;
  const [inputValue, setInputValue] = useState(currentUrl === 'orion://newtab' ? '' : currentUrl);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(currentUrl === 'orion://newtab' ? '' : currentUrl);
    }
  }, [currentUrl, isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val) {
        onNavigate(val);
      } else {
        onNavigate('orion://newtab');
      }
      activeInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(currentUrl === 'orion://newtab' ? '' : currentUrl);
      activeInputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Select all text when clicking or focusing the address bar
    setTimeout(() => {
      activeInputRef.current?.select();
    }, 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative flex-1 flex items-center min-w-[200px] h-8 bg-os-bg border border-os-border focus-within:border-os-accent rounded-lg shadow-xs transition-all overflow-hidden">
      {/* Security Status Badge */}
      <div 
        className="flex items-center pl-2.5 pr-1.5 shrink-0 select-none text-xs"
        title={
          securityStatus === 'secure'
            ? 'Connection is secure (HTTPS)'
            : securityStatus === 'internal'
            ? 'Orion OS Internal Application'
            : 'Connection is not secure (HTTP)'
        }
      >
        {securityStatus === 'secure' ? (
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
        ) : securityStatus === 'internal' ? (
          <Shield className="w-3.5 h-3.5 text-os-accent" />
        ) : (
          <Unlock className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>

      {/* Address / Search Input */}
      <input
        ref={activeInputRef as any}
        type="text"
        data-testid="browser-address-input"
        aria-label="Address and Search Bar (Ctrl+L)"
        value={inputValue}
        placeholder="Search the web or enter address..."
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none px-1 py-1 selection:bg-os-accent/30"
      />

      {/* Bookmark Star Toggle Button */}
      <button
        type="button"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this tab'}
        onClick={onToggleBookmark}
        className={cn(
          "px-2 py-1 text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer shrink-0 focus:outline-none",
          isBookmarked && "text-amber-400 hover:text-amber-300"
        )}
        title={isBookmarked ? 'Bookmark saved (Ctrl+D)' : 'Bookmark this tab (Ctrl+D)'}
      >
        <Star 
          className={cn("w-3.5 h-3.5", isBookmarked && "fill-amber-400 text-amber-400")} 
        />
      </button>

      {/* Loading Progress Bar Indicator */}
      {isLoading && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-os-accent/20 overflow-hidden"
          role="progressbar"
          aria-label="Page loading"
        >
          <div className="h-full bg-os-accent animate-pulse w-full" />
        </div>
      )}
    </div>
  );
};
