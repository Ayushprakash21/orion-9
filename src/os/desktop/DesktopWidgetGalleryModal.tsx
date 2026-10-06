/**
 * ORION-9 DESKTOP WIDGET GALLERY MODAL
 * Full spatial gallery allowing users to select and add functional desktop widgets
 * in Small, Medium, or Large size configurations.
 */

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DesktopWidgetRecord, DesktopWidgetType, WidgetSize } from '../../core/filesystem/types';
import { cn } from '../../lib/utils';
import {
  Clock,
  Calendar,
  CloudSun,
  ShieldAlert,
  Activity,
  Package,
  ShoppingCart,
  Truck,
  Building2,
  Sparkles,
  AlertTriangle,
  Cpu,
  Wifi,
  FileText,
  StickyNote,
  Zap,
  X,
  Plus,
  RotateCcw
} from 'lucide-react';

export interface WidgetGalleryItem {
  type: DesktopWidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: WidgetSize;
  dimensions: { width: number; height: number };
}

export const WIDGET_GALLERY_CATALOG: WidgetGalleryItem[] = [
  {
    type: 'clock',
    title: 'System Clock',
    description: 'Live digital clock with OS uptime and local date.',
    icon: <Clock className="w-5 h-5 text-sky-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 150 },
  },
  {
    type: 'calendar',
    title: 'Enterprise Calendar',
    description: 'Monthly calendar view with today highlight & milestones.',
    icon: <Calendar className="w-5 h-5 text-sky-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 220 },
  },
  {
    type: 'control_tower',
    title: 'Control Tower Radar',
    description: 'Live supply chain critical exception radar & approvals.',
    icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
    defaultSize: 'LARGE',
    dimensions: { width: 440, height: 250 },
  },
  {
    type: 'supply_chain_pulse',
    title: 'Supply Chain Pulse',
    description: 'SLA metrics, fulfillment rates & velocity index.',
    icon: <Activity className="w-5 h-5 text-emerald-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 440, height: 180 },
  },
  {
    type: 'inventory_health',
    title: 'Inventory Stock Ratio',
    description: 'Real-time SKU stock levels across global distribution hubs.',
    icon: <Package className="w-5 h-5 text-purple-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 160 },
  },
  {
    type: 'ai_copilot',
    title: 'Orion AI Copilot',
    description: 'Autonomous supply chain intelligence assistant.',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    defaultSize: 'LARGE',
    dimensions: { width: 440, height: 200 },
  },
  {
    type: 'system_health',
    title: 'OS Telemetry',
    description: 'Database latency, database environment & memory probes.',
    icon: <Cpu className="w-5 h-5 text-sky-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 160 },
  },
  {
    type: 'notes',
    title: 'Sticky Note',
    description: 'Persistent workspace scratchpad & strategic notes.',
    icon: <StickyNote className="w-5 h-5 text-amber-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 180 },
  },
  {
    type: 'quick_actions',
    title: 'Quick Office Actions',
    description: 'Instant launchers for New Doc, Sheet, Slide & Settings.',
    icon: <Zap className="w-5 h-5 text-sky-400" />,
    defaultSize: 'MEDIUM',
    dimensions: { width: 340, height: 180 },
  },
];

export interface DesktopWidgetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (item: WidgetGalleryItem, customPos?: { x: number; y: number }) => void;
  onRestoreDefaults?: () => void;
}

export function DesktopWidgetGalleryModal({
  isOpen,
  onClose,
  onAddWidget,
  onRestoreDefaults,
}: DesktopWidgetGalleryModalProps) {
  const [activeDrag, setActiveDrag] = useState<{
    item: WidgetGalleryItem;
    pointerId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
    isOverDesktop: boolean;
  } | null>(null);

  const dragSessionRef = useRef<{
    item: WidgetGalleryItem;
    pointerId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
    isOverDesktop: boolean;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleItemPointerDown = (e: React.PointerEvent, item: WidgetGalleryItem) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!e.isPrimary) return;

    // Do not initiate drag if clicking button
    if ((e.target as HTMLElement).closest('button')) return;

    const pointerId = e.pointerId;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const session = {
      item,
      pointerId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isDragging: false,
      isOverDesktop: false,
    };
    dragSessionRef.current = session;

    const cleanup = () => {
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      dragSessionRef.current = null;
      setActiveDrag(null);
    };

    const onPointerMove = (moveEvt: PointerEvent) => {
      const active = dragSessionRef.current;
      if (!active || active.pointerId !== moveEvt.pointerId) return;

      const dist = Math.hypot(moveEvt.clientX - active.startX, moveEvt.clientY - active.startY);
      if (!active.isDragging) {
        if (dist >= 8) {
          active.isDragging = true;
        } else {
          return;
        }
      }

      active.currentX = moveEvt.clientX;
      active.currentY = moveEvt.clientY;

      const canvasEl = document.querySelector('[data-desktop-canvas="true"]') as HTMLElement | null;
      let overDesktop = false;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const inCanvas = (
          moveEvt.clientX >= rect.left &&
          moveEvt.clientX <= rect.right &&
          moveEvt.clientY >= rect.top &&
          moveEvt.clientY <= rect.bottom
        );
        let insideModal = false;
        if (modalRef.current) {
          const mRect = modalRef.current.getBoundingClientRect();
          insideModal = (
            moveEvt.clientX >= mRect.left &&
            moveEvt.clientX <= mRect.right &&
            moveEvt.clientY >= mRect.top &&
            moveEvt.clientY <= mRect.bottom
          );
        }
        overDesktop = inCanvas && !insideModal;
      }

      active.isOverDesktop = overDesktop;
      setActiveDrag({ ...active });
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      const active = dragSessionRef.current;
      if (!active || active.pointerId !== upEvt.pointerId) return;
      cleanup();

      if (active.isDragging) {
        const canvasEl = document.querySelector('[data-desktop-canvas="true"]') as HTMLElement | null;
        if (canvasEl) {
          const rect = canvasEl.getBoundingClientRect();
          const inCanvas = (
            upEvt.clientX >= rect.left &&
            upEvt.clientX <= rect.right &&
            upEvt.clientY >= rect.top &&
            upEvt.clientY <= rect.bottom
          );
          let insideModal = false;
          if (modalRef.current) {
            const mRect = modalRef.current.getBoundingClientRect();
            insideModal = (
              upEvt.clientX >= mRect.left &&
              upEvt.clientX <= mRect.right &&
              upEvt.clientY >= mRect.top &&
              upEvt.clientY <= mRect.bottom
            );
          }
          if (inCanvas && !insideModal) {
            const dropX = upEvt.clientX - rect.left - Math.round(active.item.dimensions.width / 2);
            const dropY = upEvt.clientY - rect.top - 20;
            onAddWidget(active.item, { x: dropX, y: dropY });
            onClose();
          }
        }
      }
    };

    const onPointerCancel = () => {
      cleanup();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false, capture: true });
    window.addEventListener('pointerup', onPointerUp, { passive: false, capture: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: false, capture: true });
  };

  const content = (
    <div
      data-testid="widget-gallery-backdrop"
      style={{ zIndex: 2147483640 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none"
    >
      <div
        ref={modalRef}
        data-testid="widget-gallery"
        className="bg-[#12151a] border border-white/[0.12] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-os-text-primary">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">Orion Widget Gallery</h2>
              <p className="text-xs text-os-text-muted">Click or drag spatial OS widgets onto your desktop</p>
            </div>
          </div>
          <button
            type="button"
            data-action="close-gallery"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gallery Catalog Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 custom-scrollbar">
          {WIDGET_GALLERY_CATALOG.map((item) => (
            <div
              key={item.type}
              data-gallery-item={item.type}
              data-widget-gallery-drag-source="true"
              onPointerDown={(e) => handleItemPointerDown(e, item)}
              className="bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:bg-white/[0.07] group cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-start gap-3 pointer-events-none">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 group-hover:scale-105 transition-transform pointer-events-none">
                  {item.icon}
                </div>
                <div className="pointer-events-none">
                  <h3 className="text-sm font-semibold text-white group-hover:text-white/90 transition-colors pointer-events-none">
                    {item.title}
                  </h3>
                  <p className="text-xs text-os-text-muted mt-0.5 leading-relaxed pointer-events-none">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-os-text-secondary bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08] uppercase font-medium pointer-events-none">
                  Size: {item.defaultSize}
                </span>
                <button
                  type="button"
                  data-action="add-widget"
                  onClick={() => {
                    onAddWidget(item);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 border border-white/15"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Desktop</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Drag Preview Portal for Widget Gallery */}
        {activeDrag?.isDragging && typeof document !== 'undefined' && createPortal(
          <div
            data-testid="widget-gallery-drag-preview"
            data-is-over-desktop={activeDrag.isOverDesktop ? "true" : "false"}
            className={cn(
              "fixed pointer-events-none z-[2147483647] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-transform duration-75 select-none",
              activeDrag.isOverDesktop
                ? "bg-[#141820]/95 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.12)] scale-105 ring-1 ring-white/20"
                : "bg-[#12151a]/95 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] scale-100 opacity-80"
            )}
            style={{
              left: `${activeDrag.currentX}px`,
              top: `${activeDrag.currentY}px`,
              minWidth: '220px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white">
                {activeDrag.item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white drop-shadow">
                  {activeDrag.item.title}
                </span>
                <span className="text-[10px] text-os-text-muted font-mono uppercase">
                  {activeDrag.item.defaultSize} • {activeDrag.item.dimensions.width}×{activeDrag.item.dimensions.height}
                </span>
              </div>
            </div>
            {activeDrag.isOverDesktop && (
              <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider bg-white/[0.12] px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Drop on Desktop
              </span>
            )}
          </div>,
          document.body
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          {onRestoreDefaults ? (
            <button
              type="button"
              data-action="restore-default-widgets"
              onClick={() => {
                onRestoreDefaults();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-os-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Widgets</span>
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
