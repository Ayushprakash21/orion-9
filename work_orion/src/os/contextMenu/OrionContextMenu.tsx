import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { useOrionContextMenu, ContextMenuItem } from './OrionContextMenuContext';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const OrionContextMenu: React.FC = () => {
  const { isOpen, menuState, closeContextMenu } = useOrionContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
  const [submenuCoords, setSubmenuCoords] = useState<{ x: number; y: number; flipLeft: boolean; flipUp: boolean } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [submenuFocusedIndex, setSubmenuFocusedIndex] = useState<number>(-1);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset focus and submenus when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveSubmenuIndex(null);
      setSubmenuCoords(null);
      setFocusedIndex(-1);
      setSubmenuFocusedIndex(-1);
    }
  }, [isOpen, menuState]);

  // Viewport clamping & boundary adjustment (Requirements 25 & 26)
  useLayoutEffect(() => {
    if (!isOpen || !menuState || !menuRef.current) return;

    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let nextX = menuState.x;
    let nextY = menuState.y;

    // Minimum top margin to leave space below the 32px top system bar
    const minTop = 36;
    const margin = 8;

    // Horizontal overflow check
    if (nextX + rect.width > viewportWidth - margin) {
      nextX = Math.max(margin, viewportWidth - rect.width - margin);
    }
    if (nextX < margin) {
      nextX = margin;
    }

    // Vertical overflow check
    if (nextY + rect.height > viewportHeight - margin) {
      // Flip upward if not enough space below
      const flippedY = nextY - rect.height;
      if (flippedY >= minTop) {
        nextY = flippedY;
      } else {
        nextY = Math.max(minTop, viewportHeight - rect.height - margin);
      }
    }
    if (nextY < minTop) {
      nextY = minTop;
    }

    setAdjustedPos({ x: nextX, y: nextY });
  }, [isOpen, menuState]);

  // Click outside listener (Requirement 27)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleWindowChange = () => {
      closeContextMenu();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, closeContextMenu]);

  // Compute submenu positioning adjacent to selected item
  const openSubmenu = useCallback((itemIndex: number, itemEl: HTMLElement, item: ContextMenuItem) => {
    if (!item.submenu || item.submenu.length === 0) return;
    const itemRect = itemEl.getBoundingClientRect();
    const submenuWidth = 200;
    const submenuHeight = item.submenu.length * 32 + 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const flipLeft = itemRect.right + submenuWidth > viewportWidth - 8;
    const flipUp = itemRect.top + submenuHeight > viewportHeight - 8;

    const subX = flipLeft ? itemRect.left - submenuWidth - 4 : itemRect.right + 4;
    const subY = flipUp ? Math.max(36, itemRect.bottom - submenuHeight) : itemRect.top - 4;

    setActiveSubmenuIndex(itemIndex);
    setSubmenuCoords({ x: subX, y: subY, flipLeft, flipUp });
    setSubmenuFocusedIndex(-1);
  }, []);

  // Keyboard navigation (Requirement 30: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, ESC)
  useEffect(() => {
    if (!isOpen || !menuState) return;

    const items = menuState.items;
    const selectableIndices = items
      .map((item, idx) => (!item.separator && !item.disabled ? idx : -1))
      .filter(idx => idx !== -1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (activeSubmenuIndex !== null) {
          setActiveSubmenuIndex(null);
          setSubmenuCoords(null);
          setSubmenuFocusedIndex(-1);
        } else {
          closeContextMenu();
        }
        return;
      }

      // Inside a submenu
      if (activeSubmenuIndex !== null) {
        const activeItem = items[activeSubmenuIndex];
        const subItems = activeItem?.submenu || [];
        const subSelectableIndices = subItems
          .map((sub, idx) => (!sub.separator && !sub.disabled ? idx : -1))
          .filter(idx => idx !== -1);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currPos = subSelectableIndices.indexOf(submenuFocusedIndex);
          const nextPos = currPos === -1 || currPos === subSelectableIndices.length - 1 ? 0 : currPos + 1;
          setSubmenuFocusedIndex(subSelectableIndices[nextPos]);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currPos = subSelectableIndices.indexOf(submenuFocusedIndex);
          const prevPos = currPos <= 0 ? subSelectableIndices.length - 1 : currPos - 1;
          setSubmenuFocusedIndex(subSelectableIndices[prevPos]);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setActiveSubmenuIndex(null);
          setSubmenuCoords(null);
          setSubmenuFocusedIndex(-1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (submenuFocusedIndex !== -1 && subItems[submenuFocusedIndex]) {
            const sub = subItems[submenuFocusedIndex];
            if (!sub.disabled && sub.action) {
              sub.action();
              closeContextMenu();
            }
          }
        }
        return;
      }

      // Main menu keyboard navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currPos = selectableIndices.indexOf(focusedIndex);
        const nextPos = currPos === -1 || currPos === selectableIndices.length - 1 ? 0 : currPos + 1;
        setFocusedIndex(selectableIndices[nextPos]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currPos = selectableIndices.indexOf(focusedIndex);
        const prevPos = currPos <= 0 ? selectableIndices.length - 1 : currPos - 1;
        setFocusedIndex(selectableIndices[prevPos]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focusedIndex !== -1 && items[focusedIndex]?.submenu) {
          const itemEl = menuRef.current?.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
          if (itemEl) {
            openSubmenu(focusedIndex, itemEl, items[focusedIndex]);
            const subItems = items[focusedIndex].submenu || [];
            const firstSubSelectable = subItems.findIndex(s => !s.separator && !s.disabled);
            if (firstSubSelectable !== -1) {
              setSubmenuFocusedIndex(firstSubSelectable);
            }
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex !== -1 && items[focusedIndex]) {
          const item = items[focusedIndex];
          if (item.submenu) {
            const itemEl = menuRef.current?.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
            if (itemEl) openSubmenu(focusedIndex, itemEl, item);
          } else if (!item.disabled && item.action) {
            item.action();
            closeContextMenu();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, menuState, focusedIndex, activeSubmenuIndex, submenuFocusedIndex, openSubmenu, closeContextMenu]);

  if (!isOpen || !menuState) return null;

  const currentSubmenu = activeSubmenuIndex !== null ? menuState.items[activeSubmenuIndex]?.submenu : null;

  return (
    <>
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        tabIndex={-1}
        data-orion-context-menu="true"
        style={{
          position: 'fixed',
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`,
          zIndex: 95, // Above windows (10-45) and dock (60), below system dropdowns (100+)
        }}
        className={cn(
          "w-60 max-w-[90vw] p-1.5 rounded-xl font-sans select-none",
          "bg-os-surface/95 backdrop-blur-2xl border border-os-border",
          "shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]",
          "animate-in fade-in zoom-in-95 duration-100 ease-out",
          "text-os-text-primary text-[12px] overflow-visible"
        )}
      >
        {/* Context Target Header Badge (Optional) */}
        {(menuState.title || menuState.subtitle) && (
          <div className="px-2.5 py-1.5 mb-1 rounded-lg bg-white/[0.04] border border-os-border">
            {menuState.title && (
              <div className="text-[11px] font-semibold text-os-text-primary tracking-wide truncate">
                {menuState.title}
              </div>
            )}
            {menuState.subtitle && (
              <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider truncate">
                {menuState.subtitle}
              </div>
            )}
          </div>
        )}

        {/* Menu Items List */}
        <div className="flex flex-col gap-0.5">
          {menuState.items.map((item, idx) => {
            if (item.separator) {
              return <div key={item.id || `sep-${idx}`} className="h-px bg-white/[0.08] my-1 mx-1.5" />;
            }

            const IconComponent = typeof item.icon === 'function' ? item.icon : null;
            const isFocused = focusedIndex === idx;
            const isSubmenuOpen = activeSubmenuIndex === idx;

            return (
              <button
                key={item.id || `item-${idx}`}
                type="button"
                data-index={idx}
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.disabled) return;
                  if (item.submenu) {
                    openSubmenu(idx, e.currentTarget, item);
                  } else if (item.action) {
                    item.action();
                    closeContextMenu();
                  }
                }}
                onMouseEnter={(e) => {
                  setFocusedIndex(idx);
                  if (item.submenu) {
                    openSubmenu(idx, e.currentTarget, item);
                  } else {
                    setActiveSubmenuIndex(null);
                    setSubmenuCoords(null);
                  }
                }}
                className={cn(
                  "w-full px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between group cursor-pointer",
                  isFocused && !item.disabled && (
                    item.danger
                      ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
                      : "bg-os-surface-active text-os-text-primary shadow-sm ring-1 ring-white/10"
                  ),
                  !isFocused && !item.disabled && (
                    item.danger
                      ? "text-red-400 hover:bg-red-500/15 hover:text-red-300"
                      : "text-os-text-secondary hover:bg-white/[0.07] hover:text-os-text-primary"
                  ),
                  item.disabled && "opacity-35 cursor-not-allowed pointer-events-none text-slate-500"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {item.checked !== undefined ? (
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {item.checked && <Check className="w-3.5 h-3.5 text-os-accent" />}
                    </div>
                  ) : IconComponent ? (
                    <IconComponent className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-colors",
                      item.danger ? "text-red-400" : "text-os-text-muted group-hover:text-os-text-primary"
                    )} />
                  ) : item.icon ? (
                    <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                      {React.isValidElement(item.icon) 
                        ? item.icon 
                        : React.createElement(item.icon as React.ElementType, { className: "w-3.5 h-3.5 shrink-0" })}
                    </div>
                  ) : null}

                  <span className="truncate font-medium">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border tracking-tight">
                      {item.shortcut}
                    </span>
                  )}
                  {item.submenu && (
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 transition-transform text-os-text-muted",
                      isSubmenuOpen ? "translate-x-0.5 text-os-text-primary" : ""
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nested Submenu (Requirement 32) */}
      {currentSubmenu && submenuCoords && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'fixed',
            left: `${submenuCoords.x}px`,
            top: `${submenuCoords.y}px`,
            zIndex: 96,
          }}
          className={cn(
            "w-52 max-w-[90vw] p-1.5 rounded-xl font-sans select-none",
            "bg-os-surface/98 backdrop-blur-2xl border border-os-border",
            "shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]",
            "animate-in fade-in zoom-in-95 duration-75 ease-out",
            "text-os-text-primary text-[12px]"
          )}
        >
          <div className="flex flex-col gap-0.5">
            {currentSubmenu.map((subItem, sIdx) => {
              if (subItem.separator) {
                return <div key={subItem.id || `sub-sep-${sIdx}`} className="h-px bg-white/[0.08] my-1 mx-1.5" />;
              }

              const SubIcon = typeof subItem.icon === 'function' ? subItem.icon : null;
              const isSubFocused = submenuFocusedIndex === sIdx;

              return (
                <button
                  key={subItem.id || `sub-item-${sIdx}`}
                  type="button"
                  role="menuitem"
                  disabled={subItem.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (subItem.disabled) return;
                    if (subItem.action) {
                      subItem.action();
                      closeContextMenu();
                    }
                  }}
                  onMouseEnter={() => setSubmenuFocusedIndex(sIdx)}
                  className={cn(
                    "w-full px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between group cursor-pointer",
                    isSubFocused && !subItem.disabled && (
                      subItem.danger
                        ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
                        : "bg-os-surface-active text-os-text-primary shadow-sm ring-1 ring-white/10"
                    ),
                    !isSubFocused && !subItem.disabled && (
                      subItem.danger
                        ? "text-red-400 hover:bg-red-500/15 hover:text-red-300"
                        : "text-os-text-secondary hover:bg-white/[0.07] hover:text-os-text-primary"
                    ),
                    subItem.disabled && "opacity-35 cursor-not-allowed pointer-events-none text-slate-500"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    {subItem.checked !== undefined ? (
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {subItem.checked && <Check className="w-3.5 h-3.5 text-os-accent" />}
                      </div>
                    ) : SubIcon ? (
                      <SubIcon className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-colors",
                        subItem.danger ? "text-red-400" : "text-os-text-muted group-hover:text-os-text-primary"
                      )} />
                    ) : subItem.icon ? (
                      <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                        {React.isValidElement(subItem.icon)
                          ? subItem.icon
                          : React.createElement(subItem.icon as React.ElementType, { className: "w-3.5 h-3.5 shrink-0" })}
                      </div>
                    ) : null}

                    <span className="truncate font-medium">{subItem.label}</span>
                  </div>

                  {subItem.shortcut && (
                    <span className="text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border tracking-tight">
                      {subItem.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
