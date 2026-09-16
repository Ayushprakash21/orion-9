import * as THREE from 'three';
import {
  Supplier, Product, Warehouse, PurchaseOrder, Shipment, Exception,
  Decision, Action, Customer, CustomerOrder, Inventory
} from '../../../types';

export type EntityGroup = 'SUPPLY' | 'INVENTORY' | 'PROCUREMENT' | 'LOGISTICS' | 'DECISION' | 'CONTROL' | 'CUSTOMER';

export type EntityArchetype = 
  | 'ORION_CORE'
  | 'DOMAIN_HUB'
  | 'SUPPLIER'
  | 'FACTORY'
  | 'MATERIAL'
  | 'PURCHASE_ORDER'
  | 'SHIPMENT'
  | 'WAREHOUSE'
  | 'CUSTOMER'
  | 'ORDER'
  | 'EXCEPTION'
  | 'RISK'
  | 'DECISION'
  | 'ACTION';

export type EntityRiskState = 'normal' | 'warning' | 'high' | 'critical';

export interface WorldEntity3D {
  id: string;
  name: string;
  code?: string;
  type: string;
  archetype: EntityArchetype;
  group: EntityGroup;
  risk: EntityRiskState;
  position: THREE.Vector3;
  scale: number;
  color: string;
  hierarchyLevel: 1 | 2 | 3; // 1 = Domain Hub, 2 = Major Entity, 3 = Granular Transaction
  domainHubId?: string;
  details: any;
  metricLabel?: string;
  metricValue?: string | number;
  openIssuesCount?: number;
  moduleRoute?: string;
}

export type RelationshipFlowType = 
  | 'BACKBONE_HIGHWAY'
  | 'MATERIAL_FLOW'
  | 'TRANSACTION_FLOW'
  | 'LOGISTICS_FLOW'
  | 'INFORMATION_FLOW'
  | 'RISK_FLOW'
  | 'DECISION_FLOW'
  | 'CORE_TELEMETRY';

export interface WorldRelationship3D {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: THREE.Vector3;
  targetPos: THREE.Vector3;
  curve: THREE.CatmullRomCurve3;
  flowType: RelationshipFlowType;
  relationshipName: string;
  active: boolean;
  isBackbone: boolean;
  isCritical: boolean;
  flowSpeed: number;
  color: string;
}

export interface DomainCluster3D {
  id: string;
  name: string;
  label: string;
  group: EntityGroup;
  center: THREE.Vector3;
  color: string;
  entityCount: number;
  riskCount: number;
  entities: WorldEntity3D[];
  cameraPreset: {
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
  };
}

export interface BlastRadiusResult {
  rootEntity: WorldEntity3D;
  levels: {
    hop: number;
    entities: WorldEntity3D[];
    relationships: WorldRelationship3D[];
  }[];
  totalImpactedCount: number;
  highestRiskSeverity: EntityRiskState;
}

export interface PathTraceResult {
  found: boolean;
  pathNodes: WorldEntity3D[];
  pathEdges: WorldRelationship3D[];
  hops: number;
  summary: string;
}

/**
 * Deterministic hash function for string IDs to produce stable spatial offsets
 */
function hashStringToRange(str: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 10000) / 10000;
  return min + normalized * (max - min);
}

/**
 * WorldModelEngine3D maps real SCM entities into a structured, hierarchical 3D Digital Twin
 */
export class WorldModelEngine3D {
  /**
   * Builds the complete 3D digital twin model with Domain Hubs, Backbone Highways,
   * and clean Level 1 -> Level 2 -> Level 3 progressive hierarchy.
   */
  static buildGraph(data: {
    suppliers: Supplier[];
    products: Product[];
    warehouses: Warehouse[];
    purchaseOrders: PurchaseOrder[];
    shipments: Shipment[];
    inventory: Inventory[];
    exceptions: Exception[];
    decisions: Decision[];
    actions: Action[];
    customers?: Customer[];
    customerOrders?: CustomerOrder[];
  }): {
    entities: WorldEntity3D[];
    relationships: WorldRelationship3D[];
    domainClusters: DomainCluster3D[];
    coreNode: WorldEntity3D;
    stats: {
      totalEntities: number;
      totalRelationships: number;
      riskEntitiesCount: number;
      activeFlowCount: number;
    };
  } {
    const {
      suppliers = [],
      products = [],
      warehouses = [],
      purchaseOrders = [],
      shipments = [],
      inventory = [],
      exceptions = [],
      decisions = [],
      actions = [],
      customers = [],
      customerOrders = []
    } = data;

    const entities: WorldEntity3D[] = [];
    const entityMap = new Map<string, WorldEntity3D>();

    // =========================================================================
    // 1. CENTRAL ORION CORE (Focal Anchor at Origin)
    // =========================================================================
    const coreNode: WorldEntity3D = {
      id: 'ORION_CORE',
      name: 'ORION CORE',
      code: 'V9.4-DIGITAL-TWIN',
      type: 'Core Intelligence',
      archetype: 'ORION_CORE',
      group: 'DECISION',
      risk: 'normal',
      position: new THREE.Vector3(0, 0, 0),
      scale: 2.8,
      color: '#00F2FE',
      hierarchyLevel: 1,
      details: {
        status: 'ONLINE',
        system: 'ORION Digital Reality Kernel',
        neuralMesh: 'Active',
        frequency: '60Hz Continuous Telemetry',
        latency: '0.4ms'
      },
      metricLabel: 'WORLD ENGINE',
      metricValue: 'ACTIVE'
    };
    entities.push(coreNode);
    entityMap.set(coreNode.id, coreNode);

    // =========================================================================
    // 2. FIVE PRIMARY WORLDS / SPATIAL CLUSTER CENTERS
    // =========================================================================
    // SUPPLY: Upper region (Y: +34, Z: -32, X: -26)
    const SUPPLY_CENTER = new THREE.Vector3(-26, 34, -32);
    // PROCUREMENT: Upper-right (Y: +26, Z: -18, X: +36)
    const PROCUREMENT_CENTER = new THREE.Vector3(36, 26, -18);
    // INVENTORY: Left / Lower-left (Y: -6, Z: +10, X: -48)
    const INVENTORY_CENTER = new THREE.Vector3(-48, -6, 10);
    // LOGISTICS: Lower-right (Y: -18, Z: +28, X: +38)
    const LOGISTICS_CENTER = new THREE.Vector3(38, -18, 28);
    // CUSTOMERS: Bottom / Outer Forward (Y: -32, Z: +62, X: 0)
    const CUSTOMER_CENTER = new THREE.Vector3(0, -32, 62);
    // CONTROL / APEX: Upper elevation (Y: +52, Z: +6, X: 0)
    const CONTROL_CENTER = new THREE.Vector3(0, 52, 6);

    // =========================================================================
    // 3. SUPPLY CLUSTER ENTITIES (Suppliers, Factories, Materials)
    // =========================================================================
    const supplyEntities: WorldEntity3D[] = [];
    suppliers.forEach((sup, idx) => {
      const isHighRisk = (sup.defectRate && sup.defectRate > 2.5) || (sup.otif && sup.otif < 80);
      const isWarning = (sup.defectRate && sup.defectRate > 1.5) || (sup.otif && sup.otif < 90);
      const risk: EntityRiskState = isHighRisk ? 'high' : isWarning ? 'warning' : 'normal';

      // Deterministic radial constellation around SUPPLY_CENTER
      const angle = (idx / Math.max(1, suppliers.length)) * Math.PI * 2;
      const r = hashStringToRange(sup.id + '_sr', 9, 20);
      const x = SUPPLY_CENTER.x + Math.cos(angle) * r;
      const y = SUPPLY_CENTER.y + hashStringToRange(sup.id + '_sy', -5, 8);
      const z = SUPPLY_CENTER.z + Math.sin(angle) * r * 0.7;

      const isMajor = idx < 4 || isHighRisk; // Major entities are Level 2

      const entity: WorldEntity3D = {
        id: sup.id,
        name: sup.name,
        code: sup.id,
        type: 'Supplier',
        archetype: 'SUPPLIER',
        group: 'SUPPLY',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: isMajor ? 1.6 : 1.2,
        color: risk === 'high' ? '#EF4444' : risk === 'warning' ? '#F59E0B' : '#00F2FE',
        hierarchyLevel: isMajor ? 2 : 3,
        domainHubId: 'HUB_SUPPLY',
        details: sup,
        metricLabel: 'OTIF PERFORMANCE',
        metricValue: `${sup.otif || 94}%`,
        openIssuesCount: risk === 'high' ? 2 : 0,
        moduleRoute: '/suppliers'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      supplyEntities.push(entity);
    });

    // =========================================================================
    // 4. PROCUREMENT CLUSTER ENTITIES (Purchase Orders)
    // =========================================================================
    const procurementEntities: WorldEntity3D[] = [];
    purchaseOrders.slice(0, 18).forEach((po, idx) => {
      const isDelayed = po.status === 'Delayed' || po.status === 'Overdue';
      const isUrgent = po.totalValue > 50000;
      const risk: EntityRiskState = isDelayed ? 'high' : isUrgent ? 'warning' : 'normal';

      const angle = (idx / Math.max(1, Math.min(18, purchaseOrders.length))) * Math.PI * 2;
      const r = hashStringToRange(po.id + '_pr', 8, 18);
      const x = PROCUREMENT_CENTER.x + Math.cos(angle) * r;
      const y = PROCUREMENT_CENTER.y + hashStringToRange(po.id + '_py', -6, 6);
      const z = PROCUREMENT_CENTER.z + Math.sin(angle) * r * 0.8;

      const isMajor = idx < 4 || isDelayed;

      const entity: WorldEntity3D = {
        id: po.id,
        name: `PO #${po.id.replace(/^PO-/, '')}`,
        code: po.id,
        type: 'Purchase Order',
        archetype: 'PURCHASE_ORDER',
        group: 'PROCUREMENT',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: isMajor ? 1.35 : 1.05,
        color: risk === 'high' ? '#EF4444' : risk === 'warning' ? '#F59E0B' : '#F59E0B',
        hierarchyLevel: isMajor ? 2 : 3,
        domainHubId: 'HUB_PROCUREMENT',
        details: po,
        metricLabel: 'ORDER VALUE',
        metricValue: `$${(po.totalValue || 0).toLocaleString()}`,
        openIssuesCount: isDelayed ? 1 : 0,
        moduleRoute: '/procurement'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      procurementEntities.push(entity);
    });

    // =========================================================================
    // 5. INVENTORY CLUSTER ENTITIES (Warehouses & Physical SKUs)
    // =========================================================================
    const inventoryEntities: WorldEntity3D[] = [];
    warehouses.forEach((wh, idx) => {
      const angle = (idx / Math.max(1, warehouses.length)) * Math.PI * 1.6 - 0.8 * Math.PI;
      const r = hashStringToRange(wh.id + '_wr', 6, 14);
      const x = INVENTORY_CENTER.x + Math.cos(angle) * r;
      const y = INVENTORY_CENTER.y + hashStringToRange(wh.id + '_wy', -4, 4);
      const z = INVENTORY_CENTER.z + Math.sin(angle) * r;

      const entity: WorldEntity3D = {
        id: wh.id,
        name: wh.name,
        code: wh.id,
        type: 'Warehouse',
        archetype: 'WAREHOUSE',
        group: 'INVENTORY',
        risk: 'normal',
        position: new THREE.Vector3(x, y, z),
        scale: 1.8,
        color: '#10B981',
        hierarchyLevel: 2, // Warehouses are always Major Level 2
        domainHubId: 'HUB_INVENTORY',
        details: wh,
        metricLabel: 'FACILITY TYPE',
        metricValue: wh.location || 'Distribution Center',
        moduleRoute: '/warehouse'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      inventoryEntities.push(entity);
    });

    // SKUs / Materials clustered near warehouses
    products.slice(0, 16).forEach((prod, idx) => {
      const matchedInv = inventory.find(i => i.productId === prod.id);
      const isStockout = matchedInv && matchedInv.onHand <= matchedInv.safetyStock;
      const isCritical = prod.criticality === 'High' || prod.criticality === 'Critical';
      const risk: EntityRiskState = isStockout ? 'critical' : isCritical ? 'warning' : 'normal';

      const angle = (idx / 16) * Math.PI * 2;
      const r = hashStringToRange(prod.id + '_ir', 12, 22);
      const x = INVENTORY_CENTER.x + Math.cos(angle) * r;
      const y = INVENTORY_CENTER.y + hashStringToRange(prod.id + '_iy', -7, 7);
      const z = INVENTORY_CENTER.z + Math.sin(angle) * r;

      const isMajor = isStockout || idx < 3;

      const entity: WorldEntity3D = {
        id: prod.id,
        name: prod.name,
        code: prod.id,
        type: 'Material SKU',
        archetype: 'MATERIAL',
        group: 'INVENTORY',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: isMajor ? 1.25 : 1.0,
        color: risk === 'critical' ? '#EF4444' : risk === 'warning' ? '#F59E0B' : '#10B981',
        hierarchyLevel: isMajor ? 2 : 3,
        domainHubId: 'HUB_INVENTORY',
        details: { ...prod, inventory: matchedInv },
        metricLabel: 'STOCK ON HAND',
        metricValue: matchedInv ? `${matchedInv.onHand} units` : 'In Stock',
        openIssuesCount: isStockout ? 1 : 0,
        moduleRoute: '/inventory'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      inventoryEntities.push(entity);
    });

    // =========================================================================
    // 6. LOGISTICS CLUSTER ENTITIES (Moving Shipments & Freight Pipelines)
    // =========================================================================
    const logisticsEntities: WorldEntity3D[] = [];
    shipments.slice(0, 16).forEach((shp, idx) => {
      const isDelayed = shp.status === 'Delayed' || shp.delayDays > 0;
      const risk: EntityRiskState = isDelayed ? 'high' : shp.status === 'Exception' ? 'critical' : 'normal';

      const angle = (idx / Math.max(1, Math.min(16, shipments.length))) * Math.PI * 2;
      const r = hashStringToRange(shp.id + '_lr', 8, 18);
      const x = LOGISTICS_CENTER.x + Math.cos(angle) * r;
      const y = LOGISTICS_CENTER.y + hashStringToRange(shp.id + '_ly', -6, 6);
      const z = LOGISTICS_CENTER.z + Math.sin(angle) * r * 0.85;

      const isMajor = isDelayed || idx < 4;

      const entity: WorldEntity3D = {
        id: shp.id,
        name: `Shipment ${shp.id}`,
        code: shp.trackingNumber || shp.id,
        type: 'Shipment',
        archetype: 'SHIPMENT',
        group: 'LOGISTICS',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: isMajor ? 1.4 : 1.1,
        color: risk === 'high' || risk === 'critical' ? '#EF4444' : '#38BDF8',
        hierarchyLevel: isMajor ? 2 : 3,
        domainHubId: 'HUB_LOGISTICS',
        details: shp,
        metricLabel: 'CARRIER & STATUS',
        metricValue: `${shp.carrier} (${shp.status})`,
        openIssuesCount: isDelayed ? 1 : 0,
        moduleRoute: '/shipments'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      logisticsEntities.push(entity);
    });

    // =========================================================================
    // 7. CUSTOMER CLUSTER ENTITIES (Customers & Delivery Destinations)
    // =========================================================================
    const customerEntities: WorldEntity3D[] = [];
    customers.slice(0, 12).forEach((cust, idx) => {
      const angle = (idx / Math.max(1, Math.min(12, customers.length))) * Math.PI * 1.4 - 0.7 * Math.PI;
      const r = hashStringToRange(cust.id + '_cr', 7, 16);
      const x = CUSTOMER_CENTER.x + Math.sin(angle) * r * 1.2;
      const y = CUSTOMER_CENTER.y + hashStringToRange(cust.id + '_cy', -4, 4);
      const z = CUSTOMER_CENTER.z + Math.cos(angle) * r * 0.6;

      const isMajor = idx < 4;

      const entity: WorldEntity3D = {
        id: cust.id,
        name: cust.name,
        code: cust.id,
        type: 'Customer',
        archetype: 'CUSTOMER',
        group: 'CUSTOMER',
        risk: 'normal',
        position: new THREE.Vector3(x, y, z),
        scale: isMajor ? 1.5 : 1.15,
        color: '#A855F7',
        hierarchyLevel: isMajor ? 2 : 3,
        domainHubId: 'HUB_CUSTOMERS',
        details: cust,
        metricLabel: 'TIER & REGION',
        metricValue: `${cust.tier || 'Enterprise'} (${cust.region || 'North America'})`
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      customerEntities.push(entity);
    });

    // =========================================================================
    // 8. CONTROL & DECISION ENTITIES (Exceptions, Decisions, Actions)
    // =========================================================================
    const controlEntities: WorldEntity3D[] = [];
    exceptions.slice(0, 8).forEach((ex, idx) => {
      const isCritical = ex.severity === 'Critical';
      const risk: EntityRiskState = isCritical ? 'critical' : 'warning';

      const angle = (idx / Math.max(1, Math.min(8, exceptions.length))) * Math.PI * 2;
      const r = hashStringToRange(ex.id + '_er', 8, 16);
      const x = CONTROL_CENTER.x + Math.cos(angle) * r;
      const y = CONTROL_CENTER.y + hashStringToRange(ex.id + '_ey', -4, 6);
      const z = CONTROL_CENTER.z + Math.sin(angle) * r * 0.7;

      const entity: WorldEntity3D = {
        id: ex.id,
        name: ex.type,
        code: ex.id,
        type: 'Exception',
        archetype: 'EXCEPTION',
        group: 'CONTROL',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: 1.25,
        color: isCritical ? '#EF4444' : '#F59E0B',
        hierarchyLevel: 2,
        domainHubId: 'HUB_CONTROL',
        details: ex,
        metricLabel: 'SEVERITY & IMPACT',
        metricValue: `${ex.severity} ($${(ex.estimatedImpact || 0).toLocaleString()})`,
        moduleRoute: '/exceptions'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      controlEntities.push(entity);
    });

    decisions.slice(0, 6).forEach((dec, idx) => {
      const isCritical = dec.severity === 'CRITICAL';
      const risk: EntityRiskState = isCritical ? 'critical' : dec.severity === 'HIGH' ? 'high' : 'normal';

      const angle = (idx / Math.max(1, Math.min(6, decisions.length))) * Math.PI * 2 + 0.4;
      const r = hashStringToRange(dec.id + '_dr', 6, 14);
      const x = CONTROL_CENTER.x + Math.cos(angle) * r;
      const y = CONTROL_CENTER.y + hashStringToRange(dec.id + '_dy', -4, 4);
      const z = CONTROL_CENTER.z + Math.sin(angle) * r * 0.7;

      const entity: WorldEntity3D = {
        id: dec.id,
        name: dec.title,
        code: dec.id,
        type: 'Decision',
        archetype: 'DECISION',
        group: 'DECISION',
        risk,
        position: new THREE.Vector3(x, y, z),
        scale: 1.3,
        color: '#A855F7',
        hierarchyLevel: 2,
        domainHubId: 'HUB_CONTROL',
        details: dec,
        metricLabel: 'ORION CONFIDENCE',
        metricValue: `${dec.confidence || 'HIGH'} Confidence`,
        moduleRoute: '/decisions'
      };
      entities.push(entity);
      entityMap.set(entity.id, entity);
      controlEntities.push(entity);
    });

    // =========================================================================
    // 9. DOMAIN CLUSTERS SPECIFICATION (LEVEL 1)
    // =========================================================================
    const domainClusters: DomainCluster3D[] = [
      {
        id: 'HUB_SUPPLY',
        name: 'SUPPLY NETWORK',
        label: `${supplyEntities.length} ENTITIES`,
        group: 'SUPPLY',
        center: SUPPLY_CENTER,
        color: '#00F2FE',
        entityCount: supplyEntities.length,
        riskCount: supplyEntities.filter(e => e.risk === 'high' || e.risk === 'critical').length,
        entities: supplyEntities,
        cameraPreset: {
          pos: new THREE.Vector3(-26, 52, -2),
          lookAt: SUPPLY_CENTER
        }
      },
      {
        id: 'HUB_PROCUREMENT',
        name: 'PROCUREMENT',
        label: `${procurementEntities.length} ENTITIES`,
        group: 'PROCUREMENT',
        center: PROCUREMENT_CENTER,
        color: '#F59E0B',
        entityCount: procurementEntities.length,
        riskCount: procurementEntities.filter(e => e.risk === 'high' || e.risk === 'critical').length,
        entities: procurementEntities,
        cameraPreset: {
          pos: new THREE.Vector3(36, 46, 12),
          lookAt: PROCUREMENT_CENTER
        }
      },
      {
        id: 'HUB_INVENTORY',
        name: 'INVENTORY',
        label: `${inventoryEntities.length} ENTITIES`,
        group: 'INVENTORY',
        center: INVENTORY_CENTER,
        color: '#10B981',
        entityCount: inventoryEntities.length,
        riskCount: inventoryEntities.filter(e => e.risk === 'high' || e.risk === 'critical').length,
        entities: inventoryEntities,
        cameraPreset: {
          pos: new THREE.Vector3(-48, 16, 40),
          lookAt: INVENTORY_CENTER
        }
      },
      {
        id: 'HUB_LOGISTICS',
        name: 'LOGISTICS',
        label: `${logisticsEntities.length} ENTITIES`,
        group: 'LOGISTICS',
        center: LOGISTICS_CENTER,
        color: '#38BDF8',
        entityCount: logisticsEntities.length,
        riskCount: logisticsEntities.filter(e => e.risk === 'high' || e.risk === 'critical').length,
        entities: logisticsEntities,
        cameraPreset: {
          pos: new THREE.Vector3(38, 6, 58),
          lookAt: LOGISTICS_CENTER
        }
      },
      {
        id: 'HUB_CUSTOMERS',
        name: 'CUSTOMERS',
        label: `${customerEntities.length} ENTITIES`,
        group: 'CUSTOMER',
        center: CUSTOMER_CENTER,
        color: '#A855F7',
        entityCount: customerEntities.length,
        riskCount: 0,
        entities: customerEntities,
        cameraPreset: {
          pos: new THREE.Vector3(0, -6, 92),
          lookAt: CUSTOMER_CENTER
        }
      },
      {
        id: 'HUB_CONTROL',
        name: 'CONTROL',
        label: `${controlEntities.length} TELEMETRY`,
        group: 'CONTROL',
        center: CONTROL_CENTER,
        color: '#EF4444',
        entityCount: controlEntities.length,
        riskCount: controlEntities.filter(e => e.risk === 'high' || e.risk === 'critical').length,
        entities: controlEntities,
        cameraPreset: {
          pos: new THREE.Vector3(0, 72, 36),
          lookAt: CONTROL_CENTER
        }
      }
    ];

    // Add Domain Hubs as Level 1 Anchor Entities
    domainClusters.forEach(cluster => {
      const hubEntity: WorldEntity3D = {
        id: cluster.id,
        name: cluster.name,
        code: `${cluster.group}-HUB`,
        type: 'Domain Cluster',
        archetype: 'DOMAIN_HUB',
        group: cluster.group,
        risk: cluster.riskCount > 0 ? 'warning' : 'normal',
        position: cluster.center,
        scale: 2.2,
        color: cluster.color,
        hierarchyLevel: 1,
        details: {
          name: cluster.name,
          entitiesCount: cluster.entityCount,
          riskCount: cluster.riskCount
        },
        metricLabel: 'DOMAIN MEMBERS',
        metricValue: `${cluster.entityCount} Total`
      };
      entities.push(hubEntity);
      entityMap.set(hubEntity.id, hubEntity);
    });

    // =========================================================================
    // 10. RELATIONSHIPS & CLEAN ARTERIAL HIGHWAYS (NO SPAGHETTI)
    // =========================================================================
    const relationships: WorldRelationship3D[] = [];
    const addedRelKeys = new Set<string>();

    const addRelationship = (
      sourceId: string,
      targetId: string,
      flowType: RelationshipFlowType,
      name: string,
      color: string,
      speed = 1.0,
      isBackbone = false,
      isCritical = false
    ) => {
      const source = entityMap.get(sourceId);
      const target = entityMap.get(targetId);
      if (!source || !target || source.id === target.id) return;

      const relKey = `${sourceId}->${targetId}:${name}`;
      if (addedRelKeys.has(relKey)) return;
      addedRelKeys.add(relKey);

      // Smooth elevated 3D CatmullRom curve with arched apex
      const mid = new THREE.Vector3().addVectors(source.position, target.position).multiplyScalar(0.5);
      const dist = source.position.distanceTo(target.position);
      const lift = Math.min(22, Math.max(6, dist * 0.2));
      mid.y += lift;

      const curve = new THREE.CatmullRomCurve3([
        source.position.clone(),
        mid,
        target.position.clone()
      ]);

      relationships.push({
        id: `REL-${relationships.length + 1}`,
        sourceId,
        targetId,
        sourcePos: source.position,
        targetPos: target.position,
        curve,
        flowType,
        relationshipName: name,
        active: true,
        isBackbone,
        isCritical: isCritical || source.risk === 'high' || target.risk === 'high' || source.risk === 'critical' || target.risk === 'critical',
        flowSpeed: speed,
        color
      });
    };

    // A. MAJOR BACKBONE ARTERIAL HIGHWAYS (Only 8 clean, elegant highways!)
    // 1. Core <-> Supply
    addRelationship('ORION_CORE', 'HUB_SUPPLY', 'BACKBONE_HIGHWAY', 'MONITORS_SUPPLY', '#00F2FE', 0.8, true);
    // 2. Core <-> Procurement
    addRelationship('ORION_CORE', 'HUB_PROCUREMENT', 'BACKBONE_HIGHWAY', 'OBSERVES_PROCUREMENT', '#F59E0B', 0.8, true);
    // 3. Core <-> Inventory
    addRelationship('ORION_CORE', 'HUB_INVENTORY', 'BACKBONE_HIGHWAY', 'MONITORS_BUFFERS', '#10B981', 0.8, true);
    // 4. Core <-> Logistics
    addRelationship('ORION_CORE', 'HUB_LOGISTICS', 'BACKBONE_HIGHWAY', 'ORCHESTRATES_TRANSIT', '#38BDF8', 0.8, true);
    // 5. Supply -> Procurement (Lifecycle Commitments)
    addRelationship('HUB_SUPPLY', 'HUB_PROCUREMENT', 'BACKBONE_HIGHWAY', 'PRODUCTION_COMMITMENT', '#00F2FE', 0.9, true);
    // 6. Procurement -> Logistics (Freight Dispatches)
    addRelationship('HUB_PROCUREMENT', 'HUB_LOGISTICS', 'BACKBONE_HIGHWAY', 'DISPATCHES_FREIGHT', '#F59E0B', 0.9, true);
    // 7. Logistics -> Inventory (Inbound Stocking)
    addRelationship('HUB_LOGISTICS', 'HUB_INVENTORY', 'BACKBONE_HIGHWAY', 'WAREHOUSE_RECEIPTS', '#38BDF8', 0.9, true);
    // 8. Inventory -> Customer (Fulfillment)
    addRelationship('HUB_INVENTORY', 'HUB_CUSTOMERS', 'BACKBONE_HIGHWAY', 'FULFILLS_DEMAND', '#A855F7', 0.9, true);
    // 9. Core <-> Control (Apex Intelligence)
    addRelationship('ORION_CORE', 'HUB_CONTROL', 'BACKBONE_HIGHWAY', 'TELEMETRY_ANALYTICS', '#EF4444', 0.7, true);

    // B. AUTHENTIC ENTITY-LEVEL RELATIONSHIPS (for Entity focus, Trace Path, & Blast Radius)
    // Supplier -> PO
    purchaseOrders.forEach(po => {
      if (po.supplierId && entityMap.has(po.supplierId) && entityMap.has(po.id)) {
        const isDelay = po.status === 'Delayed';
        addRelationship(po.supplierId, po.id, 'TRANSACTION_FLOW', 'ISSUES_PO', isDelay ? '#EF4444' : '#F59E0B', 1.0, false, isDelay);
      }
    });

    // PO -> Shipment
    shipments.forEach(shp => {
      if (shp.poId && entityMap.has(shp.poId) && entityMap.has(shp.id)) {
        const isDelayed = shp.status === 'Delayed';
        addRelationship(shp.poId, shp.id, 'LOGISTICS_FLOW', 'SHIPPED_UNDER_PO', isDelayed ? '#EF4444' : '#38BDF8', 1.1, false, isDelayed);
      }
    });

    // Shipment -> Warehouse
    shipments.forEach(shp => {
      let whId = shp.warehouseId;
      if (!whId && shp.destination) {
        const matched = warehouses.find(w => shp.destination.toLowerCase().includes(w.name.toLowerCase()) || shp.destination === w.id);
        if (matched) whId = matched.id;
      }
      if (!whId && warehouses.length > 0) whId = warehouses[0].id;
      if (whId && entityMap.has(whId) && entityMap.has(shp.id)) {
        addRelationship(shp.id, whId, 'LOGISTICS_FLOW', 'DELIVERS_TO_WH', shp.status === 'Delayed' ? '#EF4444' : '#10B981', 1.0, false);
      }
    });

    // Warehouse -> SKU
    inventory.forEach(inv => {
      if (entityMap.has(inv.warehouseId) && entityMap.has(inv.productId)) {
        addRelationship(inv.warehouseId, inv.productId, 'MATERIAL_FLOW', 'STOCKS_SKU', inv.onHand <= inv.safetyStock ? '#EF4444' : '#10B981', 0.9, false);
      }
    });

    // Supplier -> SKU
    products.forEach(p => {
      if (p.supplierId && entityMap.has(p.supplierId) && entityMap.has(p.id)) {
        addRelationship(p.supplierId, p.id, 'MATERIAL_FLOW', 'PRODUCES_SKU', '#00F2FE', 0.8, false);
      }
    });

    // Warehouse -> Customer
    if (customers.length > 0) {
      customers.forEach((cust, cIdx) => {
        const targetWh = warehouses[cIdx % warehouses.length];
        if (targetWh && entityMap.has(targetWh.id) && entityMap.has(cust.id)) {
          addRelationship(targetWh.id, cust.id, 'MATERIAL_FLOW', 'FULFILLS_CUSTOMER', '#A855F7', 1.0, false);
        }
      });
    }

    // Entity -> Exception
    exceptions.forEach(ex => {
      if (ex.entityId && entityMap.has(ex.entityId) && entityMap.has(ex.id)) {
        addRelationship(ex.entityId, ex.id, 'RISK_FLOW', 'TRIGGERS_EXCEPTION', '#EF4444', 1.3, false, true);
      }
    });

    // Exception -> Decision
    decisions.forEach(dec => {
      if (dec.entityId && entityMap.has(dec.entityId) && entityMap.has(dec.id)) {
        addRelationship(dec.entityId, dec.id, 'INFORMATION_FLOW', 'ANALYZES_VARIANCE', '#A855F7', 1.1, false);
      }
    });

    const riskCount = entities.filter(e => e.risk === 'high' || e.risk === 'critical').length;

    return {
      entities,
      relationships,
      domainClusters,
      coreNode,
      stats: {
        totalEntities: entities.length,
        totalRelationships: relationships.length,
        riskEntitiesCount: riskCount,
        activeFlowCount: relationships.filter(r => r.active).length
      }
    };
  }

  /**
   * Breadth-First Graph Traversal to calculate the multi-hop blast radius of an entity
   */
  static calculateBlastRadius(
    rootId: string,
    allEntities: WorldEntity3D[],
    allRelationships: WorldRelationship3D[],
    maxHops = 3
  ): BlastRadiusResult | null {
    const entityMap = new Map<string, WorldEntity3D>(allEntities.map(e => [e.id, e]));
    const root = entityMap.get(rootId);
    if (!root) return null;

    const adj = new Map<string, { neighborId: string; rel: WorldRelationship3D }[]>();
    allRelationships.forEach(rel => {
      if (!adj.has(rel.sourceId)) adj.set(rel.sourceId, []);
      if (!adj.has(rel.targetId)) adj.set(rel.targetId, []);
      adj.get(rel.sourceId)!.push({ neighborId: rel.targetId, rel });
      adj.get(rel.targetId)!.push({ neighborId: rel.sourceId, rel });
    });

    const visited = new Set<string>([rootId]);
    let currentHopIds = [rootId];
    const levels: { hop: number; entities: WorldEntity3D[]; relationships: WorldRelationship3D[] }[] = [];
    let highestRisk: EntityRiskState = root.risk;

    for (let hop = 1; hop <= maxHops; hop++) {
      const nextHopIds: string[] = [];
      const hopEntities: WorldEntity3D[] = [];
      const hopRels: WorldRelationship3D[] = [];

      currentHopIds.forEach(currId => {
        const neighbors = adj.get(currId) || [];
        neighbors.forEach(({ neighborId, rel }) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            nextHopIds.push(neighborId);
            const ent = entityMap.get(neighborId);
            if (ent && ent.archetype !== 'DOMAIN_HUB') {
              hopEntities.push(ent);
              if (ent.risk === 'critical') highestRisk = 'critical';
              else if (ent.risk === 'high' && highestRisk !== 'critical') highestRisk = 'high';
            }
            hopRels.push(rel);
          }
        });
      });

      if (hopEntities.length > 0) {
        levels.push({ hop, entities: hopEntities, relationships: hopRels });
        currentHopIds = nextHopIds;
      } else {
        break;
      }
    }

    return {
      rootEntity: root,
      levels,
      totalImpactedCount: visited.size - 1,
      highestRiskSeverity: highestRisk
    };
  }

  /**
   * Finds the connected path between any two entities using BFS
   */
  static tracePath(
    startId: string,
    targetId: string,
    allEntities: WorldEntity3D[],
    allRelationships: WorldRelationship3D[]
  ): PathTraceResult {
    const entityMap = new Map<string, WorldEntity3D>(allEntities.map(e => [e.id, e]));
    const start = entityMap.get(startId);
    const target = entityMap.get(targetId);

    if (!start || !target) {
      return { found: false, pathNodes: [], pathEdges: [], hops: 0, summary: 'Entities not found' };
    }

    if (startId === targetId) {
      return { found: true, pathNodes: [start], pathEdges: [], hops: 0, summary: 'Direct node match' };
    }

    const adj = new Map<string, { neighborId: string; rel: WorldRelationship3D }[]>();
    allRelationships.forEach(rel => {
      if (!adj.has(rel.sourceId)) adj.set(rel.sourceId, []);
      if (!adj.has(rel.targetId)) adj.set(rel.targetId, []);
      adj.get(rel.sourceId)!.push({ neighborId: rel.targetId, rel });
      adj.get(rel.targetId)!.push({ neighborId: rel.sourceId, rel });
    });

    const queue: string[] = [startId];
    const prev = new Map<string, { fromNodeId: string; edge: WorldRelationship3D }>();
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetId) break;

      const neighbors = adj.get(curr) || [];
      for (const { neighborId, rel } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          prev.set(neighborId, { fromNodeId: curr, edge: rel });
          queue.push(neighborId);
        }
      }
    }

    if (!prev.has(targetId)) {
      return {
        found: false,
        pathNodes: [],
        pathEdges: [],
        hops: 0,
        summary: `No connected supply chain path found between ${start.name} and ${target.name}.`
      };
    }

    const pathNodes: WorldEntity3D[] = [];
    const pathEdges: WorldRelationship3D[] = [];
    let step: string | undefined = targetId;

    while (step && step !== startId) {
      const node = entityMap.get(step);
      if (node) pathNodes.unshift(node);
      const parent = prev.get(step);
      if (parent) {
        pathEdges.unshift(parent.edge);
        step = parent.fromNodeId;
      } else {
        break;
      }
    }
    pathNodes.unshift(start);

    return {
      found: true,
      pathNodes,
      pathEdges,
      hops: pathEdges.length,
      summary: `Connected path verified spanning ${pathEdges.length} hops: ${pathNodes.map(n => n.name).join(' → ')}.`
    };
  }
}
