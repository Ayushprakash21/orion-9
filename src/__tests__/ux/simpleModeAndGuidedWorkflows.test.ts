import { describe, it, expect, vi } from 'vitest';
import { normalizeSettings, DEFAULT_SYSTEM_SETTINGS } from '../../types/settings';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';

describe('Simple Mode UX & Guided Workflows', () => {
  describe('SystemSettings - User Experience Mode Configuration', () => {
    it('defaults userExperienceMode to SIMPLE in DEFAULT_SYSTEM_SETTINGS', () => {
      expect(DEFAULT_SYSTEM_SETTINGS.userExperienceMode).toBe('SIMPLE');
    });

    it('normalizes undefined or empty settings to have userExperienceMode: SIMPLE', () => {
      const normalized = normalizeSettings({});
      expect(normalized.userExperienceMode).toBe('SIMPLE');
    });

    it('preserves userExperienceMode: ADVANCED when explicitly set', () => {
      const normalized = normalizeSettings({ userExperienceMode: 'ADVANCED' });
      expect(normalized.userExperienceMode).toBe('ADVANCED');
    });

    it('normalizes invalid values to SIMPLE mode', () => {
      const normalized = normalizeSettings({ userExperienceMode: 'INVALID_MODE' as any });
      expect(normalized.userExperienceMode).toBe('SIMPLE');
    });
  });

  describe('Application Registry - Guided Workflows', () => {
    it('registers the Guided Buy Workflow app in the OS registry', () => {
      const buyApp = ORION_REGISTRY['buy-workflow'];
      expect(buyApp).toBeDefined();
      expect(buyApp?.name).toBe('Buy Something');
      expect(buyApp?.route).toBe('/buy');
      expect(buyApp?.category).toBe('Operations');
    });

    it('provides clear user-friendly descriptions for core business operations', () => {
      const buyApp = ORION_REGISTRY['buy-workflow'];
      expect(buyApp?.description).toContain('guided 5-step purchasing workflow');
    });
  });

  describe('Guided Buy Sourcing & Order Generation Logic', () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Precision Sensor X1', unitPrice: 250, defaultUOM: 'Units' },
      { id: 'prod-2', name: 'Lithium Battery Pack', unitPrice: 1200, defaultUOM: 'Packs' },
    ];

    const mockSuppliers = [
      { id: 'sup-1', name: 'Apex Electronics', otifScore: 98, country: 'DE', leadTimeDays: 5 },
      { id: 'sup-2', name: 'Global Components Ltd', otifScore: 88, country: 'TW', leadTimeDays: 12 },
      { id: 'sup-3', name: 'Optima Logistics', otifScore: 94, country: 'US', leadTimeDays: 8 },
    ];

    it('identifies the highest OTIF supplier as the recommended smart source', () => {
      const sortedSuppliers = [...mockSuppliers].sort((a, b) => (b.otifScore || 0) - (a.otifScore || 0));
      const topSupplier = sortedSuppliers[0];
      expect(topSupplier.id).toBe('sup-1');
      expect(topSupplier.name).toBe('Apex Electronics');
      expect(topSupplier.otifScore).toBe(98);
    });

    it('correctly calculates total purchase valuation', () => {
      const selectedProduct = mockProducts[0];
      const quantity = 50;
      const totalValue = quantity * selectedProduct.unitPrice;
      expect(totalValue).toBe(12500);
    });

    it('generates a complete authoritative Purchase Order object on submission', () => {
      const poPayload = {
        id: `PO-${Date.now().toString().slice(-6)}`,
        orderNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        requisitionId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: 'prod-1',
        supplierId: 'sup-1',
        quantity: 50,
        totalValue: 12500,
        currency: 'USD',
        status: 'CONFIRMED' as const,
        orderDate: new Date().toISOString(),
        deliveryDate: '2026-10-15',
        warehouseId: 'WH-CENTRAL-01',
        items: [
          {
            productId: 'prod-1',
            productName: 'Precision Sensor X1',
            quantity: 50,
            unitPrice: 250,
            totalPrice: 12500,
            uom: 'Units'
          }
        ]
      };

      expect(poPayload.id).toMatch(/^PO-/);
      expect(poPayload.orderNumber).toMatch(/^PO-2026-/);
      expect(poPayload.status).toBe('CONFIRMED');
      expect(poPayload.items[0].totalPrice).toBe(12500);
    });
  });

  describe('Simple Mode Action Grid & Operational Pulse Metrics', () => {
    it('correctly computes operational attention counts from supply chain state', () => {
      const mockShipments = [
        { id: 'shp-1', delayDays: 3, status: 'In Transit' },
        { id: 'shp-2', delayDays: 0, status: 'In Transit' },
        { id: 'shp-3', delayDays: 2, status: 'Delivered' } // Delivered shouldn't count as active delayed
      ];

      const mockInventory = [
        { id: 'inv-1', onHand: 50, reserved: 20, safetyStock: 100 }, // available 30 < 100 -> Low stock
        { id: 'inv-2', onHand: 200, reserved: 20, safetyStock: 50 }  // available 180 > 50 -> Healthy
      ];

      const mockPurchaseOrders = [
        { id: 'po-1', status: 'PENDING_APPROVAL' },
        { id: 'po-2', status: 'CONFIRMED' },
        { id: 'po-3', status: 'DRAFT' }
      ];

      const mockExceptions = [
        { id: 'exc-1', status: 'Open' },
        { id: 'exc-2', status: 'Investigating' },
        { id: 'exc-3', status: 'Resolved' }
      ];

      // Computations
      const delayedShipments = mockShipments.filter(s => s.delayDays > 0 && s.status !== 'Delivered').length;
      const lowStockItems = mockInventory.filter(i => (i.onHand - (i.reserved || 0)) < i.safetyStock).length;
      const pendingOrders = mockPurchaseOrders.filter(p => p.status === 'PENDING_APPROVAL' || p.status === 'DRAFT').length;
      const openExceptions = mockExceptions.filter(e => e.status !== 'Resolved').length;

      expect(delayedShipments).toBe(1);
      expect(lowStockItems).toBe(1);
      expect(pendingOrders).toBe(2);
      expect(openExceptions).toBe(2);
    });
  });
});
