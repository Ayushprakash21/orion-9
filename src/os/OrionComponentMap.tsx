import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { Inventory } from '../components/Inventory';
import { Procurement } from '../components/Procurement';
import { Suppliers } from '../components/Suppliers';
import { Shipments } from '../components/Shipments';
import { Exceptions } from '../components/Exceptions';
import { AICopilot } from '../components/AICopilot';
import { Settings } from '../components/Settings';
import { About } from '../components/About';
import { Profile } from '../components/Profile';
import { ExecutiveOverview } from '../components/executive/ExecutiveOverview';
import { OrionBrowser } from '../components/browser/OrionBrowser';

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

// Lazy-loaded secondary, Deep Intelligence, Admin, and Enterprise Extension modules (code-split)
const DecisionCenter = createLazyApp(() => import('../components/DecisionCenter'), 'DecisionCenter');
const ApprovalCenter = createLazyApp(() => import('../components/ApprovalCenter'), 'ApprovalCenter');
const MasterDataManager = createLazyApp(() => import('../components/MasterDataManager'), 'MasterDataManager');
const QualityCenter = createLazyApp(() => import('../components/QualityCenter'), 'QualityCenter');
const FinanceMatchingCenter = createLazyApp(() => import('../components/FinanceMatchingCenter'), 'FinanceMatchingCenter');
const ReceivingGateCenter = createLazyApp(() => import('../components/ReceivingGateCenter'), 'ReceivingGateCenter');
const VendorOnboardingCenter = createLazyApp(() => import('../components/VendorOnboardingCenter'), 'VendorOnboardingCenter');
const DataCenter = createLazyApp(() => import('../components/DataCenter'), 'DataCenter');
const Integrations = createLazyApp(() => import('../components/Integrations'), 'Integrations');
const Notepad = createLazyApp(() => import('../components/Notepad'), 'Notepad');
const OrionComputer = createLazyApp(() => import('../components/OrionComputer'), 'OrionComputer');
const Inbound = createLazyApp(() => import('../components/Inbound'), 'Inbound');
const Outbound = createLazyApp(() => import('../components/Outbound'), 'Outbound');
const Predictions = createLazyApp(() => import('../components/Predictions'), 'Predictions');
const DemandForecasting = createLazyApp(() => import('../components/DemandForecasting'), 'DemandForecasting');
const InventoryOptimization = createLazyApp(() => import('../components/InventoryOptimization'), 'InventoryOptimization');
const Scenarios = createLazyApp(() => import('../components/Scenarios'), 'Scenarios');
const SyncMonitor = createLazyApp(() => import('../components/SyncMonitor'), 'SyncMonitor');
const DataQuality = createLazyApp(() => import('../components/DataQuality'), 'DataQuality');
const ContractIntelligence = createLazyApp(() => import('../components/ContractIntelligence'), 'ContractIntelligence');
const SupplierCommunication = createLazyApp(() => import('../components/SupplierCommunication'), 'SupplierCommunication');
const LogisticsIntelligence = createLazyApp(() => import('../components/LogisticsIntelligence'), 'LogisticsIntelligence');
const WarehouseOptimization = createLazyApp(() => import('../components/WarehouseOptimization'), 'WarehouseOptimization');
const Observability = createLazyApp(() => import('../components/Observability'), 'Observability');
const ActionCenter = createLazyApp(() => import('../components/ActionCenter'), 'ActionCenter');
const Autopilot = createLazyApp(() => import('../components/Autopilot'), 'Autopilot');
const WorkflowBuilder = createLazyApp(() => import('../components/WorkflowBuilder'), 'WorkflowBuilder');
const RiskRadar = createLazyApp(() => import('../components/RiskRadar'), 'RiskRadar');
const CostOptimizer = createLazyApp(() => import('../components/CostOptimizer'), 'CostOptimizer');
const WorkingCapital = createLazyApp(() => import('../components/WorkingCapital'), 'WorkingCapital');
const ManualCenter = createLazyApp(() => import('../components/ManualCenter'), 'ManualCenter');

const OrionIntelligenceCenter = createLazyApp(() => import('../components/deep-intelligence/OrionIntelligenceCenter'), 'OrionIntelligenceCenter');
const SignalLanguageView = createLazyApp(() => import('../components/deep-intelligence/SignalLanguageView'), 'SignalLanguageView');
const OrionMemoryView = createLazyApp(() => import('../components/deep-intelligence/OrionMemoryView'), 'OrionMemoryView');
const NetworkIntelligenceView = createLazyApp(() => import('../components/deep-intelligence/NetworkIntelligenceView'), 'NetworkIntelligenceView');
const DecisionScienceView = createLazyApp(() => import('../components/deep-intelligence/DecisionScienceView'), 'DecisionScienceView');
const AutonomyView = createLazyApp(() => import('../components/deep-intelligence/AutonomyView'), 'AutonomyView');
const CausalIntelligenceView = createLazyApp(() => import('../components/deep-intelligence/CausalIntelligenceView'), 'CausalIntelligenceView');
const EventFabricView = createLazyApp(() => import('../components/deep-intelligence/EventFabricView'), 'EventFabricView');
const CounterfactualView = createLazyApp(() => import('../components/deep-intelligence/CounterfactualView'), 'CounterfactualView');
const DecisionEconomicsView = createLazyApp(() => import('../components/deep-intelligence/DecisionEconomicsView'), 'DecisionEconomicsView');
const AttentionCenterView = createLazyApp(() => import('../components/deep-intelligence/AttentionCenterView'), 'AttentionCenterView');
const InformationGapsView = createLazyApp(() => import('../components/deep-intelligence/InformationGapsView'), 'InformationGapsView');
const ConstraintsView = createLazyApp(() => import('../components/deep-intelligence/ConstraintsView'), 'ConstraintsView');
const PoliciesView = createLazyApp(() => import('../components/deep-intelligence/PoliciesView'), 'PoliciesView');
const OutcomesView = createLazyApp(() => import('../components/deep-intelligence/OutcomesView'), 'OutcomesView');
const DecisionReplayView = createLazyApp(() => import('../components/deep-intelligence/DecisionReplayView'), 'DecisionReplayView');
const TimeMachineView = createLazyApp(() => import('../components/deep-intelligence/TimeMachineView'), 'TimeMachineView');
const DecisionDnaView = createLazyApp(() => import('../components/deep-intelligence/DecisionDnaView'), 'DecisionDnaView');
const HumanAiView = createLazyApp(() => import('../components/deep-intelligence/HumanAiView'), 'HumanAiView');
const VitalSignsView = createLazyApp(() => import('../components/deep-intelligence/VitalSignsView'), 'VitalSignsView');
const QuietRiskView = createLazyApp(() => import('../components/deep-intelligence/QuietRiskView'), 'QuietRiskView');

const AdminControlCenter = createLazyApp(() => import('../components/admin/AdminControlCenter'), 'AdminControlCenter');
const AIWorkforceCenter = createLazyApp(() => import('../components/admin/AIWorkforceCenter'), 'AIWorkforceCenter');
const AdminWorkflowBuilder = createLazyApp(() => import('../components/admin/WorkflowBuilder'), 'WorkflowBuilder');
const AdminAutonomyCenter = createLazyApp(() => import('../components/admin/AutonomyCenter'), 'AutonomyCenter');
const WorkflowMonitor = createLazyApp(() => import('../components/admin/WorkflowMonitor'), 'WorkflowMonitor');
const DigitalTwinCenter = createLazyApp(() => import('../components/admin/DigitalTwinCenter'), 'DigitalTwinCenter');
const ScenarioLab = createLazyApp(() => import('../components/admin/ScenarioLab'), 'ScenarioLab');
const ScenarioResultView = createLazyApp(() => import('../components/admin/ScenarioResultView'), 'ScenarioResultView');
const OutcomeCenter = createLazyApp(() => import('../components/admin/OutcomeCenter'), 'OutcomeCenter');
const LearningCenter = createLazyApp(() => import('../components/admin/LearningCenter'), 'LearningCenter');
const DriftCenter = createLazyApp(() => import('../components/admin/DriftCenter'), 'DriftCenter');
const RollbackCenter = createLazyApp(() => import('../components/admin/RollbackCenter'), 'RollbackCenter');
const ProductionReadinessCenter = createLazyApp(() => import('../components/admin/ProductionReadinessCenter'), 'ProductionReadinessCenter');
const OperationsCenter = createLazyApp(() => import('../components/admin/OperationsCenter'), 'OperationsCenter');
const IncidentCenter = createLazyApp(() => import('../components/admin/IncidentCenter'), 'IncidentCenter');
const ConfigurationCenter = createLazyApp(() => import('../components/admin/ConfigurationCenter'), 'ConfigurationCenter');
const ReleaseCenter = createLazyApp(() => import('../components/admin/ReleaseCenter'), 'ReleaseCenter');
const GlobalOperationsCenter = createLazyApp(() => import('../components/admin/GlobalOperationsCenter'), 'GlobalOperationsCenter');
const RegionalOperationsCenter = createLazyApp(() => import('../components/admin/RegionalOperationsCenter'), 'RegionalOperationsCenter');
const IntegrationControlCenter = createLazyApp(() => import('../components/admin/IntegrationControlCenter'), 'IntegrationControlCenter');
const TradingPartnerCenter = createLazyApp(() => import('../components/admin/TradingPartnerCenter'), 'TradingPartnerCenter');
const ReconciliationCenter = createLazyApp(() => import('../components/admin/ReconciliationCenter'), 'ReconciliationCenter');
const FailoverCenter = createLazyApp(() => import('../components/admin/FailoverCenter'), 'FailoverCenter');
const ScalePerformanceCenter = createLazyApp(() => import('../components/admin/ScalePerformanceCenter'), 'ScalePerformanceCenter');
const ManufacturingCenter = createLazyApp(() => import('../components/ManufacturingCenter'), 'ManufacturingCenter');
const ReturnsCenter = createLazyApp(() => import('../components/ReturnsCenter'), 'ReturnsCenter');
const SupplyPlanningCenter = createLazyApp(() => import('../components/SupplyPlanningCenter'), 'SupplyPlanningCenter');
const PlatformMaturityCenter = createLazyApp(() => import('../components/PlatformMaturityCenter'), 'PlatformMaturityCenter');
const AtpOrderPromisingCenter = createLazyApp(() => import('../components/AtpOrderPromisingCenter'), 'AtpOrderPromisingCenter');
const OutboundExecutionCenter = createLazyApp(() => import('../components/OutboundExecutionCenter'), 'OutboundExecutionCenter');
const DeliveryPodCenter = createLazyApp(() => import('../components/DeliveryPodCenter'), 'DeliveryPodCenter');
const FinanceLedgerCenter = createLazyApp(() => import('../components/FinanceLedgerCenter'), 'FinanceLedgerCenter');
const CustomsTradeCenter = createLazyApp(() => import('../components/CustomsTradeCenter'), 'CustomsTradeCenter');
const WarrantyServiceCenter = createLazyApp(() => import('../components/WarrantyServiceCenter'), 'WarrantyServiceCenter');
const SupplierCollaborationCenter = createLazyApp(() => import('../components/SupplierCollaborationCenter'), 'SupplierCollaborationCenter');
const NetworkDesignCenter = createLazyApp(() => import('../components/NetworkDesignCenter'), 'NetworkDesignCenter');
const SustainabilityCenter = createLazyApp(() => import('../components/SustainabilityCenter'), 'SustainabilityCenter');
const AutonomousCommandCenter = createLazyApp(() => import('../components/autonomy/AutonomousCommandCenter'), 'AutonomousCommandCenter');
const MultiPartyNetworkPortal = createLazyApp(() => import('../network/MultiPartyNetworkPortal'), 'MultiPartyNetworkPortal');
const GuidedBuyWorkflow = createLazyApp(() => import('../components/guided/GuidedBuyWorkflow'), 'GuidedBuyWorkflow');
const ProjectManagementCenter = createLazyApp(() => import('../components/projects/ProjectManagementCenter'), 'ProjectManagementCenter');
const FlowTracker = createLazyApp(() => import('../components/flow/FlowTracker'), 'FlowTracker');

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
  'project-management': ProjectManagementCenter,
  'flow-tracker': FlowTracker,
};

export function getAppComponent(appId: string): React.ComponentType<any> | null {
  return ORION_COMPONENT_MAP[appId] || null;
}
