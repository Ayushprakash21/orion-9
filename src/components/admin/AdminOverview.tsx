import React, { useState, useEffect } from 'react';
import { Users, Building2, Activity, ArrowUpRight } from 'lucide-react';
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
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Admin Overview</h1>
        <p className="text-sm text-[#A0A0A0]">Platform-wide analytics and status.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers.toString(), icon: Users },
          { label: 'Active Users', value: activeUsers.toString(), icon: Users },
          { label: 'Admins', value: adminUsers.toString(), icon: Building2 },
          { label: 'Standard Operators', value: standardUsers.toString(), icon: Building2 },
        ].map((stat, idx) => (
          <div key={idx} className="p-5 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] flex flex-col">
            <div className="flex items-center justify-between mb-4 text-[#A1A1A1]">
              <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={16} />
            </div>
            <div className="text-2xl font-light text-[#F5F5F5]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A1A1A1]">Recent Users</h2>
            <a href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View All <ArrowUpRight size={12}/></a>
          </div>
          <div className="space-y-3">
            {users.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded bg-[#111111] border border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-xs font-medium text-[#F5F5F5]">
                    {u.displayName?.substring(0,2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F5F5F5]">{u.fullName || u.username}</div>
                    <div className="text-xs text-[#808080] font-mono">{u.username} • {u.role}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${u.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A1A1A1]">System Status</h2>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-4 text-sm text-[#A0A0A0]">
            <div className="flex justify-between items-center p-3 rounded bg-[#111111] border border-[#2A2A2A]">
              <span>Authentication Engine</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-[#111111] border border-[#2A2A2A]">
              <span>LocalStorage Persistence</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-[#111111] border border-[#2A2A2A]">
              <span>Role-Based Security</span>
              <span className="px-2 py-0.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
