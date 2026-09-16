import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { Inventory } from '../components/Inventory';
import { Procurement } from '../components/Procurement';
import { Suppliers } from '../components/Suppliers';
import { Shipments } from '../components/Shipments';
import { Exceptions } from '../components/Exceptions';
import { DecisionCenter } from '../components/DecisionCenter';
import { AICopilot } from '../components/AICopilot';
import { DataCenter } from '../components/DataCenter';
import { Integrations } from '../components/Integrations';
import { Reports } from '../components/Reports';
import { Settings } from '../components/Settings';
import { Inbound } from '../components/Inbound';
import { Outbound } from '../components/Outbound';
import { Predictions } from '../components/Predictions';
import { DemandForecasting } from '../components/DemandForecasting';
import { InventoryOptimization } from '../components/InventoryOptimization';
import { Scenarios } from '../components/Scenarios';
import { SyncMonitor } from '../components/SyncMonitor';
import { DataQuality } from '../components/DataQuality';
import { ContractIntelligence } from '../components/ContractIntelligence';
import { SupplierCommunication } from '../components/SupplierCommunication';
import { LogisticsIntelligence } from '../components/LogisticsIntelligence';
import { WarehouseOptimization } from '../components/WarehouseOptimization';
import { Observability } from '../components/Observability';
import { ActionCenter } from '../components/ActionCenter';
import { Autopilot } from '../components/Autopilot';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { DigitalTwin } from '../components/DigitalTwin';
import { RiskRadar } from '../components/RiskRadar';
import { CostOptimizer } from '../components/CostOptimizer';
import { WorkingCapital } from '../components/WorkingCapital';
import { OrionIntelligenceCenter } from '../components/deep-intelligence/OrionIntelligenceCenter';
import { SignalLanguageView } from '../components/deep-intelligence/SignalLanguageView';
import { OrionMemoryView } from '../components/deep-intelligence/OrionMemoryView';
import { NetworkIntelligenceView } from '../components/deep-intelligence/NetworkIntelligenceView';
import { DecisionScienceView } from '../components/deep-intelligence/DecisionScienceView';
import { WorldModelView } from '../components/deep-intelligence/WorldModelView';
import { AutonomyView } from '../components/deep-intelligence/AutonomyView';
import { CausalIntelligenceView } from '../components/deep-intelligence/CausalIntelligenceView';
import { EventFabricView } from '../components/deep-intelligence/EventFabricView';
import { CounterfactualView } from '../components/deep-intelligence/CounterfactualView';
import { DecisionEconomicsView } from '../components/deep-intelligence/DecisionEconomicsView';
import { AttentionCenterView } from '../components/deep-intelligence/AttentionCenterView';
import { InformationGapsView } from '../components/deep-intelligence/InformationGapsView';
import { ConstraintsView } from '../components/deep-intelligence/ConstraintsView';
import { PoliciesView } from '../components/deep-intelligence/PoliciesView';
import { OutcomesView } from '../components/deep-intelligence/OutcomesView';
import { DecisionReplayView } from '../components/deep-intelligence/DecisionReplayView';
import { TimeMachineView } from '../components/deep-intelligence/TimeMachineView';
import { DecisionDnaView } from '../components/deep-intelligence/DecisionDnaView';
import { HumanAiView } from '../components/deep-intelligence/HumanAiView';
import { VitalSignsView } from '../components/deep-intelligence/VitalSignsView';
import { QuietRiskView } from '../components/deep-intelligence/QuietRiskView';
import { About } from '../components/About';
import { Profile } from '../components/Profile';

const ProfileUserView: React.FC = () => <Profile initialTab="profile" />;
const ProfileOrgView: React.FC = () => <Profile initialTab="organization" />;

export const ORION_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  'command-center': Dashboard,
  'inventory': Inventory,
  'procurement': Procurement,
  'suppliers': Suppliers,
  'shipments': Shipments,
  'exceptions': Exceptions,
  'decisions': DecisionCenter,
  'orion-ai': AICopilot,
  'reports': Reports,
  'settings': Settings,
  'inbound': Inbound,
  'outbound': Outbound,
  'warehouse': WarehouseOptimization,
  'predictions': Predictions,
  'demand-forecasting': DemandForecasting,
  'inventory-optimization': InventoryOptimization,
  'scenarios': Scenarios,
  'digital-twin': DigitalTwin,
  'risk-radar': RiskRadar,
  'action-center': ActionCenter,
  'autopilot': Autopilot,
  'workflows': WorkflowBuilder,
  'memory': OrionMemoryView,
  'intelligence-center': OrionIntelligenceCenter,
  'signal-language': SignalLanguageView,
  'network-intelligence': NetworkIntelligenceView,
  'decision-science': DecisionScienceView,
  'world-model': WorldModelView,
  'data': DataCenter,
  'data-quality': DataQuality,
  'integrations': Integrations,
  'observability': Observability,
  'cost-optimizer': CostOptimizer,
  'working-capital': WorkingCapital,
  'contracts': ContractIntelligence,
  'supplier-comms': SupplierCommunication,
  'logistics': LogisticsIntelligence,
  'event-fabric': EventFabricView,
  'autonomy-center': AutonomyView,
  'causal-intelligence': CausalIntelligenceView,
  'counterfactual': CounterfactualView,
  'decision-economics': DecisionEconomicsView,
  'attention-center': AttentionCenterView,
  'information-gaps': InformationGapsView,
  'constraints': ConstraintsView,
  'policies': PoliciesView,
  'outcomes': OutcomesView,
  'decision-replay': DecisionReplayView,
  'time-machine': TimeMachineView,
  'decision-dna': DecisionDnaView,
  'human-ai': HumanAiView,
  'vital-signs': VitalSignsView,
  'quiet-risk': QuietRiskView,
  'sync': SyncMonitor,
  'about': About,
  'profile': ProfileUserView,
  'organization': ProfileOrgView,
};

export function getAppComponent(appId: string): React.ComponentType<any> | null {
  return ORION_COMPONENT_MAP[appId] || null;
}
