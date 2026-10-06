export interface AutonomousCollectionSchema {
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  actor: string;
  source: string;
  correlationId: string;
}

export const AUTONOMOUS_FIRESTORE_COLLECTIONS = [
  'autonomous_missions',
  'autonomous_actions',
  'autonomy_policies',
  'approval_requests',
  'approval_decisions',
  'agent_decisions',
  'optimization_runs',
  'forecast_runs',
  'external_signals',
  'risk_events',
  'scenario_runs',
  'execution_outcomes',
  'learning_proposals',
  'agent_metrics',
  'automation_metrics',
  'safe_fallbacks'
] as const;

export type AutonomousFirestoreCollection = typeof AUTONOMOUS_FIRESTORE_COLLECTIONS[number];
