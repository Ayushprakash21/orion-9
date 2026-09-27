import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Globe, Search, X, Check, Sparkles } from 'lucide-react';
import { SUPPORTED_LOCALES, LocaleInfo } from '../../i18n/types';

interface WorldLanguagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: string;
  onSelectLocale: (locale: string) => void;
}

export const WorldLanguagePanel: React.FC<WorldLanguagePanelProps> = ({
  isOpen,
  onClose,
  currentLocale,
  onSelectLocale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const allLanguages: LocaleInfo[] = useMemo(() => {
    return Object.values(SUPPORTED_LOCALES);
  }, []);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allLanguages;

    return allLanguages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [allLanguages, searchQuery]);

  const recommendedLanguages = useMemo(() => {
    return allLanguages.filter((l) => l.recommended);
  }, [allLanguages]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="World Languages"
      data-testid="world-language-panel"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[480px] flex flex-col bg-[#090d16]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 text-xs overflow-hidden animate-fadeIn"
    >
      {/* Header with Title & Search Input */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>World Languages</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search languages by name or code..."
            data-testid="language-search-input"
            className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Languages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar" data-testid="language-menu">
        {searchQuery.trim() ? (
          /* Search Results */
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
              Search Results ({filteredLanguages.length})
            </div>
            {filteredLanguages.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs font-mono">
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {filteredLanguages.map((lang) => (
                  <LanguageOptionItem
                    key={lang.code}
                    lang={lang}
                    isSelected={currentLocale === lang.code}
                    onSelect={() => {
                      onSelectLocale(lang.code);
                      onClose();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grouped View: Recommended & All Languages */
          <>
            {/* Recommended Group */}
            <div data-testid="recommended-languages">
              <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-400">
                <Sparkles className="w-3 h-3" />
                <span>Recommended</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {recommendedLanguages.map((lang) => (
                  <LanguageOptionItem
                    key={`rec-${lang.code}`}
                    lang={lang}
                    isSelected={currentLocale === lang.code}
                    onSelect={() => {
                      onSelectLocale(lang.code);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>

            {/* All Languages Group */}
            <div data-testid="all-languages" className="pt-2 border-t border-white/[0.06]">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                All Languages ({allLanguages.length})
              </div>
              <div className="space-y-0.5 mt-1">
                {allLanguages.map((lang) => (
                  <LanguageOptionItem
                    key={`all-${lang.code}`}
                    lang={lang}
                    isSelected={currentLocale === lang.code}
                    onSelect={() => {
                      onSelectLocale(lang.code);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface LanguageOptionItemProps {
  lang: LocaleInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const LanguageOptionItem: React.FC<LanguageOptionItemProps> = ({
  lang,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-testid={`language-option-${lang.code}`}
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all group cursor-pointer ${
        isSelected
          ? 'bg-sky-500/15 border border-sky-500/30 text-white'
          : 'hover:bg-white/[0.06] text-white/80 hover:text-white border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs truncate text-white group-hover:text-sky-300 transition-colors">
              {lang.nativeName}
            </span>
            {lang.name !== lang.nativeName && (
              <span className="text-[11px] text-white/40 truncate">
                {lang.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 group-hover:text-white group-hover:bg-white/15 transition-all">
          {lang.code}
        </span>
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 font-bold stroke-[3]" />
          </div>
        )}
      </div>
    </button>
  );
};
