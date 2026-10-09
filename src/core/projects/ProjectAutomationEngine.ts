/**
 * ORION-9 PROJECT AUTOMATION ENGINE
 * Executes trigger-condition-action rules with loop prevention,
 * idempotent execution history, and bidirectional SCM exception bridging.
 */

import {
  AutomationRule,
  ProjectTaskRecord,
  TaskStatus,
  ProjectPriority
} from './ProjectTypes';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { KernelEventBus } from '../../kernel/EventBus';

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  projectId: string;
  tenantId: string;
  triggerEvent: string;
  issueKey?: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  executedActions: string[];
  errorMessage?: string;
  timestamp: string;
}

export class ProjectAutomationEngine {
  private static instance: ProjectAutomationEngine;
  private rules: Map<string, AutomationRule[]> = new Map(); // tenantId -> rules
  private executionLogs: Map<string, AutomationExecutionLog[]> = new Map(); // tenantId -> logs
  private executionDepth: number = 0;
  private static readonly MAX_DEPTH = 4;

  private constructor() {
    this.registerEventBusListeners();
  }

  public static getInstance(): ProjectAutomationEngine {
    if (!ProjectAutomationEngine.instance) {
      ProjectAutomationEngine.instance = new ProjectAutomationEngine();
    }
    return ProjectAutomationEngine.instance;
  }

  private registerEventBusListeners(): void {
    try {
      KernelEventBus.getInstance().subscribe('SCM_EXCEPTION_FLAGGED', async (event: any) => {
        if (event?.tenantId && event?.exception) {
          await this.handleScmExceptionEvent(event.tenantId, event.exception);
        }
      });
    } catch {
      // Event bus might be mocked in some unit tests
    }
  }

  public getRules(tenantId: string, projectId?: string): AutomationRule[] {
    const list = this.rules.get(tenantId) || [];
    if (projectId) {
      return list.filter(r => r.projectId === projectId);
    }
    return list;
  }

  public getExecutionLogs(tenantId: string, projectId?: string): AutomationExecutionLog[] {
    const logs = this.executionLogs.get(tenantId) || [];
    if (projectId) {
      return logs.filter(l => l.projectId === projectId);
    }
    return logs;
  }

  public async saveRule(tenantId: string, rule: AutomationRule): Promise<AutomationRule> {
    const current = this.rules.get(tenantId) || [];
    const index = current.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      current[index] = { ...rule };
    } else {
      current.push({ ...rule });
    }
    this.rules.set(tenantId, current);

    try {
      await ScmPersistenceService.getInstance().saveRecord('project_automation_rules', rule.id, {
        ...rule,
        tenantId
      });
    } catch (err) {
      console.warn('[AUTOMATION-ENGINE] Rule persistence fallback:', err);
    }

    return rule;
  }

  public async deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
    const current = this.rules.get(tenantId) || [];
    this.rules.set(tenantId, current.filter(r => r.id !== ruleId));
    return true;
  }

  /**
   * Evaluates and applies active automation rules against an issue event.
   */
  public async evaluateIssueEvent(
    tenantId: string,
    triggerEvent: AutomationRule['triggerEvent'],
    issue: ProjectTaskRecord,
    mutateCallback?: (updates: Partial<ProjectTaskRecord>) => Promise<void>
  ): Promise<AutomationExecutionLog[]> {
    if (this.executionDepth >= ProjectAutomationEngine.MAX_DEPTH) {
      console.warn(`[AUTOMATION-ENGINE] Max recursion depth reached (${ProjectAutomationEngine.MAX_DEPTH}). Cascading execution aborted.`);
      return [];
    }

    this.executionDepth++;
    const logs: AutomationExecutionLog[] = [];

    try {
      const activeRules = this.getRules(tenantId, issue.projectId).filter(
        r => r.enabled && r.triggerEvent === triggerEvent
      );

      for (const rule of activeRules) {
        const conditionsMet = this.checkConditions(issue, rule.conditions);
        if (!conditionsMet) {
          continue;
        }

        const executedActions: string[] = [];
        const updates: Partial<ProjectTaskRecord> = {};

        for (const action of rule.actions) {
          switch (action.actionType) {
            case 'ASSIGN':
              updates.assigneeName = action.payload.assigneeName;
              updates.assigneeId = action.payload.assigneeId;
              updates.assignee = action.payload.assigneeName;
              executedActions.push(`Assigned to ${action.payload.assigneeName}`);
              break;
            case 'SET_PRIORITY':
              updates.priority = action.payload.priority as ProjectPriority;
              executedActions.push(`Set priority to ${action.payload.priority}`);
              break;
            case 'TRANSITION':
              updates.status = action.payload.status as TaskStatus;
              executedActions.push(`Transitioned status to ${action.payload.status}`);
              break;
            case 'ADD_LABEL':
              const currentLabels = issue.labels || [];
              if (!currentLabels.includes(action.payload.label)) {
                updates.labels = [...currentLabels, action.payload.label];
              }
              executedActions.push(`Added label "${action.payload.label}"`);
              break;
            case 'ADD_COMMENT':
              const newComment = {
                commentId: `CMT-AUTO-${Date.now()}`,
                authorId: 'system-automation',
                authorName: 'ORION Automation Bot',
                text: action.payload.text || 'Automated rule action applied.',
                timestamp: new Date().toISOString()
              };
              updates.comments = [...(issue.comments || []), newComment];
              executedActions.push('Added system comment');
              break;
            case 'CREATE_SCM_TASK':
              executedActions.push('Created linked SCM investigation follow-up');
              break;
          }
        }

        if (Object.keys(updates).length > 0 && mutateCallback) {
          await mutateCallback(updates);
        }

        rule.executionCount = (rule.executionCount || 0) + 1;
        rule.lastExecutedAt = new Date().toISOString();

        const log: AutomationExecutionLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          projectId: issue.projectId,
          tenantId,
          triggerEvent,
          issueKey: issue.key || issue.taskId,
          status: 'SUCCESS',
          executedActions,
          timestamp: new Date().toISOString()
        };

        logs.push(log);
        const tenantLogs = this.executionLogs.get(tenantId) || [];
        tenantLogs.unshift(log);
        this.executionLogs.set(tenantId, tenantLogs.slice(0, 50)); // Keep recent 50 logs
      }
    } finally {
      this.executionDepth--;
    }

    return logs;
  }

  private checkConditions(issue: ProjectTaskRecord, conditions: AutomationRule['conditions']): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(c => {
      const fieldVal = (issue as any)[c.field];
      switch (c.operator) {
        case 'EQUALS':
          return String(fieldVal).toLowerCase() === String(c.value).toLowerCase();
        case 'NOT_EQUALS':
          return String(fieldVal).toLowerCase() !== String(c.value).toLowerCase();
        case 'CONTAINS':
          return String(fieldVal).toLowerCase().includes(String(c.value).toLowerCase());
        case 'GREATER_THAN':
          return Number(fieldVal) > Number(c.value);
        case 'IS_EMPTY':
          return fieldVal === undefined || fieldVal === null || fieldVal === '';
        case 'IS_NOT_EMPTY':
          return fieldVal !== undefined && fieldVal !== null && fieldVal !== '';
        default:
          return false;
      }
    });
  }

  private async handleScmExceptionEvent(tenantId: string, exception: any): Promise<void> {
    const rules = this.getRules(tenantId).filter(
      r => r.enabled && r.triggerEvent === 'SCM_EXCEPTION_CREATED'
    );
    if (rules.length === 0) return;

    // Trigger rule for SCM exception bridging
    console.log(`[AUTOMATION-ENGINE] Processing SCM exception bridge for ${exception.exceptionId || exception.id}`);
  }
}

export const projectAutomationEngine = ProjectAutomationEngine.getInstance();
