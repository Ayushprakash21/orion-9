/**
 * ORION-9 DYNAMIC ISLAND TYPES
 * Definitions and interfaces for the macOS/iOS-inspired Dynamic Island state and telemetry.
 */

export type DynamicIslandMode = 'compact' | 'expanded';

export type DynamicIslandActivity = 
  | 'idle' 
  | 'copilot-thinking' 
  | 'syncing' 
  | 'critical-alerts' 
  | 'notification';

export type DynamicIslandCopilotStatus = 'ready' | 'thinking' | 'analyzing' | 'idle';

export interface DynamicIslandMetrics {
  activeExceptionsCount: number;
  criticalExceptionsCount: number;
  stockoutRisksCount: number;
  delayedShipmentsCount: number;
  openPurchaseOrdersCount: number;
  connectedConnectorsCount: number;
  activeSyncJobsCount: number;
  lastSyncTimestamp: string | null;
  unreadNotificationsCount: number;
  copilotStatus: DynamicIslandCopilotStatus;
  activeAppName: string | null;
  runtimeMode: 'TAURI DESKTOP' | 'WEB OS';
  isNativeDesktop: boolean;
  systemHealth: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  currentTime: string;
  currentDate: string;
}

export interface DynamicIslandState {
  mode: DynamicIslandMode;
  isExpanded: boolean;
  isPinned: boolean;
  isHovered: boolean;
  activity: DynamicIslandActivity;
  metrics: DynamicIslandMetrics;
  toggleExpanded: () => void;
  expand: () => void;
  collapse: () => void;
  togglePin: () => void;
  setIsHovered: (hovered: boolean) => void;
  handleAction: (appId: string) => void;
}
