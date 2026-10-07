import React from 'react';
import { AutonomousMission } from '../../autonomy/types';
import { Shipment, Exception } from '../../types';

export type MissionControlFilterType = 'ALL' | 'AIRPORT' | 'SEAPORT' | 'WAREHOUSE' | 'SUPPLIER';

export interface MissionControlCardItem {
  id: string; // missionId or synthetic shipment id
  missionNumber: string; // e.g. "Msn #: 1298VB"
  title: string;
  origin: string; // e.g. "PVG"
  destination: string; // e.g. "JKT"
  status: 'DELAYED' | 'ON_TIME' | 'CRITICAL' | 'COMPLETED';
  progress: number; // 0 to 100
  predictedDelayDays: number; // e.g. 22
  requestedDeliveryDate: string; // ISO or formatted
  predictedDeliveryDate: string;
  primaryTask: string; // e.g. "Resupply Class III - POL"
  subTasksCount: number;
  capitalAtRisk: number;
  carrier?: string;
  sourceType: 'AUTONOMOUS_MISSION' | 'SHIPMENT' | 'EXCEPTION';
  categoryContributions: {
    intelligence: number;
    anomalousAis: number;
    weather: number;
    capacity: number;
  };
  milestones: Array<{
    name: string;
    location: string;
    plannedDays: number;
    actualOrPredictedDays: number;
    status: 'COMPLETED' | 'IN_TRANSIT' | 'DELAYED' | 'PENDING';
    delayDays: number;
    lat: number;
    lng: number;
  }>;
}

export interface MapNode {
  id: string;
  name: string;
  type: 'airport' | 'seaport' | 'warehouse' | 'supplier';
  x: number; // SVG percentage coordinate (0-100)
  y: number; // SVG percentage coordinate (0-100)
  code?: string;
  city?: string;
  activeStatus?: 'normal' | 'congested' | 'delayed' | 'alert';
}

export interface MapRoute {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: 'active' | 'delayed' | 'nominal';
  polylinePoints: string; // SVG path or coordinates
}
