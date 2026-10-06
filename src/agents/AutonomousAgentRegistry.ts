import { AutonomyDecisionEngine } from '../autonomy/AutonomyDecisionEngine';
import { AutonomyScoreCard, AutonomyDecision } from '../autonomy/types';

export interface AgentDefinition {
  agentId: string;
  name: string;
  role: string;
  category: string;
  allowedTools: string[];
  maxAutonomyLevel: string;
}

export class AutonomousAgentRegistry {
  private static agentsMap: Map<string, AgentDefinition> = new Map();

  public static initializeWorkforce(): void {
    const workforce: AgentDefinition[] = [
      { agentId: 'agent-control-tower', name: 'Control Tower Agent', role: 'Autonomous Disruption & Mission Orchestrator', category: 'CONTROL_TOWER', allowedTools: ['EventFabric', 'RiskGraph', 'MissionEngine'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-demand-planner', name: 'Demand Planner Agent', role: 'Probabilistic Forecasting & Trend Detection', category: 'DEMAND', allowedTools: ['ForecastIntelligenceEngine', 'POSConnector'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-supply-planner', name: 'Supply Planner Agent', role: 'Replenishment & Capacity Balancer', category: 'SUPPLY', allowedTools: ['OrionOptimizationEngine', 'MRPConnector'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-inventory', name: 'Inventory Agent', role: 'Multi-Echelon Buffer & Reorder Point Optimizer', category: 'INVENTORY', allowedTools: ['MEIOEngine', 'StockTransferCommand'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-procurement', name: 'Procurement Agent', role: 'PO Generation & Supplier Reminders', category: 'PROCUREMENT', allowedTools: ['KernelCommandBus', 'POCommand'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-sourcing', name: 'Sourcing Agent', role: 'RFQ Sourcing & Allocation Shifting', category: 'SOURCING', allowedTools: ['RFQEngine', 'SupplierEngine'], maxAutonomyLevel: 'LEVEL_3_APPROVAL_GATED' },
      { agentId: 'agent-supplier-risk', name: 'Supplier Risk Agent', role: 'Financial & OTIF Risk Evaluator', category: 'RISK', allowedTools: ['SupplierIntelligenceEngine', 'RiskGraph'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-warehouse', name: 'Warehouse Agent', role: 'Dynamic Slotting & Dock Appointment Optimizer', category: 'WAREHOUSE', allowedTools: ['WMSConnector', 'SlottingEngine'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-transportation', name: 'Transportation Agent', role: 'Predictive ETA, Load Building & Carrier Tender', category: 'LOGISTICS', allowedTools: ['PredictiveETAEngine', 'TMSConnector'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-manufacturing', name: 'Manufacturing Agent', role: 'Finite-Capacity & OEE Scheduling', category: 'MANUFACTURING', allowedTools: ['MESConnector', 'CapacityPlanner'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-quality', name: 'Quality Agent', role: 'SPC Defect Prediction & Automated CAPA', category: 'QUALITY', allowedTools: ['QualityIntelligenceEngine'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-finance', name: 'Finance Agent', role: 'Invoice Matching & Working Capital Optimization', category: 'FINANCE', allowedTools: ['ERPConnector', 'WorkingCapitalEngine'], maxAutonomyLevel: 'LEVEL_3_APPROVAL_GATED' },
      { agentId: 'agent-trade-compliance', name: 'Trade Compliance Agent', role: 'Customs & Sanctions Screening', category: 'COMPLIANCE', allowedTools: ['SanctionChecker', 'CustomsPortal'], maxAutonomyLevel: 'LEVEL_3_APPROVAL_GATED' },
      { agentId: 'agent-customer-service', name: 'Customer Service Agent', role: 'Proactive Shipment Notifications & Re-routing', category: 'CUSTOMER', allowedTools: ['NotificationEngine', 'OrderTracker'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-sustainability', name: 'Sustainability Agent', role: 'Carbon Emission & ESG Optimization', category: 'SUSTAINABILITY', allowedTools: ['CarbonCalculator', 'ESGScorer'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-network-design', name: 'Network Design Agent', role: 'Strategic Facility & Lane Flow Optimizer', category: 'NETWORK', allowedTools: ['DigitalTwin', 'ScenarioEngine'], maxAutonomyLevel: 'LEVEL_3_APPROVAL_GATED' },
      { agentId: 'agent-executive-strategy', name: 'Executive Strategy Agent', role: 'Enterprise Horizon Risk & Margin Intelligence', category: 'EXECUTIVE', allowedTools: ['ExecutiveStrategyAgent'], maxAutonomyLevel: 'LEVEL_1_RECOMMEND' },
      { agentId: 'agent-incident-response', name: 'Incident Response Agent', role: 'Disruption Remediation & Closed-Loop Recovery', category: 'INCIDENT', allowedTools: ['AutonomyExecutionManager', 'AutonomyRollbackManager'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-data-quality', name: 'Data Quality Agent', role: 'Master Data Anomaly Detection & Self-Healing', category: 'DATA_QUALITY', allowedTools: ['DataQualityAgent'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' },
      { agentId: 'agent-integration', name: 'Integration Agent', role: 'EDI/AS2 & Gateway Failure Auto-Recovery', category: 'INTEGRATION', allowedTools: ['ConnectorFramework', 'DLQReplayer'], maxAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS' }
    ];

    workforce.forEach(agent => {
      this.agentsMap.set(agent.agentId, agent);
    });
  }

  public static getAgent(agentId: string): AgentDefinition | undefined {
    if (this.agentsMap.size === 0) this.initializeWorkforce();
    return this.agentsMap.get(agentId);
  }

  public static getAllAgents(): AgentDefinition[] {
    if (this.agentsMap.size === 0) this.initializeWorkforce();
    return Array.from(this.agentsMap.values());
  }

  /**
   * Governed Agent Decision Dispatcher
   */
  public static executeAgentTask(
    agentId: string,
    tenantId: string,
    actionType: string,
    scoreCard: AutonomyScoreCard,
    missionId?: string
  ): AutonomyDecision {
    const agent = this.getAgent(agentId);
    if (!agent) throw new Error(`Agent ${agentId} is not registered in Autonomous Agent Workforce`);

    return AutonomyDecisionEngine.evaluateDecision(
      tenantId,
      agentId,
      actionType,
      scoreCard,
      missionId
    );
  }
}
