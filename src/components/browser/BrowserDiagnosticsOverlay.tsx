/**
 * ORION-9 BROWSER DIAGNOSTICS OVERLAY
 * 
 * Development and runtime diagnostics panel providing real-time visibility into:
 * - Runtime Mode: WEB_EMBEDDED vs NATIVE_WEBVIEW
 * - Native Availability & Authoritative IPC Verification
 * - Active Tab & Surface Lifecycle State
 * - Navigation State Machine
 * - Event Stream Telemetry & Error Classification
 */

import React from 'react';
import { X, Activity, ShieldCheck, ShieldAlert, Monitor, Terminal } from 'lucide-react';
import { BrowserRuntimeCapability } from './BrowserRuntimeCapability';
import { BrowserTab } from './BrowserTypes';
import { resolveWebModePolicy } from './WebModePolicy';

export interface BrowserDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  capability: BrowserRuntimeCapability;
  activeTab?: BrowserTab;
  tabsCount: number;
  lastEvent?: { type: string; timestamp: number; detail?: any };
  lastError?: string;
}

export const BrowserDiagnosticsOverlay: React.FC<BrowserDiagnosticsProps> = ({
  isOpen,
  onClose,
  capability,
  activeTab,
  tabsCount,
  lastEvent,
  lastError,
}) => {
  if (!isOpen) return null;

  const isNative = capability.mode === 'NATIVE_WEBVIEW';
  const webPolicy = !isNative && activeTab ? resolveWebModePolicy(activeTab.url) : null;
  const iframeStatus = isNative 
    ? 'N/A (NATIVE_WEBVIEW)' 
    : (webPolicy?.iframeAllowed ? 'CREATED' : 'NOT_CREATED');

  return (
    <div 
      data-testid="browser-diagnostics-panel"
      className="absolute bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-os-surface/95 backdrop-blur-md border border-os-border shadow-2xl p-4 text-xs font-mono text-os-text-primary select-none pointer-events-auto"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-os-border/60">
        <div className="flex items-center gap-2 font-semibold tracking-wide text-os-text-primary">
          <Activity className="w-4 h-4 text-os-accent animate-pulse" />
          <span>ORION BROWSER DIAGNOSTICS</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-os-surface-hover text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
          aria-label="Close Diagnostics"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Runtime Mode */}
        <div className="flex justify-between items-center py-1 px-2 rounded-lg bg-os-bg/50">
          <span className="text-os-text-muted">Runtime:</span>
          <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
            isNative 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {capability.mode}
          </span>
        </div>

        {/* Web Mode Specific Diagnostics */}
        {!isNative && webPolicy && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="py-1 px-2 rounded-lg bg-os-bg/50 flex justify-between items-center">
                <span className="text-os-text-muted text-[10px]">Policy:</span>
                <span className={`font-bold text-[11px] ${
                  webPolicy.decision === 'EMBED_ALLOWED' ? 'text-emerald-400' :
                  webPolicy.decision === 'EXTERNAL_REQUIRED' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {webPolicy.decision}
                </span>
              </div>
              <div className="py-1 px-2 rounded-lg bg-os-bg/50 flex justify-between items-center">
                <span className="text-os-text-muted text-[10px]">Iframe:</span>
                <span className={`font-bold text-[11px] ${
                  webPolicy.iframeAllowed ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {iframeStatus}
                </span>
              </div>
            </div>

            <div className="py-1 px-2 rounded-lg bg-os-bg/50">
              <span className="text-os-text-muted block text-[10px]">Policy Reason:</span>
              <div className="text-[10px] text-os-text-secondary leading-tight mt-0.5">
                {webPolicy.reason}
              </div>
            </div>
          </>
        )}

        {/* Native Mode Specific Diagnostics */}
        {isNative && (
          <div className="grid grid-cols-2 gap-2">
            <div className="py-1 px-2 rounded-lg bg-os-bg/50 flex justify-between items-center">
              <span className="text-os-text-muted text-[10px]">Native Verified:</span>
              <span className={capability.verifiedNative ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {capability.verifiedNative ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="py-1 px-2 rounded-lg bg-os-bg/50 flex justify-between items-center">
              <span className="text-os-text-muted text-[10px]">Surface:</span>
              <span className="text-os-accent font-bold text-[11px]">
                {activeTab?.nativeLifecycleState || 'READY'}
              </span>
            </div>
          </div>
        )}

        {/* Active Tab & Surface Label */}
        <div className="py-1 px-2 rounded-lg bg-os-bg/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-os-text-muted">Tab:</span>
            <span className="text-os-accent font-semibold">{activeTab?.id || 'None'} ({tabsCount} tabs)</span>
          </div>
          {isNative && activeTab?.id && (
            <div className="text-[10px] text-os-text-muted font-mono">
              Native label: orion-browser-{activeTab.id.replace(/[^a-zA-Z0-9_-]/g, '_')}
            </div>
          )}
          <div className="text-[10px] text-os-text-secondary truncate mt-0.5">
            {activeTab?.title || 'No Title'}
          </div>
        </div>

        {/* Active URL & Navigation State */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 py-1 px-2 rounded-lg bg-os-bg/50">
            <span className="text-os-text-muted block text-[10px]">URL:</span>
            <div className="text-[10px] text-os-text-secondary truncate font-mono select-all">
              {activeTab?.url || 'about:blank'}
            </div>
          </div>
          <div className="py-1 px-2 rounded-lg bg-os-bg/50">
            <span className="text-os-text-muted block text-[10px]">State:</span>
            <span className={`font-semibold text-[10px] ${
              activeTab?.loadState === 'EXTERNAL_REQUIRED' || activeTab?.loadState === 'BLOCKED_EMBEDDING' ? 'text-amber-400' :
              activeTab?.loadState === 'PAGE_LOADED' ? 'text-emerald-400' :
              activeTab?.loadState === 'LOADING' ? 'text-cyan-400' : 'text-os-text-primary'
            }`}>
              {activeTab?.webNavigationState || activeTab?.loadState || 'IDLE'}
            </span>
          </div>
        </div>

        {/* Event Stream */}
        <div className="py-1 px-2 rounded-lg bg-os-bg/50">
          <div className="flex justify-between text-[10px] text-os-text-muted">
            <span>Last Event:</span>
            <span>{lastEvent ? new Date(lastEvent.timestamp).toLocaleTimeString() : '-'}</span>
          </div>
          <div className="text-[10px] text-os-accent truncate mt-0.5">
            {lastEvent?.type || 'None'}
          </div>
        </div>

        {lastError && (
          <div className="py-1 px-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
            <span className="font-bold block">Last Error:</span>
            <span className="break-all">{lastError}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-os-border/50 text-[10px] text-os-text-muted flex justify-between">
        <span>Toggle: Alt+D / Menu</span>
        <span>Platform: {capability.platform}</span>
      </div>
    </div>
  );
};
