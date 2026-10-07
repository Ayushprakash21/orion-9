import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Box,
  Target,
  Users,
  Truck,
  ShieldAlert,
  Brain,
  Layers,
  Factory,
  Compass,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileText,
  User,
  ShoppingBag,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWindowManager } from '../../os/WindowManagerContext';

export interface EnterpriseNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  appId?: string;
  badge?: string;
  active?: boolean;
}

interface EnterpriseNavRailProps {
  activeItemId: string;
  onSelectItem: (id: string, appId?: string) => void;
  className?: string;
}

export const ENTERPRISE_NAV_ITEMS: EnterpriseNavItem[] = [
  // Primary Operations
  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, appId: 'executive-overview' },
  { id: 'control-tower', label: 'Control Tower', icon: Layers, appId: 'command-center' },
  { id: 'crm', label: 'CRM & Customers', icon: Users, appId: 'multi-party-network' },
  { id: 'buy', label: 'Buy Something', icon: ShoppingBag, appId: 'buy-workflow' },
  { id: 'work', label: 'Work Orders', icon: Target, appId: 'manufacturing' },
  { id: 'files', label: 'Documents & Files', icon: FileText, appId: 'file-manager' },
  { id: 'order-acceptance', label: 'Order Promising (ATP)', icon: Compass, appId: 'atp-center' },
  { id: 'die-mgmt', label: 'Die & Tooling Mgmt', icon: Factory, appId: 'manufacturing' },
  { id: 'dispatch', label: 'Dispatch & Logistics', icon: Truck, appId: 'logistics' },
  { id: 'supply-chain', label: 'Supply Chain Fabric', icon: Box, appId: 'inventory' },
  { id: 'production', label: 'Production Planning', icon: Factory, appId: 'supply-planning' },
  { id: 'mrp', label: 'MRP & Requirements', icon: Target, appId: 'procurement' },
  { id: 'equipment', label: 'Equipment Health', icon: Cpu, appId: 'warehouse' },
  { id: 'hr', label: 'HR & Workforce', icon: User, appId: 'profile' },
  { id: 'finance', label: 'Finance & Ledger', icon: DollarSign, appId: 'finance-ledger' },
  // Bottom / Settings
  { id: 'governance', label: 'Governance & RBAC', icon: ShieldCheck, appId: 'approval-center' },
  { id: 'settings', label: 'Settings', icon: Settings, appId: 'settings' },
];

export const EnterpriseNavRail: React.FC<EnterpriseNavRailProps> = ({
  activeItemId,
  onSelectItem,
  className,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  let openApplication: (id: string) => void = () => {};
  try {
    const wm = useWindowManager();
    if (wm?.openApplication) {
      openApplication = wm.openApplication;
    }
  } catch (e) {}

  const handleItemClick = (item: EnterpriseNavItem) => {
    onSelectItem(item.id, item.appId);
    if (item.appId && item.id !== 'overview') {
      openApplication(item.appId);
    }
  };

  return (
    <aside
      className={cn(
        "h-full bg-[var(--orion-morph-surface-subtle,#101111)] border-r border-[var(--orion-morph-border,rgba(255,255,255,0.08))] backdrop-blur-[var(--orion-morph-blur,10px)] flex flex-col shrink-0 select-none transition-all duration-200 z-30",
        collapsed ? "w-14" : "w-56 sm:w-60",
        className
      )}
      aria-label="Enterprise Command Navigation"
    >

      {/* Rail Header */}
      <div className="h-12 px-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-mono text-xs font-bold text-os-text-primary tracking-wider uppercase truncate">
              Command Suite
            </span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#39C77A]/10 text-[#39C77A] border border-[#39C77A]/30">
              v9
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md text-os-text-muted hover:text-os-text-primary hover:bg-white/[0.05] transition-colors cursor-pointer",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
        {ENTERPRISE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItemId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer group text-left",
                isActive
                  ? "bg-[var(--orion-morph-surface-active,#1B1C1C)] text-[var(--orion-accent,#39C77A)] font-semibold border border-[var(--orion-morph-border-strong,rgba(255,255,255,0.08))] shadow-[var(--orion-morph-shadow-soft,none)]"
                  : "text-os-text-secondary hover:text-os-text-primary hover:bg-[var(--orion-morph-surface-hover,rgba(255,255,255,0.04))] border border-transparent"
              )}
            >

              <Icon 
                size={16} 
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-[#39C77A]" : "text-os-text-muted group-hover:text-os-text-primary"
                )} 
              />
              {!collapsed && (
                <span className="truncate flex-1 tracking-tight">
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#39C77A]/10 text-[#39C77A]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Details */}
      {!collapsed && (
        <div className="p-3 border-t border-white/[0.06] text-[10px] font-mono text-os-text-muted flex items-center justify-between">
          <span>ORION / SENTINEL</span>
          <span className="text-[#39C77A]">ONLINE</span>
        </div>
      )}
    </aside>
  );
};
