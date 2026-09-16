import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment } from '../types';

export class DataImporter {
  static async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (error: any) => {
            reject(error);
          }
        });
      } else if (file.name.match(/\.xlsx?$/)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);
          resolve(json);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please upload CSV or Excel.'));
      }
    });
  }

  static detectEntityType(headers: string[]): string {
    const h = headers.map(x => x.toLowerCase().trim().replace(/[-_\s]+/g, ''));
    if (h.includes('inventoryid') || (h.includes('sku') && (h.includes('currentstock') || h.includes('onhand')))) return 'inventory';
    if (h.includes('shipmentid') || h.includes('shipmentnumber')) return 'shipments';
    if (h.includes('poid') || h.includes('ponumber')) return 'purchaseOrders';
    if (h.includes('supplierid') || h.includes('suppliername')) return 'suppliers';
    if (h.includes('warehouseid') && h.includes('location')) return 'warehouses';
    if ((h.includes('sku') || h.includes('productid')) && (h.includes('productname') || h.includes('category'))) return 'products';
    return 'unknown';
  }

  static getNormalizedValue(row: any, possibleKeys: string[]): any {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.toLowerCase().trim().replace(/[-_\s]+/g, '');
      if (possibleKeys.includes(normalizedKey)) return row[key];
    }
    return undefined;
  }
  
  static parseNum(val: any, min = 0, max = Infinity, isInt = false, allowEmpty = true): number | undefined {
    if (val === undefined || val === null || val === '') return allowEmpty ? undefined : min;
    const n = isInt ? parseInt(val) : parseFloat(val);
    if (isNaN(n) || n < min || n > max) throw new Error(`Invalid number: ${val} (must be between ${min} and ${max})`);
    return n;
  }
  
  static parseDate(val: any): string | undefined {
    if (!val) return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) throw new Error(`Invalid date: ${val}`);
    return d.toISOString();
  }

  static normalizeProducts(data: any[]): { valid: Product[], errors: any[] } {
    const valid: Product[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();

    data.forEach((row, i) => {
      try {
        const id = this.getNormalizedValue(row, ['sku', 'productid', 'id']);
        const name = this.getNormalizedValue(row, ['productname', 'name']);
        
        if (!id) throw new Error('Missing SKU or Product ID');
        if (!name) throw new Error('Missing Product Name');
        if (idSet.has(id)) throw new Error('Duplicate SKU');
        idSet.add(id);
        
        valid.push({
          id,
          name,
          category: this.getNormalizedValue(row, ['category']) || 'General',
          unitCost: this.parseNum(this.getNormalizedValue(row, ['unitcost', 'cost', 'price']), 0, Infinity, false, false),
          leadTime: this.parseNum(this.getNormalizedValue(row, ['leadtimedays', 'leadtime']), 0, 365, true, false) || 14,
          safetyStock: this.parseNum(this.getNormalizedValue(row, ['safetystock']), 0, Infinity, false, false),
          reorderPoint: this.parseNum(this.getNormalizedValue(row, ['reorderpoint']), 0, Infinity, false, false),
          supplierId: this.getNormalizedValue(row, ['supplierid', 'supplier']),
          status: this.getNormalizedValue(row, ['status']) || 'Active',
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }

  static normalizeWarehouses(data: any[]): { valid: Warehouse[], errors: any[] } {
    const valid: Warehouse[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();
    data.forEach((row, i) => {
      try {
        const id = this.getNormalizedValue(row, ['warehouseid', 'id']);
        const name = this.getNormalizedValue(row, ['warehousename', 'name']);
        if (!id) throw new Error('Missing Warehouse ID');
        if (!name) throw new Error('Missing Warehouse Name');
        if (idSet.has(id)) throw new Error('Duplicate Warehouse ID');
        idSet.add(id);
        valid.push({ id, name, location: this.getNormalizedValue(row, ['location', 'city', 'region']) || 'Unknown' });
      } catch (e: any) { errors.push({ row: i + 1, data: row, error: e.message }); }
    });
    return { valid, errors };
  }

  static normalizeInventory(data: any[]): { valid: Inventory[], errors: any[] } {
    const valid: Inventory[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();

    data.forEach((row, i) => {
      try {
        const productId = this.getNormalizedValue(row, ['sku', 'productid']);
        const warehouseId = this.getNormalizedValue(row, ['warehouseid', 'warehouse']);
        if (!productId) throw new Error('Missing SKU');
        if (!warehouseId) throw new Error('Missing Warehouse ID');
        
        const id = this.getNormalizedValue(row, ['inventoryid', 'id']) || `INV-${productId}-${warehouseId}`;
        if (idSet.has(id)) throw new Error('Duplicate Inventory Record');
        idSet.add(id);

        valid.push({
          id,
          productId,
          warehouseId,
          onHand: this.parseNum(this.getNormalizedValue(row, ['currentstock', 'onhand', 'stock']), 0, Infinity, false, false) || 0,
          reserved: this.parseNum(this.getNormalizedValue(row, ['reservedstock', 'reserved']), 0, Infinity, false, false) || 0,
          inTransit: this.parseNum(this.getNormalizedValue(row, ['intransit']), 0, Infinity, false, true) || 0,
          safetyStock: this.parseNum(this.getNormalizedValue(row, ['safetystock']), 0, Infinity, false, false) || 0,
          reorderPoint: this.parseNum(this.getNormalizedValue(row, ['reorderpoint']), 0, Infinity, false, false) || 0,
          averageDailyDemand: this.parseNum(this.getNormalizedValue(row, ['averagedailydemand', 'dailydemand']), 0, Infinity, false, false) || 0,
          unitCost: this.parseNum(this.getNormalizedValue(row, ['unitcost', 'cost']), 0, Infinity, false, false) || 0,
          leadTime: this.parseNum(this.getNormalizedValue(row, ['leadtime', 'leadtimedays']), 0, 365, true, false) || 0,
          lastUpdated: new Date().toISOString()
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }

  static normalizeSuppliers(data: any[]): { valid: Supplier[], errors: any[] } {
    const valid: Supplier[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();

    data.forEach((row, i) => {
      try {
        const id = this.getNormalizedValue(row, ['supplierid', 'id']);
        const name = this.getNormalizedValue(row, ['suppliername', 'name']);
        if (!id) throw new Error('Missing Supplier ID');
        if (!name) throw new Error('Missing Supplier Name');
        if (idSet.has(id)) throw new Error('Duplicate Supplier ID');
        idSet.add(id);

        valid.push({
          id,
          name,
          category: this.getNormalizedValue(row, ['category']) || 'General',
          region: this.getNormalizedValue(row, ['region', 'location']) || 'Unknown',
          otif: this.parseNum(this.getNormalizedValue(row, ['otif']), 0, 100, false, false) || 0,
          qualityRate: this.parseNum(this.getNormalizedValue(row, ['qualityrate', 'quality']), 0, 100, false, false) || 0,
          leadTime: this.parseNum(this.getNormalizedValue(row, ['leadtime']), 0, 365, true, false) || 0,
          defectRate: this.parseNum(this.getNormalizedValue(row, ['defectrate']), 0, 100, false, false) || 0,
          spend: this.parseNum(this.getNormalizedValue(row, ['spend', 'totalspend']), 0, Infinity, false, false) || 0,
          status: this.getNormalizedValue(row, ['status']) || 'Active',
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }

  static normalizePurchaseOrders(data: any[]): { valid: PurchaseOrder[], errors: any[] } {
    const valid: PurchaseOrder[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();

    const poGroups = new Map<string, any[]>();
    data.forEach(row => {
      const id = this.getNormalizedValue(row, ['poid', 'ponumber']);
      if (id) {
        if (!poGroups.has(id)) poGroups.set(id, []);
        poGroups.get(id)!.push(row);
      }
    });

    Array.from(poGroups.entries()).forEach(([id, rows], i) => {
      try {
        if (idSet.has(id)) throw new Error('Duplicate PO ID');
        idSet.add(id);
        const r = rows[0];
        
        const supplierId = this.getNormalizedValue(r, ['supplierid', 'supplier']);
        if (!supplierId) throw new Error('Missing Supplier ID');
        
        const lines = rows.map(r => {
           const productId = this.getNormalizedValue(r, ['sku', 'productid']);
           if (!productId) throw new Error('Missing SKU in PO line');
           return {
             productId,
             quantity: this.parseNum(this.getNormalizedValue(r, ['quantity', 'qty']), 0, Infinity, false, false) || 0,
             receivedQuantity: this.parseNum(this.getNormalizedValue(r, ['receivedquantity', 'receivedqty']), 0, Infinity, false, true) || 0,
             unitPrice: this.parseNum(this.getNormalizedValue(r, ['unitprice', 'price']), 0, Infinity, false, false) || 0,
           };
        });

        valid.push({
          id,
          supplierId,
          orderDate: this.parseDate(this.getNormalizedValue(r, ['orderdate', 'date'])) || new Date().toISOString(),
          expectedDelivery: this.parseDate(this.getNormalizedValue(r, ['expecteddelivery', 'deliverydate'])) || new Date().toISOString(),
          status: this.getNormalizedValue(r, ['status']) || 'Draft',
          totalValue: lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0),
          lines,
          buyer: this.getNormalizedValue(r, ['buyer', 'purchaser']) || 'System',
        });
      } catch (e: any) {
        rows.forEach(r => errors.push({ row: `PO: ${id}`, data: r, error: e.message }));
      }
    });
    return { valid, errors };
  }

  static normalizeShipments(data: any[]): { valid: Shipment[], errors: any[] } {
    const valid: Shipment[] = [];
    const errors: any[] = [];
    const idSet = new Set<string>();

    data.forEach((row, i) => {
      try {
        const id = this.getNormalizedValue(row, ['shipmentid', 'shipmentnumber']);
        if (!id) throw new Error('Missing Shipment ID');
        if (idSet.has(id)) throw new Error('Duplicate Shipment ID');
        idSet.add(id);
        
        const poId = this.getNormalizedValue(row, ['poid', 'ponumber']);
        if (!poId) throw new Error('Missing PO ID');

        valid.push({
          id,
          poId,
          supplierId: this.getNormalizedValue(row, ['supplierid']),
          carrier: this.getNormalizedValue(row, ['carrier']) || 'Unknown',
          origin: this.getNormalizedValue(row, ['origin']) || 'Unknown',
          destination: this.getNormalizedValue(row, ['destination', 'warehouseid']) || 'Unknown',
          shipDate: this.parseDate(this.getNormalizedValue(row, ['shipdate'])) || new Date().toISOString(),
          expectedArrival: this.parseDate(this.getNormalizedValue(row, ['expectedarrival', 'eta'])) || new Date().toISOString(),
          actualArrival: this.parseDate(this.getNormalizedValue(row, ['actualarrival'])),
          status: this.getNormalizedValue(row, ['status']) || 'Planned',
          delayDays: this.parseNum(this.getNormalizedValue(row, ['delaydays', 'delay']), 0, Infinity, true, true) || 0,
          freightCost: this.parseNum(this.getNormalizedValue(row, ['freightcost', 'cost']), 0, Infinity, false, true) || 0,
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }
}
