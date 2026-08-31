import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ArrowDownLeft, 
  FileText, 
  Network, 
  Truck, 
  ArrowUpRight, 
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
  Building2,
  HelpCircle,
  FileBarChart,
  ShieldAlert,
  Clock,
  Check
} from 'lucide-react';

export type IconType = 
  | 'dashboard' 
  | 'inventory' 
  | 'inbound' 
  | 'procurement' 
  | 'suppliers' 
  | 'shipments' 
  | 'outbound' 
  | 'exceptions' 
  | 'predictions' 
  | 'scenarios' 
  | 'ai' 
  | 'integrations' 
  | 'datacenter' 
  | 'quality' 
  | 'sync' 
  | 'reports' 
  | 'analytics' 
  | 'settings'
  | 'supplier'
  | 'po'
  | 'warning'
  | 'success'
  | 'clock'
  | 'search';

interface OrionIconProps {
  name: IconType | string;
  size?: number;
  className?: string;
  color?: string;
}

export const OrionIcon: React.FC<OrionIconProps> = ({ name, size = 18, className = '', color }) => {
  const defaultClassName = className || "text-[#A0A0A0] hover:text-[#D0D0D0] transition-colors";
  const style = color ? { color } : undefined;

  switch (name) {
    case 'dashboard': return <LayoutDashboard size={size} className={defaultClassName} style={style} />;
    case 'inventory': return <Boxes size={size} className={defaultClassName} style={style} />;
    case 'inbound': return <ArrowDownLeft size={size} className={defaultClassName} style={style} />;
    case 'procurement': return <FileText size={size} className={defaultClassName} style={style} />;
    case 'suppliers':
    case 'supplier': return <Network size={size} className={defaultClassName} style={style} />;
    case 'shipments': return <Truck size={size} className={defaultClassName} style={style} />;
    case 'outbound': return <ArrowUpRight size={size} className={defaultClassName} style={style} />;
    case 'exceptions':
    case 'warning': return <AlertTriangle size={size} className={defaultClassName} style={style} />;
    case 'predictions': return <TrendingUp size={size} className={defaultClassName} style={style} />;
    case 'scenarios': return <GitBranch size={size} className={defaultClassName} style={style} />;
    case 'ai': return <Sparkles size={size} className={defaultClassName} style={style} />;
    case 'integrations': return <Share2 size={size} className={defaultClassName} style={style} />;
    case 'datacenter': return <Database size={size} className={defaultClassName} style={style} />;
    case 'quality': return <CheckCircle2 size={size} className={defaultClassName} style={style} />;
    case 'sync': return <RefreshCw size={size} className={defaultClassName} style={style} />;
    case 'reports': return <FileBarChart size={size} className={defaultClassName} style={style} />;
    case 'analytics': return <BarChart3 size={size} className={defaultClassName} style={style} />;
    case 'settings': return <Settings size={size} className={defaultClassName} style={style} />;
    case 'success': return <Check size={size} className={defaultClassName} style={style} />;
    case 'clock': return <Clock size={size} className={defaultClassName} style={style} />;
    default: return <Boxes size={size} className={defaultClassName} style={style} />;
  }
};
