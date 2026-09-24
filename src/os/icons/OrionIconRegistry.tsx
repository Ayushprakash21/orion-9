import React from 'react';
import {
  IconCommandCenter,
  IconInventory,
  IconProcurement,
  IconSuppliers,
  IconShipments,
  IconQuality,
  IconInvoiceMatching,
  IconGateReceiving,
  IconInbound,
  IconOutbound,
  IconWarehouse,
  IconCostOptimizer,
  IconWorkingCapital,
  IconContracts,
  IconSupplierComms,
  IconLogistics,
  IconVitalSigns,
  IconTradingPartners,
  IconManufacturing,
  IconReturns,
  IconSupplyPlanning,
  IconAtpCenter,
  IconOutboundExecution,
  IconDeliveryPod,
  IconWarrantyService,
  IconSupplierCollaboration
} from './icons/OperationsIcons';

import {
  IconWorldModel,
  IconOrionAi,
  IconPredictions,
  IconDemandForecasting,
  IconInventoryOptimization,
  IconScenarios,
  IconDigitalTwin,
  IconRiskRadar,
  IconMemory,
  IconIntelligenceCenter,
  IconSignalLanguage,
  IconNetworkIntelligence,
  IconDecisionScience,
  IconEventFabric,
  IconCausalIntelligence,
  IconCounterfactual,
  IconDecisionEconomics,
  IconInformationGaps,
  IconOutcomes,
  IconDecisionReplay,
  IconTimeMachine,
  IconDecisionDna,
  IconHumanAi,
  IconQuietRisk,
  IconWorkflowMonitor,
  IconDigitalTwinCenter,
  IconScenarioLab,
  IconScenarioResult,
  IconLearningCenter,
  IconDriftCenter,
  IconNetworkDesign,
  IconSustainability
} from './icons/IntelligenceIcons';

import {
  IconExceptions,
  IconApprovalCenter,
  IconAiWorkforce,
  IconVendorOnboarding,
  IconDecisions,
  IconActionCenter,
  IconAutopilot,
  IconWorkflows,
  IconAutonomyCenter,
  IconAttentionCenter,
  IconConstraints,
  IconPolicies,
  IconControlCenter,
  IconWorkflowBuilder,
  IconOutcomeCenter,
  IconRollbackCenter,
  IconOperationsCenter,
  IconIncidentCenter,
  IconGlobalOperations,
  IconRegionalOperations,
  IconReconciliationCenter,
  IconFailoverCenter,
  IconFinanceLedger,
  IconCustomsTrade
} from './icons/ControlIcons';

import {
  IconMasterData,
  IconReports,
  IconDocuments,
  IconUserManual,
  IconSettings,
  IconData,
  IconDataQuality,
  IconIntegrations,
  IconObservability,
  IconSync,
  IconAbout,
  IconTimeWorld,
  IconProfile,
  IconOrganization,
  IconPlatformIntelligence,
  IconProductionReadiness,
  IconConfigurationCenter,
  IconReleaseCenter,
  IconIntegrationGateway,
  IconScalePerformance,
  IconPlatformMaturity,
  IconFileManager,
  IconNotepad,
  IconOrionComputer,
  IconRecycleBin
} from './icons/PlatformIcons';

export interface OrionIconDefinition {
  appId: string;
  iconId: string;
  name: string;
  category: 'Operations' | 'Intelligence' | 'Control' | 'Platform' | 'AI';
  description: string;
  palette: {
    from: string;
    to: string;
    accent: string;
    surface: string;
  };
  component: React.FC<{ size?: number; className?: string; active?: boolean }>;
}

// ---------------------------------------------------------------------------
// Base Icon Container Helper Component
// ---------------------------------------------------------------------------
interface IconBaseProps {
  size?: number;
  className?: string;
  active?: boolean;
  gradientId: string;
  from: string;
  to: string;
  accent?: string;
  children: React.ReactNode;
}

export const OrionSquircleBase: React.FC<IconBaseProps> = ({
  size = 48,
  className = '',
  active = false,
  gradientId,
  from,
  to,
  children
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={`select-none overflow-visible transition-transform duration-200 ${className}`}
      role="img"
    >
      <defs>
        {/* Main Body Gradient */}
        <linearGradient id={`${gradientId}-bg`} x1="16" y1="8" x2="112" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>

        {/* Specular Top Sheen */}
        <linearGradient id={`${gradientId}-sheen`} x1="64" y1="8" x2="64" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Inner Border Rim */}
        <linearGradient id={`${gradientId}-rim`} x1="64" y1="8" x2="64" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>

        {/* Drop Shadow Filter */}
        <filter id={`${gradientId}-shadow`} x="-10%" y="-5%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.38" />
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>

        {/* Glyph Glow / Shadow */}
        <filter id={`${gradientId}-glyph-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Outer Ground Shadow & Base Squircle */}
      <rect
        x="10"
        y="10"
        width="108"
        height="108"
        rx="26"
        fill={`url(#${gradientId}-bg)`}
        filter={`url(#${gradientId}-shadow)`}
      />

      {/* Top Gloss Highlight Sheen */}
      <path
        d="M 10 36 C 10 21.6 21.6 10 36 10 L 92 10 C 106.4 10 118 21.6 118 36 L 118 52 C 118 52 88 64 64 64 C 40 64 10 52 10 52 Z"
        fill={`url(#${gradientId}-sheen)`}
      />

      {/* Inner Precision Rim Stroke */}
      <rect
        x="10.5"
        y="10.5"
        width="107"
        height="107"
        rx="25.5"
        stroke={`url(#${gradientId}-rim)`}
        strokeWidth="1.2"
        fill="none"
      />

      {/* Central Artwork Foreground */}
      <g filter={`url(#${gradientId}-glyph-shadow)`}>
        {children}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Fallback Sovereign Icon for unknown IDs
// ---------------------------------------------------------------------------
export const IconOrionGeneric: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-generic" from="#334155" to="#0F172A" {...props}>
    <circle cx="64" cy="64" r="28" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
    <polygon points="64,42 78,74 50,74" fill="#00F2FE" />
  </OrionSquircleBase>
);

// ---------------------------------------------------------------------------
// Authoritative 103-Application Icon Registry
// ---------------------------------------------------------------------------
export const ORION_ICON_REGISTRY: Record<string, OrionIconDefinition> = {
  // === Operations ===
  'command-center': {
    appId: 'command-center',
    iconId: 'icon-cmd-center',
    name: 'Command Center',
    category: 'Operations',
    description: 'Central supply chain control tower and multi-domain observability.',
    palette: { from: '#0F2027', to: '#203A43', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconCommandCenter
  },
  'inventory': {
    appId: 'inventory',
    iconId: 'icon-inventory',
    name: 'Inventory',
    category: 'Operations',
    description: 'Global inventory positioning and stock health.',
    palette: { from: '#059669', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconInventory
  },
  'procurement': {
    appId: 'procurement',
    iconId: 'icon-procurement',
    name: 'Procurement',
    category: 'Operations',
    description: 'Purchase orders and material requisitions.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconProcurement
  },
  'suppliers': {
    appId: 'suppliers',
    iconId: 'icon-suppliers',
    name: 'Suppliers',
    category: 'Operations',
    description: 'Supplier health, performance, and communication.',
    palette: { from: '#2563EB', to: '#1E3A8A', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconSuppliers
  },
  'shipments': {
    appId: 'shipments',
    iconId: 'icon-shipments',
    name: 'Shipments',
    category: 'Operations',
    description: 'Inbound and outbound logistics tracking.',
    palette: { from: '#EA580C', to: '#7C2D12', accent: '#F97316', surface: '#F9731615' },
    component: IconShipments
  },
  'quality': {
    appId: 'quality',
    iconId: 'icon-quality',
    name: 'Quality Center',
    category: 'Operations',
    description: 'AQL lot inspection, defect quarantine, and NCRs.',
    palette: { from: '#E11D48', to: '#881337', accent: '#F43F5E', surface: '#F43F5E15' },
    component: IconQuality
  },
  'invoice-matching': {
    appId: 'invoice-matching',
    iconId: 'icon-inv-match',
    name: 'Invoice 3-Way Match',
    category: 'Operations',
    description: 'Automated 3-way cross-referencing and variance approval.',
    palette: { from: '#0D9488', to: '#134E4A', accent: '#14B8A6', surface: '#14B8A615' },
    component: IconInvoiceMatching
  },
  'gate-receiving': {
    appId: 'gate-receiving',
    iconId: 'icon-gate-recv',
    name: 'Gate & GRN Center',
    category: 'Operations',
    description: 'Carrier check-in, dock allocation, and GRN posting.',
    palette: { from: '#1D4ED8', to: '#172554', accent: '#2563EB', surface: '#2563EB15' },
    component: IconGateReceiving
  },
  'inbound': {
    appId: 'inbound',
    iconId: 'icon-inbound',
    name: 'Inbound Logistics',
    category: 'Operations',
    description: 'Inbound receiving and staging operations.',
    palette: { from: '#2563EB', to: '#1E40AF', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconInbound
  },
  'outbound': {
    appId: 'outbound',
    iconId: 'icon-outbound',
    name: 'Outbound Logistics',
    category: 'Operations',
    description: 'Outbound fulfillment and dispatch workflows.',
    palette: { from: '#F97316', to: '#9A3412', accent: '#FB923C', surface: '#FB923C15' },
    component: IconOutbound
  },
  'warehouse': {
    appId: 'warehouse',
    iconId: 'icon-warehouse',
    name: 'Warehouse Operations',
    category: 'Operations',
    description: 'High-bay rack layout and bin allocation.',
    palette: { from: '#047857', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconWarehouse
  },
  'cost-optimizer': {
    appId: 'cost-optimizer',
    iconId: 'icon-cost-opt',
    name: 'Cost Optimizer',
    category: 'Operations',
    description: 'Cost reduction and freight margin maximization.',
    palette: { from: '#059669', to: '#022C22', accent: '#10B981', surface: '#10B98115' },
    component: IconCostOptimizer
  },
  'working-capital': {
    appId: 'working-capital',
    iconId: 'icon-working-cap',
    name: 'Working Capital',
    category: 'Operations',
    description: 'Cash conversion cycle (CCC) and liquidity optimization.',
    palette: { from: '#15803D', to: '#14532D', accent: '#22C55E', surface: '#22C55E15' },
    component: IconWorkingCapital
  },
  'contracts': {
    appId: 'contracts',
    iconId: 'icon-contracts',
    name: 'Contracts',
    category: 'Operations',
    description: 'Enterprise supplier contract management and SLA tracking.',
    palette: { from: '#4F46E5', to: '#312E81', accent: '#6366F1', surface: '#6366F115' },
    component: IconContracts
  },
  'supplier-comms': {
    appId: 'supplier-comms',
    iconId: 'icon-comms',
    name: 'Communications',
    category: 'Operations',
    description: 'Supplier communication and operational dialogue.',
    palette: { from: '#0284C7', to: '#075985', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconSupplierComms
  },
  'logistics': {
    appId: 'logistics',
    iconId: 'icon-logistics',
    name: 'Logistics',
    category: 'Operations',
    description: 'Freight lanes, carrier assignment, and tracking.',
    palette: { from: '#C2410C', to: '#7C2D12', accent: '#EA580C', surface: '#EA580C15' },
    component: IconLogistics
  },
  'vital-signs': {
    appId: 'vital-signs',
    iconId: 'icon-vital-signs',
    name: 'Vital Signs',
    category: 'Operations',
    description: 'Core operational pulses, throughputs, and system health.',
    palette: { from: '#DC2626', to: '#7F1D1D', accent: '#EF4444', surface: '#EF444415' },
    component: IconVitalSigns
  },
  'trading-partners': {
    appId: 'trading-partners',
    iconId: 'icon-trading-partners',
    name: 'Trading Partner Center',
    category: 'Operations',
    description: 'EDI trading partner lifecycle management and compliance.',
    palette: { from: '#7C3AED', to: '#4C1D95', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconTradingPartners
  },
  'manufacturing': {
    appId: 'manufacturing',
    iconId: 'icon-mfg',
    name: 'Manufacturing & MRP',
    category: 'Operations',
    description: 'Multi-level BOMs, work centers, and shop floor execution.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconManufacturing
  },
  'returns': {
    appId: 'returns',
    iconId: 'icon-returns',
    name: 'Returns & Reverse Logistics',
    category: 'Operations',
    description: 'RMA processing, receiving inspection, and credit notes.',
    palette: { from: '#E11D48', to: '#881337', accent: '#EF4444', surface: '#EF444415' },
    component: IconReturns
  },
  'supply-planning': {
    appId: 'supply-planning',
    iconId: 'icon-supply-plan',
    name: 'Supply Planning & MRP',
    category: 'Operations',
    description: 'Gross-to-net demand netting and master supply schedules.',
    palette: { from: '#0891B2', to: '#164E63', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconSupplyPlanning
  },
  'atp-center': {
    appId: 'atp-center',
    iconId: 'icon-atp',
    name: 'ATP & Order Promising',
    category: 'Operations',
    description: 'Deterministic Available-to-Promise order netting.',
    palette: { from: '#00F2FE', to: '#0369A1', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconAtpCenter
  },
  'outbound-execution': {
    appId: 'outbound-execution',
    iconId: 'icon-out-exec',
    name: 'Outbound & Wave Picking',
    category: 'Operations',
    description: 'Wave release orchestration and SSCC carton packing.',
    palette: { from: '#F59E0B', to: '#92400E', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconOutboundExecution
  },
  'delivery-pod': {
    appId: 'delivery-pod',
    iconId: 'icon-del-pod',
    name: 'Last-Mile & Digital POD',
    category: 'Operations',
    description: 'Carrier milestone tracking and cryptographic Proof of Delivery.',
    palette: { from: '#3B82F6', to: '#1E3A8A', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconDeliveryPod
  },
  'warranty-service': {
    appId: 'warranty-service',
    iconId: 'icon-warranty',
    name: 'Warranty & Supplier RTV',
    category: 'Operations',
    description: 'Serialized warranty claim validation and supplier recovery.',
    palette: { from: '#DB2777', to: '#831843', accent: '#EC4899', surface: '#EC489915' },
    component: IconWarrantyService
  },
  'supplier-collaboration': {
    appId: 'supplier-collaboration',
    iconId: 'icon-cpfr',
    name: 'Supplier CPFR & Capacity',
    category: 'Operations',
    description: 'Collaborative Planning, Forecasting, and Replenishment.',
    palette: { from: '#06B6D4', to: '#164E63', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconSupplierCollaboration
  },

  // === Intelligence ===
  'world-model': {
    appId: 'world-model',
    iconId: 'icon-world-model',
    name: 'World Model',
    category: 'Intelligence',
    description: 'Living digital replica of global supply chains and operations.',
    palette: { from: '#0E7490', to: '#083344', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconWorldModel
  },
  'orion-ai': {
    appId: 'orion-ai',
    iconId: 'icon-orion-ai',
    name: 'Orion AI',
    category: 'AI',
    description: 'Autonomous reasoning, anomaly diagnosis, and guidance.',
    palette: { from: '#7E22CE', to: '#3B0764', accent: '#A855F7', surface: '#A855F715' },
    component: IconOrionAi
  },
  'predictions': {
    appId: 'predictions',
    iconId: 'icon-predictions',
    name: 'Predictions',
    category: 'Intelligence',
    description: 'AI-driven forecasting and lead-time predictions.',
    palette: { from: '#8B5CF6', to: '#4C1D95', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconPredictions
  },
  'demand-forecasting': {
    appId: 'demand-forecasting',
    iconId: 'icon-demand-fc',
    name: 'Demand Forecasting',
    category: 'Intelligence',
    description: 'Multi-horizon demand sensing and prediction.',
    palette: { from: '#9333EA', to: '#581C87', accent: '#A855F7', surface: '#A855F715' },
    component: IconDemandForecasting
  },
  'inventory-optimization': {
    appId: 'inventory-optimization',
    iconId: 'icon-inv-opt',
    name: 'Inventory Optimization',
    category: 'Intelligence',
    description: 'Safety stock balancing and MEIO optimization.',
    palette: { from: '#0D9488', to: '#115E59', accent: '#14B8A6', surface: '#14B8A615' },
    component: IconInventoryOptimization
  },
  'scenarios': {
    appId: 'scenarios',
    iconId: 'icon-scenarios',
    name: 'Scenarios',
    category: 'Intelligence',
    description: 'What-if simulation and disruption modeling.',
    palette: { from: '#0284C7', to: '#0369A1', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconScenarios
  },
  'digital-twin': {
    appId: 'digital-twin',
    iconId: 'icon-digital-twin',
    name: 'Digital Twin',
    category: 'Intelligence',
    description: 'Real-time multi-echelon network simulation.',
    palette: { from: '#0891B2', to: '#155E75', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconDigitalTwin
  },
  'risk-radar': {
    appId: 'risk-radar',
    iconId: 'icon-risk-radar',
    name: 'Risk Radar',
    category: 'Intelligence',
    description: 'Multi-tier risk detection and disruption scoring.',
    palette: { from: '#B91C1C', to: '#450A0A', accent: '#EF4444', surface: '#EF444415' },
    component: IconRiskRadar
  },
  'memory': {
    appId: 'memory',
    iconId: 'icon-memory',
    name: 'Orion Memory',
    category: 'Intelligence',
    description: 'Long-term cognitive memory across past decisions.',
    palette: { from: '#6D28D9', to: '#2E1065', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconMemory
  },
  'intelligence-center': {
    appId: 'intelligence-center',
    iconId: 'icon-intel-center',
    name: 'Deep Intelligence',
    category: 'Intelligence',
    description: 'Full Deep Intelligence cognitive plane.',
    palette: { from: '#581C87', to: '#1E1B4B', accent: '#A855F7', surface: '#A855F715' },
    component: IconIntelligenceCenter
  },
  'signal-language': {
    appId: 'signal-language',
    iconId: 'icon-signal-lang',
    name: 'Signal Language',
    category: 'Intelligence',
    description: 'Unified cross-system signal grammar.',
    palette: { from: '#7C3AED', to: '#3B0764', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconSignalLanguage
  },
  'network-intelligence': {
    appId: 'network-intelligence',
    iconId: 'icon-net-intel',
    name: 'Network Intelligence',
    category: 'Intelligence',
    description: 'Multi-tier dependency and bottleneck discovery.',
    palette: { from: '#4338CA', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconNetworkIntelligence
  },
  'decision-science': {
    appId: 'decision-science',
    iconId: 'icon-dec-sci',
    name: 'Decision Science',
    category: 'Intelligence',
    description: 'Algorithmic policy and optimization models.',
    palette: { from: '#B45309', to: '#451A03', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconDecisionScience
  },
  'event-fabric': {
    appId: 'event-fabric',
    iconId: 'icon-event-fabric',
    name: 'Event Fabric',
    category: 'Intelligence',
    description: 'Live enterprise event streaming and causal tracing.',
    palette: { from: '#0284C7', to: '#082F49', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconEventFabric
  },
  'causal-intelligence': {
    appId: 'causal-intelligence',
    iconId: 'icon-causal',
    name: 'Causal Engine',
    category: 'Intelligence',
    description: 'Root cause and downstream impact analysis.',
    palette: { from: '#0D9488', to: '#042F2E', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconCausalIntelligence
  },
  'counterfactual': {
    appId: 'counterfactual',
    iconId: 'icon-counterfactual',
    name: 'Counterfactual',
    category: 'Intelligence',
    description: 'What-if outcome comparison for past actions.',
    palette: { from: '#1D4ED8', to: '#172554', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconCounterfactual
  },
  'decision-economics': {
    appId: 'decision-economics',
    iconId: 'icon-dec-econ',
    name: 'Economics',
    category: 'Intelligence',
    description: 'Cost-benefit and revenue trade-off analysis.',
    palette: { from: '#15803D', to: '#052E16', accent: '#10B981', surface: '#10B98115' },
    component: IconDecisionEconomics
  },
  'information-gaps': {
    appId: 'information-gaps',
    iconId: 'icon-info-gaps',
    name: 'Information Gaps',
    category: 'Intelligence',
    description: 'Detection of missing signals and blind spots.',
    palette: { from: '#BE185D', to: '#500724', accent: '#EC4899', surface: '#EC489915' },
    component: IconInformationGaps
  },
  'outcomes': {
    appId: 'outcomes',
    iconId: 'icon-outcomes',
    name: 'Outcomes',
    category: 'Intelligence',
    description: 'Historical decision outcome tracking and accuracy.',
    palette: { from: '#047857', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconOutcomes
  },
  'decision-replay': {
    appId: 'decision-replay',
    iconId: 'icon-dec-replay',
    name: 'Decision Replay',
    category: 'Intelligence',
    description: 'Step-by-step playback of past automated decisions.',
    palette: { from: '#6D28D9', to: '#2E1065', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconDecisionReplay
  },
  'time-machine': {
    appId: 'time-machine',
    iconId: 'icon-time-mach',
    name: 'Time Machine',
    category: 'Intelligence',
    description: 'Historical state inspection and temporal replay.',
    palette: { from: '#0369A1', to: '#082F49', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconTimeMachine
  },
  'decision-dna': {
    appId: 'decision-dna',
    iconId: 'icon-dec-dna',
    name: 'Decision DNA',
    category: 'Intelligence',
    description: 'Evolutionary history of decision policies.',
    palette: { from: '#4338CA', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconDecisionDna
  },
  'human-ai': {
    appId: 'human-ai',
    iconId: 'icon-human-ai',
    name: 'Human-AI Teaming',
    category: 'Intelligence',
    description: 'Cooperative oversight, trust metrics, and delegation.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconHumanAi
  },
  'quiet-risk': {
    appId: 'quiet-risk',
    iconId: 'icon-quiet-risk',
    name: 'Quiet Risk',
    category: 'Intelligence',
    description: 'Sub-threshold systemic risks and latent vulnerabilities.',
    palette: { from: '#C2410C', to: '#431407', accent: '#F97316', surface: '#F9731615' },
    component: IconQuietRisk
  },
  'workflow-monitor': {
    appId: 'workflow-monitor',
    iconId: 'icon-wf-mon',
    name: 'Workflow Monitor',
    category: 'Intelligence',
    description: 'Live instance trace spans and execution timelines.',
    palette: { from: '#0284C7', to: '#075985', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconWorkflowMonitor
  },
  'digital-twin-center': {
    appId: 'digital-twin-center',
    iconId: 'icon-dt-center',
    name: 'Digital Twin Center',
    category: 'Intelligence',
    description: 'Enterprise multi-relational supply chain topology.',
    palette: { from: '#0891B2', to: '#164E63', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconDigitalTwinCenter
  },
  'scenario-lab': {
    appId: 'scenario-lab',
    iconId: 'icon-scen-lab',
    name: 'Scenario Lab',
    category: 'Intelligence',
    description: 'Deterministic what-if simulations and trade-offs.',
    palette: { from: '#4F46E5', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconScenarioLab
  },
  'scenario-result': {
    appId: 'scenario-result',
    iconId: 'icon-scen-res',
    name: 'Scenario Results',
    category: 'Intelligence',
    description: 'Analytical impact inspector and risk contagion paths.',
    palette: { from: '#4338CA', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconScenarioResult
  },
  'learning-center': {
    appId: 'learning-center',
    iconId: 'icon-learning',
    name: 'Learning Center',
    category: 'Intelligence',
    description: 'Systemic learning signals and improvement proposals.',
    palette: { from: '#7E22CE', to: '#3B0764', accent: '#A855F7', surface: '#A855F715' },
    component: IconLearningCenter
  },
  'drift-center': {
    appId: 'drift-center',
    iconId: 'icon-drift',
    name: 'Drift Center',
    category: 'Intelligence',
    description: 'Continuous concept and data drift monitoring.',
    palette: { from: '#9333EA', to: '#3B0764', accent: '#A855F7', surface: '#A855F715' },
    component: IconDriftCenter
  },
  'network-design': {
    appId: 'network-design',
    iconId: 'icon-net-design',
    name: 'Network Design & Scenarios',
    category: 'Intelligence',
    description: 'Supply chain network topology modeling and scenarios.',
    palette: { from: '#4F46E5', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconNetworkDesign
  },
  'sustainability': {
    appId: 'sustainability',
    iconId: 'icon-sustainability',
    name: 'Sustainability & ESG Center',
    category: 'Intelligence',
    description: 'Scope 1, 2, and 3 carbon accounting and CBAM metrics.',
    palette: { from: '#15803D', to: '#052E16', accent: '#10B981', surface: '#10B98115' },
    component: IconSustainability
  },

  // === Control ===
  'exceptions': {
    appId: 'exceptions',
    iconId: 'icon-exceptions',
    name: 'Exceptions',
    category: 'Control',
    description: 'Supply chain disruptions and risk alerts.',
    palette: { from: '#DC2626', to: '#7F1D1D', accent: '#EF4444', surface: '#EF444415' },
    component: IconExceptions
  },
  'approval-center': {
    appId: 'approval-center',
    iconId: 'icon-approvals',
    name: 'Approval Center',
    category: 'Control',
    description: 'Centralized human-in-the-loop governance.',
    palette: { from: '#0284C7', to: '#082F49', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconApprovalCenter
  },
  'ai-workforce': {
    appId: 'ai-workforce',
    iconId: 'icon-ai-workforce',
    name: 'AI Workforce Center',
    category: 'Control',
    description: 'Governed enterprise AI workforce management.',
    palette: { from: '#0E7490', to: '#164E63', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconAiWorkforce
  },
  'vendor-onboarding': {
    appId: 'vendor-onboarding',
    iconId: 'icon-vendor-onb',
    name: 'Vendor Onboarding & RFQ',
    category: 'Control',
    description: 'Supplier due diligence and RFQ quotation management.',
    palette: { from: '#6D28D9', to: '#2E1065', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconVendorOnboarding
  },
  'decisions': {
    appId: 'decisions',
    iconId: 'icon-decisions',
    name: 'Decisions',
    category: 'Control',
    description: 'Governed decision records and execution.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconDecisions
  },
  'action-center': {
    appId: 'action-center',
    iconId: 'icon-action-ctr',
    name: 'Action Center',
    category: 'Control',
    description: 'Prescriptive operational action queue.',
    palette: { from: '#EA580C', to: '#7C2D12', accent: '#F97316', surface: '#F9731615' },
    component: IconActionCenter
  },
  'autopilot': {
    appId: 'autopilot',
    iconId: 'icon-autopilot',
    name: 'Autopilot',
    category: 'Control',
    description: 'Autonomous execution rules and policies.',
    palette: { from: '#7C3AED', to: '#3B0764', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconAutopilot
  },
  'workflows': {
    appId: 'workflows',
    iconId: 'icon-workflows',
    name: 'Workflows',
    category: 'Control',
    description: 'State machine workflow definitions.',
    palette: { from: '#0284C7', to: '#082F49', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconWorkflows
  },
  'autonomy-center': {
    appId: 'autonomy-center',
    iconId: 'icon-autonomy-ctr',
    name: 'Autonomy Center',
    category: 'Control',
    description: 'Autonomy levels, bounded authority, and guardrails.',
    palette: { from: '#6D28D9', to: '#1E1B4B', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconAutonomyCenter
  },
  'attention-center': {
    appId: 'attention-center',
    iconId: 'icon-attention',
    name: 'Attention Center',
    category: 'Control',
    description: 'Operator focus routing and critical queue.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconAttentionCenter
  },
  'constraints': {
    appId: 'constraints',
    iconId: 'icon-constraints',
    name: 'Constraints',
    category: 'Control',
    description: 'Physical, regulatory, and policy boundaries.',
    palette: { from: '#4338CA', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconConstraints
  },
  'policies': {
    appId: 'policies',
    iconId: 'icon-policies',
    name: 'Policies',
    category: 'Control',
    description: 'Enterprise governance rules and policy engine.',
    palette: { from: '#1D4ED8', to: '#172554', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconPolicies
  },
  'control-center': {
    appId: 'control-center',
    iconId: 'icon-ctrl-ctr',
    name: 'AI + Manual Control Center',
    category: 'Control',
    description: 'Governed path from policy to execution and audit.',
    palette: { from: '#0F766E', to: '#134E4A', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconControlCenter
  },
  'workflow-builder': {
    appId: 'workflow-builder',
    iconId: 'icon-wf-builder',
    name: 'Workflow Builder',
    category: 'Control',
    description: 'Visual workflow orchestration and simulation.',
    palette: { from: '#0284C7', to: '#0369A1', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconWorkflowBuilder
  },
  'outcome-center': {
    appId: 'outcome-center',
    iconId: 'icon-outcome-ctr',
    name: 'Outcome Center',
    category: 'Control',
    description: 'Closed-loop telemetry and decision effectiveness.',
    palette: { from: '#047857', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconOutcomeCenter
  },
  'rollback-center': {
    appId: 'rollback-center',
    iconId: 'icon-rollback',
    name: 'Rollback Center',
    category: 'Control',
    description: 'Governed configuration version ledger and rollback.',
    palette: { from: '#B91C1C', to: '#7F1D1D', accent: '#EF4444', surface: '#EF444415' },
    component: IconRollbackCenter
  },
  'operations-center': {
    appId: 'operations-center',
    iconId: 'icon-ops-ctr',
    name: 'Operations Center',
    category: 'Control',
    description: 'Real-time telemetry and circuit breakers.',
    palette: { from: '#0F766E', to: '#115E59', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconOperationsCenter
  },
  'incident-center': {
    appId: 'incident-center',
    iconId: 'icon-incident-ctr',
    name: 'Incident Center',
    category: 'Control',
    description: 'SEV1-SEV4 incident triage and blast radius scoring.',
    palette: { from: '#991B1B', to: '#450A0A', accent: '#DC2626', surface: '#DC262615' },
    component: IconIncidentCenter
  },
  'global-operations': {
    appId: 'global-operations',
    iconId: 'icon-global-ops',
    name: 'Global Operations',
    category: 'Control',
    description: '7-level organizational hierarchy and governance.',
    palette: { from: '#0369A1', to: '#082F49', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconGlobalOperations
  },
  'regional-operations': {
    appId: 'regional-operations',
    iconId: 'icon-reg-ops',
    name: 'Regional Operations',
    category: 'Control',
    description: 'Multi-region topology and sovereign data residency.',
    palette: { from: '#0891B2', to: '#155E75', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconRegionalOperations
  },
  'reconciliation-center': {
    appId: 'reconciliation-center',
    iconId: 'icon-recon-ctr',
    name: 'Reconciliation Center',
    category: 'Control',
    description: 'Cross-system ledger reconciliation and exposure.',
    palette: { from: '#D97706', to: '#78350F', accent: '#F59E0B', surface: '#F59E0B15' },
    component: IconReconciliationCenter
  },
  'failover-center': {
    appId: 'failover-center',
    iconId: 'icon-failover',
    name: 'Failover & Fencing',
    category: 'Control',
    description: 'Multi-region failover and distributed fencing tokens.',
    palette: { from: '#991B1B', to: '#450A0A', accent: '#EF4444', surface: '#EF444415' },
    component: IconFailoverCenter
  },
  'finance-ledger': {
    appId: 'finance-ledger',
    iconId: 'icon-fin-ledger',
    name: 'Finance & Working Capital',
    category: 'Control',
    description: 'Customer billing, 5-bucket AR aging, and AP matching.',
    palette: { from: '#059669', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconFinanceLedger
  },
  'customs-trade': {
    appId: 'customs-trade',
    iconId: 'icon-customs',
    name: 'Customs & Trade Compliance',
    category: 'Control',
    description: 'Customs declarations, HS codes, and port releases.',
    palette: { from: '#6D28D9', to: '#3B0764', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconCustomsTrade
  },

  // === Platform ===
  'master-data': {
    appId: 'master-data',
    iconId: 'icon-master-data',
    name: 'Data & Integration Fabric',
    category: 'Platform',
    description: 'Master Data Lifecycle and ERP Integration Contracts.',
    palette: { from: '#4F46E5', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconMasterData
  },
  'reports': {
    appId: 'reports',
    iconId: 'icon-reports',
    name: 'Reports',
    category: 'Platform',
    description: 'Operational and executive report generation.',
    palette: { from: '#4338CA', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconReports
  },
  'documents': {
    appId: 'documents',
    iconId: 'icon-documents',
    name: 'Documents',
    category: 'Platform',
    description: 'Document management and attachments.',
    palette: { from: '#475569', to: '#0F172A', accent: '#94A3B8', surface: '#94A3B815' },
    component: IconDocuments
  },
  'user-manual': {
    appId: 'user-manual',
    iconId: 'icon-manual',
    name: 'User Manual',
    category: 'Platform',
    description: 'Field operation guide and system documentation.',
    palette: { from: '#0891B2', to: '#164E63', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconUserManual
  },
  'settings': {
    appId: 'settings',
    iconId: 'icon-settings',
    name: 'Settings',
    category: 'Platform',
    description: 'Platform configuration and preferences.',
    palette: { from: '#475569', to: '#1E293B', accent: '#94A3B8', surface: '#94A3B815' },
    component: IconSettings
  },
  'data': {
    appId: 'data',
    iconId: 'icon-data',
    name: 'Data Center',
    category: 'Platform',
    description: 'Data health, pipelines, and schema status.',
    palette: { from: '#0284C7', to: '#082F49', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconData
  },
  'data-quality': {
    appId: 'data-quality',
    iconId: 'icon-data-qual',
    name: 'Data Quality',
    category: 'Platform',
    description: 'Schema integrity and completeness scoring.',
    palette: { from: '#059669', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconDataQuality
  },
  'integrations': {
    appId: 'integrations',
    iconId: 'icon-integrations',
    name: 'Integrations',
    category: 'Platform',
    description: 'External ERP, WMS, and TMS connections.',
    palette: { from: '#4F46E5', to: '#1E1B4B', accent: '#6366F1', surface: '#6366F115' },
    component: IconIntegrations
  },
  'observability': {
    appId: 'observability',
    iconId: 'icon-observability',
    name: 'Observability',
    category: 'Platform',
    description: 'System health, logs, and telemetry metrics.',
    palette: { from: '#1D4ED8', to: '#172554', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconObservability
  },
  'sync': {
    appId: 'sync',
    iconId: 'icon-sync',
    name: 'Sync Monitor',
    category: 'Platform',
    description: 'Live ERP, WMS, and TMS synchronization state.',
    palette: { from: '#0891B2', to: '#155E75', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconSync
  },
  'about': {
    appId: 'about',
    iconId: 'icon-about',
    name: 'About ORION',
    category: 'Platform',
    description: 'Operating environment version, build, and architecture.',
    palette: { from: '#0F172A', to: '#020617', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconAbout
  },
  'time-world': {
    appId: 'time-world',
    iconId: 'icon-time-world',
    name: 'Time & World',
    category: 'Platform',
    description: 'Global time zones, live time, and world clock.',
    palette: { from: '#0284C7', to: '#075985', accent: '#0EA5E9', surface: '#0EA5E915' },
    component: IconTimeWorld
  },
  'profile': {
    appId: 'profile',
    iconId: 'icon-profile',
    name: 'User Profile',
    category: 'Platform',
    description: 'Operator credentials, role, and preferences.',
    palette: { from: '#2563EB', to: '#1E3A8A', accent: '#3B82F6', surface: '#3B82F615' },
    component: IconProfile
  },
  'organization': {
    appId: 'organization',
    iconId: 'icon-org',
    name: 'Organization',
    category: 'Platform',
    description: 'Enterprise organization profile and domain settings.',
    palette: { from: '#6D28D9', to: '#3B0764', accent: '#8B5CF6', surface: '#8B5CF615' },
    component: IconOrganization
  },
  'platform-intelligence': {
    appId: 'platform-intelligence',
    iconId: 'icon-plat-intel',
    name: 'Platform Intelligence',
    category: 'Platform',
    description: 'Platform AI settings and models.',
    palette: { from: '#581C87', to: '#1E1B4B', accent: '#A855F7', surface: '#A855F715' },
    component: IconPlatformIntelligence
  },
  'production-readiness': {
    appId: 'production-readiness',
    iconId: 'icon-prod-ready',
    name: 'Production Readiness',
    category: 'Platform',
    description: 'Production control plane for security and health.',
    palette: { from: '#059669', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconProductionReadiness
  },
  'configuration-center': {
    appId: 'configuration-center',
    iconId: 'icon-config-ctr',
    name: 'Configuration Center',
    category: 'Platform',
    description: 'Immutable parameter governance and masked secrets.',
    palette: { from: '#475569', to: '#0F172A', accent: '#94A3B8', surface: '#94A3B815' },
    component: IconConfigurationCenter
  },
  'release-center': {
    appId: 'release-center',
    iconId: 'icon-release-ctr',
    name: 'Release Center',
    category: 'Platform',
    description: 'Release verification gates and deployment evidence.',
    palette: { from: '#0E7490', to: '#164E63', accent: '#06B6D4', surface: '#06B6D415' },
    component: IconReleaseCenter
  },
  'integration-gateway': {
    appId: 'integration-gateway',
    iconId: 'icon-int-gw',
    name: 'Integration Gateway',
    category: 'Platform',
    description: 'Perimeter gateway, rate limiters, and DLQ quarantine.',
    palette: { from: '#00F2FE', to: '#0369A1', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconIntegrationGateway
  },
  'scale-performance': {
    appId: 'scale-performance',
    iconId: 'icon-scale-perf',
    name: 'Scale & Performance',
    category: 'Platform',
    description: 'Distributed workload orchestrator and load simulation.',
    palette: { from: '#059669', to: '#022C22', accent: '#10B981', surface: '#10B98115' },
    component: IconScalePerformance
  },
  'platform-maturity': {
    appId: 'platform-maturity',
    iconId: 'icon-plat-mat',
    name: 'Platform Maturity Center',
    category: 'Platform',
    description: 'Enterprise operational maturity scorecard.',
    palette: { from: '#047857', to: '#064E3B', accent: '#10B981', surface: '#10B98115' },
    component: IconPlatformMaturity
  },
  'file-manager': {
    appId: 'file-manager',
    iconId: 'icon-file-mgr',
    name: 'File Explorer',
    category: 'Platform',
    description: 'Enterprise virtual file explorer, folder hierarchy, and storage management.',
    palette: { from: '#0284C7', to: '#0F172A', accent: '#38BDF8', surface: '#38BDF815' },
    component: IconFileManager
  },
  'notepad': {
    appId: 'notepad',
    iconId: 'icon-notepad',
    name: 'Notepad',
    category: 'Platform',
    description: 'Full-featured desktop text editor and supply chain memo pad.',
    palette: { from: '#00F2FE', to: '#0E7490', accent: '#00F2FE', surface: '#00F2FE15' },
    component: IconNotepad
  },
  'orion-computer': {
    appId: 'orion-computer',
    iconId: 'icon-orion-comp',
    name: 'This Computer',
    category: 'Platform',
    description: 'Orion workstation storage volumes, system drives, and hardware telemetry.',
    palette: { from: '#4F46E5', to: '#0F172A', accent: '#6366F1', surface: '#6366F115' },
    component: IconOrionComputer
  },
  'recycle-bin': {
    appId: 'recycle-bin',
    iconId: 'icon-recycle-bin',
    name: 'Recycle Bin',
    category: 'Platform',
    description: 'Deleted system items, recoverable documents, and permanent purge canister.',
    palette: { from: '#E11D48', to: '#4C0519', accent: '#FB7185', surface: '#FB718515' },
    component: IconRecycleBin
  }
};

/**
 * Returns the authoritative icon definition for any application ID.
 * Falls back safely to Orion generic squircle if ID is unrecognized.
 */
export function getAppIconDefinition(appId: string): OrionIconDefinition {
  const norm = appId.toLowerCase().trim();
  return (
    ORION_ICON_REGISTRY[norm] || {
      appId: norm,
      iconId: `icon-${norm}`,
      name: norm.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: 'Platform',
      description: 'Orion OS Application',
      palette: { from: '#334155', to: '#0F172A', accent: '#00F2FE', surface: '#00F2FE15' },
      component: IconOrionGeneric
    }
  );
}

/**
 * Returns the React component that renders the icon.
 */
export function getAppIconComponent(appId: string): React.FC<{ size?: number; className?: string; active?: boolean }> {
  return getAppIconDefinition(appId).component;
}

/**
 * Validates registry uniqueness across all registered applications.
 */
export function validateIconRegistryUniqueness(): {
  totalApps: number;
  uniqueIconIds: number;
  is100PercentUnique: boolean;
  duplicates: string[];
} {
  const apps = Object.values(ORION_ICON_REGISTRY);
  const seenIconIds = new Set<string>();
  const duplicates: string[] = [];

  for (const app of apps) {
    if (seenIconIds.has(app.iconId)) {
      duplicates.push(app.iconId);
    }
    seenIconIds.add(app.iconId);
  }

  return {
    totalApps: apps.length,
    uniqueIconIds: seenIconIds.size,
    is100PercentUnique: duplicates.length === 0 && seenIconIds.size === apps.length,
    duplicates
  };
}
