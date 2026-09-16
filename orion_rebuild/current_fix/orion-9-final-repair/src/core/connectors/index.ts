export interface ERPConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  syncProducts(): Promise<void>;
  syncPurchaseOrders(): Promise<void>;
}

export interface WMSConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  syncInventory(): Promise<void>;
  syncWarehouses(): Promise<void>;
}

export interface TMSConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  syncShipments(): Promise<void>;
  syncTransportation(): Promise<void>;
}

export interface SupplierConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  syncSuppliers(): Promise<void>;
  syncSupplierMetrics(): Promise<void>;
}

export interface EmailConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export interface DocumentConnector {
  connect(credentials: any): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): string;
  uploadDocument(file: any): Promise<string>;
  getDocument(id: string): Promise<any>;
}
