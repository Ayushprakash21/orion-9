/**
 * ORION-9 OS LANGUAGE SERVICES & LANGUAGE PACK MANAGER
 * 
 * Comprehensive management interface for OS-level language packs, offline package installation,
 * catalog downloads, dynamic RTL switching, and organization language policies.
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
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
  FileCode,
  HardDrive,
  FileDown
} from 'lucide-react';
import { useI18n, useLanguage } from '../../store/LanguageContext';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { formatNumber } from '../../lib/formatters';
import { SUPPORTED_LOCALES } from '../../i18n';
import { languageService } from '../../i18n/LanguagePackService';

export const LanguageSettingsPanel: React.FC = () => {
  const {
    locale,
    setLocale,
    setUserPreferredLanguage,
    installedLanguages,
    availableLanguages,
    activeLanguagePack,
    installLanguagePack,
    uninstallLanguagePack,
    updateLanguagePack,
    installLanguagePackFromFile,
    organizationPolicy,
    setOrganizationPolicy,
    t,
    dir,
  } = useI18n();

  const { showToast } = useToast();
  const { profile, hasRole } = useAuth();
  const isAdmin = hasRole(['platform_admin', 'organization_admin']) ||
                  profile?.role === 'platform_admin' ||
                  profile?.role === 'organization_admin';

  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-6 min-w-0 max-w-full font-sans text-white">
      {/* 1. CURRENT ACTIVE LANGUAGE HERO CARD */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#12151a] to-[#12151a] border border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Globe size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeLocaleInfo.nativeName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold uppercase">
                  Active OS Language
                </span>
                {dir === 'rtl' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    RTL Layout
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeLocaleInfo.name} • BCP-47: <span className="font-mono text-sky-300">{activeLocaleInfo.bcp47}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportPack(locale)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition"
              title="Export active package as .orionlang"
            >
              <FileDown size={13} />
              <span>Export .orionlang</span>
            </button>
          </div>
        </div>

        {/* Active Pack Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/[0.08] text-[11px] font-mono text-slate-400">
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 block text-[9px] uppercase">Translation Coverage</span>
            <span className="font-bold text-emerald-400">{activeLanguagePack?.manifest.coverage || 100}%</span>
          </div>
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 block text-[9px] uppercase">Pack Version</span>
            <span className="font-bold text-white">{activeLanguagePack?.manifest.version || '9.0.0'}</span>
          </div>
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 block text-[9px] uppercase">Text Direction</span>
            <span className="font-bold text-sky-400 uppercase">{dir}</span>
          </div>
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-slate-500 block text-[9px] uppercase">Package Type</span>
            <span className="font-bold text-white">{languageService.isBuiltIn(locale) ? 'Built-In Bundle' : 'Dynamic Pack'}</span>
          </div>
        </div>
      </div>

      {/* 2. INSTALLED LANGUAGE PACKS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-sky-400" />
              <span>Installed Language Packs ({installedLanguages.length})</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Locally cached translation packages ready for instantaneous OS switching.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {installedLanguages.map((pack) => {
            const isActive = locale === pack.locale;
            return (
              <div
                key={pack.locale}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-sky-950/20 border-sky-500/40 shadow-xs'
                    : 'bg-[#12151a] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{pack.nativeName}</span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">({pack.name})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 uppercase">{pack.locale}</span>
                      <span>•</span>
                      <span>v{pack.version || '1.0.0'}</span>
                      <span>•</span>
                      <span className="uppercase">{pack.direction}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border shrink-0 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : pack.isBuiltIn
                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : pack.isBuiltIn ? 'BUILT-IN' : 'INSTALLED'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        onClick={() => handleActivate(pack.locale)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[11px] font-mono transition cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleExportPack(pack.locale)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                      title="Export package (.orionlang)"
                    >
                      <FileDown size={14} />
                    </button>
                  </div>

                  {!pack.isBuiltIn && (
                    <button
                      onClick={() => handleUninstall(pack.locale)}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                      title="Uninstall Language Pack"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AIR-GAPPED / OFFLINE PACKAGE INSTALLATION */}
      <div className="p-4 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Upload size={14} className="text-emerald-400" />
              <span>Offline / Air-Gapped Package Installation (.orionlang)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload enterprise-certified data-only language packs for completely air-gapped environments.
            </p>
          </div>
        </div>

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
            Pure structured JSON format • Maximum 5MB • Validated before registration
          </p>

          {uploadError && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono text-left">
              {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* 4. AVAILABLE LANGUAGE PACKS CATALOG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Download size={14} className="text-sky-400" />
              <span>Official Language Catalog</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pre-validated language packages ready for internal 1-click installation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {availableLanguages.map((manifest) => {
            const isInstallingThis = isInstalling === manifest.bcp47.split('-')[0];
            return (
              <div
                key={manifest.id}
                className="p-3 rounded-xl bg-[#12151a] border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-between gap-2 transition"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-white truncate">{manifest.nativeName}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {manifest.name} • <span className="uppercase">{manifest.direction}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleInstallFromCatalog(manifest.bcp47.split('-')[0])}
                  disabled={Boolean(isInstalling)}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-mono font-medium transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isInstallingThis ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>Install</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ORGANIZATION LANGUAGE POLICY (ADMIN CONTROL) */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>Enterprise Language Policy & Governance</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure corporate defaults and language distribution security boundaries.
              </p>
            </div>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              Admin Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-white block">User Language Downloads</span>
              <p className="text-[10px] text-slate-400">Allow regular operators to download language packs from catalog.</p>
              <button
                type="button"
                onClick={() => setOrganizationPolicy({ allowUserDownloads: !organizationPolicy.allowUserDownloads })}
                className={`mt-2 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  organizationPolicy.allowUserDownloads ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}
              >
                {organizationPolicy.allowUserDownloads ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-white block">Offline Package Ingestion</span>
              <p className="text-[10px] text-slate-400">Permit uploading uncataloged .orionlang packages.</p>
              <button
                type="button"
                onClick={() => setOrganizationPolicy({ allowOfflineUpload: !organizationPolicy.allowOfflineUpload })}
                className={`mt-2 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition ${
                  organizationPolicy.allowOfflineUpload ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}
              >
                {organizationPolicy.allowOfflineUpload ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck size={16} className="shrink-0" />
              <span>External & Browser Translation Isolation: Active (Zero Data Egress)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Enforced</span>
          </div>
        </div>
      )}
    </div>
  );
};
