import React, { useCallback } from 'react';
import { useOrionContextMenu, ContextMenuItem } from './OrionContextMenuContext';
import { useEntityDrawer, EntityType } from '../../store/EntityDrawerContext';
import { useWindowManager } from '../WindowManagerContext';
import { useToast } from '../../store/ToastContext';
import { 
  FileText, 
  Copy, 
  ExternalLink, 
  Truck, 
  Package, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Share2,
  BrainCircuit,
  Boxes
} from 'lucide-react';

export function useEntityContextMenu() {
  const { openContextMenu, copyToClipboardWithToast } = useOrionContextMenu();
  const { openEntity } = useEntityDrawer();
  const { openApplication } = useWindowManager();
  const { showToast } = useToast();

  /**
   * INVENTORY / SKU CONTEXT MENU (Requirement 18 & 20)
   */
  const openInventoryContextMenu = useCallback((
    e: React.MouseEvent | { clientX: number; clientY: number },
    item: { productId: string; product?: { name?: string }; warehouse?: { name?: string; id?: string }; available?: number; value?: number; status?: string }
  ) => {
    if ('preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const items: ContextMenuItem[] = [
      {
        id: 'inv-open',
        label: 'Open Inventory Record',
        icon: Boxes,
        action: () => openEntity('inventory', item.productId),
      },
      {
        id: 'inv-copy-sku',
        label: 'Copy SKU Identifier',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => copyToClipboardWithToast(item.productId, 'SKU ID'),
      },
      {
        id: 'inv-sep-1',
        label: '',
        separator: true,
      },
      {
        id: 'inv-open-shipments',
        label: 'View Inbound Logistics',
        icon: Truck,
        action: () => openApplication('shipments'),
      },
      {
        id: 'inv-open-procurement',
        label: 'View Purchase Orders',
        icon: FileText,
        action: () => openApplication('procurement'),
      },
      {
        id: 'inv-sep-2',
        label: '',
        separator: true,
      },
      {
        id: 'inv-refresh',
        label: 'Refresh SKU Telemetry',
        icon: RefreshCw,
        action: () => {
          showToast(`Telemetry updated for ${item.productId}`, 'info', 'Inventory');
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'entity',
      targetId: item.productId,
      title: item.productId,
      subtitle: item.product?.name || 'Inventory SKU',
      items,
    });
  }, [openContextMenu, openEntity, openApplication, copyToClipboardWithToast, showToast]);

  /**
   * SHIPMENT CONTEXT MENU (Requirement 18 & 20)
   */
  const openShipmentContextMenu = useCallback((
    e: React.MouseEvent | { clientX: number; clientY: number },
    item: { id: string; carrier?: string; poId?: string; origin?: string; destination?: string; status?: string }
  ) => {
    if ('preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const items: ContextMenuItem[] = [
      {
        id: 'shp-open',
        label: 'Open Shipment Details',
        icon: Truck,
        action: () => openEntity('shipment', item.id),
      },
      {
        id: 'shp-copy-id',
        label: 'Copy Shipment ID',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => copyToClipboardWithToast(item.id, 'Shipment ID'),
      },
      ...(item.poId ? [
        {
          id: 'shp-open-po',
          label: `Open PO (${item.poId})`,
          icon: FileText,
          action: () => openEntity('po', item.poId!),
        },
      ] : []),
      {
        id: 'shp-sep-1',
        label: '',
        separator: true,
      },
      {
        id: 'shp-open-inbound',
        label: 'Open Inbound Terminal',
        icon: Package,
        action: () => openApplication('inbound'),
      },
      {
        id: 'shp-open-radar',
        label: 'View in Risk Radar',
        icon: AlertTriangle,
        action: () => openApplication('risk-radar'),
      },
      {
        id: 'shp-sep-2',
        label: '',
        separator: true,
      },
      {
        id: 'shp-refresh',
        label: 'Refresh Carrier GPS Telemetry',
        icon: RefreshCw,
        action: () => {
          showToast(`Carrier telemetry synchronized for ${item.id}`, 'info', 'Logistics');
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'entity',
      targetId: item.id,
      title: item.id,
      subtitle: `${item.carrier || 'Logistics'} • ${item.status || 'In Transit'}`,
      items,
    });
  }, [openContextMenu, openEntity, openApplication, copyToClipboardWithToast, showToast]);

  /**
   * SUPPLIER CONTEXT MENU (Requirement 18 & 20)
   */
  const openSupplierContextMenu = useCallback((
    e: React.MouseEvent | { clientX: number; clientY: number },
    item: { id: string; name?: string; category?: string; status?: string }
  ) => {
    if ('preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const items: ContextMenuItem[] = [
      {
        id: 'sup-open',
        label: 'Open Supplier Profile',
        icon: Building2,
        action: () => openEntity('supplier', item.id),
      },
      {
        id: 'sup-copy-id',
        label: 'Copy Supplier ID',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => copyToClipboardWithToast(item.id, 'Supplier ID'),
      },
      {
        id: 'sup-sep-1',
        label: '',
        separator: true,
      },
      {
        id: 'sup-open-procurement',
        label: 'Open Procurement Orders',
        icon: FileText,
        action: () => openApplication('procurement'),
      },
      {
        id: 'sup-open-comms',
        label: 'Supplier Communications',
        icon: Share2,
        action: () => openApplication('supplier-communication'),
      },
      {
        id: 'sup-sep-2',
        label: '',
        separator: true,
      },
      {
        id: 'sup-refresh',
        label: 'Refresh Vendor Scorecard',
        icon: RefreshCw,
        action: () => {
          showToast(`Vendor scorecard updated for ${item.name || item.id}`, 'info', 'Suppliers');
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'entity',
      targetId: item.id,
      title: item.name || item.id,
      subtitle: `Supplier ID: ${item.id}`,
      items,
    });
  }, [openContextMenu, openEntity, openApplication, copyToClipboardWithToast, showToast]);

  /**
   * EXCEPTION CONTEXT MENU (Requirement 18 & 20)
   */
  const openExceptionContextMenu = useCallback((
    e: React.MouseEvent | { clientX: number; clientY: number },
    item: { id: string; title?: string; entityType?: string; entityId?: string; severity?: string; status?: string }
  ) => {
    if ('preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const items: ContextMenuItem[] = [
      {
        id: 'exc-open',
        label: 'Open Exception Investigation',
        icon: AlertTriangle,
        action: () => openEntity('exception', item.id),
      },
      {
        id: 'exc-copy-id',
        label: 'Copy Exception ID',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => copyToClipboardWithToast(item.id, 'Exception ID'),
      },
      ...(item.entityId && item.entityType ? [
        {
          id: 'exc-open-target',
          label: `Open Target Entity (${item.entityId})`,
          icon: ExternalLink,
          action: () => openEntity(item.entityType as EntityType, item.entityId!),
        },
      ] : []),
      {
        id: 'exc-sep-1',
        label: '',
        separator: true,
      },
      {
        id: 'exc-open-decision',
        label: 'Open Decision Center',
        icon: BrainCircuit,
        action: () => openApplication('decisions'),
      },
      {
        id: 'exc-open-action',
        label: 'Open Action Center',
        icon: CheckCircle2,
        action: () => openApplication('action-center'),
      },
      {
        id: 'exc-sep-2',
        label: '',
        separator: true,
      },
      {
        id: 'exc-refresh',
        label: 'Refresh Real-time Telemetry',
        icon: RefreshCw,
        action: () => {
          showToast(`Exception diagnostics refreshed for ${item.id}`, 'info', 'Exceptions');
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'entity',
      targetId: item.id,
      title: item.id,
      subtitle: item.title || `${item.severity || 'System'} Exception`,
      items,
    });
  }, [openContextMenu, openEntity, openApplication, copyToClipboardWithToast, showToast]);

  /**
   * PURCHASE ORDER CONTEXT MENU (Requirement 18 & 20)
   */
  const openPurchaseOrderContextMenu = useCallback((
    e: React.MouseEvent | { clientX: number; clientY: number },
    item: { id: string; supplierId?: string; status?: string; totalAmount?: number }
  ) => {
    if ('preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const items: ContextMenuItem[] = [
      {
        id: 'po-open',
        label: 'Open Purchase Order',
        icon: FileText,
        action: () => openEntity('po', item.id),
      },
      {
        id: 'po-copy-id',
        label: 'Copy PO Number',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => copyToClipboardWithToast(item.id, 'PO Number'),
      },
      ...(item.supplierId ? [
        {
          id: 'po-open-supplier',
          label: `Open Supplier (${item.supplierId})`,
          icon: Building2,
          action: () => openEntity('supplier', item.supplierId!),
        },
      ] : []),
      {
        id: 'po-sep-1',
        label: '',
        separator: true,
      },
      {
        id: 'po-open-procurement',
        label: 'Open Procurement Application',
        icon: Package,
        action: () => openApplication('procurement'),
      },
      {
        id: 'po-refresh',
        label: 'Refresh PO Status',
        icon: RefreshCw,
        action: () => {
          showToast(`PO status synchronized for ${item.id}`, 'info', 'Procurement');
        },
      },
    ];

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'entity',
      targetId: item.id,
      title: item.id,
      subtitle: `Purchase Order • ${item.status || 'Active'}`,
      items,
    });
  }, [openContextMenu, openEntity, openApplication, copyToClipboardWithToast, showToast]);

  return {
    openInventoryContextMenu,
    openShipmentContextMenu,
    openSupplierContextMenu,
    openExceptionContextMenu,
    openPurchaseOrderContextMenu,
  };
}
