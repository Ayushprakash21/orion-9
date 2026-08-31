import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
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
    
    // Inventory
    if (h.includes('inventoryid') || (h.includes('sku') && (h.includes('currentstock') || h.includes('onhand')))) {
      return 'inventory';
    }
    // Shipments
    if (h.includes('shipmentid') || h.includes('shipmentnumber')) {
      return 'shipments';
    }
    // Purchase Orders
    if (h.includes('poid') || h.includes('ponumber')) {
      return 'purchaseOrders';
    }
    // Suppliers
    if (h.includes('supplierid') && h.includes('suppliername')) {
      return 'suppliers';
    }
    // Warehouses
    if (h.includes('warehouseid') && h.includes('warehousename')) {
      return 'warehouses';
    }
    // Products
    if ((h.includes('sku') || h.includes('productid')) && (h.includes('productname') || h.includes('category'))) {
      return 'products';
    }
    return 'unknown';
  }

  static getNormalizedValue(row: any, possibleKeys: string[]): any {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.toLowerCase().trim().replace(/[-_\s]+/g, '');
      if (possibleKeys.includes(normalizedKey)) {
        return row[key];
      }
    }
    return undefined;
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
        
        const unitCost = parseFloat(this.getNormalizedValue(row, ['unitcost', 'cost', 'price']) || 0);
        if (isNaN(unitCost) || unitCost < 0) throw new Error('Invalid Unit Cost');

        valid.push({
          id,
          name,
          category: this.getNormalizedValue(row, ['category']) || 'General',
          unitCost,
          leadTime: parseInt(this.getNormalizedValue(row, ['leadtimedays', 'leadtime']) || 14),
          safetyStock: parseFloat(this.getNormalizedValue(row, ['safetystock']) || 0),
          reorderPoint: parseFloat(this.getNormalizedValue(row, ['reorderpoint']) || 0),
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

        valid.push({
          id,
          name,
          location: this.getNormalizedValue(row, ['location', 'city', 'state', 'region', 'country']) || 'Unknown Location'
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }

  static normalizeInventory(data: any[]): { valid: Inventory[], errors: any[] } {
    const valid: Inventory[] = [];
    const errors: any[] = [];
    
    data.forEach((row, i) => {
      try {
        const productId = this.getNormalizedValue(row, ['sku', 'productid']);
        const warehouseId = this.getNormalizedValue(row, ['warehouseid', 'warehouse']) || 'WH-001';
        const onHand = parseFloat(this.getNormalizedValue(row, ['currentstock', 'qtyonhand', 'onhand']) || 0);
        const reserved = parseFloat(this.getNormalizedValue(row, ['reservedstock', 'reserved']) || 0);
        const safetyStock = parseFloat(this.getNormalizedValue(row, ['safetystock', 'safetyqty']) || 0);
        const averageDailyDemand = parseFloat(this.getNormalizedValue(row, ['averagedailydemand', 'dailydemand', 'demand']) || 1);
        const unitCost = parseFloat(this.getNormalizedValue(row, ['unitcost', 'cost']) || 0);
        
        if (!productId) throw new Error('Missing SKU');
        if (isNaN(onHand) || onHand < 0) throw new Error('Invalid Current Stock');
        
        const id = this.getNormalizedValue(row, ['inventoryid', 'id']) || `INV-${uuidv4().substring(0, 8)}`;

        valid.push({
          id,
          productId,
          warehouseId,
          onHand,
          reserved,
          safetyStock,
          reorderPoint: parseFloat(this.getNormalizedValue(row, ['reorderpoint']) || (averageDailyDemand * 7)),
          averageDailyDemand,
          unitCost,
          leadTime: parseInt(this.getNormalizedValue(row, ['leadtimedays', 'leadtime']) || 14)
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
        const otif = parseFloat(this.getNormalizedValue(row, ['otifpercent', 'otif']) || 90);
        const qualityRate = parseFloat(this.getNormalizedValue(row, ['qualitypercent', 'qualityrate', 'quality']) || 95);
        
        if (!id) throw new Error('Missing Supplier ID');
        if (!name) throw new Error('Missing Supplier Name');
        if (idSet.has(id)) throw new Error('Duplicate Supplier ID');
        idSet.add(id);

        valid.push({
          id,
          name,
          category: this.getNormalizedValue(row, ['category']) || 'General',
          region: this.getNormalizedValue(row, ['region', 'country']) || 'Global',
          otif,
          qualityRate,
          leadTime: parseInt(this.getNormalizedValue(row, ['leadtimedays', 'leadtime']) || 14),
          defectRate: parseFloat(this.getNormalizedValue(row, ['defectrate']) || 1),
          spend: parseFloat(this.getNormalizedValue(row, ['totalspend', 'spend']) || 0),
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
    
    // Group by PO Number
    const grouped = new Map<string, any[]>();
    data.forEach((row, i) => {
      const id = this.getNormalizedValue(row, ['poid', 'ponumber', 'id']);
      if (!id) {
        errors.push({ row: i + 1, data: row, error: 'Missing PO Number' });
        return;
      }
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id)?.push(row);
    });

    grouped.forEach((rows, id) => {
      try {
        const first = rows[0];
        const supplierId = this.getNormalizedValue(first, ['supplierid']);
        if (!supplierId) throw new Error(`Missing Supplier ID for PO ${id}`);

        const lines = rows.map(r => ({
          productId: this.getNormalizedValue(r, ['sku', 'productid']) || 'UNKNOWN',
          quantity: parseInt(this.getNormalizedValue(r, ['orderedquantity', 'quantity', 'qty']) || 1),
          receivedQuantity: parseInt(this.getNormalizedValue(r, ['receivedquantity']) || 0),
          unitPrice: parseFloat(this.getNormalizedValue(r, ['unitcost', 'unitprice', 'price']) || 0)
        }));
        
        const totalValue = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
        
        const statusStr = (this.getNormalizedValue(first, ['status']) || 'Open').toLowerCase();
        let status: PurchaseOrder['status'] = 'Submitted';
        if (statusStr.includes('draft')) status = 'Draft';
        if (statusStr.includes('open') || statusStr.includes('submitted')) status = 'Submitted';
        if (statusStr.includes('approved') || statusStr.includes('confirmed')) status = 'Approved';
        if (statusStr.includes('transit')) status = 'In Transit';
        if (statusStr.includes('partial')) status = 'Partially Received';
        if (statusStr.includes('received') || statusStr.includes('closed')) status = 'Received';
        if (statusStr.includes('delay')) status = 'Delayed';
        if (statusStr.includes('cancel')) status = 'Cancelled';
        if (statusStr.includes('overdue')) status = 'Overdue';

        valid.push({
          id,
          supplierId,
          orderDate: this.getNormalizedValue(first, ['orderdate']) || new Date().toISOString(),
          expectedDelivery: this.getNormalizedValue(first, ['requesteddeliverydate', 'expecteddeliverydate', 'expecteddelivery']) || new Date().toISOString(),
          actualDelivery: this.getNormalizedValue(first, ['actualdeliverydate', 'actualdelivery']) || undefined,
          status,
          totalValue,
          currency: this.getNormalizedValue(first, ['currency']) || 'USD',
          lines,
          buyer: this.getNormalizedValue(first, ['buyer']) || 'System'
        });
      } catch (e: any) {
        errors.push({ row: 'grouped', data: rows, error: e.message });
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
        const id = this.getNormalizedValue(row, ['shipmentid', 'shipmentnumber', 'id']);
        if (!id) throw new Error('Missing Shipment ID');
        if (idSet.has(id)) throw new Error('Duplicate Shipment ID');
        idSet.add(id);

        const expectedStr = this.getNormalizedValue(row, ['expecteddeliverydate', 'expecteddelivery', 'expectedarrival']);
        const actualStr = this.getNormalizedValue(row, ['actualdeliverydate', 'actualdelivery', 'actualarrival']);
        
        const expected = expectedStr ? new Date(expectedStr) : new Date();
        const actual = actualStr ? new Date(actualStr) : null;
        
        if (isNaN(expected.getTime())) throw new Error('Invalid Expected Delivery Date');
        if (actualStr && isNaN(actual!.getTime())) throw new Error('Invalid Actual Delivery Date');

        let delayDays = 0;
        const today = new Date();
        
        if (actual) {
          delayDays = Math.max(0, Math.floor((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
        } else if (today > expected) {
          delayDays = Math.floor((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        const statusStr = (this.getNormalizedValue(row, ['status']) || 'In Transit').toLowerCase();
        let status: Shipment['status'] = 'In Transit';
        if (statusStr.includes('book') || statusStr.includes('planned')) status = 'Planned';
        if (statusStr.includes('pick')) status = 'Picked Up';
        if (statusStr.includes('delay')) status = 'Delayed';
        if (statusStr.includes('deliver')) status = 'Delivered';
        if (statusStr.includes('cancel')) status = 'Cancelled';
        if (statusStr.includes('except')) status = 'Exception';

        valid.push({
          id,
          poId: this.getNormalizedValue(row, ['poid', 'ponumber']) || 'UNKNOWN',
          supplierId: this.getNormalizedValue(row, ['supplierid']),
          carrier: this.getNormalizedValue(row, ['carrier']) || 'Unknown Carrier',
          origin: this.getNormalizedValue(row, ['origin']) || 'Unknown',
          destination: this.getNormalizedValue(row, ['destination']) || 'Unknown',
          warehouseId: this.getNormalizedValue(row, ['warehouseid']),
          shipDate: this.getNormalizedValue(row, ['shipdate']) || new Date().toISOString(),
          expectedArrival: expected.toISOString(),
          actualArrival: actual ? actual.toISOString() : null,
          status: delayDays > 0 && status !== 'Delivered' ? 'Delayed' : status,
          delayDays,
          freightCost: parseFloat(this.getNormalizedValue(row, ['freightcost']) || 0),
          trackingNumber: this.getNormalizedValue(row, ['trackingnumber'])
        });
      } catch (e: any) {
        errors.push({ row: i + 1, data: row, error: e.message });
      }
    });
    return { valid, errors };
  }
}
