/**
 * ORION-9 SCM CONTROL TOWER MISSION CONTROL TEST SUITE
 * Validates the 4-quadrant layout, operations panel, network map,
 * timeline milestones, contextual details panel, evidence package modal,
 * and Copilot context integration using renderToString.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ControlTowerWorkspace } from '../../components/controltower/ControlTowerWorkspace';
import { ControlTowerHeader } from '../../components/controltower/ControlTowerHeader';
import { ControlTowerOperationsPanel } from '../../components/controltower/ControlTowerOperationsPanel';
import { ControlTowerNetworkMap } from '../../components/controltower/ControlTowerNetworkMap';
import { ControlTowerTimeline } from '../../components/controltower/ControlTowerTimeline';
import { ControlTowerDetailsPanel } from '../../components/controltower/ControlTowerDetailsPanel';
import { EvidencePackageModal } from '../../components/controltower/EvidencePackageModal';
import { InventoryDecisionCenterView } from '../../components/controltower/InventoryDecisionCenterView';
import { FinancialImpactView } from '../../components/controltower/FinancialImpactView';
import { AIDecisionCenterView } from '../../components/controltower/AIDecisionCenterView';
import { MissionControlCardItem } from '../../components/controltower/missionControlTypes';
import { SupplyChainProvider } from '../../store/SupplyChainContext';
import { EntityDrawerProvider } from '../../store/EntityDrawerContext';
import { OrionWindowManager } from '../../os/WindowManagerContext';
import { MemoryRouter } from 'react-router-dom';

const mockMission: MissionControlCardItem = {
  id: 'msn-1298vb',
  missionNumber: 'Msn #: 1298VB',
  title: 'Pacific Freight Resupply Task Force',
  origin: 'PVG',
  destination: 'JKT',
  status: 'DELAYED',
  progress: 20,
  predictedDelayDays: 22,
  requestedDeliveryDate: '08/14/2026',
  predictedDeliveryDate: '09/05/2026',
  primaryTask: 'Resupply Class III - POL',
  subTasksCount: 5,
  capitalAtRisk: 84000,
  carrier: 'Pacific Ocean Carrier',
  sourceType: 'AUTONOMOUS_MISSION',
  categoryContributions: {
    intelligence: 45,
    anomalousAis: 35,
    weather: 15,
    capacity: 5,
  },
  milestones: [
    { name: 'Incheon, KOR', location: 'ICN', plannedDays: 4, actualOrPredictedDays: 4, status: 'COMPLETED', delayDays: 0, lat: 37.4, lng: 126.4 },
    { name: 'Jeju, KOR', location: 'CJU', plannedDays: 6, actualOrPredictedDays: 12, status: 'DELAYED', delayDays: 6, lat: 33.5, lng: 126.5 },
    { name: 'Okinawa, JPN', location: 'OKA', plannedDays: 2, actualOrPredictedDays: 4, status: 'IN_TRANSIT', delayDays: 2, lat: 26.2, lng: 127.6 },
    { name: 'Piti, GUAM', location: 'GUM', plannedDays: 8, actualOrPredictedDays: 8, status: 'PENDING', delayDays: 0, lat: 13.4, lng: 144.6 },
  ],
};

describe('ORION-9 Control Tower — Mission Control Center', () => {
  it('renders ControlTowerHeader with Mission Control badge and view toggles', () => {
    const html = renderToString(
      <ControlTowerHeader
        activeView="geospatial"
        onViewChange={() => {}}
        connectionStatus="CONNECTED"
        onRefresh={() => {}}
        onInspectSystemStatus={() => {}}
        isLoading={false}
        activeDomainName="Overview"
      />
    );

    expect(html).toContain('Control Tower');
    expect(html).toContain('Mission Control');
    expect(html).toContain('Geospatial');
    expect(html).toContain('Time Graph');
    expect(html).toContain('CONNECTED');
  });

  it('renders ControlTowerOperationsPanel with 4 quick actions and mission cards', () => {
    const html = renderToString(
      <ControlTowerOperationsPanel
        missions={[mockMission]}
        selectedMissionId="msn-1298vb"
        onSelectMission={() => {}}
        activeQuickAction="missions"
        onQuickActionChange={() => {}}
        currency="USD"
      />
    );

    expect(html).toContain('Quick Actions');
    expect(html).toContain('Missions');
    expect(html).toContain('Facilities');
    expect(html).toContain('Assets');
    expect(html).toContain('Risks');
    expect(html).toContain('Msn #: 1298VB');
    expect(html).toContain('PVG');
    expect(html).toContain('JKT');
    expect(html).toContain('20%');
  });

  it('renders ControlTowerNetworkMap with airport and seaport nodes and active route', () => {
    const html = renderToString(
      <ControlTowerNetworkMap
        selectedMission={mockMission}
      />
    );

    expect(html).toContain('Port Type');
    expect(html).toContain('Airport');
    expect(html).toContain('Seaport');
    expect(html).toContain('PVG');
    expect(html).toContain('JKT');
    expect(html).toContain('routeGradient');
  });

  it('renders ControlTowerTimeline with port transit durations and delay tags', () => {
    const html = renderToString(
      <ControlTowerTimeline
        selectedMission={mockMission}
      />
    );

    expect(html).toContain('Operational Port Milestones');
    expect(html).toContain('Transit Gantt');
    expect(html).toContain('Incheon, KOR');
    expect(html).toContain('Jeju, KOR');
    expect(html).toContain('+6d');
  });

  it('renders ControlTowerDetailsPanel with donut chart, delivery predictions, and copilot button', () => {
    const html = renderToString(
      <ControlTowerDetailsPanel
        selectedMission={mockMission}
        onAskCopilot={() => {}}
        onViewEvidencePackage={() => {}}
        onExecuteGovernedAction={() => {}}
        currency="USD"
      />
    );

    expect(html).toContain('Contribution by Category');
    expect(html).toContain('Intelligence');
    expect(html).toContain('Anomalous AIS');
    expect(html).toContain('Weather');
    expect(html).toContain('View Detail in Evidence Package');
    expect(html).toContain('Mission Detail');
    expect(html).toContain('Delivery Prediction Overtime');
    expect(html).toContain('Ask Orion Copilot About This Mission');
    expect(html).toContain('Formulate Governed Recovery Action');
  });

  it('renders EvidencePackageModal with audit trail and telemetry logs', () => {
    const html = renderToString(
      <EvidencePackageModal
        isOpen={true}
        onClose={() => {}}
        mission={mockMission}
        currency="USD"
      />
    );

    expect(html).toContain('Evidence Package:');
    expect(html).toContain('Msn #: 1298VB');
    expect(html).toContain('Authoritative Audit Trail');
    expect(html).toContain('AIS Vessel Geofence Deviation Flagged');
    expect(html).toContain('Port Terminal Berth Congestion Verified');
    expect(html).toContain('Close Package');
  });

  it('renders ControlTowerWorkspace integrated tree', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/command-center']}>
        <SupplyChainProvider>
          <ControlTowerWorkspace />
        </SupplyChainProvider>
      </MemoryRouter>
    );

    expect(html).toContain('Control Tower');
    expect(html).toContain('Network Health');
    expect(html).toContain('Capital at Risk');
    expect(html).toContain('AI Opportunity Detected');
  });

  it('renders InventoryDecisionCenterView with excess inventory metrics, AI recommendations, and location breakdown', () => {
    const html = renderToString(
      <InventoryDecisionCenterView
        inventory={[]}
        purchaseOrders={[]}
        suppliers={[]}
        warehouses={[]}
        currency="USD"
        onNavigateToView={() => {}}
        onSelectSku={() => {}}
        onSelectLocation={() => {}}
        onAskCopilotContext={() => {}}
        onExecuteRecommendation={async () => {}}
      />
    );

    expect(html).toContain('Excess Inventory Identified');
    expect(html).toContain('Working Capital Recoverable');
    expect(html).toContain('AI Recommendations');
    expect(html).toContain('Excess by Location');
    expect(html).toContain('Singapore');
    expect(html).toContain('Houston');
    expect(html).toContain('Highest Excess');
  });

  it('renders FinancialImpactView and AIDecisionCenterView', () => {
    const finHtml = renderToString(
      <FinancialImpactView
        currency="USD"
        onAskCopilot={() => {}}
      />
    );
    expect(finHtml).toContain('Total Working Capital Deployed');
    expect(finHtml).toContain('Working Capital Opportunity');

    const aiHtml = renderToString(
      <AIDecisionCenterView
        onAskCopilot={() => {}}
        currency="USD"
      />
    );
    expect(aiHtml).toContain('AI Decision Center');
    expect(aiHtml).toContain('Strategic Decision Prompts');
  });
});
