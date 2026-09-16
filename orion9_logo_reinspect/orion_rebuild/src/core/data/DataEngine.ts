import { 
  Product, Supplier, Warehouse, Inventory, 
  PurchaseOrder, Shipment, Exception, KPI 
} from '../types';
import * as demoData from '../../data';

export class DataEngine {
  private static instance: DataEngine;
  private useRealData = false;
  
  // Data cache
  private _products: Product[] = [];
  private _suppliers: Supplier[] = [];
  private _warehouses: Warehouse[] = [];
  private _inventory: Inventory[] = [];
  private _purchaseOrders: PurchaseOrder[] = [];
  private _shipments: Shipment[] = [];
  private _exceptions: Exception[] = [];

  private constructor() {
    this.resetToDemoData();
  }

  public static getInstance(): DataEngine {
    if (!DataEngine.instance) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance;
  }

  public setMode(mode: 'demo' | 'real') {
    this.useRealData = mode === 'real';
    if (!this.useRealData) {
      this.resetToDemoData();
    }
  }
  
  public resetToDemoData() {
    this._products = demoData.demoProducts as Product[];
    this._suppliers = demoData.demoSuppliers as Supplier[];
    this._warehouses = demoData.demoWarehouses as Warehouse[];
    this._inventory = demoData.demoInventory as Inventory[];
    this._purchaseOrders = demoData.demoPurchaseOrders as PurchaseOrder[];
    this._shipments = demoData.demoShipments as Shipment[];
    this._exceptions = demoData.demoExceptions as Exception[];
  }

  public setData(data: {
    products?: Product[],
    suppliers?: Supplier[],
    warehouses?: Warehouse[],
    inventory?: Inventory[],
    purchaseOrders?: PurchaseOrder[],
    shipments?: Shipment[],
    exceptions?: Exception[]
  }) {
    if (data.products) this._products = data.products;
    if (data.suppliers) this._suppliers = data.suppliers;
    if (data.warehouses) this._warehouses = data.warehouses;
    if (data.inventory) this._inventory = data.inventory;
    if (data.purchaseOrders) this._purchaseOrders = data.purchaseOrders;
    if (data.shipments) this._shipments = data.shipments;
    
    if (data.exceptions) {
      const unique = new Map<string, Exception>();
      data.exceptions.forEach(e => {
        if (!unique.has(e.id)) unique.set(e.id, e);
      });
      this._exceptions = Array.from(unique.values());
    }
  }

  public getProducts(): Product[] { return this._products; }
  public getProduct(id: string): Product | undefined { return this._products.find(p => p.id === id); }
  
  public getSuppliers(): Supplier[] { return this._suppliers; }
  public getSupplier(id: string): Supplier | undefined { return this._suppliers.find(s => s.id === id); }
  
  public getWarehouses(): Warehouse[] { return this._warehouses; }
  public getWarehouse(id: string): Warehouse | undefined { return this._warehouses.find(w => w.id === id); }
  
  public getInventory(): Inventory[] { return this._inventory; }
  public getInventoryByProduct(productId: string): Inventory[] { return this._inventory.filter(i => i.productId === productId); }
  public getInventoryByLocation(locationId: string): Inventory[] { return this._inventory.filter(i => i.warehouseId === locationId); }
  
  public getPurchaseOrders(): PurchaseOrder[] { return this._purchaseOrders; }
  public getPurchaseOrder(id: string): PurchaseOrder | undefined { return this._purchaseOrders.find(p => p.id === id); }
  
  public getShipments(): Shipment[] { return this._shipments; }
  public getShipment(id: string): Shipment | undefined { return this._shipments.find(s => s.id === id); }
  
  public getExceptions(): Exception[] { return this._exceptions; }
  
  public getKPIs(): KPI[] { return []; }
}

export const dataEngine = DataEngine.getInstance();
