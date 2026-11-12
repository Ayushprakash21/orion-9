import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Terminal, 
  Search,
  Filter,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ORION_OS_METADATA } from '../os/constants/OrionOsMetadata';
import { useToast } from '../store/ToastContext';

interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  category: 'Supply Chain' | 'Integrations' | 'Audit' | 'Maintenance' | 'AI Core';
  status: 'running' | 'paused' | 'scheduled';
  lastRunTime: string;
  nextRunTime: string;
  retryPolicy: string;
  timeoutSeconds: number;
  successRate: number;
}

export const TaskScheduler: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [jobs, setJobs] = useState<ScheduledJob[]>([
    {
      id: 'job-scm-event-pump',
      name: 'Cloudflare Worker Event Pump (orion-scm-events)',
      cronExpression: '* * * * *',
      category: 'Supply Chain',
      status: 'running',
      lastRunTime: 'Just now',
      nextRunTime: 'In 45 seconds',
      retryPolicy: 'Exponential backoff (3 attempts, max 30s)',
      timeoutSeconds: 30,
      successRate: 99.8,
    },
    {
      id: 'job-sap-inventory-sync',
      name: 'SAP ERP Material Movement & Stock Sync',
      cronExpression: '*/15 * * * *',
      category: 'Integrations',
      status: 'running',
      lastRunTime: '8 mins ago',
      nextRunTime: 'In 7 minutes',
      retryPolicy: 'Fixed interval (5 attempts, 10s delay)',
      timeoutSeconds: 120,
      successRate: 99.2,
    },
    {
      id: 'job-crypto-audit-seal',
      name: 'Cryptographic Ledger Block Sealing',
      cronExpression: '0 * * * *',
      category: 'Audit',
      status: 'running',
      lastRunTime: '24 mins ago',
      nextRunTime: 'In 36 minutes',
      retryPolicy: 'Strict abort on hash discrepancy',
      timeoutSeconds: 60,
      successRate: 100.0,
    },
    {
      id: 'job-dlq-cleanup',
      name: 'Dead Letter Queue (orion-scm-events-dlq) Cleaner',
      cronExpression: '0 0 * * *',
      category: 'Maintenance',
      status: 'scheduled',
      lastRunTime: 'Yesterday 00:00',
      nextRunTime: 'Tonight 00:00',
      retryPolicy: 'Manual human-in-the-loop review',
      timeoutSeconds: 300,
      successRate: 100.0,
    },
    {
      id: 'job-ai-workforce-rebalance',
      name: 'Autonomous Agent Workload Rebalancer',
      cronExpression: '*/30 * * * *',
      category: 'AI Core',
      status: 'paused',
      lastRunTime: '1 hour ago',
      nextRunTime: 'Paused',
      retryPolicy: 'Exponential backoff (2 attempts)',
      timeoutSeconds: 90,
      successRate: 98.5,
    },
  ]);

  const toggleJobStatus = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const newStatus = j.status === 'running' ? 'paused' : 'running';
          showToast(`Job "${j.name}" is now ${newStatus.toUpperCase()}`, 'info', 'Scheduler');
          return {
            ...j,
            status: newStatus,
            nextRunTime: newStatus === 'running' ? 'In 1 minute' : 'Paused',
          };
        }
        return j;
      })
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedCategory !== 'all' && j.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return j.name.toLowerCase().includes(q) || j.cronExpression.includes(q);
      }
      return true;
    });
  }, [jobs, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Background Task Scheduler</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-purple-300 font-semibold border border-white/10">
                EDGE CRON ENGINE
              </span>
            </div>
            <div className="text-[11px] text-white/50">Durable Cloudflare Worker cron pipelines, retry policies, and workflow scheduling</div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheduled jobs..."
              className="pl-8 pr-3 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all" className="bg-[#161b22]">All Domains</option>
            <option value="supply chain" className="bg-[#161b22]">Supply Chain</option>
            <option value="integrations" className="bg-[#161b22]">Integrations</option>
            <option value="audit" className="bg-[#161b22]">Audit</option>
            <option value="maintenance" className="bg-[#161b22]">Maintenance</option>
            <option value="ai core" className="bg-[#161b22]">AI Core</option>
          </select>
        </div>
      </div>

      {/* Scheduler Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.02] border-b border-white/[0.06] shrink-0 text-xs">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-white/50 font-mono text-[10px] uppercase">Active Schedules</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {jobs.filter((j) => j.status === 'running').length} / {jobs.length}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">Durable Cloudflare Cron Triggers</div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-white/50 font-mono text-[10px] uppercase">Min Frequency</div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">1 Minute</div>
          <div className="text-[10px] text-white/40 mt-0.5">Continuous event pumping</div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-white/50 font-mono text-[10px] uppercase">Execution SLA</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">99.9%</div>
          <div className="text-[10px] text-white/40 mt-0.5">Zero unhandled backpressure</div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-white/50 font-mono text-[10px] uppercase">Dead Letter Queue</div>
          <div className="text-xl font-bold font-mono text-white mt-1">Zero Messages</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">DLQ clean and idle</div>
        </div>
      </div>

      {/* Jobs Roster Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.05] text-white/60 font-semibold border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Job Name</th>
                <th className="py-2.5 px-3">Cron</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Next Trigger</th>
                <th className="py-2.5 px-3">Retry Policy</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredJobs.map((j) => (
                <tr key={j.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{j.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">{j.cronExpression}</td>
                  <td className="py-2.5 px-3 text-white/70 font-sans">{j.category}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      j.status === 'running' ? "bg-emerald-500/20 text-emerald-300" :
                      j.status === 'paused' ? "bg-amber-500/20 text-amber-300" :
                      "bg-white/10 text-white/70"
                    )}>
                      {j.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white/70 font-sans">{j.nextRunTime}</td>
                  <td className="py-2.5 px-3 text-white/50 text-[10px] max-w-[180px] truncate">{j.retryPolicy}</td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => toggleJobStatus(j.id)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {j.status === 'running' ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                      <span>{j.status === 'running' ? 'Pause' : 'Resume'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.08] bg-[#161b22] flex items-center justify-between text-xs text-white/50 shrink-0 font-mono">
        <div>ORION-9 TASK SCHEDULER • CLOUDFLARE WORKER CRON BINDINGS</div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Idempotent Execution</span>
        </div>
      </div>
    </div>
  );
};

export default TaskScheduler;
