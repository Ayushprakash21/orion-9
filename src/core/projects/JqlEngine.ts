/**
 * ORION-9 JQL (JIRA QUERY LANGUAGE) PARSER & EVALUATOR ENGINE
 * Provides robust tokenization, AST generation, query validation,
 * issue filtering, and ordering for enterprise project work-items.
 */

import { ProjectTaskRecord } from './ProjectTypes';

export type JqlOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | '~' | '!~' | 'IN' | 'NOT IN';

export interface JqlClause {
  field: string;
  operator: JqlOperator;
  value: any;
}

export interface JqlOrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface JqlParsedQuery {
  clauses: Array<{
    type: 'CLAUSE' | 'LOGICAL';
    logicalOp?: 'AND' | 'OR';
    clause?: JqlClause;
  }>;
  orderBy?: JqlOrderBy;
}

export class JqlEngine {
  /**
   * Field alias mapping to normalize JQL identifiers to ProjectTaskRecord properties.
   */
  private static readonly FIELD_MAP: Record<string, keyof ProjectTaskRecord | 'text'> = {
    project: 'projectId',
    projectid: 'projectId',
    key: 'key',
    issue: 'key',
    id: 'id',
    summary: 'title',
    title: 'title',
    description: 'description',
    type: 'issueType',
    issuetype: 'issueType',
    status: 'status',
    priority: 'priority',
    assignee: 'assigneeName',
    assigneeid: 'assigneeId',
    reporter: 'reporterName',
    reporterid: 'reporterId',
    sprint: 'sprintId',
    sprintid: 'sprintId',
    epic: 'epicId',
    parent: 'parentId',
    points: 'storyPoints',
    storypoints: 'storyPoints',
    duedate: 'dueDate',
    due: 'dueDate',
    resolution: 'resolution',
    label: 'labels',
    labels: 'labels',
    component: 'components',
    components: 'components',
    fixversion: 'fixVersions',
    text: 'text'
  };

  /**
   * Validates a JQL string without throwing.
   */
  public static validate(queryStr: string): { valid: boolean; error?: string } {
    if (!queryStr || queryStr.trim().length === 0) {
      return { valid: true };
    }
    try {
      this.parse(queryStr);
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Invalid JQL syntax' };
    }
  }

  /**
   * Parses a JQL string into an executable query structure.
   */
  public static parse(rawQuery: string): JqlParsedQuery {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return { clauses: [] };
    }

    let queryPart = trimmed;
    let orderBy: JqlOrderBy | undefined = undefined;

    // Extract ORDER BY clause if present
    const orderByIndex = trimmed.search(/\bORDER\s+BY\b/i);
    if (orderByIndex !== -1) {
      queryPart = trimmed.substring(0, orderByIndex).trim();
      const orderPart = trimmed.substring(orderByIndex).replace(/\bORDER\s+BY\b/i, '').trim();
      const orderTokens = orderPart.split(/\s+/);
      if (orderTokens.length > 0 && orderTokens[0]) {
        const field = orderTokens[0].toLowerCase();
        const direction = orderTokens[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderBy = { field, direction };
      }
    }

    if (!queryPart) {
      return { clauses: [], orderBy };
    }

    // Tokenize into logical chunks separated by AND or OR
    const clauses: JqlParsedQuery['clauses'] = [];
    // Regex splits by top-level AND / OR while preserving operator
    const tokenRegex = /\s+(AND|OR)\s+/i;
    const parts = queryPart.split(tokenRegex);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      if (/^(AND|OR)$/i.test(part)) {
        clauses.push({
          type: 'LOGICAL',
          logicalOp: part.toUpperCase() as 'AND' | 'OR'
        });
      } else {
        const clause = this.parseSingleClause(part);
        clauses.push({
          type: 'CLAUSE',
          clause
        });
      }
    }

    return { clauses, orderBy };
  }

  private static parseSingleClause(expr: string): JqlClause {
    // Recognize operators: !=, <=, >=, !~, =, <, >, ~, IN, NOT IN
    const match = expr.match(/^([a-zA-Z0-9_.-]+)\s*(!=|<=|>=|!~|=|<|>|~|\bNOT\s+IN\b|\bIN\b)\s*(.+)$/i);
    if (!match) {
      throw new Error(`Syntax error in expression: "${expr}". Expected format: field operator value`);
    }

    const rawField = match[1].toLowerCase();
    const rawOp = match[2].toUpperCase().replace(/\s+/, ' ') as JqlOperator;
    let rawVal = match[3].trim();

    // Strip wrapping quotes
    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      rawVal = rawVal.substring(1, rawVal.length - 1);
    }

    // Handle IN (val1, val2, ...)
    let parsedVal: any = rawVal;
    if (rawOp === 'IN' || rawOp === 'NOT IN') {
      const listContent = rawVal.replace(/^\(|\)$/g, '');
      parsedVal = listContent.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
      parsedVal = Number(rawVal);
    }

    return {
      field: rawField,
      operator: rawOp,
      value: parsedVal
    };
  }

  /**
   * Filters and sorts issues according to a JQL string.
   */
  public static filter(issues: ProjectTaskRecord[], jql: string): ProjectTaskRecord[] {
    return this.filterIssues(issues, jql);
  }

  public static filterIssues(issues: ProjectTaskRecord[], jql: string): ProjectTaskRecord[] {
    if (!jql || jql.trim().length === 0) {
      return [...issues];
    }

    const parsed = this.parse(jql);
    if (parsed.clauses.length === 0 && !parsed.orderBy) {
      return [...issues];
    }

    let results = issues.filter(issue => this.evaluateIssue(issue, parsed.clauses));

    if (parsed.orderBy) {
      const { field, direction } = parsed.orderBy;
      const mappedField = this.FIELD_MAP[field] || field;

      results.sort((a, b) => {
        let valA: any = (a as any)[mappedField];
        let valB: any = (b as any)[mappedField];

        if (mappedField === 'priority') {
          const priorityWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          valA = priorityWeights[valA] || 0;
          valB = priorityWeights[valB] || 0;
        }

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return direction === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return direction === 'ASC' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    return results;
  }

  private static evaluateIssue(issue: ProjectTaskRecord, clauses: JqlParsedQuery['clauses']): boolean {
    if (clauses.length === 0) return true;

    let overallResult = true;
    let nextLogical: 'AND' | 'OR' = 'AND';

    for (const item of clauses) {
      if (item.type === 'LOGICAL') {
        nextLogical = item.logicalOp || 'AND';
      } else if (item.type === 'CLAUSE' && item.clause) {
        const matches = this.evaluateSingleClause(issue, item.clause);
        if (nextLogical === 'AND') {
          overallResult = overallResult && matches;
        } else {
          overallResult = overallResult || matches;
        }
      }
    }

    return overallResult;
  }

  private static evaluateSingleClause(issue: ProjectTaskRecord, clause: JqlClause): boolean {
    const { field, operator, value } = clause;
    const normalizedField = field.toLowerCase();

    // Full text search handling
    if (normalizedField === 'text') {
      const textToSearch = `${issue.key || ''} ${issue.title || ''} ${issue.description || ''} ${issue.assigneeName || ''}`.toLowerCase();
      const searchTarget = String(value).toLowerCase();
      return operator === '~' ? textToSearch.includes(searchTarget) : !textToSearch.includes(searchTarget);
    }

    const mappedKey = this.FIELD_MAP[normalizedField] || (normalizedField as keyof ProjectTaskRecord);
    const issueVal = (issue as any)[mappedKey];

    // Array field handling (labels, components, etc.)
    if (Array.isArray(issueVal)) {
      const targetStr = String(value).toLowerCase();
      const contains = issueVal.some(item => String(item).toLowerCase() === targetStr || String(item).toLowerCase().includes(targetStr));
      if (operator === '=' || operator === '~') return contains;
      if (operator === '!=' || operator === '!~') return !contains;
      return false;
    }

    const strA = issueVal !== undefined && issueVal !== null ? String(issueVal).toLowerCase() : '';
    const strB = value !== undefined && value !== null ? String(value).toLowerCase() : '';

    switch (operator) {
      case '=':
        return strA === strB;
      case '!=':
        return strA !== strB;
      case '~':
        return strA.includes(strB);
      case '!~':
        return !strA.includes(strB);
      case '>':
        return Number(issueVal) > Number(value);
      case '>=':
        return Number(issueVal) >= Number(value);
      case '<':
        return Number(issueVal) < Number(value);
      case '<=':
        return Number(issueVal) <= Number(value);
      case 'IN':
        if (Array.isArray(value)) {
          return value.map(v => String(v).toLowerCase()).includes(strA);
        }
        return strA === strB;
      case 'NOT IN':
        if (Array.isArray(value)) {
          return !value.map(v => String(v).toLowerCase()).includes(strA);
        }
        return strA !== strB;
      default:
        return false;
    }
  }

  /**
   * Returns autocomplete suggestions for fields, operators, and sample values.
   */
  public static getSuggestions(partialQuery: string): string[] {
    const trimmed = partialQuery.trim();
    if (!trimmed) {
      return Object.keys(this.FIELD_MAP).map(f => `${f} = `);
    }

    const tokens = trimmed.split(/\s+/);
    const lastToken = tokens[tokens.length - 1].toLowerCase();

    // Field suggestions
    const matchingFields = Object.keys(this.FIELD_MAP).filter(f => f.startsWith(lastToken));
    if (matchingFields.length > 0) {
      return matchingFields.map(f => `${f} = `);
    }

    // Keyword suggestions
    if ('order by'.startsWith(lastToken) || 'order'.startsWith(lastToken)) {
      return ['ORDER BY priority DESC', 'ORDER BY created DESC', 'ORDER BY dueDate ASC'];
    }

    return ['AND ', 'OR ', 'ORDER BY '];
  }
}
