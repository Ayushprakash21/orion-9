import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  Check, 
  RefreshCw, 
  Globe, 
  Shield, 
  Settings, 
  Activity, 
  Signal, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Radio,
  Server,
  Info
} from 'lucide-react';
import { useConnectivity } from '../../store/ConnectivityContext';
import { useOptionalWindowManager } from '../WindowManagerContext';
import { cn } from '../../lib/utils';

export interface NetworkConnectionPopoverProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onOpenSystemStatus?: () => void;
}

interface NetworkItem {
  id: string;
  ssid: string;
  type: 'enterprise' | 'cloud' | 'mesh' | 'guest';
  security: 'WPA3-Enterprise' | 'WPA3-Personal' | 'TLS 1.3 / mTLS' | 'Open';
  frequency: '5 GHz' | '6 GHz' | '2.4 GHz' | 'Multi-Band';
  signalStrength: 1 | 2 | 3 | 4; // 1 to 4 bars
  speed: string;
  isConnected: boolean;
  isSaved: boolean;
  ipAddress?: string;
  gateway?: string;
}

export const NetworkConnectionPopover: React.FC<NetworkConnectionPopoverProps> = ({
  isOpen,
  anchorRect,
  onClose,
  onOpenSystemStatus
}) => {
  const { isOnline, statusLabel, isLocalMode, checkHealth } = useConnectivity();
  const wm = useOptionalWindowManager();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('net-orion-mesh');

  // Realistic enterprise network catalog
  const [networks, setNetworks] = useState<NetworkItem[]>([
    {
      id: 'net-orion-mesh',
      ssid: 'ORION-9 Enterprise Mesh (Ultra-Low Latency)',
      type: 'enterprise',
      security: 'WPA3-Enterprise',
      frequency: '6 GHz',
      signalStrength: 4,
      speed: '2.4 Gbps',
      isConnected: isOnline && !isLocalMode,
      isSaved: true,
      ipAddress: '10.240.18.94',
      gateway: '10.240.18.1'
    },
    {
      id: 'net-gcp-cloud',
      ssid: 'Google Cloud Platform — Dedicated Interconnect',
      type: 'cloud',
      security: 'TLS 1.3 / mTLS',
      frequency: 'Multi-Band',
      signalStrength: 4,
      speed: '10 Gbps',
      isConnected: false,
      isSaved: true,
      ipAddress: '172.16.100.12',
      gateway: '172.16.100.1'
    },
    {
      id: 'net-scm-telemetry',
      ssid: 'SCM Global Fleet Telemetry & IoT Gateway',
      type: 'mesh',
      security: 'WPA3-Enterprise',
      frequency: '5 GHz',
      signalStrength: 3,
      speed: '866 Mbps',
      isConnected: false,
      isSaved: true
    },
    {
      id: 'net-secure-dmz',
      ssid: 'Orion Logistics Dock & Robotics DMZ',
      type: 'mesh',
      security: 'WPA3-Enterprise',
      frequency: '5 GHz',
      signalStrength: 3,
      speed: '600 Mbps',
      isConnected: false,
      isSaved: false
    },
    {
      id: 'net-guest',
      ssid: 'Orion Visitor & Contractor Network',
      type: 'guest',
      security: 'WPA3-Personal',
      frequency: '2.4 GHz',
      signalStrength: 2,
      speed: '150 Mbps',
      isConnected: false,
      isSaved: false
    }
  ]);

  // Dynamic position calculation anchored to Wi-Fi button
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 48, right: 12 });

  const updatePosition = useCallback(() => {
    if (!anchorRect) return;
    const viewportWidth = window.innerWidth;
    const rightMargin = Math.max(12, viewportWidth - anchorRect.right);
    const topMargin = anchorRect.bottom + 6;
    setCoords({
      top: topMargin,
      right: rightMargin
    });
  }, [anchorRect]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    // Use timeout so current click doesn't trigger close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Handle network scan/refresh
  const handleScan = () => {
    setIsScanning(true);
    checkHealth().catch(() => {});
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  // Handle network connect
  const handleConnect = (networkId: string) => {
    setConnectingId(networkId);
    setTimeout(() => {
      setNetworks(prev => prev.map(n => ({
        ...n,
        isConnected: n.id === networkId
      })));
      setSelectedNetworkId(networkId);
      setConnectingId(null);
    }, 750);
  };

  // Handle network disconnect
  const handleDisconnect = (networkId: string) => {
    setNetworks(prev => prev.map(n => ({
      ...n,
      isConnected: n.id === networkId ? false : n.isConnected
    })));
  };

  if (!isOpen) return null;

  const connectedNetwork = networks.find(n => n.isConnected && wifiEnabled);

  const popoverContent = (
    <div 
      ref={popoverRef}
      role="dialog"
      aria-label="Network Connections"
      data-testid="network-connection-popover"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        right: `${coords.right}px`,
        zIndex: 2147483600 // High OS overlay layer - permanently above application windows
      }}
      className={cn(
        "w-[min(380px,calc(100vw-24px))] max-h-[calc(100vh-64px)]",
        "bg-os-surface/95 dark:bg-[#0c0d10]/95 backdrop-blur-2xl",
        "border border-os-border rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]",
        "flex flex-col text-[12px] font-sans overflow-hidden select-none",
        "animate-in fade-in zoom-in-95 duration-150 origin-top-right"
      )}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-os-border/60 bg-os-surface-active/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg border",
            wifiEnabled 
              ? (isOnline && !isLocalMode ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400")
              : "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"
          )}>
            {wifiEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-os-text-primary truncate">Wi-Fi & Connectivity</h3>
            <p className="text-[10px] font-mono text-os-text-muted flex items-center gap-1.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full inline-block",
                wifiEnabled 
                  ? (isOnline && !isLocalMode ? "bg-emerald-500 animate-pulse" : "bg-cyan-400")
                  : "bg-neutral-500"
              )} />
              {wifiEnabled ? (isLocalMode ? 'Local / Demo Mode' : 'Connected') : 'Wi-Fi Disabled'}
            </p>
          </div>
        </div>

        {/* Master Wi-Fi Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleScan}
            disabled={!wifiEnabled || isScanning}
            title="Scan for networks"
            className={cn(
              "p-1.5 rounded-lg text-os-text-muted hover:text-os-text-primary hover:bg-os-surface-hover transition-all cursor-pointer disabled:opacity-40",
              isScanning && "text-os-accent"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isScanning && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={() => setWifiEnabled(!wifiEnabled)}
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none focus:ring-1 focus:ring-os-accent",
              wifiEnabled ? "bg-os-accent" : "bg-os-surface-active border border-os-border"
            )}
            aria-label={wifiEnabled ? "Disable Wi-Fi" : "Enable Wi-Fi"}
          >
            <div className={cn(
              "w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs",
              wifiEnabled ? "translate-x-4" : "translate-x-0"
            )} />
          </button>
        </div>
      </div>

      {/* ── ACTIVE CONNECTION CARD ─────────────────────────────────────────── */}
      {wifiEnabled && (
        <div className="p-3 border-b border-os-border/60 bg-os-surface/40">
          {connectedNetwork ? (
            <div className="p-3 rounded-lg bg-os-surface-elevated/70 border border-os-border/80 shadow-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-os-text-primary truncate">
                      {connectedNetwork.ssid}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-os-text-muted">
                    <span>{connectedNetwork.frequency}</span>
                    <span>•</span>
                    <span>{connectedNetwork.security}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{connectedNetwork.speed}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDisconnect(connectedNetwork.id)}
                  className="px-2 py-1 text-[10px] font-mono text-os-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded border border-os-border hover:border-red-500/30 transition-all cursor-pointer shrink-0"
                >
                  Disconnect
                </button>
              </div>

              {connectedNetwork.ipAddress && (
                <div className="pt-2 border-t border-os-border/40 flex items-center justify-between text-[10px] font-mono text-os-text-muted">
                  <span>IPv4: <span className="text-os-text-primary">{connectedNetwork.ipAddress}</span></span>
                  <span>Gateway: <span className="text-os-text-primary">{connectedNetwork.gateway}</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-os-surface-active/40 border border-os-border text-center space-y-1">
              <p className="text-[11px] font-medium text-os-text-primary">No Active Network Connection</p>
              <p className="text-[10px] text-os-text-muted">Select an available enterprise or cloud network below</p>
            </div>
          )}
        </div>
      )}

      {/* ── AVAILABLE NETWORKS LIST ────────────────────────────────────────── */}
      {wifiEnabled ? (
        <div className="flex-1 overflow-y-auto max-h-56 p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-os-text-muted flex items-center justify-between">
            <span>Known & Available Networks ({networks.length})</span>
            {isScanning && <span className="text-os-accent text-[9px] animate-pulse">Scanning...</span>}
          </div>

          {networks.map(net => {
            const isSelected = selectedNetworkId === net.id;
            const isConnecting = connectingId === net.id;

            return (
              <div
                key={net.id}
                onClick={() => setSelectedNetworkId(net.id)}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border",
                  net.isConnected 
                    ? "bg-os-accent/10 border-os-accent/30 text-os-text-primary"
                    : isSelected
                      ? "bg-os-surface-hover/80 border-os-border text-os-text-primary"
                      : "bg-transparent border-transparent hover:bg-os-surface-hover/50 text-os-text-secondary hover:text-os-text-primary"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="text-os-text-muted group-hover:text-os-text-primary transition-colors shrink-0">
                    <SignalBars bars={net.signalStrength} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium truncate">{net.ssid}</span>
                      {net.security !== 'Open' && <Lock className="w-2.5 h-2.5 text-os-text-muted shrink-0" />}
                    </div>
                    <div className="text-[9px] font-mono text-os-text-muted truncate">
                      {net.security} • {net.frequency} • {net.speed}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {net.isConnected ? (
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                      Connected
                    </span>
                  ) : isConnecting ? (
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-os-accent/20 text-os-accent rounded-full border border-os-accent/30 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Connecting
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(net.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-[10px] font-medium bg-os-surface-active hover:bg-os-accent hover:text-white rounded border border-os-border transition-all cursor-pointer shadow-xs"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-os-surface-active mx-auto flex items-center justify-center text-os-text-muted">
            <WifiOff className="w-5 h-5" />
          </div>
          <p className="text-[12px] font-medium text-os-text-primary">Wi-Fi is Turned Off</p>
          <p className="text-[10px] text-os-text-muted max-w-[240px] mx-auto">
            Turn on Wi-Fi to scan and connect to Orion mesh networks and cloud interconnects.
          </p>
          <button
            type="button"
            onClick={() => setWifiEnabled(true)}
            className="mt-2 px-3 py-1.5 text-[11px] font-medium bg-os-accent text-white rounded-lg shadow-sm hover:bg-os-accent/90 transition-all cursor-pointer"
          >
            Turn On Wi-Fi
          </button>
        </div>
      )}

      {/* ── FOOTER & ACTIONS ────────────────────────────────────────────────── */}
      <div className="p-2 border-t border-os-border/60 bg-os-surface-active/20 flex flex-col gap-1">
        {onOpenSystemStatus && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSystemStatus();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded-lg transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-os-accent" />
              <span>System Health & Diagnostics...</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            if (wm) {
              wm.openApplication('settings');
            }
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded-lg transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-os-text-muted" />
            <span>Network & Internet Settings</span>
          </div>
          <ExternalLink className="w-3 h-3 opacity-40" />
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(popoverContent, document.body)
    : popoverContent;
};

/**
 * Clean multi-bar signal strength icon
 */
const SignalBars: React.FC<{ bars: 1 | 2 | 3 | 4 }> = ({ bars }) => {
  return (
    <div className="flex items-end gap-0.5 h-3 w-3.5 justify-center" aria-label={`${bars} bars of signal`}>
      <div className={cn("w-0.5 rounded-xs transition-colors", bars >= 1 ? "h-1 bg-current" : "h-1 bg-white/20")} />
      <div className={cn("w-0.5 rounded-xs transition-colors", bars >= 2 ? "h-1.5 bg-current" : "h-1.5 bg-white/20")} />
      <div className={cn("w-0.5 rounded-xs transition-colors", bars >= 3 ? "h-2 bg-current" : "h-2 bg-white/20")} />
      <div className={cn("w-0.5 rounded-xs transition-colors", bars >= 4 ? "h-2.5 bg-current" : "h-2.5 bg-white/20")} />
    </div>
  );
};
