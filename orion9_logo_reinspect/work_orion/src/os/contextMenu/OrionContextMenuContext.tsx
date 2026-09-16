import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../../store/ToastContext';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }> | React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  checked?: boolean;
  action?: () => void;
  submenu?: ContextMenuItem[];
}

export interface OpenContextMenuOptions {
  x: number;
  y: number;
  targetType: 'desktop' | 'window' | 'dock' | 'entity' | 'custom';
  targetId?: string;
  title?: string;
  subtitle?: string;
  items: ContextMenuItem[];
}

interface ContextMenuContextProps {
  isOpen: boolean;
  menuState: OpenContextMenuOptions | null;
  openContextMenu: (options: OpenContextMenuOptions) => void;
  closeContextMenu: () => void;
  copyToClipboardWithToast: (text: string, label?: string) => Promise<boolean>;
}

const ContextMenuContext = createContext<ContextMenuContextProps | undefined>(undefined);

export const OrionContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuState, setMenuState] = useState<OpenContextMenuOptions | null>(null);
  const { showToast } = useToast();

  const openContextMenu = useCallback((options: OpenContextMenuOptions) => {
    // Only one context menu may exist at a time (Requirement 1 & 27)
    setMenuState(options);
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  // Safe clipboard helper with user-facing toast feedback (Requirement 23)
  const copyToClipboardWithToast = useCallback(async (text: string, label = 'Identifier'): Promise<boolean> => {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for restricted iframes / older environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!success) throw new Error('execCommand copy failed');
      }
      showToast(`Copied ${label}: ${text}`, 'success', 'Clipboard');
      return true;
    } catch (err) {
      console.warn('[ORION Clipboard Error]:', err);
      showToast(`Failed to copy ${label} to clipboard`, 'error', 'Clipboard');
      return false;
    }
  }, [showToast]);

  return (
    <ContextMenuContext.Provider
      value={{
        isOpen: !!menuState,
        menuState,
        openContextMenu,
        closeContextMenu,
        copyToClipboardWithToast,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useOrionContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useOrionContextMenu must be used within OrionContextMenuProvider');
  }
  return context;
};

/**
 * Helper hook for attaching both native right-click (onContextMenu) and
 * touch long-press (550ms) for mobile and tablet interactions (Requirement 35 & 36).
 */
export interface UseContextMenuTriggerOptions {
  getItems: () => ContextMenuItem[];
  targetType: 'desktop' | 'window' | 'dock' | 'entity' | 'custom';
  targetId?: string;
  title?: string;
  subtitle?: string;
  onBeforeOpen?: () => void;
  disabled?: boolean;
}

export function useContextMenuTrigger(options: UseContextMenuTriggerOptions) {
  const { openContextMenu, closeContextMenu } = useOrionContextMenu();
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchCoordsRef = useRef<{ startX: number; startY: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    touchCoordsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (options.disabled) return;
    
    // Check if target is inside an input, textarea, or contentEditable to protect normal browser behavior
    const target = e.target as HTMLElement | null;
    const isTextInput = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (target.getAttribute && target.getAttribute('contenteditable') === 'true')
    );
    if (isTextInput) {
      // Do not prevent default inside text inputs / textareas (Requirement 29)
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (options.onBeforeOpen) {
      options.onBeforeOpen();
    }

    const items = options.getItems();
    if (items.length === 0) return;

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: options.targetType,
      targetId: options.targetId,
      title: options.title,
      subtitle: options.subtitle,
      items,
    });
  }, [options, openContextMenu]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (options.disabled) return;
    if (e.touches.length !== 1) {
      clearTimer();
      return;
    }

    const touch = e.touches[0];
    touchCoordsRef.current = { startX: touch.clientX, startY: touch.clientY };

    touchTimerRef.current = setTimeout(() => {
      // Trigger context menu after 550ms motionless touch (Requirement 35 & 36)
      if (!touchCoordsRef.current) return;
      if (options.onBeforeOpen) {
        options.onBeforeOpen();
      }
      const items = options.getItems();
      if (items.length > 0) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(35);
        }
        openContextMenu({
          x: touchCoordsRef.current.startX,
          y: touchCoordsRef.current.startY,
          targetType: options.targetType,
          targetId: options.targetId,
          title: options.title,
          subtitle: options.subtitle,
          items,
        });
      }
      clearTimer();
    }, 550);
  }, [options, openContextMenu, clearTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchCoordsRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchCoordsRef.current.startX);
    const dy = Math.abs(touch.clientY - touchCoordsRef.current.startY);

    // If finger moves more than 10px, cancel long-press (user is scrolling)
    if (dx > 10 || dy > 10) {
      clearTimer();
    }
  }, [clearTimer]);

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleTouchCancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  return {
    onContextMenu: handleContextMenu,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}
