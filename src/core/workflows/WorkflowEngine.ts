/**
 * ORION-9 DEPRECATED LEGACY WORKFLOW ENGINE PROXY
 * 
 * Notice: This module is deprecated. The authoritative enterprise workflow engine resides in
 * `src/workflows/WorkflowEngine.ts`. All calls are cleanly proxied to maintain backwards
 * compatibility.
 */

import { WorkflowEngine as AuthoritativeWorkflowEngine, workflowEngine as authoritativeWorkflowEngine } from '../../workflows/WorkflowEngine';

export { AuthoritativeWorkflowEngine as WorkflowEngine };
export { authoritativeWorkflowEngine as workflowEngine };
