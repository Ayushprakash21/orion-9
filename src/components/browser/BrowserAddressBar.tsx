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
    setTimeout(() => {
      activeInputRef.current?.select();
    }, 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative flex-1 flex items-center min-w-[200px] h-8 bg-white/[0.05] backdrop-blur-md border border-white/[0.08] focus-within:border-[var(--orion-accent,#0071E3)]/60 focus-within:ring-2 focus-within:ring-[var(--orion-accent,#0071E3)]/25 rounded-[8px] shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)] transition-all overflow-hidden">
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
          <Shield className="w-3.5 h-3.5 text-[var(--orion-accent,#0071E3)]" />
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
        className="flex-1 bg-transparent text-xs text-[var(--orion-text-primary,#F2F2EF)] placeholder:text-[var(--orion-text-muted,#747875)] focus:outline-none px-1 py-1 selection:bg-[var(--orion-accent,#0071E3)]/30"
      />

      {/* Bookmark Action */}
      <button
        type="button"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        onClick={onToggleBookmark}
        className="p-1.5 mr-1 rounded-[5px] text-[var(--orion-text-muted,#747875)] hover:text-amber-400 hover:bg-white/[0.08] transition-colors cursor-pointer"
        title={isBookmarked ? 'Bookmarked' : 'Add bookmark'}
      >
        <Star className={cn('w-3.5 h-3.5', isBookmarked && 'fill-amber-400 text-amber-400')} />
      </button>

      {/* Loading Progress Bar Indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--orion-accent,#0071E3)]/20 overflow-hidden">
          <div className="h-full bg-[var(--orion-accent,#0071E3)] animate-pulse w-2/3" />
        </div>
      )}
    </div>
  );
};
