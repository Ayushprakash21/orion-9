import {
  Customer, CustomerOrder, Carrier, Route, TransportationPlan,
  WarehouseDetail, Contract, DocumentRecord, SupplierCommunication,
  KpiRecord, InventoryLot
} from '../types';
import { demoSuppliers, demoWarehouses, demoProducts, demoPurchaseOrders, demoShipments } from '../data';
import { subDays, addDays } from 'date-fns';

const today = new Date();

export const demoCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Apex Industrial Corp',
    tier: 'Enterprise',
    region: 'North America',
    contactEmail: 'procurement@apexindustrial.com',
    slaTargetDays: 3,
    historicalFulfillmentRate: 98.4,
    totalOrdersValue: 1850000
  },
  {
    id: 'CUST-002',
    name: 'Nexus Automotive Systems',
    tier: 'Enterprise',
    region: 'EMEA',
    contactEmail: 'sc-ops@nexusauto.de',
    slaTargetDays: 2,
    historicalFulfillmentRate: 94.2,
    totalOrdersValue: 2400000
  },
  {
    id: 'CUST-003',
    name: 'Veritas Medical Technologies',
    tier: 'Strategic',
    region: 'APAC',
    contactEmail: 'logistics@veritasmed.sg',
    slaTargetDays: 2,
    historicalFulfillmentRate: 99.1,
    totalOrdersValue: 920000
  },
  {
    id: 'CUST-004',
    name: 'Solaris Energy Grid Ltd',
    tier: 'Strategic',
    region: 'APAC',
    contactEmail: 'supplies@solarisgrid.in',
    slaTargetDays: 5,
    historicalFulfillmentRate: 91.5,
    totalOrdersValue: 1150000
  },
  {
    id: 'CUST-005',
    name: 'Quantum Consumer Goods',
    tier: 'Standard',
    region: 'North America',
    contactEmail: 'orderdesk@quantumcg.com',
    slaTargetDays: 4,
    historicalFulfillmentRate: 96.0,
    totalOrdersValue: 640000
  }
];

export const demoCustomerOrders: CustomerOrder[] = [
  {
    id: 'SO-2026-101',
    customerId: 'CUST-001',
    customerName: 'Apex Industrial Corp',
    orderDate: subDays(today, 3).toISOString(),
    promisedDate: addDays(today, 2).toISOString(),
    status: 'At Risk',
    totalValue: 84500,
    priority: 'Critical',
    lines: [
      {
        id: 'SOL-101-1',
        orderId: 'SO-2026-101',
        productId: demoProducts[0]?.id || 'SKU-1000',
        quantity: 120,
        unitPrice: 420,
        allocatedWarehouseId: 'WH-001',
        status: 'Unallocated'
      },
      {
        id: 'SOL-101-2',
        orderId: 'SO-2026-101',
        productId: demoProducts[1]?.id || 'SKU-1001',
        quantity: 80,
        unitPrice: 425,
        allocatedWarehouseId: 'WH-001',
        status: 'Allocated'
      }
    ],
    linkedShipmentId: demoShipments[0]?.id
  },
  {
    id: 'SO-2026-102',
    customerId: 'CUST-002',
    customerName: 'Nexus Automotive Systems',
    orderDate: subDays(today, 4).toISOString(),
    promisedDate: addDays(today, 1).toISOString(),
    status: 'Delayed',
    totalValue: 142000,
    priority: 'Critical',
    lines: [
      {
        id: 'SOL-102-1',
        orderId: 'SO-2026-102',
        productId: demoProducts[2]?.id || 'SKU-1002',
        quantity: 350,
        unitPrice: 405,
        allocatedWarehouseId: 'WH-002',
        status: 'Backordered'
      }
    ],
    linkedShipmentId: demoShipments[1]?.id
  },
  {
    id: 'SO-2026-103',
    customerId: 'CUST-003',
    customerName: 'Veritas Medical Technologies',
    orderDate: subDays(today, 1).toISOString(),
    promisedDate: addDays(today, 4).toISOString(),
    status: 'Allocated',
    totalValue: 62000,
    priority: 'High',
    lines: [
      {
        id: 'SOL-103-1',
        orderId: 'SO-2026-103',
        productId: demoProducts[3]?.id || 'SKU-1003',
        quantity: 150,
        unitPrice: 413,
        allocatedWarehouseId: 'WH-003',
        status: 'Allocated'
      }
    ]
  },
  {
    id: 'SO-2026-104',
    customerId: 'CUST-004',
    customerName: 'Solaris Energy Grid Ltd',
    orderDate: subDays(today, 6).toISOString(),
    promisedDate: addDays(today, 5).toISOString(),
    status: 'In Assembly',
    totalValue: 98000,
    priority: 'Normal',
    lines: [
      {
        id: 'SOL-104-1',
        orderId: 'SO-2026-104',
        productId: demoProducts[4]?.id || 'SKU-1004',
        quantity: 220,
        unitPrice: 445,
        allocatedWarehouseId: 'WH-001',
        status: 'Allocated'
      }
    ]
  }
];

export const demoCarriers: Carrier[] = [
  {
    id: 'CARR-01',
    name: 'Maersk Line Intermodal',
    modes: ['Ocean', 'Rail'],
    onTimeReliability: 87.5,
    averageDelayDays: 2.1,
    costPerTonKm: 0.045,
    activeShipmentsCount: 18,
    rating: 4.4,
    status: 'Preferred'
  },
  {
    id: 'CARR-02',
    name: 'DHL Global Forwarding',
    modes: ['Air', 'Road'],
    onTimeReliability: 94.8,
    averageDelayDays: 0.6,
    costPerTonKm: 0.18,
    activeShipmentsCount: 26,
    rating: 4.8,
    status: 'Preferred'
  },
  {
    id: 'CARR-03',
    name: 'FedEx Freight Logistics',
    modes: ['Road', 'Air'],
    onTimeReliability: 91.2,
    averageDelayDays: 1.2,
    costPerTonKm: 0.14,
    activeShipmentsCount: 14,
    rating: 4.2,
    status: 'Active'
  },
  {
    id: 'CARR-04',
    name: 'Mediterranean Shipping Co (MSC)',
    modes: ['Ocean'],
    onTimeReliability: 79.4,
    averageDelayDays: 4.2,
    costPerTonKm: 0.038,
    activeShipmentsCount: 12,
    rating: 3.6,
    status: 'Restricted'
  },
  {
    id: 'CARR-05',
    name: 'Kuehne + Nagel Logistics',
    modes: ['Road', 'Ocean', 'Air'],
    onTimeReliability: 93.0,
    averageDelayDays: 0.9,
    costPerTonKm: 0.11,
    activeShipmentsCount: 22,
    rating: 4.6,
    status: 'Preferred'
  }
];

export const demoRoutes: Route[] = [
  {
    id: 'RT-01',
    origin: 'Shanghai Port (CN)',
    destination: 'Nhava Sheva Mumbai (IN)',
    primaryCarrierId: 'CARR-01',
    mode: 'Ocean',
    standardLeadTimeDays: 16,
    currentCongestionLevel: 'Moderate',
    typicalDelayRisk: 18,
    freightIndexPerTeu: 1850
  },
  {
    id: 'RT-02',
    origin: 'Singapore Changi (SG)',
    destination: 'Bengaluru Airport (IN)',
    primaryCarrierId: 'CARR-02',
    mode: 'Air',
    standardLeadTimeDays: 2,
    currentCongestionLevel: 'Low',
    typicalDelayRisk: 4,
    freightIndexPerTeu: 4600
  },
  {
    id: 'RT-03',
    origin: 'Rotterdam Port (NL)',
    destination: 'Mundra Port Gujarat (IN)',
    primaryCarrierId: 'CARR-04',
    mode: 'Ocean',
    standardLeadTimeDays: 24,
    currentCongestionLevel: 'Severe',
    typicalDelayRisk: 42,
    freightIndexPerTeu: 2400
  },
  {
    id: 'RT-04',
    origin: 'Delhi North Hub (IN)',
    destination: 'Mumbai Central WH (IN)',
    primaryCarrierId: 'CARR-03',
    mode: 'Road',
    standardLeadTimeDays: 3,
    currentCongestionLevel: 'Low',
    typicalDelayRisk: 8,
    freightIndexPerTeu: 650
  }
];

export const demoWarehouseDetails: WarehouseDetail[] = demoWarehouses.map((wh, idx) => {
  const capacities = [15000, 12000, 10000, 8000, 11000];
  const utilizations = [88.5, 94.2, 74.0, 68.2, 82.4];
  const inboundScores = [72, 89, 45, 30, 60];
  const outboundScores = [65, 84, 40, 28, 55];
  const cap = capacities[idx % capacities.length];
  const util = utilizations[idx % utilizations.length];
  
  return {
    id: wh.id,
    name: wh.name,
    location: wh.location,
    totalCapacityPallets: cap,
    usedCapacityPallets: Math.round(cap * (util / 100)),
    utilizationRate: util,
    inboundCongestionScore: inboundScores[idx % inboundScores.length],
    outboundCongestionScore: outboundScores[idx % outboundScores.length],
    activeDockDoors: idx === 1 ? 12 : 8,
    totalDockDoors: idx === 1 ? 14 : 10,
    pickingEfficiencyScore: idx === 1 ? 81.2 : 94.5,
    laborCapacityPercent: idx === 1 ? 95 : 82,
    bottleneckSummary: idx === 1 ? 'High yard congestion and dock queue exceeding 3.5 hours during afternoon inbound rush.' : undefined
  };
});

export const demoContracts: Contract[] = [
  {
    id: 'CNT-2025-01',
    contractNumber: 'MSA-ORION-SUP001',
    title: 'Semiconductor Master Supply & Consignment Agreement',
    supplierId: demoSuppliers[0]?.id || 'SUP-001',
    supplierName: demoSuppliers[0]?.name || 'Supplier A Tech Ltd.',
    startDate: subDays(today, 300).toISOString(),
    endDate: addDays(today, 65).toISOString(),
    renewalNoticeDays: 60,
    annualValue: 2400000,
    status: 'Expiring Soon',
    agreedOtifTarget: 95.0,
    maxDefectRateAllowed: 1.5,
    penaltyClauseSummary: '2% liquidated damages per week of unexcused delivery delay capped at 10% PO value.',
    pricingTerms: 'Net 45 with quarterly volume rebates up to 4.5%',
    riskRating: 'High',
    keyObligations: [
      'Maintain 30-day buffer inventory at regional hub',
      'Provide bi-weekly production schedule visibility',
      'Notify schedule disruptions within 24 hours of detection'
    ]
  },
  {
    id: 'CNT-2025-02',
    contractNumber: 'PSA-ORION-SUP002',
    title: 'Precision Plastic Components Strategic Sourcing Agreement',
    supplierId: demoSuppliers[1]?.id || 'SUP-002',
    supplierName: demoSuppliers[1]?.name || 'Supplier B Materials Ltd.',
    startDate: subDays(today, 180).toISOString(),
    endDate: addDays(today, 185).toISOString(),
    renewalNoticeDays: 45,
    annualValue: 850000,
    status: 'Active',
    agreedOtifTarget: 92.0,
    maxDefectRateAllowed: 2.0,
    penaltyClauseSummary: 'Replacement of non-conforming lots within 5 business days at supplier expense.',
    pricingTerms: 'Net 30 fixed pricing through Q4 2026',
    riskRating: 'Low',
    keyObligations: [
      'Zero change in tooling or resin grade without prior written QA approval',
      'Quarterly quality audit rights'
    ]
  },
  {
    id: 'CNT-2025-03',
    contractNumber: 'LSA-ORION-CARR01',
    title: 'Global Ocean & Multimodal Freight Services Agreement',
    supplierId: 'CARR-01',
    supplierName: 'Maersk Line Intermodal',
    startDate: subDays(today, 240).toISOString(),
    endDate: addDays(today, 125).toISOString(),
    renewalNoticeDays: 30,
    annualValue: 1650000,
    status: 'Active',
    agreedOtifTarget: 90.0,
    maxDefectRateAllowed: 0.5,
    penaltyClauseSummary: 'Demurrage waiver for port delays caused by carrier schedule changes.',
    pricingTerms: 'Bunker adjustment factor indexed to Rotterdam marine fuel index',
    riskRating: 'Moderate',
    keyObligations: [
      'EDI 214 real-time shipment milestone status updates every 6 hours',
      'Guaranteed container equipment allocation during peak seasons'
    ]
  }
];

export const demoDocuments: DocumentRecord[] = [
  {
    id: 'DOC-101',
    title: 'Master Supply Agreement 2025-2026.pdf',
    fileName: 'MSA-ORION-SUP001.pdf',
    fileType: 'PDF',
    fileSizeKb: 1420,
    category: 'Contract',
    linkedEntityType: 'Supplier',
    linkedEntityId: demoSuppliers[0]?.id || 'SUP-001',
    uploadedAt: subDays(today, 25).toISOString(),
    uploadedBy: 'Legal Procurement',
    extractedFields: {
      contractNumber: 'MSA-ORION-SUP001',
      parties: ['ORION-9 Corp', 'Supplier A Tech Ltd.'],
      effectiveDate: '2025-01-15',
      expirationDate: '2026-05-15',
      paymentTerms: 'Net 45',
      slaOtif: '95.0%'
    },
    summary: 'Standard multi-year component sourcing agreement covering electronics modules. Contains strict delivery delay penalties.',
    anomalyDetected: 'Renewal notice window opened 5 days ago without formal review logged.'
  },
  {
    id: 'DOC-102',
    title: 'Ocean Bill of Lading - MAEU9821440.pdf',
    fileName: 'BOL_MAEU9821440.pdf',
    fileType: 'PDF',
    fileSizeKb: 680,
    category: 'Bill of Lading',
    linkedEntityType: 'Shipment',
    linkedEntityId: demoShipments[0]?.id || 'SHP-2026-0001',
    uploadedAt: subDays(today, 4).toISOString(),
    uploadedBy: 'Logistics Customs Broker',
    extractedFields: {
      vesselName: 'Maersk Mc-Kinney Moller',
      portOfLoading: 'Shanghai (CNSHA)',
      portOfDischarge: 'Nhava Sheva (INNSA)',
      containerNumber: 'MSKU8842109',
      weightKg: 18450
    },
    summary: 'Clean on-board ocean bill of lading for 1x40HC container carrying active electronics components.',
    anomalyDetected: undefined
  },
  {
    id: 'DOC-103',
    title: 'Supplier QA Lot Inspection Certificate #4812.xlsx',
    fileName: 'Lot_Inspection_4812.xlsx',
    fileType: 'Excel',
    fileSizeKb: 450,
    category: 'Quality Certificate',
    linkedEntityType: 'PurchaseOrder',
    linkedEntityId: demoPurchaseOrders[0]?.id || 'PO-2026-0001',
    uploadedAt: subDays(today, 2).toISOString(),
    uploadedBy: 'Inbound Receiving QA',
    extractedFields: {
      sampleSize: 150,
      defectsFound: 4,
      defectRate: '2.67%',
      allowableAql: '1.5%'
    },
    summary: 'Inbound sampling report showing minor soldering defects slightly above AQL 1.5%.',
    anomalyDetected: 'Sample defect rate (2.67%) exceeds contract threshold (1.50%).'
  }
];

export const demoSupplierCommunications: SupplierCommunication[] = [
  {
    id: 'COMM-01',
    supplierId: demoSuppliers[0]?.id || 'SUP-001',
    supplierName: demoSuppliers[0]?.name || 'Supplier A Tech Ltd.',
    contactEmail: 'orders@supplier-a-tech.com',
    subject: '[URGENT] Delivery Status Inquiry — Purchase Order PO-2026-0001',
    body: 'Dear Supplier A Operations Team, Our ORION-9 has flagged PO-2026-0001 as delayed by 5 days against committed milestone. Downstream manufacturing is exposed. Please provide confirmed revised dispatch date within 24h.',
    type: 'PO_STATUS',
    status: 'DISPATCHED',
    sentAt: subDays(today, 2).toISOString(),
    sentBy: 'Jane Smith (Procurement Lead)',
    requiresAuthorization: true,
    linkedPoId: 'PO-2026-0001'
  },
  {
    id: 'COMM-02',
    supplierId: demoSuppliers[1]?.id || 'SUP-002',
    supplierName: demoSuppliers[1]?.name || 'Supplier B Materials Ltd.',
    contactEmail: 'support@supplier-b-materials.com',
    subject: 'Advance Quality Notice — Non-conformance in Lot #4812',
    body: 'Dear QA Team, Incoming inspection report #4812 revealed defect rate of 2.67% vs contractual maximum of 2.0%. Please issue an 8D corrective action response.',
    type: 'QUALITY_ISSUE',
    status: 'APPROVED',
    sentAt: subDays(today, 1).toISOString(),
    sentBy: 'Quality Operations',
    requiresAuthorization: true
  },
  {
    id: 'COMM-03',
    supplierId: demoSuppliers[0]?.id || 'SUP-001',
    supplierName: demoSuppliers[0]?.name || 'Supplier A Tech Ltd.',
    contactEmail: 'contracts@supplier-a-tech.com',
    subject: 'Contract Renewal & SLA Review Notice (MSA-ORION-SUP001)',
    body: 'Dear Commercial Team, Contract MSA-ORION-SUP001 enters its 60-day renewal notice window. We request a quarterly review session regarding OTIF metrics and volume rebates.',
    type: 'CONTRACT_RENEWAL',
    status: 'DRAFT',
    requiresAuthorization: true
  }
];

export const demoKpis: KpiRecord[] = [
  {
    id: 'KPI-01',
    domain: 'Service',
    name: 'Customer Order On-Time In-Full (OTIF)',
    current: 94.2,
    target: 98.0,
    unit: '%',
    trend: 'DOWN',
    variancePercent: -3.8,
    status: 'WARNING',
    driver: 'Component stockouts at Mumbai central warehouse and 3-day port customs delay.',
    recommendedAction: 'Expedite incoming PO-2026-0001 and reroute safety stock from Bengaluru hub.',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 97.4 },
      { date: subDays(today, 20).toISOString(), value: 96.8 },
      { date: subDays(today, 10).toISOString(), value: 95.1 },
      { date: today.toISOString(), value: 94.2 }
    ]
  },
  {
    id: 'KPI-02',
    domain: 'Inventory',
    name: 'Inventory Health Index',
    current: 88.4,
    target: 92.0,
    unit: 'Score',
    trend: 'STABLE',
    variancePercent: -3.6,
    status: 'HEALTHY',
    driver: 'Critical stockouts contained to 8 SKUs; excess inventory reduced by 14% this month.',
    recommendedAction: 'Execute auto-rebalance workflow between WH-001 and WH-003.',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 85.0 },
      { date: subDays(today, 20).toISOString(), value: 86.8 },
      { date: subDays(today, 10).toISOString(), value: 88.0 },
      { date: today.toISOString(), value: 88.4 }
    ]
  },
  {
    id: 'KPI-03',
    domain: 'Supplier',
    name: 'Supplier Aggregate Reliability Score',
    current: 86.7,
    target: 92.0,
    unit: '%',
    trend: 'DOWN',
    variancePercent: -5.3,
    status: 'WARNING',
    driver: 'Semiconductor vendor lead-time variability increased from 4 days to 11 days.',
    recommendedAction: 'Enforce liquidated damages clause in MSA-ORION-SUP001 and dual-source critical ICs.',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 91.2 },
      { date: subDays(today, 20).toISOString(), value: 89.4 },
      { date: subDays(today, 10).toISOString(), value: 87.8 },
      { date: today.toISOString(), value: 86.7 }
    ]
  },
  {
    id: 'KPI-04',
    domain: 'Logistics',
    name: 'Carrier Delivery On-Time Performance',
    current: 89.1,
    target: 95.0,
    unit: '%',
    trend: 'DOWN',
    variancePercent: -5.9,
    status: 'WARNING',
    driver: 'Mundra and Rotterdam container port congestion impacting MSC ocean sailings.',
    recommendedAction: 'Shift critical replenishment volume to DHL Air charter for high-urgency SKUs.',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 94.0 },
      { date: subDays(today, 20).toISOString(), value: 92.5 },
      { date: subDays(today, 10).toISOString(), value: 90.4 },
      { date: today.toISOString(), value: 89.1 }
    ]
  },
  {
    id: 'KPI-05',
    domain: 'Warehouse',
    name: 'Distribution Center Utilization',
    current: 81.5,
    target: 80.0,
    unit: '%',
    trend: 'UP',
    variancePercent: 1.5,
    status: 'HEALTHY',
    driver: 'North DC (WH-002) experiencing 94.2% peak utilization; other nodes balanced.',
    recommendedAction: 'Schedule off-peak replenishment transfers to East DC (WH-004).',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 76.2 },
      { date: subDays(today, 20).toISOString(), value: 78.9 },
      { date: subDays(today, 10).toISOString(), value: 80.4 },
      { date: today.toISOString(), value: 81.5 }
    ]
  },
  {
    id: 'KPI-06',
    domain: 'Finance',
    name: 'Working Capital in Inventory',
    current: 4850000,
    target: 4500000,
    unit: '$',
    trend: 'DOWN',
    variancePercent: 7.8,
    status: 'HEALTHY',
    driver: 'Excess safety stock reduction program successfully freed $320,000 in Q1.',
    recommendedAction: 'Liquidate slow-moving Class C packaging inventory.',
    historicalValues: [
      { date: subDays(today, 30).toISOString(), value: 5240000 },
      { date: subDays(today, 20).toISOString(), value: 5120000 },
      { date: subDays(today, 10).toISOString(), value: 4980000 },
      { date: today.toISOString(), value: 4850000 }
    ]
  }
];
