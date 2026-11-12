import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Save, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  Layers, 
  Monitor, 
  Sliders 
} from 'lucide-react';
import { useToast } from '../store/ToastContext';
import { useWindowManager } from '../os/WindowManagerContext';
import { cn } from '../lib/utils';
import { ORION_OS_METADATA } from '../os/constants/OrionOsMetadata';

interface ConfigSnapshot {
  id: string;
  name: string;
  createdAt: string;
  theme: string;
  widgetsCount: number;
  workspacesCount: number;
  dockAppsCount: number;
  isCurrent?: boolean;
}

export const RecoveryCenter: React.FC = () => {
  const { showToast } = useToast();
  const { workspaces, dockPinnedApps } = useWindowManager();
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([
    {
      id: 'snap-pulsar-initial',
      name: 'Orion-9 OS 21.1 Pulsar Baseline Snapshot',
      createdAt: 'Today, 20:30',
      theme: 'Pulsar Dark',
      widgetsCount: 3,
      workspacesCount: 3,
      dockAppsCount: 11,
      isCurrent: true,
    },
    {
      id: 'snap-auto-backup-1',
      name: 'System Workspace Auto-Checkpoint',
      createdAt: 'Yesterday, 18:00',
      theme: 'Pulsar Dark',
      widgetsCount: 3,
      workspacesCount: 3,
      dockAppsCount: 10,
    },
    {
      id: 'snap-factory-default',
      name: 'Factory System Defaults',
      createdAt: 'Release Build v21.1',
      theme: 'Pulsar Dark',
      widgetsCount: 2,
      workspacesCount: 3,
      dockAppsCount: 9,
    },
  ]);

  const [confirmRollbackId, setConfirmRollbackId] = useState<string | null>(null);

  const handleCreateSnapshot = () => {
    const id = `snap-${Date.now()}`;
    const newSnapshot: ConfigSnapshot = {
      id,
      name: `User Snapshot #${snapshots.length + 1}`,
      createdAt: 'Just now',
      theme: 'Pulsar Dark',
      widgetsCount: 3,
      workspacesCount: workspaces.length,
      dockAppsCount: dockPinnedApps.length,
    };
    setSnapshots([newSnapshot, ...snapshots]);
    showToast('Created desktop and workspace configuration snapshot', 'success', 'Recovery Center');
  };

  const handleRollback = (id: string) => {
    setSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === id,
      }))
    );
    setConfirmRollbackId(null);
    showToast('Configuration restored successfully. Desktop environment reloaded.', 'success', 'Recovery Center');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white select-none overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Orion Recovery Center</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                CHECKPOINT READY
              </span>
            </div>
            <div className="text-[11px] text-white/50">Desktop workspace checkpoints, widget geometry backups, and safe state restoration</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateSnapshot}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Checkpoint</span>
        </button>
      </div>

      {/* Safety Notice per Rule 12 */}
      <div className="p-3 bg-white/[0.02] border-b border-white/[0.06] text-xs text-white/70 flex items-center gap-2 shrink-0">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Desktop State Boundary:</strong> Configuration snapshots protect your window manager layouts, widget placements, dock pinnings, and theme preferences. Transactional business data is preserved independently via Cloud Firestore.
        </span>
      </div>

      {/* Snapshots Roster */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div className="text-xs text-white/50 font-mono uppercase tracking-wider">
          Configuration Version History ({snapshots.length})
        </div>

        <div className="space-y-2.5">
          {snapshots.map((snap) => (
            <div
              key={snap.id}
              className={cn(
                "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4",
                snap.isCurrent ? "bg-white/[0.05] border-emerald-500/40 shadow-sm" : "bg-white/[0.02] border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  snap.isCurrent ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-white/60"
                )}>
                  {snap.isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white truncate">{snap.name}</span>
                    {snap.isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                        CURRENT ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/50 mt-1 font-mono">
                    <span>{snap.createdAt}</span>
                    <span>•</span>
                    <span>{snap.workspacesCount} Workspaces</span>
                    <span>•</span>
                    <span>{snap.widgetsCount} Widgets</span>
                    <span>•</span>
                    <span>{snap.dockAppsCount} Dock Apps</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {snap.isCurrent ? (
                  <span className="text-xs text-emerald-400 font-semibold px-2 py-1">Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRollbackId(snap.id)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Modal */}
        {confirmRollbackId && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Configuration Rollback</span>
            </div>
            <p className="text-white/80">
              Restoring this configuration will reposition desktop widgets, restore saved workspaces, and apply recorded theme preferences. Are you sure you wish to proceed?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRollback(confirmRollbackId)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
              >
                Yes, Restore Configuration
              </button>
              <button
                type="button"
                onClick={() => setConfirmRollbackId(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.08] bg-[#161b22] flex items-center justify-between text-xs text-white/50 shrink-0 font-mono">
        <div>ORION-9 RECOVERY & WORKSPACE RESTORATION ENGINE</div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Backups</span>
        </div>
      </div>
    </div>
  );
};

export default RecoveryCenter;
