/**
 * ORION-9 COMPUTER ("THIS PC") SYSTEM DASHBOARD
 * System architecture overview displaying storage volumes, category breakdowns,
 * direct folder shortcuts, kernel runtime status, and environment health telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Cpu,
  Server,
  Folder,
  Monitor,
  FileText,
  Download,
  FolderKanban,
  BarChart3,
  Truck,
  Brain,
  Trash2,
  CheckCircle2,
  Activity,
  Layers,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { orionFileSystemService, SYSTEM_FOLDERS } from '../core/filesystem/OrionFileSystemService';
import { VirtualStorageInfo, SystemFolderKey } from '../core/filesystem/types';
import { useWindowManager } from '../os/WindowManagerContext';
import { DatabaseConnectionManager } from '../core/database/DatabaseConnectionManager';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { cn } from '../lib/utils';

export function OrionComputer() {
  const { openApplication } = useWindowManager();
  const { user, profile, organization } = useAuth();
  const { showToast } = useToast();

  const [storageInfo, setStorageInfo] = useState<VirtualStorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const env = DatabaseConnectionManager.getInstance().getEnvironment();

  const loadStorage = async () => {
    setIsLoading(true);
    try {
      await orionFileSystemService.ensureSystemStructure();
      const info = await orionFileSystemService.getVirtualStorageInfo();
      setStorageInfo(info);
    } catch (e) {
      console.error('Failed to load storage info in Orion Computer', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const openFolderInExplorer = (key: SystemFolderKey) => {
    openApplication('file-manager');
  };

  // Convert bytes to readable string
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const usedPercentage = storageInfo
    ? Math.min(100, Math.max(1, (storageInfo.usedBytes / storageInfo.totalCapacityBytes) * 100))
    : 0;

  return (
    <div className="flex flex-col h-full w-full bg-os-surface text-os-text-primary select-none overflow-y-auto p-5 gap-6 rounded-b-xl">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between bg-os-surface-tint border border-os-border/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <HardDrive size={26} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-os-text-primary flex items-center gap-2">
              Orion-9 Workstation Computer
              <span className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase",
                env === 'LIVE' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              )}>
                {env} Mode
              </span>
            </h2>
            <p className="text-xs text-os-text-muted mt-0.5">
              Virtual Host Node • Enterprise Cloud Storage Subsystem • Orion OS v9.4.0
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadStorage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-xs font-medium text-os-text-secondary transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin text-os-accent" : ""} />
          <span>Refresh Hardware</span>
        </button>
      </div>

      {/* Storage Volumes & Partitions */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-os-text-muted uppercase tracking-wider px-1">
          Storage Volumes & Drives
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Drive C: */}
          <div
            onClick={() => openApplication('file-manager')}
            className="flex flex-col gap-3 p-4 rounded-2xl bg-os-surface-tint border border-os-border/60 hover:border-os-accent/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <HardDrive size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold text-os-text-primary group-hover:text-os-accent transition-colors">
                    Orion Virtual Disk (C:)
                  </div>
                  <div className="text-[10px] text-os-text-muted">Primary System Volume</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-os-text-muted group-hover:text-os-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="w-full bg-os-surface rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, usedPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-os-text-muted">
              <span>{storageInfo ? formatBytes(storageInfo.availableBytes) : '49.8 GB'} free</span>
              <span>50.0 GB Total</span>
            </div>
          </div>

          {/* Drive D: SCM Lake */}
          <div
            onClick={() => openApplication('command-center')}
            className="flex flex-col gap-3 p-4 rounded-2xl bg-os-surface-tint border border-os-border/60 hover:border-emerald-500/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Database size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold text-os-text-primary group-hover:text-emerald-400 transition-colors">
                    SCM Lake Volume (D:)
                  </div>
                  <div className="text-[10px] text-os-text-muted">Authoritative Firestore</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-os-text-muted group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="w-full bg-os-surface rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[12%]" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-os-text-muted">
              <span>Synchronized & Healthy</span>
              <span>Cloud Realtime</span>
            </div>
          </div>

          {/* Drive E: AI Model Cache */}
          <div
            onClick={() => openApplication('ai-copilot')}
            className="flex flex-col gap-3 p-4 rounded-2xl bg-os-surface-tint border border-os-border/60 hover:border-purple-500/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Brain size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold text-os-text-primary group-hover:text-purple-400 transition-colors">
                    AI Memory Cache (E:)
                  </div>
                  <div className="text-[10px] text-os-text-muted">High-Speed Context Store</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-os-text-muted group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="w-full bg-os-surface rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full w-[24%]" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-os-text-muted">
              <span>Ready for Copilot Inference</span>
              <span>In-Memory</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Folders Quick Access Cards */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-os-text-muted uppercase tracking-wider px-1">
          System Folders
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {SYSTEM_FOLDERS.map(f => (
            <div
              key={f.key}
              onClick={() => openFolderInExplorer(f.key)}
              className="flex items-center gap-3 p-3 rounded-xl bg-os-surface-tint border border-os-border/50 hover:bg-os-surface-hover hover:border-os-accent/40 cursor-pointer transition-all group"
            >
              <div className="p-2 rounded-lg bg-os-surface text-os-accent group-hover:scale-110 transition-transform">
                <Folder size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-os-text-primary truncate group-hover:text-os-accent">
                  {f.name}
                </span>
                <span className="text-[10px] text-os-text-muted">System Folder</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Categorization & System Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Breakdown */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-os-surface-tint border border-os-border/60">
          <h3 className="text-xs font-bold text-os-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-400" />
            Disk Usage Breakdown
          </h3>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="flex items-center gap-2 text-os-text-secondary">
                <FileText size={14} className="text-cyan-400" />
                Documents & Memos
              </span>
              <span className="font-mono text-os-text-primary">
                {storageInfo ? formatBytes(storageInfo.categories.documents) : '0 B'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="flex items-center gap-2 text-os-text-secondary">
                <BarChart3 size={14} className="text-emerald-400" />
                Reports & Analytics
              </span>
              <span className="font-mono text-os-text-primary">
                {storageInfo ? formatBytes(storageInfo.categories.reports) : '0 B'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="flex items-center gap-2 text-os-text-secondary">
                <Truck size={14} className="text-amber-400" />
                Supply Chain Datasets
              </span>
              <span className="font-mono text-os-text-primary">
                {storageInfo ? formatBytes(storageInfo.categories.supplyChain) : '0 B'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="flex items-center gap-2 text-os-text-secondary">
                <Brain size={14} className="text-purple-400" />
                AI Prompts & Rules
              </span>
              <span className="font-mono text-os-text-primary">
                {storageInfo ? formatBytes(storageInfo.categories.ai) : '0 B'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-2 text-os-text-secondary">
                <Trash2 size={14} className="text-rose-400" />
                Recycle Bin
              </span>
              <span className="font-mono text-os-text-primary">
                {storageInfo ? formatBytes(storageInfo.categories.recycleBin) : '0 B'}
              </span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-os-surface-tint border border-os-border/60">
          <h3 className="text-xs font-bold text-os-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={14} className="text-cyan-400" />
            Kernel Specifications & Telemetry
          </h3>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="text-os-text-secondary">OS Platform:</span>
              <span className="font-semibold text-os-text-primary">Orion-9 Autonomous Enterprise OS</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="text-os-text-secondary">Core Architecture:</span>
              <span className="font-mono text-os-text-primary">React 19 + TypeScript + Cloud Firestore</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="text-os-text-secondary">Active Tenant:</span>
              <span className="font-mono text-os-accent">{profile?.organizationId || organization?.id || 'tenant_default'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-os-border/40">
              <span className="text-os-text-secondary">Virtual File System:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                Multi-Tenant Isolated
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-os-text-secondary">Edge Synchronization:</span>
              <span className="text-os-text-primary">Cloudflare Pages Global CDN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
