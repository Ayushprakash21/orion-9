/**
 * ORION-9 DYNAMIC ISLAND TYPES & TELEMETRY CONTRACTS
 * Interaction & low-idle-cost architecture inspired in part by Astraeus
 * (https://github.com/Icetist/Astraeus — edge-anchored pill, compact over
 * maximized windows, fullscreen auto-hide, zero idle CPU/GPU wakeups).
 * Implemented natively in Orion-9's React + Motion stack.
 */

export type DynamicIslandMode = 'compact' | 'expanded';
export type DynamicIslandPresentationMode = 'compact' | 'expanded' | 'minimal' | 'disabled';

/**
 * 5-state visual lifecycle surface model:
 * - idle: calm compact capsule
 * - activity: active non-blocking background operation (sync, simulation, copilot)
 * - expanded: unfolded frosted glass control card
 * - critical: high-priority critical alert state
 * - returning: brief controlled transition back to compact pill
 */
export type DynamicIslandSurfaceState =
  | 'idle'
  | 'activity'
  | 'expanded'
  | 'critical'
  | 'returning';

export type DynamicIslandActivity =
  | 'none'
  | 'critical-alert'
  | 'copilot-thinking'
  | 'connector-sync'
  | 'simulation-running'
  | 'unread-notifications'
  | 'system-ready';

export type DynamicIslandCopilotStatus = 'ready' | 'thinking' | 'analyzing' | 'idle';

export type DynamicIslandEventSeverity = 'info' | 'active' | 'warning' | 'critical' | 'success';

export interface DynamicIslandEventItem {
  id: string;
  source: 'system' | 'copilot' | 'connector' | 'simulation' | 'exception' | 'user';
  title: string;
  subtitle?: string;
  severity: DynamicIslandEventSeverity;
  timestamp: number;
  expiresAt?: number;
  progress?: number; // 0 - 100 optional determinate progress
  actionLabel?: string;
  actionAppId?: string;
}

export interface DynamicIslandMetrics {
  activeExceptionsCount: number;
  criticalExceptionsCount: number;
  stockoutRisksCount: number;
  delayedShipmentsCount: number;
  openPurchaseOrdersCount: number;
  connectedConnectorsCount: number;
  activeSyncJobsCount: number;
  unreadNotificationsCount: number;
  runtimeMode: 'WEB OS' | 'TAURI DESKTOP';
  isNativeDesktop: boolean;
  environmentLabel?: string;
  connectivityLabel?: string;
  isOnline?: boolean;
  activeAppName: string | null;
  copilotStatus: DynamicIslandCopilotStatus;
  simulationRunning: boolean;
}

export interface DynamicIslandState {
  mode: DynamicIslandMode;
  presentationMode: DynamicIslandPresentationMode;
  surfaceState: DynamicIslandSurfaceState;
  isExpanded: boolean;
  isPinned: boolean;
  isHovered: boolean;
  isCompactOverMaximized: boolean;
  isFullscreenHidden: boolean;
  activity: DynamicIslandActivity;
  activities: DynamicIslandEventItem[];
  primaryEvent: DynamicIslandEventItem | null;
  metrics: DynamicIslandMetrics;
  toggleExpanded: () => void;
  expand: () => void;
  collapse: () => void;
  togglePin: () => void;
  setIsHovered: (hovered: boolean) => void;
  handleAction: (appId: string) => void;
  pushActivity: (item: DynamicIslandEventItem) => void;
  dismissActivity: (id: string) => void;
}
