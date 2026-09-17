import React, { useState } from 'react';
import { Activity, RefreshCw, AlertCircle, CheckCircle2, Play, CircleSlash, ArrowRight, GitCompare } from 'lucide-react';
import { useToast } from '../store/ToastContext';
import { useNotifications } from '../store/NotificationContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatNumber } from '../lib/formatters';
import { MobileRecordCard } from './MobileRecordCard';
import { useOptionalWindowManager } from '../os/WindowManagerContext';

interface SyncJob {
  id: string;
  source: string;
  connector: string;
  started: string;
  duration: string;
  records: number | string;
  status: 'SUCCESS' | 'RUNNING' | 'WARNING' | 'FAILED' | 'NOT CONFIGURED';
  errors?: number;
}

export const SyncMonitor: React.FC = () => {
  const wm = useOptionalWindowManager();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { openEntity } = useEntityDrawer();
  const [isSyncing, setIsSyncing] = useState(false);
  const [jobs, setJobs] = useState<SyncJob[]>([
    { id: 'job-1', source: 'Products_Export.xlsx', connector: 'File Importer', started: '10 mins ago', duration: '2s', records: 15, status: 'SUCCESS' },
    { id: 'job-2', source: 'Supplier_Network_DB', connector: 'SQL DB', started: '1 hour ago', duration: '45s', records: 1042, status: 'SUCCESS' },
    { id: 'job-4', source: 'SAP ERP', connector: 'Enterprise Connector', started: '-', duration: '-', records: 0, status: 'NOT CONFIGURED' },
    { id: 'job-3', source: 'WMS_API_Endpoint', connector: 'REST API', started: '2 hours ago', duration: '-', records: 0, status: 'FAILED', errors: 1 }
  ]);

  const handleSyncAll = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast('Initiating full enterprise synchronization across all configured data sources...', 'info', 'Sync Started');

    setTimeout(() => {
      const newJob: SyncJob = {
        id: `job-${Date.now()}`,
        source: 'Full_Enterprise_Sync',
        connector: 'Multi-Connector Engine',
        started: 'Just now',
        duration: '3.4s',
        records: 1240,
        status: 'SUCCESS'
      };
      
      const unconfiguredJob: SyncJob = {
        id: `job-${Date.now() + 1}`,
        source: 'SAP ERP',
        connector: 'Enterprise Connector',
        started: 'Just now',
        duration: '0s',
        records: 'SKIPPED',
        status: 'NOT CONFIGURED'
      };
      
      setJobs(prev => [newJob, unconfiguredJob, ...prev]);
      setIsSyncing(false);
      showToast('Configured sources synced successfully. Unconfigured connectors were skipped.', 'success', 'Sync Complete');
      addNotification({
        type: 'success',
        title: 'Enterprise Sync Completed',
        message: 'All inventory, procurement, and supplier records synchronized successfully. SAP ERP skipped (not configured).',
      });
    }, 2000);
  };

  const handleRetry = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Retrying sync job ${jobId}...`, 'info');
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'SUCCESS', started: 'Just now', duration: '1.2s' } : j));
      showToast('Sync job retried and completed successfully.', 'success');
    }, 1000);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-4 sm:space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-os-border">
        <div>
          <h2 className="text-xl font-medium text-os-text-primary tracking-tight">Sync Monitor</h2>
          <p className="text-xs text-os-text-muted mt-1 hidden sm:block">Monitor data integration sync jobs, pipeline statuses, and error logs.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {wm && (
            <button
              onClick={() => wm.openApplication('master-data')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-indigo-500/20 transition-colors cursor-pointer"
            >
              <GitCompare size={14} />
              <span>Data Fabric & MDM</span>
            </button>
          )}
          <button 
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-os-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync All Sources'}
          </button>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {jobs.map(job => (
            <MobileRecordCard
              key={job.id}
              title={job.source}
              subtitle={job.connector}
              onClick={() => openEntity({ type: 'sync', id: job.id })}
              statusNode={
                  <span className={`flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${
                    job.status === 'SUCCESS' ? 'bg-os-surface-elevated text-[#30D158] border-os-border' :
                    job.status === 'RUNNING' ? 'bg-os-surface-elevated text-os-text-primary border-os-border' :
                    job.status === 'FAILED' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' :
                    'bg-os-surface-elevated text-os-text-muted border-os-border'
                  }`}>
                    {job.status === 'SUCCESS' && <CheckCircle2 size={10} />}
                    {job.status === 'RUNNING' && <RefreshCw size={10} className="animate-spin" />}
                    {job.status === 'FAILED' && <AlertCircle size={10} />}
                    {job.status === 'NOT CONFIGURED' && <CircleSlash size={10} />}
                    {job.status === 'SUCCESS' ? 'Success' : 
                     job.status === 'RUNNING' ? 'Running' : 
                     job.status === 'FAILED' ? 'Failed' : 
                     'Unconfigured'}
                  </span>
                }
                fields={[
                  { label: 'Started', value: job.started },
                  { label: 'Duration', value: job.duration },
                  { label: 'Records', value: typeof job.records === 'number' ? formatNumber(job.records) : job.records }
                ]}
              />
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs text-os-text-secondary">
            <thead>
              <tr className="border-b border-os-border bg-os-surface-secondary text-[10px] font-mono text-os-text-muted uppercase tracking-wider">
                <th className="p-4">Status</th>
                <th className="p-4">Source</th>
                <th className="p-4">Connector</th>
                <th className="p-4">Started</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Records</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {jobs.map(job => (
                <tr 
                  key={job.id} 
                  onClick={() => openEntity({ type: 'sync', id: job.id })}
                  className="hover:bg-os-surface-hover transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    {job.status === 'SUCCESS' && (
                      <div className="flex items-center gap-2 text-[#30D158]">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] uppercase font-mono">Success</span>
                      </div>
                    )}
                    {job.status === 'RUNNING' && (
                      <div className="flex items-center gap-2 text-os-text-primary">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-[10px] uppercase font-mono">Running</span>
                      </div>
                    )}
                    {job.status === 'FAILED' && (
                      <div className="flex items-center gap-2 text-[#FF453A]">
                        <AlertCircle size={16} />
                        <span className="text-[10px] uppercase font-mono">Failed</span>
                      </div>
                    )}
                    {job.status === 'NOT CONFIGURED' && (
                      <div className="flex items-center gap-2 text-os-text-muted">
                        <CircleSlash size={16} />
                        <span className="text-[10px] uppercase font-mono">Unconfigured</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-os-text-primary">{job.source}</td>
                  <td className="p-4 text-os-text-secondary">{job.connector}</td>
                  <td className="p-4 font-mono text-os-text-muted">{job.started}</td>
                  <td className="p-4 font-mono text-os-text-muted">{job.duration}</td>
                  <td className="p-4 font-mono text-os-text-primary text-right">{typeof job.records === 'number' ? formatNumber(job.records) : job.records}</td>
                  <td className="p-4 text-right space-x-3">
                    {job.status === 'FAILED' && (
                      <button 
                        onClick={(e) => handleRetry(job.id, e)}
                        className="text-[10px] uppercase font-mono text-[#30D158] hover:underline"
                      >
                        Retry
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEntity({ type: 'sync', id: job.id });
                      }}
                      className="text-[10px] uppercase font-mono text-os-text-secondary hover:text-os-text-primary transition-colors"
                    >
                      View Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
