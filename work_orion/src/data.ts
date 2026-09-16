import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from './types';
import { subDays, addDays, format } from 'date-fns';

const today = new Date();


// Deterministic random number generator
let seed = 12345;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

export const demoProducts: Product[] = Array.from({ length: 120 }).map((_, i) => ({
  id: `SKU-${1000 + i}`,
  name: `Component ${String.fromCharCode(65 + (i % 26))}-${Math.floor(i / 26) + 1} (${['Electronics', 'Plastics', 'Metals', 'Packaging'][i % 4]})`,
  category: ['Electronics', 'Plastics', 'Metals', 'Packaging'][i % 4],
}));

export const demoWarehouses: Warehouse[] = [
  { id: 'WH-001', name: 'Central Warehouse', location: 'Mumbai' },
  { id: 'WH-002', name: 'North Distribution Center', location: 'Delhi' },
  { id: 'WH-003', name: 'South Distribution Center', location: 'Bengaluru' },
  { id: 'WH-004', name: 'East Distribution Center', location: 'Kolkata' },
  { id: 'WH-005', name: 'West Distribution Center', location: 'Ahmedabad' },
];

export const demoSuppliers: Supplier[] = Array.from({ length: 25 }).map((_, i) => {
  const isHighRisk = i % 5 === 0;
  return {
    id: `SUP-${String(i + 1).padStart(3, '0')}`,
    name: `Supplier ${String.fromCharCode(65 + i)} ${['Tech', 'Materials', 'Logistics'][i % 3]} Ltd.`,
    category: ['Electronics', 'Plastics', 'Metals', 'Packaging'][i % 4],
    region: ['APAC', 'EMEA', 'AMER'][i % 3],
    otif: isHighRisk ? 70 + random() * 15 : 90 + random() * 8,
    qualityRate: isHighRisk ? 85 + random() * 10 : 96 + random() * 4,
    leadTime: 7 + (i % 3) * 7,
    defectRate: isHighRisk ? random() * 5 + 2 : random() * 1.5,
    spend: 100000 + random() * 900000,
  };
});

export const demoInventory: Inventory[] = demoProducts.map((p, i) => {
  const isCritical = i % 15 === 0;
  const isExcess = i % 20 === 1;
  const avgDemand = 10 + Math.floor(random() * 50);
  let onHand = avgDemand * (20 + random() * 20); // Healthy: 20-40 days
  if (isCritical) {
    onHand = avgDemand * (random() * 5); // 0-5 days
  } else if (isExcess) {
    onHand = avgDemand * (60 + random() * 40); // 60-100 days
  }
  
  return {
    id: `INV-${1000 + i}`,
    productId: p.id,
    warehouseId: demoWarehouses[i % 5].id,
    onHand: Math.floor(onHand),
    reserved: Math.floor(onHand * 0.1),
    safetyStock: avgDemand * 10,
    reorderPoint: avgDemand * 15,
    averageDailyDemand: avgDemand,
    unitCost: 100 + random() * 900,
    leadTime: 14 + (i % 10),
  };
});

export const demoPurchaseOrders: PurchaseOrder[] = Array.from({ length: 150 }).map((_, i) => {
  const isDelayed = i % 10 === 0;
  const statusList: PurchaseOrder['status'][] = ['Approved', 'In Transit', 'Partially Received', 'Received', 'Delayed'];
  const status = isDelayed ? 'Delayed' : statusList[Math.floor(random() * statusList.length)];
  const orderDate = subDays(today, 5 + Math.floor(random() * 40));
  
  const lineCount = 1 + Math.floor(random() * 3);
  const lines = Array.from({ length: lineCount }).map((_, j) => {
    const qty = 100 + Math.floor(random() * 900);
    return {
      productId: demoProducts[(i + j) % demoProducts.length].id,
      quantity: qty,
      receivedQuantity: status === 'Received' ? qty : (status === 'Partially Received' ? Math.floor(qty * 0.5) : 0),
      unitPrice: 100 + random() * 900,
    };
  });

  return {
    id: `PO-2026-${String(i + 1).padStart(4, '0')}`,
    supplierId: demoSuppliers[i % demoSuppliers.length].id,
    orderDate: orderDate.toISOString(),
    expectedDelivery: addDays(orderDate, 14).toISOString(),
    status,
    totalValue: lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0),
    lines,
    buyer: 'John Doe',
  };
});

export const demoShipments: Shipment[] = demoPurchaseOrders.slice(0, 100).map((po, i) => {
  const isDelayed = po.status === 'Delayed';
  const delayDays = isDelayed ? 2 + Math.floor(random() * 10) : 0;
  
  const shipmentStatuses: Shipment['status'][] = ['Planned', 'Picked Up', 'In Transit', 'Delivered'];
  let status: Shipment['status'] = isDelayed ? 'Delayed' : shipmentStatuses[Math.floor(random() * shipmentStatuses.length)];
  if (po.status === 'Received') status = 'Delivered';

  return {
    id: `SHP-2026-${String(i + 1).padStart(4, '0')}`,
    poId: po.id,
    carrier: ['FedEx', 'DHL', 'UPS', 'Maersk', 'Local Freight'][i % 5],
    origin: demoSuppliers.find(s => s.id === po.supplierId)?.region || 'Unknown',
    destination: demoWarehouses[i % demoWarehouses.length].name,
    shipDate: addDays(new Date(po.orderDate), 2).toISOString(),
    expectedArrival: po.expectedDelivery,
    actualArrival: status === 'Delivered' ? addDays(new Date(po.expectedDelivery), delayDays).toISOString() : null,
    status,
    delayDays,
    freightCost: 5000 + random() * 20000,
  };
});

export const demoExceptions: Exception[] = [
  ...demoProducts.filter((_, i) => i % 15 === 0).map((p, i): Exception => ({
    id: `EXC-SKU-${i}`,
    date: subDays(today, Math.floor(random() * 5)).toISOString(),
    type: 'Stock-Out Risk',
    severity: 'Critical',
    entityId: p.id,
    description: `Inventory for ${p.id} has fallen critically below safety stock levels.`,
    estimatedImpact: 25000 + random() * 50000,
    status: 'Open',
    owner: 'Jane Smith',
    recommendedAction: 'Expedite open purchase orders and review alternative suppliers.',
  })),
  ...demoSuppliers.filter((_, i) => i % 5 === 0).map((s, i): Exception => ({
    id: `EXC-SUP-${i}`,
    date: subDays(today, 1 + Math.floor(random() * 10)).toISOString(),
    type: 'Supplier Delay',
    severity: 'High',
    entityId: s.id,
    description: `Supplier ${s.name} OTIF has dropped below 75% over the last 30 days.`,
    estimatedImpact: 100000 + random() * 200000,
    status: 'Investigating',
    owner: 'John Doe',
    recommendedAction: 'Schedule an immediate review meeting with supplier account manager.',
  })),
  ...demoShipments.filter(s => s.delayDays > 5).map((s, i): Exception => ({
    id: `EXC-SHP-${i}`,
    date: subDays(today, 1).toISOString(),
    type: 'Shipment Delay',
    severity: 'Medium',
    entityId: s.id,
    description: `Shipment ${s.id} is delayed by ${s.delayDays} days at customs.`,
    estimatedImpact: 5000 + random() * 15000,
    status: 'Action Required',
    owner: 'Logistics Team',
    recommendedAction: 'Follow up with customs broker to clear documentation issues.',
  }))
];
