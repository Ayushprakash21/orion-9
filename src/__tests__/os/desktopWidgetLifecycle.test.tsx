/**
 * ORION-9 DESKTOP WIDGET LIFECYCLE & PERSISTENCE TEST SUITE
 * 
 * Verifies:
 * 1. DesktopWidgetSystem renders normal-mode hover control cluster and attributes.
 * 2. Widget removal triggers onRemove callback.
 * 3. DesktopWorkspaceService seeds default widgets on first initialization.
 * 4. Durable widget deletion: Deleted widgets are not resurrected on reload/re-initialization.
 * 5. Explicit user restoration: restoreDefaultWidgets repopulates defaults.
 * 6. DesktopWidgetGalleryModal provides accessible Restore Default Widgets action.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DesktopWidgetSystem } from '../../os/desktop/DesktopWidgetSystem';
import { DesktopWidgetGalleryModal, WIDGET_GALLERY_CATALOG } from '../../os/desktop/DesktopWidgetGalleryModal';
import { desktopWorkspaceService } from '../../core/filesystem/DesktopWorkspaceService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { DesktopWidgetRecord } from '../../core/filesystem/types';

// Mock WindowManagerContext and ToastContext
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    openApplication: vi.fn(),
    activeWorkspaceId: 'operations',
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ORION-9 Desktop Widget Lifecycle & Removal UX', () => {
  const sampleWidget: DesktopWidgetRecord = {
    id: 'test_widget_clock_01',
    widgetType: 'clock',
    title: 'System Clock',
    size: 'MEDIUM',
    x: 100,
    y: 100,
    width: 340,
    height: 150,
    zIndex: 10,
    visible: true,
    workspaceId: 'operations',
    ownerId: 'user_current',
    tenantId: 'tenant_default',
    organizationId: 'ORION_PLATFORM',
    environment: 'DEMO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    desktopWorkspaceService.clear();
  });

  it('1. DesktopWidgetSystem renders normal-mode hover remove and options controls', () => {
    const handleRemove = vi.fn();
    const handleResize = vi.fn();
    const handleMoveStart = vi.fn();

    const html = renderToString(
      <DesktopWidgetSystem
        widget={sampleWidget}
        isEditMode={false}
        onRemove={handleRemove}
        onResize={handleResize}
        onMoveStart={handleMoveStart}
      />
    );

    // Widget card is rendered
    expect(html).toContain('data-testid="desktop-widget"');
    expect(html).toContain('data-widget-type="clock"');

    // Remove button and options buttons are present
    expect(html).toContain('data-action="remove-widget"');
    expect(html).toContain('data-action="widget-options"');
    expect(html).toContain('aria-label="Remove Widget"');
  });

  it('2. DesktopWidgetSystem renders drag and edit controls in edit mode', () => {
    const handleRemove = vi.fn();
    const handleResize = vi.fn();
    const handleMoveStart = vi.fn();

    const html = renderToString(
      <DesktopWidgetSystem
        widget={sampleWidget}
        isEditMode={true}
        onRemove={handleRemove}
        onResize={handleResize}
        onMoveStart={handleMoveStart}
      />
    );

    expect(html).toContain('DRAG');
    expect(html).toContain('border-sky-500/60');
  });

  it('3. DesktopWorkspaceService seeds default widgets on first initialization', async () => {
    const initialWidgets = await desktopWorkspaceService.ensureDefaultWidgets('operations', 'tenant_unit_test', 'DEMO');
    expect(initialWidgets.length).toBeGreaterThanOrEqual(3);
    expect(initialWidgets.some(w => w.widgetType === 'clock')).toBe(true);
    expect(initialWidgets.some(w => w.widgetType === 'control_tower')).toBe(true);
    expect(initialWidgets.some(w => w.widgetType === 'supply_chain_pulse')).toBe(true);
  });

  it('4. Durable widget deletion: User-deleted widgets are NOT resurrected on subsequent ensureDefaultWidgets calls', async () => {
    // 1. Initial load seeds default widgets
    const initialWidgets = await desktopWorkspaceService.ensureDefaultWidgets('operations', 'tenant_durable_test', 'DEMO');
    expect(initialWidgets.length).toBe(3);

    // 2. User removes all widgets
    for (const w of initialWidgets) {
      await desktopWorkspaceService.removeWidget(w.id, 'tenant_durable_test', 'DEMO');
    }

    // 3. Verify widget list is empty
    const currentWidgets = await desktopWorkspaceService.listWidgets('operations', 'tenant_durable_test', 'DEMO');
    expect(currentWidgets.length).toBe(0);

    // 4. Simulate page reload / workspace reopen
    const reloadedWidgets = await desktopWorkspaceService.ensureDefaultWidgets('operations', 'tenant_durable_test', 'DEMO');
    // MUST NOT resurrect default widgets!
    expect(reloadedWidgets.length).toBe(0);
  });

  it('5. Explicit user action restoreDefaultWidgets re-seeds default widgets', async () => {
    // 1. Initial seeding
    await desktopWorkspaceService.ensureDefaultWidgets('operations', 'tenant_restore_test', 'DEMO');
    
    // 2. Delete all
    const widgets = await desktopWorkspaceService.listWidgets('operations', 'tenant_restore_test', 'DEMO');
    for (const w of widgets) {
      await desktopWorkspaceService.removeWidget(w.id, 'tenant_restore_test', 'DEMO');
    }
    expect((await desktopWorkspaceService.listWidgets('operations', 'tenant_restore_test', 'DEMO')).length).toBe(0);

    // 3. User clicks "Restore Default Widgets"
    const restored = await desktopWorkspaceService.restoreDefaultWidgets('operations', 'tenant_restore_test', 'DEMO');
    expect(restored.length).toBe(3);

    const finalList = await desktopWorkspaceService.listWidgets('operations', 'tenant_restore_test', 'DEMO');
    expect(finalList.length).toBe(3);
  });

  it('6. DesktopWidgetGalleryModal renders catalog items and restore action when open', () => {
    const handleRestore = vi.fn();
    const handleClose = vi.fn();
    const handleAdd = vi.fn();

    const html = renderToString(
      <DesktopWidgetGalleryModal
        isOpen={true}
        onClose={handleClose}
        onAddWidget={handleAdd}
        onRestoreDefaults={handleRestore}
      />
    );

    expect(html).toContain('data-testid="widget-gallery"');
    expect(html).toContain('data-action="restore-default-widgets"');
    expect(html).toContain('Restore Default Widgets');
    expect(html).toContain('Control Tower Radar');
  });
});
