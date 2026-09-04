import React, { useMemo } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { userService } from '../../services/userService';

export const AdminRoles = () => {
  const { hasRole } = useAuth();
  const isLoading = false;
  const isPlatformAdmin = hasRole(['platform_admin']);
  
  const userCounts = useMemo(() => {
    const users = userService.getUsers();
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Roles & Access</h1>
        <p className="text-sm text-[#A0A0A0]">Define role-based access controls (RBAC).</p>
      </div>
      
      <div className="grid gap-6">
        {[
          {
            name: 'PLATFORM ADMIN',
            desc: 'Full platform-level administration. Can manage all tenants, billing, and global settings.',
            code: 'platform_admin',
            users: userCounts['platform_admin'] || 0,
            visible: isPlatformAdmin
          },
          {
            name: 'ORGANIZATION ADMIN',
            desc: 'Manages their organization. Can invite users, manage billing, and configure org settings.',
            code: 'organization_admin',
            users: userCounts['organization_admin'] || 0,
            visible: true
          },
          {
            name: 'MANAGER',
            desc: 'Can view users and manage some organizational workflows. Cannot change settings.',
            code: 'manager',
            users: userCounts['manager'] || 0,
            visible: true
          },
          {
            name: 'USER',
            desc: 'Standard application access. Interacts with core modules according to organization role.',
            code: 'user',
            users: userCounts['user'] || 0,
            visible: true
          }
        ].filter(role => role.visible).map((role) => (
          <div key={role.code} className="p-6 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#111111] border border-[#2A2A2A] shrink-0 text-[#F5F5F5]">
              <Shield size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold tracking-wider text-[#F5F5F5]">{role.name}</h3>
              <p className="text-[10px] font-mono text-[#6F6F6F] mt-1">{role.code}</p>
              <p className="text-sm text-[#A0A0A0] mt-2">{role.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-[#6F6F6F] mb-1">Assigned Users</p>
              <div className="flex justify-end items-center text-sm font-medium text-[#F5F5F5]">
                {isLoading ? <Loader2 size={14} className="animate-spin text-[#6F6F6F]" /> : role.users}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
