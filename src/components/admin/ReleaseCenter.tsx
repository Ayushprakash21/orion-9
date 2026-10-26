/**
 * ORION-9 ENTERPRISE PRODUCTION CONTROL PLANE
 * Release Center UI Component
 * 
 * Release pipeline gates, preflight verification evidence, deployment history,
 * 1-click rollback linkage, and Cloud Firebase Storage installer uploader.
 */

import React, { useState, useEffect } from 'react';
import {
  releaseManager,
  ReleaseRecord,
  ReleaseStage,
  DesktopPackageMetadata,
} from '../../operations';
import { releaseService } from '../../services/releaseService';
import {
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Download,
  Laptop,
  Upload,
  RefreshCw,
  Copy,
  Check,
  X,
  FileCode,
  HardDrive,
} from 'lucide-react';

export const ReleaseCenter: React.FC<{ tenantId?: string }> = () => {
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Uploader Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadVersion, setUploadVersion] = useState('v10.0.0');
  const [uploadPlatform, setUploadPlatform] = useState<'windows-x64' | 'macos-universal' | 'macos-arm64'>('windows-x64');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedSha, setComputedSha] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadReleases = async () => {
    setIsSyncing(true);
    try {
      const list = await releaseManager.syncWithCloudReleases();
      setReleases(list);
      if (list.length > 0 && !selectedRelease) {
        setSelectedRelease(list[0]);
      } else if (selectedRelease) {
        const updated = list.find(r => r.id === selectedRelease.id);
        if (updated) setSelectedRelease(updated);
      }
    } catch {
      const list = releaseManager.getAllReleases();
      setReleases(list);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const handlePromote = (releaseId: string) => {
    const res = releaseManager.promoteRelease(releaseId, 'platform_admin');
    if (res.success) {
      loadReleases();
    } else {
      alert('Cannot promote release: all preflight verification gates must pass.');
    }
  };

  const handleRollback = (releaseId: string) => {
    if (window.confirm('Are you sure you want to trigger 1-click automated rollback for this release?')) {
      releaseManager.rollbackRelease(releaseId, 'platform_admin', 'Operational rollback via Release Center');
      loadReleases();
    }
  };

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    try {
      const sha = await releaseService.computeFileSha256(file);
      setComputedSha(sha);
    } catch (err: any) {
      setUploadError('Failed to compute file SHA-256: ' + (err?.message || err));
    }
  };

  const handleUploadAndPublish = async () => {
    if (!selectedFile) {
      setUploadError('Please select a desktop installer file.');
      return;
    }
    if (!uploadVersion.trim()) {
      setUploadError('Please specify a valid release version (e.g. v10.0.0).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const desktopPackage = await releaseService.uploadInstallerBinary({
        file: selectedFile,
        filename: selectedFile.name,
        version: uploadVersion.trim(),
        platform: uploadPlatform,
        onProgress: (pct) => setUploadProgress(pct),
      });

      const publishedRecord = await releaseService.publishReleaseRecord({
        version: uploadVersion.trim(),
        commitSha: 'HEAD',
        deployedBy: 'PLATFORM_ADMIN',
        notes: uploadNotes || `Production desktop installer ${selectedFile.name}`,
        desktopPackage,
        packages: [desktopPackage],
        stage: 'VERIFIED',
      });

      releaseManager.addOrUpdateRelease(publishedRecord);
      setShowUploadModal(false);
      setSelectedFile(null);
      setComputedSha('');
      setUploadNotes('');
      await loadReleases();
      setSelectedRelease(publishedRecord);
    } catch (err: any) {
      setUploadError('Upload failed: ' + (err?.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const getStageBadge = (stage: ReleaseStage) => {
    switch (stage) {
      case 'PROMOTED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PROMOTED</span>;
      case 'VERIFIED':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">VERIFIED</span>;
      case 'PREFLIGHT_PENDING':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PREFLIGHT PENDING</span>;
      case 'CANARY':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">CANARY</span>;
      case 'ROLLED_BACK':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">ROLLED BACK</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400">DRAFT</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitCommit className="h-6 w-6 text-cyan-400" />
              Release Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Deployment Safety & Preflight Gates
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise release verification pipeline, automated preflight gates, deployment history, Firebase Storage distribution, and 1-click rollback linkage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReleases}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            Sync Cloud
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Installer Package
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Release Catalog */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Releases ({releases.length})
          </div>
          <div className="space-y-2">
            {releases.map(rel => (
              <div
                key={rel.id}
                onClick={() => setSelectedRelease(rel)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedRelease?.id === rel.id
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-white">{rel.version}</span>
                  {getStageBadge(rel.stage)}
                </div>
                <div className="text-xs text-slate-400 font-mono truncate mb-2">
                  Commit: {rel.commitSha.substring(0, 8)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
                  <span>{new Date(rel.deployedAt).toLocaleDateString()}</span>
                  <span>{rel.gates.filter(g => g.passed).length} / {rel.gates.length} Gates</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Release Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRelease ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold font-mono text-white">{selectedRelease.version}</h2>
                    {getStageBadge(selectedRelease.stage)}
                  </div>
                  <p className="text-xs text-slate-400">{selectedRelease.notes}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRelease.stage !== 'PROMOTED' && selectedRelease.stage !== 'ROLLED_BACK' && (
                    <button
                      onClick={() => handlePromote(selectedRelease.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Promote to Production</span>
                    </button>
                  )}
                  {selectedRelease.stage === 'PROMOTED' && selectedRelease.rollbackTargetVersion && (
                    <button
                      onClick={() => handleRollback(selectedRelease.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>1-Click Rollback</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preflight Verification Gates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    Automated Preflight Gates & Evidence
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    {selectedRelease.gates.filter(g => g.passed).length} of {selectedRelease.gates.length} Passed
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedRelease.gates.map(gate => (
                    <div
                      key={gate.gateId}
                      className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{gate.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">[{gate.gateId}]</span>
                        </div>
                        <p className="text-xs text-slate-400">{gate.evidence}</p>
                      </div>
                      <div>
                        {gate.passed ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                            <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                            <Clock className="h-3.5 w-3.5" /> PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Package Distribution Card */}
              {selectedRelease.desktopPackage && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-cyan-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {selectedRelease.desktopPackage.platform.includes('macos') ? 'macOS Desktop Application Package' : 'Windows x64 Native Desktop Application Package'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {selectedRelease.desktopPackage.filename} · {(selectedRelease.desktopPackage.sizeBytes / (1024 * 1024)).toFixed(2)} MB · {selectedRelease.desktopPackage.platform}
                        </span>
                      </div>
                    </div>
                    <a
                      href={selectedRelease.desktopPackage.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Package</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="text-slate-500 font-bold shrink-0">SHA-256:</span>
                      <span className="text-slate-300 select-all truncate">{selectedRelease.desktopPackage.sha256}</span>
                    </div>
                    <button
                      onClick={() => handleCopySha(selectedRelease.desktopPackage!.sha256)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 shrink-0"
                    >
                      {copiedSha === selectedRelease.desktopPackage.sha256 ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Rollback Linkage Box */}
              {selectedRelease.rollbackTargetVersion && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        Designated Rollback Target: {selectedRelease.rollbackTargetVersion}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        In case of production disruption, 1-click rollback restores configuration, schema, and operational rules instantly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Select a release to inspect preflight gates and deployment history.
            </div>
          )}
        </div>
      </div>

      {/* Upload Installer Package Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Upload Native Desktop Package</h3>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {uploadError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">RELEASE VERSION</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="e.g. v10.0.0"
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">TARGET PLATFORM</label>
                  <select
                    value={uploadPlatform}
                    onChange={(e) => setUploadPlatform(e.target.value as any)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="windows-x64">Windows x64 (.exe / .msi)</option>
                    <option value="macos-universal">macOS Universal (.dmg)</option>
                    <option value="macos-arm64">macOS Apple Silicon (.dmg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">RELEASE NOTES</label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Summarize key features, bug fixes, or preflight changes in this release..."
                  rows={2}
                  disabled={isUploading}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">SELECT INSTALLER FILE</label>
                <input
                  type="file"
                  accept=".exe,.msi,.dmg,.zip"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Name:</span>
                    <span className="text-white font-bold">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Size:</span>
                    <span className="text-white">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 shrink-0">SHA-256:</span>
                    <span className="text-cyan-400 select-all truncate text-[11px]">{computedSha || 'Computing...'}</span>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Uploading to Firebase Storage:</span>
                    <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAndPublish}
                disabled={isUploading || !selectedFile || !uploadVersion}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-950 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish Release</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
