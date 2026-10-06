/**
 * ORION-9 OS LANGUAGE & REGION PANEL
 * 
 * Clean, OS-style Settings panel for Interface Language, Regional Locales, Formats,
 * Installed Language Packs, and Air-Gapped Offline Packages.
 */

import React, { useState, useRef } from 'react';
import {
  Globe,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Upload,
  ShieldCheck,
  Layers,
  FileDown,
  Search,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  DollarSign,
  ChevronUp,
  X
} from 'lucide-react';
import { useI18n } from '../../store/LanguageContext';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALE_CODES } from '../../i18n';
import { languageService } from '../../i18n/LanguagePackService';
import { SearchableDropdown } from '../ui/SearchableDropdown';
import { locales } from '../../lib/timezones';
import { cn } from '../../lib/utils';

export const LanguageSettingsPanel: React.FC = () => {
  const {
    locale,
    setUserPreferredLanguage,
    installedLanguages,
    availableLanguages,
    activeLanguagePack,
    installLanguagePack,
    uninstallLanguagePack,
    installLanguagePackFromFile,
    organizationPolicy,
    setOrganizationPolicy,
    languages,
    dir,
  } = useI18n();

  const { settings, updateSettings } = useSupplyChain();
  const { showToast } = useToast();
  const { profile, hasRole } = useAuth();
  const isAdmin = hasRole(['platform_admin', 'organization_admin']) ||
                  profile?.role === 'platform_admin' ||
                  profile?.role === 'organization_admin';

  // UI State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAdvancedOffline, setShowAdvancedOffline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatting state synced with system settings
  const [dateFormat, setDateFormat] = useState<string>(settings?.dateFormat || 'DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(settings?.timeFormat === '12h' ? '12h' : '24h');
  const [numberFormat, setNumberFormat] = useState<string>(settings?.numberFormat || '1,23,456.78');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'Monday' | 'Sunday'>((settings?.firstDayOfWeek as 'Monday' | 'Sunday') || 'Monday');
  const [selectedRegion, setSelectedRegion] = useState<string>(settings?.region || 'India');

  const activeLocaleInfo = SUPPORTED_LOCALES[locale] || {
    code: locale,
    name: locale,
    nativeName: locale,
    dir: dir,
    bcp47: locale,
  };

  const handleActivate = async (code: string) => {
    try {
      await setUserPreferredLanguage(code as any, profile?.id);
      showToast(`Active language set to ${SUPPORTED_LOCALES[code]?.nativeName || code}.`, 'success', 'Language Updated');
      setIsPickerOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to switch language.', 'error', 'Language Error');
    }
  };

  const handleInstallFromCatalog = async (code: string) => {
    setIsInstalling(code);
    try {
      const res = await installLanguagePack(code);
      if (res.success) {
        showToast(res.message || `Language pack ${code} installed.`, 'success', 'Language Pack Installed');
      } else {
        showToast(res.message || 'Installation failed.', 'error', 'Installation Failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Installation error.', 'error', 'Error');
    } finally {
      setIsInstalling(null);
    }
  };

  const handleUninstall = async (code: string) => {
    try {
      const res = await uninstallLanguagePack(code);
      if (res.success) {
        showToast(`Language pack "${code}" removed.`, 'info', 'Package Removed');
      } else {
        showToast(res.message || 'Cannot remove language pack.', 'warning', 'Action Prohibited');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove language pack.', 'error', 'Error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await file.text();
      const res = await installLanguagePackFromFile(text);
      if (res.success && res.locale) {
        showToast(`Air-gapped language pack (${res.locale}) installed successfully!`, 'success', 'Package Installed');
        await setUserPreferredLanguage(res.locale as any, profile?.id);
      } else {
        setUploadError(res.error || 'Failed to validate .orionlang package.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to read package file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportPack = (code: string) => {
    const pack = languageService.exportLanguagePack(code);
    if (!pack) {
      showToast('No package data available to export.', 'warning', 'Export Unavailable');
      return;
    }

    const json = JSON.stringify(pack, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${code}.orionlang`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${code}.orionlang for air-gapped deployment.`, 'success', 'Package Exported');
  };

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 font-sans text-white max-w-full">
      {/* SECTION 1 — INTERFACE LANGUAGE */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Interface Language</h3>
              <p className="text-[11px] text-slate-400">Select the display language for Orion-9 OS applications.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>Change Language</span>
            <ChevronDown size={14} className={cn("transition-transform", isPickerOpen && "rotate-180")} />
          </button>
        </div>

        {/* Current Selected Language Summary Row */}
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{activeLocaleInfo.nativeName}</span>
            <span className="text-slate-400 font-mono text-[11px]">• {activeLocaleInfo.name} ({activeLocaleInfo.bcp47})</span>
            {dir === 'rtl' && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[9px] font-mono font-bold uppercase border border-amber-500/30">
                RTL
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-bold uppercase">
            ACTIVE
          </span>
        </div>

        {/* Compact Searchable Language Picker Popover Modal */}
        {isPickerOpen && (
          <div className="p-3 rounded-xl bg-[#0d1015] border border-sky-500/30 space-y-2 animate-in fade-in duration-150 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Search size={14} className="text-sky-400" /> Search Languages ({languages.length})
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X size={14} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search languages by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 font-sans"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-white/[0.04]">
              {filteredLanguages.map((lang) => {
                const isSelected = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleActivate(lang.code)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs transition flex items-center justify-between cursor-pointer",
                      isSelected
                        ? "bg-sky-500/15 text-sky-300 font-semibold"
                        : "hover:bg-white/[0.05] text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.nativeName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({lang.name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                        {lang.code}
                      </span>
                      {isSelected && <Check size={14} className="text-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 — REGION & LOCALE */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Region & Locale</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Region</label>
            <SearchableDropdown
              value={selectedRegion}
              options={[
                { value: 'India', label: 'India' },
                { value: 'United States', label: 'United States' },
                { value: 'United Kingdom', label: 'United Kingdom' },
                { value: 'Germany', label: 'Germany' },
                { value: 'France', label: 'France' },
                { value: 'Japan', label: 'Japan' },
                { value: 'Singapore', label: 'Singapore' },
                { value: 'Australia', label: 'Australia' }
              ]}
              onChange={(val) => {
                setSelectedRegion(val);
                updateSettings({ region: val });
              }}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Locale Configuration</label>
            <SearchableDropdown
              value={settings?.locale || 'en-IN'}
              options={locales}
              onChange={(val) => updateSettings({ locale: val })}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3 — FORMATS */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Regional Formats</h4>

        <div className="divide-y divide-white/[0.06] text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">Date Format</span>
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                updateSettings({ dateFormat: e.target.value });
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 font-mono"
            >
              <option value="DD/MM/YYYY" className="bg-[#12151a]">DD/MM/YYYY (26/10/2026)</option>
              <option value="MM/DD/YYYY" className="bg-[#12151a]">MM/DD/YYYY (10/26/2026)</option>
              <option value="YYYY-MM-DD" className="bg-[#12151a]">YYYY-MM-DD (2026-10-26)</option>
            </select>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">Time Format</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('24h');
                  updateSettings({ timeFormat: '24h' });
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer border",
                  timeFormat === '24h' ? "bg-sky-500/20 border-sky-500/40 text-sky-400" : "bg-white/[0.03] border-white/10 text-slate-400"
                )}
              >
                24-Hour (19:44)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('12h');
                  updateSettings({ timeFormat: '12h' });
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer border",
                  timeFormat === '12h' ? "bg-sky-500/20 border-sky-500/40 text-sky-400" : "bg-white/[0.03] border-white/10 text-slate-400"
                )}
              >
                12-Hour (7:44 PM)
              </button>
            </div>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">Number Format</span>
            <select
              value={numberFormat}
              onChange={(e) => {
                setNumberFormat(e.target.value);
                updateSettings({ numberFormat: e.target.value });
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 font-mono"
            >
              <option value="1,23,456.78" className="bg-[#12151a]">1,23,456.78 (South Asian)</option>
              <option value="123,456.78" className="bg-[#12151a]">123,456.78 (Standard)</option>
              <option value="123.456,78" className="bg-[#12151a]">123.456,78 (European)</option>
            </select>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">Currency</span>
            <span className="font-mono text-sky-400">{settings?.currency || 'INR'} — Indian Rupee</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">First Day of Week</span>
            <select
              value={firstDayOfWeek}
              onChange={(e) => {
                const val = e.target.value as 'Monday' | 'Sunday';
                setFirstDayOfWeek(val);
                updateSettings({ firstDayOfWeek: val });
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50"
            >
              <option value="Monday" className="bg-[#12151a]">Monday</option>
              <option value="Sunday" className="bg-[#12151a]">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4 — INSTALLED LANGUAGE PACKS */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} className="text-sky-400" />
            <span>Installed Language Packs ({installedLanguages.length})</span>
          </h4>
        </div>

        <div className="overflow-x-auto border border-white/[0.06] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.08] text-[10px] uppercase font-mono text-slate-400">
                <th className="py-2 px-3">Language</th>
                <th className="py-2 px-3">Version</th>
                <th className="py-2 px-3">Coverage</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {installedLanguages.map((pack) => {
                const isActive = locale === pack.locale;
                return (
                  <tr key={pack.locale} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{pack.nativeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pack.name} ({pack.locale})</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">v{pack.version || '9.0.0'}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{pack.coverage || 100}%</td>
                    <td className="py-2.5 px-3">
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border",
                        isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {isActive ? 'Active' : 'Installed'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => handleActivate(pack.locale)}
                          className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[11px] font-mono transition cursor-pointer"
                        >
                          Set Active
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">Default</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 — OFFLINE LANGUAGE PACKS (EXPANDABLE) */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvancedOffline(!showAdvancedOffline)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Upload size={14} className="text-emerald-400" />
            <span>Advanced / Offline Language Packages (.orionlang)</span>
          </span>
          <ChevronDown size={14} className={cn("transition-transform", showAdvancedOffline && "rotate-180")} />
        </button>

        {showAdvancedOffline && (
          <div className="pt-2 space-y-3 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/[0.01] hover:bg-white/[0.03] transition text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".orionlang,.json"
                onChange={handleFileUpload}
                disabled={isUploading || !organizationPolicy.allowOfflineUpload}
                className="hidden"
                id="orionlang-file-input"
              />
              <label
                htmlFor="orionlang-file-input"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white cursor-pointer transition active:scale-95 ${
                  !organizationPolicy.allowOfflineUpload ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Upload size={14} className="text-emerald-400" />
                <span>Select .orionlang Package File</span>
              </label>
              <p className="text-[10px] text-slate-500 font-mono">
                Pure structured JSON format • Air-Gapped Package Import
              </p>

              {uploadError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono text-left">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleExportPack(locale)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
              >
                <FileDown size={13} />
                <span>Export Active .orionlang Package</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
