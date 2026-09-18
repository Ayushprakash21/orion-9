/**
 * ORION-9 ENTERPRISE CONTRACT & SOURCING SEED DATA
 * Layer 4 Kernel & Layer 7 Data Fabric Canonical Datasets
 */

import { subDays, addDays } from 'date-fns';
import { EnterpriseContract, SourcingRfq } from '../../types/contract';
import { demoSuppliers } from '../../data';

const today = new Date();

export const demoEnterpriseContracts: EnterpriseContract[] = [
  {
    id: 'CNT-2025-01',
    contractNumber: 'MSA-ORION-SUP001',
    title: 'Semiconductor Master Supply & Consignment Agreement',
    version: 'v2.1',
    supplierId: demoSuppliers[0]?.id || 'SUP-001',
    supplierName: demoSuppliers[0]?.name || 'Supplier A Tech Ltd.',
    category: 'Semiconductors',
    currency: 'USD',
    startDate: subDays(today, 300).toISOString(),
    endDate: addDays(today, 58).toISOString(),
    renewalNoticeDays: 60,
    annualValue: 2400000,
    totalCommitmentValue: 4800000,
    status: 'Expiring Soon',
    contractState: 'EXPIRING_SOON',
    incoterm: 'DDP',
    paymentTerms: 'NET_45' as any,
    governingLaw: 'State of Delaware, USA',
    liabilityCapUsd: 1000000,
    indemnificationScope: 'MUTUAL',
    forceMajeureClause: true,
    agreedOtifTarget: 95.0,
    maxDefectRateAllowed: 1.5,
    penaltyClauseSummary: '2% liquidated damages per week of unexcused delivery delay capped at 10% PO value.',
    pricingTerms: 'Net 45 with quarterly volume rebates up to 4.5%',
    riskRating: 'High',
    keyObligations: [
      'Maintain 30-day buffer inventory at regional hub',
      'Provide bi-weekly production schedule visibility',
      'Notify schedule disruptions within 24 hours of detection'
    ],
    volumeTiers: [
      { minUnits: 1, maxUnits: 10000, unitPrice: 48.50, discountPercent: 0 },
      { minUnits: 10001, maxUnits: 50000, unitPrice: 44.20, discountPercent: 8.8 },
      { minUnits: 50001, maxUnits: 100000, unitPrice: 41.00, discountPercent: 15.4 }
    ],
    slaTargets: [
      {
        id: 'SLA-01',
        metricKey: 'OTIF_PERCENT',
        name: 'On-Time In-Full Delivery Target',
        targetValue: 95.0,
        actualValue: 89.4,
        unit: '%',
        penaltyRatePercent: 2.0,
        status: 'BREACH',
        curePeriodDays: 14
      },
      {
        id: 'SLA-02',
        metricKey: 'DEFECT_RATE_MAX',
        name: 'Lot Rejection & Defect Cap',
        targetValue: 1.5,
        actualValue: 1.2,
        unit: '%',
        penaltyRatePercent: 1.5,
        status: 'COMPLIANT',
        curePeriodDays: 7
      },
      {
        id: 'SLA-03',
        metricKey: 'EXPEDITE_RESPONSE_HOURS',
        name: 'Emergency Production Re-route Response',
        targetValue: 24,
        actualValue: 18,
        unit: 'hours',
        penaltyRatePercent: 0.5,
        status: 'COMPLIANT',
        curePeriodDays: 5
      }
    ],
    clauses: [
      {
        clauseNumber: 'Sec 4.2',
        title: 'Buffer Stock Warranty & Safety Margin',
        category: 'SUPPLY_ASSURANCE',
        body: 'Supplier warrants it shall continuously maintain dedicated finished-goods buffer inventory equivalent to thirty (30) operating calendar days of Orion-9 forecasted draw.',
        isStandard: true
      },
      {
        clauseNumber: 'Sec 8.1',
        title: 'Liquidated Damages for Delayed Deliveries',
        category: 'LIABILITY',
        body: 'If Supplier fails to tender delivery by the agreed Ship Date, Buyer may assess liquidated damages equal to two percent (2%) of the affected order per seven (7) day delay increment, capped at ten percent (10%).',
        isStandard: false,
        redlineFindingId: 'REDLINE-01'
      },
      {
        clauseNumber: 'Sec 12.3',
        title: 'Escalation & Notice of Impending Disruption',
        category: 'FORCE_MAJEURE',
        body: 'Supplier must notify Buyer in writing within twenty-four (24) hours of discovering any yield drop, raw material bottleneck, or geopolitical export embargo affecting deliverables.',
        isStandard: true
      }
    ],
    redlineFindings: [
      {
        id: 'REDLINE-01',
        clauseCategory: 'LIABILITY',
        riskSeverity: 'HIGH',
        originalText: 'Liquidated damages capped at 10% of PO value without supplier reimbursement for freight expediting costs.',
        issueAnalysis: 'Standard Orion-9 Master Agreements mandate full supplier coverage of emergency air-freight and third-party substitution costs during prolonged delays.',
        proposedRevision: 'Liquidated damages capped at 15% of PO value PLUS Supplier responsibility for Buyer-authorized expedite freight costs.',
        status: 'PENDING'
      }
    ],
    cryptoIntegrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    classification: 'RESTRICTED',
    sourceSystem: 'SAP_S4HANA_MM_2026',
    signatures: {
      buyerSigner: 'Elena Vance (VP Strategic Sourcing)',
      buyerSignedAt: subDays(today, 298).toISOString(),
      supplierSigner: 'Kenji Sato (Managing Director)',
      supplierSignedAt: subDays(today, 295).toISOString(),
      approvalId: 'appr-msa-sup001'
    }
  },
  {
    id: 'CNT-2025-02',
    contractNumber: 'PSA-ORION-SUP002',
    title: 'Precision Plastic & Composite Structural Housings LTA',
    version: 'v1.4',
    supplierId: demoSuppliers[1]?.id || 'SUP-002',
    supplierName: demoSuppliers[1]?.name || 'Supplier B Materials Ltd.',
    category: 'Raw Materials',
    currency: 'USD',
    startDate: subDays(today, 180).toISOString(),
    endDate: addDays(today, 185).toISOString(),
    renewalNoticeDays: 45,
    annualValue: 850000,
    totalCommitmentValue: 1700000,
    status: 'Active',
    contractState: 'ACTIVE',
    incoterm: 'FCA',
    paymentTerms: 'NET_30',
    governingLaw: 'Singapore International Commercial Court',
    liabilityCapUsd: 500000,
    indemnificationScope: 'MUTUAL',
    forceMajeureClause: true,
    agreedOtifTarget: 92.0,
    maxDefectRateAllowed: 2.0,
    penaltyClauseSummary: 'Replacement of non-conforming lots within 5 business days at supplier expense.',
    pricingTerms: 'Net 30 fixed pricing through Q4 2026',
    riskRating: 'Low',
    keyObligations: [
      'Zero change in tooling or resin grade without prior written QA approval',
      'Quarterly quality audit rights',
      'Maintain ISO 9001 and ISO 14001 certification'
    ],
    volumeTiers: [
      { minUnits: 1, maxUnits: 25000, unitPrice: 12.80, discountPercent: 0 },
      { minUnits: 25001, maxUnits: 100000, unitPrice: 11.40, discountPercent: 10.9 }
    ],
    slaTargets: [
      {
        id: 'SLA-04',
        metricKey: 'OTIF_PERCENT',
        name: 'On-Time In-Full Delivery Target',
        targetValue: 92.0,
        actualValue: 94.2,
        unit: '%',
        penaltyRatePercent: 1.0,
        status: 'COMPLIANT',
        curePeriodDays: 14
      },
      {
        id: 'SLA-05',
        metricKey: 'DEFECT_RATE_MAX',
        name: 'Maximum Lot Defect PPM',
        targetValue: 2.0,
        actualValue: 1.1,
        unit: '%',
        penaltyRatePercent: 2.5,
        status: 'COMPLIANT',
        curePeriodDays: 5
      }
    ],
    clauses: [
      {
        clauseNumber: 'Sec 2.4',
        title: 'Tooling Ownership & Intellectual Property',
        category: 'INTELLECTUAL_PROPERTY',
        body: 'All injection molds, dies, and CAD drawings financed by Buyer shall remain the sole exclusive property of Buyer, held in trust by Supplier.',
        isStandard: true
      },
      {
        clauseNumber: 'Sec 6.2',
        title: 'Immediate Remediation of Quarantined Batches',
        category: 'QUALITY',
        body: 'Upon receipt of a Non-Conformance Report (NCR), Supplier shall dispatch replacement certified raw stock within five (5) business days at Supplier expense.',
        isStandard: true
      }
    ],
    redlineFindings: [],
    cryptoIntegrityHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    classification: 'CONFIDENTIAL',
    sourceSystem: 'ORACLE_FUSION_2026',
    signatures: {
      buyerSigner: 'Marcus Wright (Lead Category Mgr)',
      buyerSignedAt: subDays(today, 178).toISOString(),
      supplierSigner: 'David Zhang (VP Commercial)',
      supplierSignedAt: subDays(today, 175).toISOString(),
      approvalId: 'appr-psa-sup002'
    }
  },
  {
    id: 'CNT-2025-03',
    contractNumber: 'LSA-ORION-CARR01',
    title: 'Global Ocean & Multimodal Freight Services Agreement',
    version: 'v3.0',
    supplierId: 'CARR-01',
    supplierName: 'Maersk Line Intermodal',
    category: 'Logistics & 3PL',
    currency: 'USD',
    startDate: subDays(today, 240).toISOString(),
    endDate: addDays(today, 125).toISOString(),
    renewalNoticeDays: 30,
    annualValue: 1650000,
    totalCommitmentValue: 3300000,
    status: 'Active',
    contractState: 'ACTIVE',
    incoterm: 'FOB',
    paymentTerms: 'NET_30',
    governingLaw: 'English Maritime Law, London',
    liabilityCapUsd: 2500000,
    indemnificationScope: 'MUTUAL',
    forceMajeureClause: true,
    agreedOtifTarget: 90.0,
    maxDefectRateAllowed: 0.5,
    penaltyClauseSummary: 'Demurrage waiver for port delays caused by carrier schedule changes.',
    pricingTerms: 'Bunker adjustment factor indexed to Rotterdam marine fuel index',
    riskRating: 'Moderate',
    keyObligations: [
      'EDI 214 real-time shipment milestone status updates every 6 hours',
      'Guaranteed container equipment allocation during peak seasons',
      'Priority berthing window at Rotterdam and Los Angeles ports'
    ],
    volumeTiers: [
      { minUnits: 1, maxUnits: 500, unitPrice: 2850, discountPercent: 0 },
      { minUnits: 501, maxUnits: 2000, unitPrice: 2450, discountPercent: 14.0 }
    ],
    slaTargets: [
      {
        id: 'SLA-06',
        metricKey: 'OTIF_PERCENT',
        name: 'Transpacific & Transatlantic Port-to-Port Transit',
        targetValue: 90.0,
        actualValue: 87.1,
        unit: '%',
        penaltyRatePercent: 1.5,
        status: 'WARNING',
        curePeriodDays: 30
      }
    ],
    clauses: [
      {
        clauseNumber: 'Sec 5.1',
        title: 'Real-Time Telemetry & Milestone Integration',
        category: 'INTEGRATION',
        body: 'Carrier shall transmit automated EDI 214 and AIS geospatial position data via Orion-9 Integration Fabric at intervals not exceeding 360 minutes.',
        isStandard: true
      },
      {
        clauseNumber: 'Sec 9.4',
        title: 'Demurrage and Detention Indemnity',
        category: 'LIABILITY',
        body: 'Carrier agrees to waive all demurrage and detention charges when delays stem from carrier vessel mechanical casualty or blank sailings.',
        isStandard: true
      }
    ],
    redlineFindings: [],
    cryptoIntegrityHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    classification: 'CONFIDENTIAL',
    sourceSystem: 'SAP_TM_2026',
    signatures: {
      buyerSigner: 'Siddharth Rao (Global Logistics Director)',
      buyerSignedAt: subDays(today, 238).toISOString(),
      supplierSigner: 'Jens Møller (Global Key Accounts)',
      supplierSignedAt: subDays(today, 236).toISOString(),
      approvalId: 'appr-lsa-carr01'
    }
  },
  {
    id: 'CNT-2026-04',
    contractNumber: 'DPA-ORION-SUP003',
    title: 'High-Capacity Lithium-Ion Prismatic Battery Cells Contract',
    version: 'v1.0-DRAFT',
    supplierId: demoSuppliers[2]?.id || 'SUP-003',
    supplierName: demoSuppliers[2]?.name || 'Supplier C Technologies',
    category: 'Direct Procurement',
    currency: 'USD',
    startDate: today.toISOString(),
    endDate: addDays(today, 365).toISOString(),
    renewalNoticeDays: 90,
    annualValue: 3800000,
    totalCommitmentValue: 7600000,
    status: 'Under Review',
    contractState: 'UNDER_LEGAL_REVIEW',
    incoterm: 'DDP',
    paymentTerms: 'NET_60',
    governingLaw: 'State of New York, USA',
    liabilityCapUsd: 5000000,
    indemnificationScope: 'UNILATERAL_BUYER',
    forceMajeureClause: false,
    agreedOtifTarget: 96.0,
    maxDefectRateAllowed: 0.8,
    penaltyClauseSummary: 'Liquidated damages of 3% per week delay; warranty indemnity for thermal runaway defects.',
    pricingTerms: 'Indexed quarterly to London Metal Exchange (LME) Cobalt & Lithium Hydroxide price benchmarks',
    riskRating: 'High',
    keyObligations: [
      '100% automated ultrasonic weld inspection data archived per serial number',
      'Dual-continent manufacturing redundancy guarantee',
      'Mandatory ESG audit adherence for DRC cobalt sourcing'
    ],
    volumeTiers: [
      { minUnits: 1, maxUnits: 100000, unitPrice: 72.00, discountPercent: 0 },
      { minUnits: 100001, maxUnits: 500000, unitPrice: 66.50, discountPercent: 7.6 },
      { minUnits: 500001, maxUnits: 1000000, unitPrice: 62.00, discountPercent: 13.9 }
    ],
    slaTargets: [
      {
        id: 'SLA-07',
        metricKey: 'OTIF_PERCENT',
        name: 'Battery Cell Delivery Punctuality',
        targetValue: 96.0,
        actualValue: 96.0,
        unit: '%',
        penaltyRatePercent: 3.0,
        status: 'COMPLIANT',
        curePeriodDays: 7
      },
      {
        id: 'SLA-08',
        metricKey: 'DEFECT_RATE_MAX',
        name: 'Thermal Cell Quality & Internal Resistance Cap',
        targetValue: 0.8,
        actualValue: 0.5,
        unit: '%',
        penaltyRatePercent: 5.0,
        status: 'COMPLIANT',
        curePeriodDays: 3
      }
    ],
    clauses: [
      {
        clauseNumber: 'Sec 7.3',
        title: 'Geopolitical & Critical Mineral Export Risk',
        category: 'FORCE_MAJEURE',
        body: 'Parties recognize lithium and cobalt as export-controlled substances. Supplier assumes sole burden of obtaining export clearance.',
        isStandard: false,
        redlineFindingId: 'REDLINE-02'
      },
      {
        clauseNumber: 'Sec 14.2',
        title: 'Product Recall & Latent Defect Indemnity',
        category: 'LIABILITY',
        body: 'In the event of an NHTSA or CPSC battery safety recall resulting from internal cell dendrite formation, Supplier shall hold Buyer harmless for all direct and consequential repair costs.',
        isStandard: true
      }
    ],
    redlineFindings: [
      {
        id: 'REDLINE-02',
        clauseCategory: 'FORCE_MAJEURE',
        riskSeverity: 'CRITICAL',
        originalText: 'Supplier assumes sole burden of export clearance without bilateral allocation for sudden sovereign export embargoes.',
        issueAnalysis: 'Standard Orion-9 Risk Policy POL-CTR-002 flags unilateral embargo burden as high risk for supply rupture. Must provide 30-day buffer relocation protocol.',
        proposedRevision: 'Supplier and Buyer shall jointly maintain bonded warehouse inventory in neutral jurisdiction with pre-cleared customs documentation.',
        status: 'PENDING'
      }
    ],
    cryptoIntegrityHash: '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ad67e014e3',
    classification: 'RESTRICTED',
    sourceSystem: 'COUPA_PROCUREMENT_2026',
    signatures: {
      buyerSigner: 'Elena Vance (VP Strategic Sourcing)',
      supplierSigner: 'Dr. Hiroshi Tanaka (Chief Commercial Officer)'
    }
  }
];

export const demoSourcingRfqs: SourcingRfq[] = [
  {
    id: 'RFQ-2026-901',
    rfqNumber: 'RFQ-ORION-SSB-09',
    title: 'Solid-State Battery Electrolyte Sourcing & Volume Allocation',
    category: 'Direct Procurement',
    sku: 'SKU-SSB-ELEC-90',
    targetUnits: 150000,
    targetBudgetUsd: 1800000,
    currency: 'USD',
    deadline: addDays(today, 14).toISOString(),
    status: 'EVALUATING',
    createdAt: subDays(today, 10).toISOString(),
    bids: [
      {
        id: 'BID-01',
        supplierId: 'SUP-001',
        supplierName: 'Supplier A Tech Ltd.',
        unitPrice: 11.20,
        leadTimeDays: 28,
        moq: 10000,
        paymentTerms: 'NET_60',
        incoterm: 'DDP',
        esgScore: 84,
        historicalOtif: 89.4,
        calculatedScore: 87.2,
        awarded: false,
        complianceStatus: 'VERIFIED',
        notes: 'Includes dedicated dual-site cleanroom production in Taiwan & Dresden.',
        submittedAt: subDays(today, 5).toISOString()
      },
      {
        id: 'BID-02',
        supplierId: 'SUP-003',
        supplierName: 'Supplier C Technologies',
        unitPrice: 10.45,
        leadTimeDays: 21,
        moq: 25000,
        paymentTerms: 'NET_45',
        incoterm: 'CIF',
        esgScore: 92,
        historicalOtif: 96.0,
        calculatedScore: 94.6,
        awarded: false,
        complianceStatus: 'VERIFIED',
        notes: 'Lowest cost per kg with zero cobalt content and verified low-carbon cathode footprint.',
        submittedAt: subDays(today, 4).toISOString()
      },
      {
        id: 'BID-03',
        supplierId: 'SUP-002',
        supplierName: 'Supplier B Materials Ltd.',
        unitPrice: 12.80,
        leadTimeDays: 35,
        moq: 5000,
        paymentTerms: 'NET_30',
        incoterm: 'FCA',
        esgScore: 78,
        historicalOtif: 94.2,
        calculatedScore: 79.8,
        awarded: false,
        complianceStatus: 'NEEDS_AUDIT',
        notes: 'Smaller batches available but higher per-unit premium.',
        submittedAt: subDays(today, 2).toISOString()
      }
    ]
  },
  {
    id: 'RFQ-2026-902',
    rfqNumber: 'RFQ-ORION-OPTO-04',
    title: 'High-Precision Optoelectronic Laser Sensor Assemblies',
    category: 'Semiconductors',
    sku: 'SKU-OPTO-SEN-40',
    targetUnits: 50000,
    targetBudgetUsd: 950000,
    currency: 'USD',
    deadline: addDays(today, 25).toISOString(),
    status: 'OPEN',
    createdAt: subDays(today, 4).toISOString(),
    bids: [
      {
        id: 'BID-04',
        supplierId: 'SUP-001',
        supplierName: 'Supplier A Tech Ltd.',
        unitPrice: 18.50,
        leadTimeDays: 42,
        moq: 5000,
        paymentTerms: 'NET_45',
        incoterm: 'DDP',
        esgScore: 84,
        historicalOtif: 89.4,
        calculatedScore: 88.0,
        awarded: false,
        complianceStatus: 'VERIFIED',
        notes: 'Automated test reports bundled with each reel of 1000 pieces.',
        submittedAt: subDays(today, 1).toISOString()
      }
    ]
  }
];
