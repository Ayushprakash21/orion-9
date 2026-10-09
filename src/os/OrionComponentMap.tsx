import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { Inventory } from '../components/Inventory';
import { Procurement } from '../components/Procurement';
import { Suppliers } from '../components/Suppliers';
import { Shipments } from '../components/Shipments';
import { Exceptions } from '../components/Exceptions';
import { DecisionCenter } from '../components/DecisionCenter';
import { ApprovalCenter } from '../components/ApprovalCenter';
import { MasterDataManager } from '../components/MasterDataManager';
import { QualityCenter } from '../components/QualityCenter';
import { FinanceMatchingCenter } from '../components/FinanceMatchingCenter';
import { ReceivingGateCenter } from '../components/ReceivingGateCenter';
import { VendorOnboardingCenter } from '../components/VendorOnboardingCenter';
import { AICopilot } from '../components/AICopilot';
import { DataCenter } from '../components/DataCenter';
import { Integrations } from '../components/Integrations';
import { Settings } from '../components/Settings';
import { Notepad } from '../components/Notepad';
import { OrionComputer } from '../components/OrionComputer';
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
import { RiskRadar } from '../components/RiskRadar';
import { CostOptimizer } from '../components/CostOptimizer';
import { WorkingCapital } from '../components/WorkingCapital';
import { OrionIntelligenceCenter } from '../components/deep-intelligence/OrionIntelligenceCenter';
import { SignalLanguageView } from '../components/deep-intelligence/SignalLanguageView';
import { OrionMemoryView } from '../components/deep-intelligence/OrionMemoryView';
import { NetworkIntelligenceView } from '../components/deep-intelligence/NetworkIntelligenceView';
import { DecisionScienceView } from '../components/deep-intelligence/DecisionScienceView';
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
import { ManualCenter } from '../components/ManualCenter';

import { AdminControlCenter } from '../components/admin/AdminControlCenter';
import { AIWorkforceCenter } from '../components/admin/AIWorkforceCenter';
import { WorkflowBuilder as AdminWorkflowBuilder } from '../components/admin/WorkflowBuilder';
import { AutonomyCenter as AdminAutonomyCenter } from '../components/admin/AutonomyCenter';
import { WorkflowMonitor } from '../components/admin/WorkflowMonitor';
import { DigitalTwinCenter } from '../components/admin/DigitalTwinCenter';
import { ScenarioLab } from '../components/admin/ScenarioLab';
import { ScenarioResultView } from '../components/admin/ScenarioResultView';
import { OutcomeCenter } from '../components/admin/OutcomeCenter';
import { LearningCenter } from '../components/admin/LearningCenter';
import { DriftCenter } from '../components/admin/DriftCenter';
import { RollbackCenter } from '../components/admin/RollbackCenter';
import { ProductionReadinessCenter } from '../components/admin/ProductionReadinessCenter';
import { OperationsCenter } from '../components/admin/OperationsCenter';
import { IncidentCenter } from '../components/admin/IncidentCenter';
import { ConfigurationCenter } from '../components/admin/ConfigurationCenter';
import { ReleaseCenter } from '../components/admin/ReleaseCenter';
import { GlobalOperationsCenter } from '../components/admin/GlobalOperationsCenter';
import { RegionalOperationsCenter } from '../components/admin/RegionalOperationsCenter';
import { IntegrationControlCenter } from '../components/admin/IntegrationControlCenter';
import { TradingPartnerCenter } from '../components/admin/TradingPartnerCenter';
import { ReconciliationCenter } from '../components/admin/ReconciliationCenter';
import { FailoverCenter } from '../components/admin/FailoverCenter';
import { ScalePerformanceCenter } from '../components/admin/ScalePerformanceCenter';
import { ManufacturingCenter } from '../components/ManufacturingCenter';
import { ReturnsCenter } from '../components/ReturnsCenter';
import { SupplyPlanningCenter } from '../components/SupplyPlanningCenter';
import { PlatformMaturityCenter } from '../components/PlatformMaturityCenter';
import { AtpOrderPromisingCenter } from '../components/AtpOrderPromisingCenter';
import { OutboundExecutionCenter } from '../components/OutboundExecutionCenter';
import { DeliveryPodCenter } from '../components/DeliveryPodCenter';
import { FinanceLedgerCenter } from '../components/FinanceLedgerCenter';
import { CustomsTradeCenter } from '../components/CustomsTradeCenter';
import { WarrantyServiceCenter } from '../components/WarrantyServiceCenter';
import { SupplierCollaborationCenter } from '../components/SupplierCollaborationCenter';
import { NetworkDesignCenter } from '../components/NetworkDesignCenter';
import { SustainabilityCenter } from '../components/SustainabilityCenter';
import { AutonomousCommandCenter } from '../components/autonomy/AutonomousCommandCenter';
import { MultiPartyNetworkPortal } from '../network/MultiPartyNetworkPortal';
import { GuidedBuyWorkflow } from '../components/guided/GuidedBuyWorkflow';
import { ExecutiveOverview } from '../components/executive/ExecutiveOverview';

function createLazyApp(
  loader: () => Promise<any>,
  exportName?: string
): React.ComponentType<any> {
  const LazyComponent = React.lazy(async () => {
    const mod = await loader();
    if (exportName && mod[exportName]) {
      return { default: mod[exportName] };
    }
    if (mod.default) {
      return { default: mod.default };
    }
    const found = Object.values(mod).find((val) => typeof val === 'function');
    return { default: (found as any) || (() => null) };
  });

  return function LazyAppWrapper(props: any) {
    return (
      <React.Suspense
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-950/80 select-none">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <div className="text-xs uppercase tracking-widest text-slate-400 font-mono">Loading Module...</div>
          </div>
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

// Lazy-loaded heavy components (Office suite & Three.js 3D engines)
const DigitalTwin = createLazyApp(() => import('../components/DigitalTwin'), 'DigitalTwin');
const WorldModelView = createLazyApp(() => import('../components/deep-intelligence/WorldModelView'), 'WorldModelView');
const TimeWorld = createLazyApp(() => import('../components/TimeWorld'), 'TimeWorld');
const OrionDocuments = createLazyApp(() => import('../components/office'), 'OrionDocuments');
const OrionSheets = createLazyApp(() => import('../components/office'), 'OrionSheets');
const OrionSlides = createLazyApp(() => import('../components/office'), 'OrionSlides');
const OrionPdf = createLazyApp(() => import('../components/office'), 'OrionPdf');
const Reports = createLazyApp(() => import('../components/Reports'), 'Reports');
const DocumentWorkspace = createLazyApp(() => import('../components/DocumentWorkspace'), 'DocumentWorkspace');
const PlatformIntelligence = createLazyApp(() => import('../components/admin/PlatformIntelligence'), 'PlatformIntelligence');
const FileManager = createLazyApp(() => import('../components/FileManager'), 'FileManager');
const OrionBrowser = createLazyApp(() => import('../components/browser/OrionBrowser'), 'OrionBrowser');

const ProfileUserView: React.FC = () => <Profile initialTab="profile" />;
const ProfileOrgView: React.FC = () => <Profile initialTab="organization" />;

export const ORION_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  'executive-overview': ExecutiveOverview,
  'command-center': Dashboard,
  'autonomous-command-center': AutonomousCommandCenter,
  'multi-party-network': MultiPartyNetworkPortal,
  'buy-workflow': GuidedBuyWorkflow,
  'inventory': Inventory,
  'procurement': Procurement,
  'suppliers': Suppliers,
  'shipments': Shipments,
  'exceptions': Exceptions,
  'decisions': DecisionCenter,
  'approval-center': ApprovalCenter,
  'ai-workforce': AIWorkforceCenter,
  'master-data': MasterDataManager,
  'quality': QualityCenter,
  'invoice-matching': FinanceMatchingCenter,
  'gate-receiving': ReceivingGateCenter,
  'vendor-onboarding': VendorOnboardingCenter,
  'orion-ai': AICopilot,
  'reports': Reports,
  'documents': DocumentWorkspace,
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
  'autonomy-center': AdminAutonomyCenter,
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
  'time-world': TimeWorld,
  'user-manual': ManualCenter,
  'organization': ProfileOrgView,
  'control-center': AdminControlCenter,
  'platform-intelligence': PlatformIntelligence,
  'workflow-builder': AdminWorkflowBuilder,
  'workflow-monitor': WorkflowMonitor,
  'digital-twin-center': DigitalTwinCenter,
  'scenario-lab': ScenarioLab,
  'scenario-result': ScenarioResultView,
  'outcome-center': OutcomeCenter,
  'learning-center': LearningCenter,
  'drift-center': DriftCenter,
  'rollback-center': RollbackCenter,
  'production-readiness': ProductionReadinessCenter,
  'operations-center': OperationsCenter,
  'incident-center': IncidentCenter,
  'configuration-center': ConfigurationCenter,
  'release-center': ReleaseCenter,
  'global-operations': GlobalOperationsCenter,
  'regional-operations': RegionalOperationsCenter,
  'integration-gateway': IntegrationControlCenter,
  'trading-partners': TradingPartnerCenter,
  'reconciliation-center': ReconciliationCenter,
  'failover-center': FailoverCenter,
  'scale-performance': ScalePerformanceCenter,
  'manufacturing': ManufacturingCenter,
  'returns': ReturnsCenter,
  'supply-planning': SupplyPlanningCenter,
  'platform-maturity': PlatformMaturityCenter,
  'atp-center': AtpOrderPromisingCenter,
  'outbound-execution': OutboundExecutionCenter,
  'delivery-pod': DeliveryPodCenter,
  'finance-ledger': FinanceLedgerCenter,
  'customs-trade': CustomsTradeCenter,
  'warranty-service': WarrantyServiceCenter,
  'supplier-collaboration': SupplierCollaborationCenter,
  'network-design': NetworkDesignCenter,
  'sustainability': SustainabilityCenter,
  'file-manager': FileManager,
  'notepad': Notepad,
  'orion-computer': OrionComputer,
  'recycle-bin': () => <FileManager initialFolderKey="recycle_bin" />,
  'orion-documents': OrionDocuments,
  'orion-sheets': OrionSheets,
  'orion-slides': OrionSlides,
  'orion-pdf': OrionPdf,
  'browser': OrionBrowser,
};

export function getAppComponent(appId: string): React.ComponentType<any> | null {
  return ORION_COMPONENT_MAP[appId] || null;
}
