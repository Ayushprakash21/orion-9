import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Building2, Activity, ArrowUpRight, BrainCircuit, ArrowRight } from 'lucide-react';
import { userService } from '../../services/userService';
import { UserProfile } from '../../types/auth';

export const AdminOverview = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    setUsers(userService.getUsers());
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'platform_admin' || u.role === 'organization_admin').length;
  const standardUsers = users.filter(u => u.role === 'user' || u.role === 'manager').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-1 text-os-text-primary">Admin Overview</h1>
          <p className="text-sm text-os-text-secondary">Platform-wide governance, intelligence, and system telemetry.</p>
        </div>
        <NavLink
          to="/admin/platform-intelligence"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <BrainCircuit size={15} />
          <span>Launch Platform Intelligence</span>
          <ArrowRight size={13} />
        </NavLink>
      </div>

      {/* Featured Platform Intelligence Banner */}
      <div className="p-5 rounded-lg border border-blue-900/40 bg-blue-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-800/40 shrink-0 mt-0.5">
            <BrainCircuit size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-os-text-primary">AI Platform Intelligence & Executive Reporting</h3>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-blue-900/40 text-blue-400 border border-blue-800/60">NEW</span>
            </div>
            <p className="text-xs text-os-text-secondary max-w-2xl leading-relaxed">
              Synthesize live supply chain telemetry with Gemini 3.8 Flash multi-part reasoning and Orion's deterministic mathematical engines. Generate verified executive PDF reports.
            </p>
          </div>
        </div>
        <NavLink
          to="/admin/platform-intelligence"
          className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-800/50 transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>Open Workspace</span>
          <ArrowRight size={13} />
        </NavLink>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers.toString(), icon: Users },
          { label: 'Active Users', value: activeUsers.toString(), icon: Users },
          { label: 'Admins', value: adminUsers.toString(), icon: Building2 },
          { label: 'Standard Operators', value: standardUsers.toString(), icon: Building2 },
        ].map((stat, idx) => (
          <div key={idx} className="p-5 rounded-lg border border-os-border bg-os-bg flex flex-col">
            <div className="flex items-center justify-between mb-4 text-os-text-secondary">
              <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={16} />
            </div>
            <div className="text-2xl font-light text-os-text-primary">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-os-border bg-os-bg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-secondary">Recent Users</h2>
            <a href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View All <ArrowUpRight size={12}/></a>
          </div>
          <div className="space-y-3">
            {users.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded bg-os-surface border border-os-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-os-surface-elevated border border-os-border flex items-center justify-center text-xs font-medium text-os-text-primary">
                    {u.displayName?.substring(0,2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">{u.fullName || u.username}</div>
                    <div className="text-xs text-os-text-muted font-mono">{u.username} • {u.role}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${u.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 rounded-lg border border-os-border bg-os-bg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-secondary">System Status</h2>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-4 text-sm text-os-text-secondary">
            <div className="flex justify-between items-center p-3 rounded bg-os-surface border border-os-border">
              <span>Authentication Engine</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-os-surface border border-os-border">
              <span>LocalStorage Persistence</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-os-surface border border-os-border">
              <span>Role-Based Security</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
