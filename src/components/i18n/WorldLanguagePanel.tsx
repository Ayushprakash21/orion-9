import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Globe, Search, X, Check, Sparkles, Download, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { SUPPORTED_LOCALES, LocaleInfo } from '../../i18n/types';
import { languageService } from '../../i18n/LanguagePackService';
import { LanguagePackEntry, LanguagePackManifest } from '../../i18n';

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
  const [installingLocale, setInstallingLocale] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFeedbackMessage(null);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside & Escape key to close
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

  // Read installed & available languages from single authority LanguagePackService
  const installedList: LanguagePackEntry[] = useMemo(() => {
    return languageService.listInstalledLanguages();
  }, [isOpen, installingLocale]);

  const allLanguages: LocaleInfo[] = useMemo(() => {
    return Object.values(SUPPORTED_LOCALES);
  }, []);

  const installedCodes = useMemo(() => {
    return new Set(installedList.map(i => i.locale));
  }, [installedList]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allLanguages;

    return allLanguages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.dir.toLowerCase().includes(q)
    );
  }, [allLanguages, searchQuery]);

  const handleInstallAndActivate = async (localeCode: string) => {
    setInstallingLocale(localeCode);
    setFeedbackMessage(null);
    try {
      const res = await languageService.installLanguagePack(localeCode);
      if (res.success) {
        onSelectLocale(localeCode);
        onClose();
      } else {
        setFeedbackMessage(res.message || 'Language pack unavailable.');
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Installation failed.');
    } finally {
      setInstallingLocale(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="World Languages"
      data-testid="world-language-panel"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] max-h-[80dvh] sm:max-h-[500px] flex flex-col bg-[#090d16]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 text-xs overflow-hidden animate-fadeIn"
    >
      {/* Header with Title & Search Input */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>World Languages</span>
            <span className="text-[10px] font-mono text-sky-400/80 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              Internal Language Services
            </span>
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
            placeholder="Search languages by name, code, or direction..."
            data-testid="language-search-input"
            className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {feedbackMessage && (
          <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
            {feedbackMessage}
          </div>
        )}
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
                {filteredLanguages.map((lang) => {
                  const isInstalled = installedCodes.has(lang.code);
                  const isSelected = currentLocale === lang.code;
                  return (
                    <LanguageOptionItem
                      key={lang.code}
                      lang={lang}
                      isInstalled={isInstalled}
                      isSelected={isSelected}
                      isInstalling={installingLocale === lang.code}
                      onSelect={() => {
                        if (isInstalled) {
                          onSelectLocale(lang.code);
                          onClose();
                        } else {
                          handleInstallAndActivate(lang.code);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Grouped View: Installed vs Available */
          <>
            {/* Installed Language Packs */}
            <div data-testid="recommended-languages">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-sky-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Installed Language Packs ({installedList.length})</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">Ready</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {installedList.map((entry) => {
                  const langInfo = SUPPORTED_LOCALES[entry.locale] || {
                    code: entry.locale,
                    name: entry.name,
                    nativeName: entry.nativeName,
                    dir: entry.direction,
                    bcp47: entry.bcp47,
                  };
                  return (
                    <LanguageOptionItem
                      key={`inst-${entry.locale}`}
                      lang={langInfo}
                      isInstalled={true}
                      isSelected={currentLocale === entry.locale}
                      isInstalling={false}
                      onSelect={() => {
                        onSelectLocale(entry.locale);
                        onClose();
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Available Language Packs for In-App Install */}
            <div data-testid="all-languages" className="pt-2 border-t border-white/[0.06]">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/40">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-sky-400" />
                  <span>Available Language Packs</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">.orionlang</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {allLanguages
                  .filter((l) => !installedCodes.has(l.code))
                  .map((lang) => (
                    <LanguageOptionItem
                      key={`avail-${lang.code}`}
                      lang={lang}
                      isInstalled={false}
                      isSelected={currentLocale === lang.code}
                      isInstalling={installingLocale === lang.code}
                      onSelect={() => handleInstallAndActivate(lang.code)}
                    />
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Info: Browser Translation Isolated */}
      <div className="px-3 py-2 border-t border-white/[0.08] bg-[#07090e] flex items-center justify-between text-[10px] font-mono text-white/40">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Internal Translation System</span>
        </span>
        <span className="text-white/30">Offline-Ready</span>
      </div>
    </div>
  );
};

interface LanguageOptionItemProps {
  lang: LocaleInfo;
  isInstalled: boolean;
  isSelected: boolean;
  isInstalling: boolean;
  onSelect: () => void;
}

const LanguageOptionItem: React.FC<LanguageOptionItemProps> = ({
  lang,
  isInstalled,
  isSelected,
  isInstalling,
  onSelect,
}) => {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-testid={`language-option-${lang.code}`}
      onClick={onSelect}
      disabled={isInstalling}
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

      <div className="flex items-center gap-1.5 shrink-0">
        {lang.dir === 'rtl' && (
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-bold">
            RTL
          </span>
        )}

        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 group-hover:text-white group-hover:bg-white/15 transition-all">
          {lang.code}
        </span>

        {isSelected ? (
          <div className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 font-bold stroke-[3]" />
          </div>
        ) : !isInstalled ? (
          isInstalling ? (
            <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
          ) : (
            <div className="p-1 rounded-md text-white/40 group-hover:text-sky-400 transition-colors" title="Download & Install Language Pack">
              <Download className="w-3 h-3" />
            </div>
          )
        ) : null}
      </div>
    </button>
  );
};
