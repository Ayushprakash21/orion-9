/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Condition Engine
 * 
 * Safe deterministic condition evaluator with zero eval() or dynamic execution.
 * Supports logical AND, OR, NOT combinators and rich comparison operators.
 */

import { WorkflowCondition, WorkflowConditionClause } from './types';

export class WorkflowConditionEngine {
  /**
   * Safely resolves a nested property path from a context object (e.g., "inventory.daysOfSupply")
   */
  public static resolveField(context: Record<string, any>, path: string): any {
    if (!path || !context) return undefined;
    const parts = path.split('.');
    let current: any = context;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  /**
   * Evaluates a single clause against context
   */
  public static evaluateClause(clause: WorkflowConditionClause, context: Record<string, any>): boolean {
    const actual = this.resolveField(context, clause.field);
    const expected = clause.value;

    switch (clause.operator) {
      case 'EQUALS':
        return actual === expected;
      case 'NOT_EQUALS':
        return actual !== expected;
      case 'GREATER_THAN':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'LESS_THAN':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'GREATER_THAN_OR_EQUAL':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case 'LESS_THAN_OR_EQUAL':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'IN':
        return Array.isArray(expected) ? expected.includes(actual) : false;
      case 'CONTAINS':
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().includes(expected.toLowerCase());
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Evaluates a composite condition structure (AND, OR, NOT)
   */
  public static evaluate(condition: WorkflowCondition, context: Record<string, any>): boolean {
    const op = condition.operator || 'AND';
    const clauseResults: boolean[] = [];

    if (condition.clauses && condition.clauses.length > 0) {
      for (const clause of condition.clauses) {
        clauseResults.push(this.evaluateClause(clause, context));
      }
    }

    if (condition.subConditions && condition.subConditions.length > 0) {
      for (const sub of condition.subConditions) {
        clauseResults.push(this.evaluate(sub, context));
      }
    }

    if (clauseResults.length === 0) {
      return true; // Empty condition evaluates to true
    }

    if (op === 'AND') {
      return clauseResults.every(r => r === true);
    } else if (op === 'OR') {
      return clauseResults.some(r => r === true);
    } else if (op === 'NOT') {
      // In NOT mode, must not match any of the child conditions
      return !clauseResults.some(r => r === true);
    }

    return false;
  }
}
