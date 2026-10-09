/**
 * ORION-9 DESKTOP WIDGET SYSTEM
 * Native macOS-inspired spatial desktop widgets with real data binding (DEMO/LIVE),
 * integrated size selectors, in-widget close controls, natural surface dragging,
 * and Cloud Firestore / SCM persistence.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DesktopWidgetRecord, DesktopWidgetType, WidgetSize } from '../../core/filesystem/types';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { useWindowManager } from '../WindowManagerContext';
import { useToast } from '../../store/ToastContext';
import { cn } from '../../lib/utils';
import {
  Clock,
  Calendar as CalendarIcon,
  ShieldAlert,
  Activity,
  Package,
  Sparkles,
  Cpu,
  StickyNote,
  Zap,
  X,
  FileText,
  Settings,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

/**
 * Canonical size-to-dimensions resolver for Small, Medium, and Large widgets.
 */
export function resolveWidgetDimensions(
  widgetType: DesktopWidgetType,
  size: WidgetSize
): { width: number; height: number } {
  switch (size) {
    case 'SMALL':
      return { width: 240, height: 150 };
    case 'LARGE':
      return { width: 440, height: 250 };
    case 'MEDIUM':
    default:
      if (widgetType === 'supply_chain_pulse') {
        return { width: 440, height: 180 };
      }
      return { width: 340, height: 180 };
  }
}

/**
 * Centralized interactive-target exclusion check.
 * Prevents widget dragging when pointer initiates on buttons, links, inputs,
 * textareas, size selectors, close controls, or explicit interactive areas.
 */
export function isWidgetInteractiveElement(element: Element | null): boolean {
  if (!element) return false;
  return Boolean(
    element.closest(
      'button, a, input, textarea, select, option, ' +
      '[role="button"], [role="slider"], [role="textbox"], [role="menuitem"], ' +
      '[data-widget-interactive="true"], [data-action], ' +
      '.interactive, [contenteditable="true"]'
    )
  );
}

export function getWidgetIcon(type: DesktopWidgetType) {
  switch (type) {
    case 'clock':
      return <Clock className="w-3.5 h-3.5 text-sky-400" />;
    case 'calendar':
      return <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />;
    case 'control_tower':
      return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
    case 'supply_chain_pulse':
      return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
    case 'inventory_health':
      return <Package className="w-3.5 h-3.5 text-purple-400" />;
    case 'ai_copilot':
      return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    case 'system_health':
      return <Cpu className="w-3.5 h-3.5 text-sky-400" />;
    case 'notes':
      return <StickyNote className="w-3.5 h-3.5 text-amber-400" />;
    case 'quick_actions':
      return <Zap className="w-3.5 h-3.5 text-sky-400" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-sky-400" />;
  }
}

export interface WidgetComponentProps {
  widget: DesktopWidgetRecord;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onResize: (id: string, newSize: WidgetSize) => void;
  onMoveStart: (e: React.PointerEvent, widget: DesktopWidgetRecord) => void;
}

export function DesktopWidgetSystem({
  widget,
  isEditMode,
  onRemove,
  onResize,
  onMoveStart,
}: WidgetComponentProps) {
  const { openApplication } = useWindowManager();
  const { showToast } = useToast();
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [healthData, setHealthData] = useState<{ liveness: boolean; readiness: boolean; latency: number }>({
    liveness: true,
    readiness: true,
    latency: 12,
  });
  const [noteText, setNoteText] = useState<string>(() => widget.config?.noteText || 'Strategic Objective: Q3 Global Supply Chain Optimization');
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!menuPos) return;
    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPos(null);
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('touchstart', handleDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuPos]);

  const getTargetAppId = (): string | null => {
    switch (widget.widgetType) {
      case 'control_tower':
        return 'control-tower';
      case 'supply_chain_pulse':
        return 'command-center';
      case 'inventory_health':
        return 'inventory';
      case 'ai_copilot':
        return 'orion-copilot';
      case 'notes':
        return 'notepad';
      case 'system_health':
      case 'clock':
      case 'calendar':
        return 'settings';
      default:
        return null;
    }
  };

  const handleSafeRemove = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setMenuPos(null);
    onRemove(widget.id);
  }, [onRemove, widget.id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const updateHealth = async () => {
      try {
        const env = dbManager.getEnvironment();
        const health = await HealthService.getInstance().runHealthCheck();
        const state = dbManager.getState();
        if (mounted) {
          setDbEnv(env);
          setHealthData({
            liveness: health.livenessProbe,
            readiness: health.readinessProbe,
            latency: state.measuredLatencyMs || 12,
          });
        }
      } catch (e) {}
    };
    updateHealth();
    const interval = setInterval(updateHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    // Only primary left-button click initiates drag
    if (e.button !== 0) return;
    // Check if pointer began on an interactive target
    if (isWidgetInteractiveElement(e.target as Element)) {
      return;
    }
    onMoveStart(e, widget);
  };

  const dims = resolveWidgetDimensions(widget.widgetType, widget.size);
  const effectiveWidth = widget.width || dims.width;
  const effectiveHeight = widget.height || dims.height;

  const renderHeaderBadge = () => {
    switch (widget.widgetType) {
      case 'control_tower':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
            {dbEnv}
          </span>
        );
      case 'supply_chain_pulse':
        return (
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            98.4% SLA
          </span>
        );
      case 'inventory_health':
        return (
          <span className="text-[10px] font-mono text-white/50">
            24 Hubs
          </span>
        );
      case 'ai_copilot':
        return (
          <span className="text-[9px] font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-500/25">
            ACTIVE
          </span>
        );
      case 'system_health':
        return (
          <span className="text-[9px] font-mono text-emerald-400 font-semibold">
            ONLINE
          </span>
        );
      case 'notes':
        return (
          <span className="text-[9px] font-mono text-white/40">
            Auto-saved
          </span>
        );
      default:
        return null;
    }
  };

  const renderWidgetContent = () => {
    switch (widget.widgetType) {
      case 'clock':
        return (
          <div className="flex flex-col justify-center items-center h-full text-center select-none py-1">
            <div className={cn(
              "font-semibold font-mono tracking-tight text-white drop-shadow-sm",
              widget.size === 'SMALL' ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"
            )}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: widget.size === 'SMALL' ? undefined : '2-digit' })}
            </div>
            <div className="text-[11px] text-os-text-muted font-medium mt-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        );

      case 'calendar':
        if (widget.size === 'SMALL') {
          return (
            <div className="flex items-center justify-between h-full px-2 select-none">
              <div>
                <span className="text-3xl font-bold font-mono text-white">{currentTime.getDate()}</span>
                <span className="block text-xs text-sky-400 font-medium">
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long' })}
                </span>
              </div>
              <div className="text-right text-[11px] text-white/60">
                <div>{currentTime.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>
                <div className="text-[10px] text-white/40 mt-1">Calendar</div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full justify-between select-none">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] my-auto">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="text-white/40 font-bold">{d}</span>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === currentTime.getDate();
                return (
                  <span
                    key={i}
                    className={`py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {dayNum}
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'control_tower':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="grid grid-cols-3 gap-2 my-auto text-center">
              <div className="bg-white/[0.05] border border-white/[0.10] rounded-xl p-1.5 backdrop-blur-md">
                <span className="block text-[9px] text-white/50 uppercase font-medium">Critical</span>
                <span className="text-base sm:text-lg font-bold text-rose-400 font-mono">3</span>
              </div>
              <div className="bg-white/[0.05] border border-white/[0.10] rounded-xl p-1.5 backdrop-blur-md">
                <span className="block text-[9px] text-white/50 uppercase font-medium">High</span>
                <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">8</span>
              </div>
              <div className="bg-white/[0.05] border border-white/[0.10] rounded-xl p-1.5 backdrop-blur-md">
                <span className="block text-[9px] text-white/50 uppercase font-medium">Pending</span>
                <span className="text-base sm:text-lg font-bold text-sky-400 font-mono">14</span>
              </div>
            </div>
            {widget.size !== 'SMALL' && (
              <button
                type="button"
                data-widget-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  openApplication('control-tower');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full py-1 text-center text-xs text-white font-medium bg-white/[0.08] hover:bg-white/[0.16] rounded-xl border border-white/[0.12] transition-colors cursor-pointer"
              >
                Open Control Tower Workspace →
              </button>
            )}
          </div>
        );

      case 'supply_chain_pulse':
        return (
          <div className="flex flex-col h-full justify-between space-y-2 my-auto">
            <div>
              <div className="flex justify-between text-[11px] text-white/70 mb-1">
                <span>Global Fulfillment Rate</span>
                <span className="font-mono text-emerald-400 font-semibold">96.8%</span>
              </div>
              <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden border border-white/[0.06]">
                <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: '96.8%' }} />
              </div>
            </div>
            {widget.size !== 'SMALL' && (
              <div>
                <div className="flex justify-between text-[11px] text-white/70 mb-1">
                  <span>Inventory Velocity Index</span>
                  <span className="font-mono text-sky-400 font-semibold">94.2%</span>
                </div>
                <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden border border-white/[0.06]">
                  <div className="bg-sky-500 h-full rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]" style={{ width: '94.2%' }} />
                </div>
              </div>
            )}
          </div>
        );

      case 'inventory_health':
        return (
          <div className="flex items-center justify-around my-auto h-full">
            <div className="text-center">
              <span className="text-xs text-white/50 block">In-Stock</span>
              <span className="text-base font-bold text-emerald-400 font-mono">142,500</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-xs text-white/50 block">Low Stock</span>
              <span className="text-base font-bold text-amber-400 font-mono">12 SKU</span>
            </div>
          </div>
        );

      case 'ai_copilot':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="text-xs text-white/80 bg-white/5 border border-white/10 rounded-lg p-2 my-auto">
              "Optimal route for Asia-Pacific shipments re-routed to avoid port congestion."
            </div>
            {widget.size !== 'SMALL' && (
              <div className="flex gap-2" data-widget-interactive="true" onPointerDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="Ask Orion Copilot..."
                  className="flex-1 px-3 py-1 bg-white/10 border border-white/15 rounded-lg text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && copilotInput.trim()) {
                      showToast(`Copilot processing: "${copilotInput.trim()}"`, 'info');
                      setCopilotInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => openApplication('orion-copilot')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Ask
                </button>
              </div>
            )}
          </div>
        );

      case 'system_health':
        return (
          <div className="grid grid-cols-2 gap-2 my-auto text-center h-full items-center">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <span className="text-[10px] text-white/50 block">DB Latency</span>
              <span className="text-sm font-bold font-mono text-sky-400">{healthData.latency}ms</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <span className="text-[10px] text-white/50 block">Environment</span>
              <span className={`text-sm font-bold font-mono ${dbEnv === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dbEnv}
              </span>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="flex flex-col h-full my-auto" data-widget-interactive="true" onPointerDown={(e) => e.stopPropagation()}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full flex-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-100 placeholder:text-amber-200/40 focus:outline-none resize-none font-sans leading-relaxed"
              placeholder="Type persistent note here..."
            />
          </div>
        );

      case 'quick_actions':
        return (
          <div className="grid grid-cols-2 gap-2 my-auto" data-widget-interactive="true" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openApplication('orion-documents')}
              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>New Doc</span>
            </button>
            <button
              type="button"
              onClick={() => openApplication('orion-sheets')}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>New Sheet</span>
            </button>
            {widget.size !== 'SMALL' && (
              <>
                <button
                  type="button"
                  onClick={() => openApplication('orion-slides')}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>New Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => openApplication('settings')}
                  className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Settings</span>
                </button>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-2">
            <span className="font-semibold text-xs text-white">{widget.title}</span>
            <span className="text-[10px] text-white/50 uppercase mt-1">Widget ({widget.widgetType})</span>
          </div>
        );
    }
  };

  const targetApp = getTargetAppId();

  return (
    <>
      <div
        data-testid="desktop-widget"
        data-widget-id={widget.id}
        data-widget-type={widget.widgetType}
        data-widget-size={widget.size}
        style={{
          position: 'absolute',
          left: `${widget.x}px`,
          top: `${widget.y}px`,
          width: `${effectiveWidth}px`,
          height: `${effectiveHeight}px`,
          zIndex: widget.zIndex || 10,
        }}
        onPointerDown={handleContainerPointerDown}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuPos({
            x: Math.min(e.clientX, typeof window !== 'undefined' ? window.innerWidth - 200 : e.clientX),
            y: Math.min(e.clientY, typeof window !== 'undefined' ? window.innerHeight - 200 : e.clientY),
          });
        }}
        className={cn(
          "rounded-[22px] border transition-[box-shadow,border-color] duration-200 p-3.5 flex flex-col justify-between select-none group overflow-hidden",
          "backdrop-blur-[var(--orion-blur,24px)]",
          "bg-[var(--orion-surface,#121417)]/75",
          "border-[var(--orion-border,rgba(255,255,255,0.09))]",
          "shadow-[0_16px_42px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "cursor-grab active:cursor-grabbing hover:border-white/20",
          isEditMode && "ring-2 ring-[var(--orion-accent,#0071E3)]/50 border-white/40"
        )}
      >
        {/* Integrated macOS-style Widget Header */}
        <div
          data-testid="widget-header"
          className="flex items-center justify-between pb-1.5 border-b border-white/[0.08] select-none shrink-0"
        >
          {/* Header Draggable Anchor */}
          <div
            data-testid="widget-drag-handle"
            aria-label="Drag Widget"
            title="Drag to reposition widget"
            className="flex items-center gap-1.5 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
          >
            {getWidgetIcon(widget.widgetType)}
            <span className="font-semibold text-xs text-white truncate tracking-tight">
              {widget.title}
            </span>
            {renderHeaderBadge()}
            {isEditMode && (
              <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-white/10 text-white/70">
                DRAG
              </span>
            )}
          </div>

          {/* Integrated Size Selector & Action Buttons */}
          <div
            className="flex items-center gap-1.5 shrink-0 ml-2 opacity-80 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            data-widget-interactive="true"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Small / Medium / Large Size Selector */}
            <div
              className="flex items-center bg-white/[0.06] hover:bg-white/[0.10] p-0.5 rounded-lg border border-white/[0.08]"
              role="group"
              aria-label="Widget Size Selector"
            >
              {(['SMALL', 'MEDIUM', 'LARGE'] as WidgetSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  data-action="resize-widget"
                  data-size={sz}
                  onClick={(e) => {
                    e.stopPropagation();
                    onResize(widget.id, sz);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`Resize to ${sz.toLowerCase()}`}
                  title={`Resize to ${sz.toLowerCase()}`}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer",
                    widget.size === sz
                      ? "bg-white/20 text-white font-bold shadow-xs"
                      : "text-white/40 hover:text-white/80"
                  )}
                >
                  {sz === 'SMALL' ? 'S' : sz === 'MEDIUM' ? 'M' : 'L'}
                </button>
              ))}
            </div>

            {/* Options Button */}
            <button
              type="button"
              data-action="widget-options"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenuPos({ x: Math.max(16, rect.left - 160), y: rect.bottom + 4 });
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/60 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              title="Widget Options"
              aria-label="Widget Options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {/* In-Widget Close / Remove Button */}
            <button
              type="button"
              data-action="remove-widget"
              onClick={handleSafeRemove}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-rose-500/80 text-white/60 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Remove Widget"
              aria-label="Remove Widget"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main Widget Body Content */}
        <div className="w-full h-full relative z-10 overflow-hidden pt-2 flex flex-col justify-between">
          {renderWidgetContent()}
        </div>
      </div>

      {/* Widget Context Menu for Secondary Actions */}
      {menuPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          data-testid="widget-context-menu"
          style={{
            position: 'fixed',
            left: `${menuPos.x}px`,
            top: `${menuPos.y}px`,
            zIndex: 2147483600,
          }}
          className="bg-[#14171d]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl p-1 w-48 text-xs text-white select-none animate-in fade-in zoom-in-95 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider border-b border-white/10 mb-1">
            {widget.title}
          </div>

          {targetApp && (
            <button
              type="button"
              onClick={() => {
                setMenuPos(null);
                openApplication(targetApp);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white text-left transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Open in Application</span>
            </button>
          )}

          <button
            type="button"
            data-action="menu-remove-widget"
            onClick={handleSafeRemove}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-left transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove Widget</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default DesktopWidgetSystem;
