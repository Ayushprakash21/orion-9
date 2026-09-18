import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Network,
  Truck,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Sparkles,
  Share2,
  Database,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Settings,
  Info,
  Clock,
  Check,
  BrainCircuit,
  MapPin,
  DollarSign,
  ShieldCheck,
  Sliders,
  Users,
  Building2,
  Lock,
  Search,
  Folder,
  Bell,
  Cpu,
  Eye,
  Activity,
  Zap,
  Globe,
  Package,
  Layers,
  Compass,
  FileCheck,
  PackageCheck,
  FileSearch,
  UserCheck
} from 'lucide-react';

export type OrionAppIconSize = 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96;

export interface OrionAppIconProps {
  app: string;
  size?: OrionAppIconSize | number;
  theme?: 'light' | 'dark' | 'auto';
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  badge?: boolean | string;
  notificationCount?: number;
  className?: string;
  showContainer?: boolean;
}

// Icon gradient palette definitions for application categories
const APP_GRADIENTS: Record<string, { from: string; to: string; iconColor: string }> = {
  // Operations / Supply Chain (Blues & Emeralds)
  'command-center': { from: '#00F2FE', to: '#4FACFE', iconColor: '#FFFFFF' },
  'dashboard': { from: '#00F2FE', to: '#4FACFE', iconColor: '#FFFFFF' },
  'inventory': { from: '#10B981', to: '#059669', iconColor: '#FFFFFF' },
  'procurement': { from: '#F59E0B', to: '#D97706', iconColor: '#FFFFFF' },
  'suppliers': { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' },
  'shipments': { from: '#F97316', to: '#EA580C', iconColor: '#FFFFFF' },
  'inbound': { from: '#3B82F6', to: '#2563EB', iconColor: '#FFFFFF' },
  'outbound': { from: '#F97316', to: '#C2410C', iconColor: '#FFFFFF' },
  'warehouse': { from: '#059669', to: '#047857', iconColor: '#FFFFFF' },
  'logistics': { from: '#EA580C', to: '#9A3412', iconColor: '#FFFFFF' },
  'contracts': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },
  'quality': { from: '#F43F5E', to: '#E11D48', iconColor: '#FFFFFF' },
  'gate-receiving': { from: '#2563EB', to: '#1D4ED8', iconColor: '#FFFFFF' },
  'invoice-matching': { from: '#10B981', to: '#047857', iconColor: '#FFFFFF' },
  'cost-optimizer': { from: '#10B981', to: '#059669', iconColor: '#FFFFFF' },
  'working-capital': { from: '#059669', to: '#047857', iconColor: '#FFFFFF' },

  // Intelligence & Analytics (Purples & Cyans)
  'world-model': { from: '#06B6D4', to: '#0891B2', iconColor: '#FFFFFF' },
  'digital-twin': { from: '#06B6D4', to: '#0891B2', iconColor: '#FFFFFF' },
  'predictions': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'demand-forecasting': { from: '#8B5CF6', to: '#7C3AED', iconColor: '#FFFFFF' },
  'inventory-optimization': { from: '#10B981', to: '#047857', iconColor: '#FFFFFF' },
  'scenarios': { from: '#0EA5E9', to: '#0284C7', iconColor: '#FFFFFF' },
  'risk-radar': { from: '#EF4444', to: '#B91C1C', iconColor: '#FFFFFF' },
  'quiet-risk': { from: '#F97316', to: '#C2410C', iconColor: '#FFFFFF' },
  'causal-intelligence': { from: '#06B6D4', to: '#0891B2', iconColor: '#FFFFFF' },
  'counterfactual': { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' },
  'decision-economics': { from: '#10B981', to: '#059669', iconColor: '#FFFFFF' },
  'information-gaps': { from: '#EC4899', to: '#BE185D', iconColor: '#FFFFFF' },
  'outcomes': { from: '#10B981', to: '#047857', iconColor: '#FFFFFF' },
  'decision-replay': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'time-machine': { from: '#00F2FE', to: '#0284C7', iconColor: '#FFFFFF' },
  'decision-dna': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },

  // Control & Governance (Amber & Indigo)
  'exceptions': { from: '#EF4444', to: '#DC2626', iconColor: '#FFFFFF' },
  'approval-center': { from: '#00F2FE', to: '#0284C7', iconColor: '#FFFFFF' },
  'decisions': { from: '#F59E0B', to: '#D97706', iconColor: '#FFFFFF' },
  'action-center': { from: '#F59E0B', to: '#B45309', iconColor: '#FFFFFF' },
  'autopilot': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'workflows': { from: '#0EA5E9', to: '#0369A1', iconColor: '#FFFFFF' },
  'autonomy-center': { from: '#8B5CF6', to: '#5B21B6', iconColor: '#FFFFFF' },
  'attention-center': { from: '#F59E0B', to: '#D97706', iconColor: '#FFFFFF' },
  'constraints': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },
  'policies': { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' },

  // AI & Memory (Violet & Fuchsia)
  'orion-ai': { from: '#A855F7', to: '#6B21A8', iconColor: '#FFFFFF' },
  'copilot': { from: '#A855F7', to: '#7E22CE', iconColor: '#FFFFFF' },
  'memory': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'intelligence-center': { from: '#8B5CF6', to: '#5B21B6', iconColor: '#FFFFFF' },
  'signal-language': { from: '#8B5CF6', to: '#7C3AED', iconColor: '#FFFFFF' },
  'network-intelligence': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'decision-science': { from: '#F59E0B', to: '#B45309', iconColor: '#FFFFFF' },
  'human-ai': { from: '#F59E0B', to: '#D97706', iconColor: '#FFFFFF' },

  // System, Platform & Files (Slate & Teal)
  'documents': { from: '#475569', to: '#1E293B', iconColor: '#FFFFFF' },
  'files': { from: '#475569', to: '#1E293B', iconColor: '#FFFFFF' },
  'reports': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },
  'data': { from: '#0EA5E9', to: '#0284C7', iconColor: '#FFFFFF' },
  'master-data': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },
  'data-quality': { from: '#10B981', to: '#047857', iconColor: '#FFFFFF' },
  'integrations': { from: '#6366F1', to: '#4338CA', iconColor: '#FFFFFF' },
  'observability': { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' },
  'sync': { from: '#06B6D4', to: '#0891B2', iconColor: '#FFFFFF' },
  'settings': { from: '#64748B', to: '#334155', iconColor: '#FFFFFF' },
  'about': { from: '#00F2FE', to: '#0284C7', iconColor: '#FFFFFF' },
  'profile': { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' },
  'organization': { from: '#8B5CF6', to: '#6D28D9', iconColor: '#FFFFFF' },
  'user-manual': { from: '#06B6D4', to: '#0891B2', iconColor: '#FFFFFF' },
  'admin-console': { from: '#475569', to: '#0F172A', iconColor: '#FFFFFF' },
  'event-fabric': { from: '#00F2FE', to: '#0284C7', iconColor: '#FFFFFF' },
  'vital-signs': { from: '#EF4444', to: '#B91C1C', iconColor: '#FFFFFF' },
};

// Returns the underlying Lucide icon component for an app ID
function getAppGlyph(appId: string) {
  const norm = appId.toLowerCase();
  switch (norm) {
    case 'command-center':
    case 'dashboard': return LayoutDashboard;
    case 'inventory':
    case 'warehouse': return Boxes;
    case 'procurement': return FileText;
    case 'suppliers':
    case 'supplier-comms': return Network;
    case 'shipments':
    case 'inbound':
    case 'outbound':
    case 'logistics': return Truck;
    case 'exceptions':
    case 'risk-radar':
    case 'quiet-risk': return AlertTriangle;
    case 'approval-center': return ShieldCheck;
    case 'quality': return CheckCircle2;
    case 'invoice-matching': return DollarSign;
    case 'gate-receiving': return PackageCheck;
    case 'vendor-onboarding': return Users;
    case 'world-model':
    case 'digital-twin': return Globe;
    case 'orion-ai':
    case 'copilot':
    case 'memory':
    case 'intelligence-center': return Sparkles;
    case 'reports':
    case 'documents':
    case 'files': return Folder;
    case 'user-manual': return Info;
    case 'settings': return Settings;
    case 'predictions':
    case 'demand-forecasting': return TrendingUp;
    case 'inventory-optimization': return Package;
    case 'scenarios': return GitBranch;
    case 'decisions':
    case 'action-center':
    case 'autonomy-center': return Zap;
    case 'autopilot':
    case 'workflows': return BrainCircuit;
    case 'signal-language':
    case 'observability':
    case 'vital-signs': return Activity;
    case 'network-intelligence': return Network;
    case 'decision-science': return Cpu;
    case 'data':
    case 'master-data': return Database;
    case 'data-quality': return FileCheck;
    case 'integrations': return Share2;
    case 'cost-optimizer':
    case 'working-capital':
    case 'decision-economics': return BarChart3;
    case 'contracts': return FileText;
    case 'event-fabric': return RefreshCw;
    case 'causal-intelligence': return GitBranch;
    case 'counterfactual': return Compass;
    case 'attention-center': return Eye;
    case 'information-gaps': return Search;
    case 'constraints': return Sliders;
    case 'policies': return FileText;
    case 'outcomes': return Check;
    case 'decision-replay':
    case 'time-machine': return Clock;
    case 'decision-dna': return GitBranch;
    case 'human-ai': return UserCheck;
    case 'sync': return RefreshCw;
    case 'about': return Info;
    case 'profile': return UserCheck;
    case 'organization': return Building2;
    case 'admin-console':
    case 'administration': return Lock;
    default: return Layers;
  }
}

export const OrionAppIcon: React.FC<OrionAppIconProps> = ({
  app,
  size = 48,
  theme = 'auto',
  active = false,
  selected = false,
  disabled = false,
  badge = false,
  notificationCount = 0,
  className = '',
  showContainer = true,
}) => {
  const normApp = app.toLowerCase();
  const palette = APP_GRADIENTS[normApp] || { from: '#3B82F6', to: '#1D4ED8', iconColor: '#FFFFFF' };
  const Glyph = getAppGlyph(normApp);

  // Icon sizing proportions
  const sizeNum = typeof size === 'number' ? size : parseInt(String(size), 10) || 48;
  const glyphSize = Math.round(sizeNum * 0.52);

  // Corner radius scales smoothly with icon size
  const borderRadius = Math.max(4, Math.round(sizeNum * 0.22));

  if (!showContainer) {
    return (
      <Glyph
        size={sizeNum}
        className={`${disabled ? 'opacity-40' : ''} ${className}`}
        style={{ color: palette.from }}
      />
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-200 select-none ${
        disabled ? 'opacity-40 grayscale pointer-events-none' : ''
      } ${selected ? 'ring-2 ring-os-accent ring-offset-2 ring-offset-os-bg' : ''} ${className}`}
      style={{
        width: `${sizeNum}px`,
        height: `${sizeNum}px`,
      }}
    >
      {/* Icon Squircle Body */}
      <div
        className="w-full h-full flex items-center justify-center shadow-sm transition-transform duration-200 active:scale-95 group-hover:scale-105 overflow-hidden"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          boxShadow: active
            ? `0 4px 12px ${palette.from}40, 0 1px 3px rgba(0,0,0,0.2)`
            : `0 2px 8px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Subtle top inner shine */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
            borderRadius: `${borderRadius}px`,
          }}
        />

        {/* Vector Glyph */}
        <Glyph
          size={glyphSize}
          color={palette.iconColor}
          strokeWidth={2}
          className="relative z-10 drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
        />
      </div>

      {/* Notification Count Badge */}
      {notificationCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white font-semibold flex items-center justify-center shadow-md rounded-full border-2 border-os-surface px-1 text-xs min-w-[18px] h-[18px]"
          style={{ fontSize: Math.max(9, Math.round(sizeNum * 0.2)) }}
        >
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}

      {/* Boolean Dot Badge */}
      {badge && notificationCount === 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-os-accent rounded-full border-2 border-os-surface shadow-sm" />
      )}
    </div>
  );
};

export default OrionAppIcon;
