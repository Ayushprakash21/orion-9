/**
 * ORION-9 PROJECT MANAGEMENT DATA CONTRACTS & JIRA-CLASS GOVERNANCE TYPES
 * Supports workspace navigation, Scrum sprint planning, Kanban boards,
 * issue hierarchy (Initiative -> Epic -> Story/Task/Bug -> Subtask),
 * JQL search, workflow automation, burndown reports, and direct SCM entity linkage.
 */

export type ProjectCategory =
  | 'SUPPLIER_ONBOARDING'
  | 'PROCUREMENT_PROGRAM'
  | 'WAREHOUSE_IMPLEMENTATION'
  | 'LOGISTICS_REDESIGN'
  | 'ERP_INTEGRATION'
  | 'PRODUCT_LAUNCH'
  | 'MANUFACTURING_CHANGE'
  | 'DISRUPTION_RECOVERY'
  | 'PROCESS_IMPROVEMENT'
  | 'FINANCE_IMPROVEMENT'
  | 'INFRASTRUCTURE'
  | 'LOGISTICS'
  | 'INVENTORY_REDUCTION'
  | 'GENERAL';

export type ProjectType = 'SCRUM' | 'KANBAN' | 'BUSINESS';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueType =
  | 'INITIATIVE'
  | 'EPIC'
  | 'STORY'
  | 'TASK'
  | 'SUBTASK'
  | 'BUG'
  | 'FEATURE'
  | 'IMPROVEMENT';

export type TaskStatus =
  | 'TODO'
  | 'BACKLOG'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'IN_REVIEW'
  | 'DONE'
  | 'COMPLETED'
  | 'CANCELLED';

export type IssueResolution =
  | 'UNRESOLVED'
  | 'DONE'
  | 'WONT_DO'
  | 'DUPLICATE'
  | 'CANNOT_REPRODUCE';

export type SprintStatus = 'FUTURE' | 'ACTIVE' | 'CLOSED';

export interface LinkedScmEntity {
  type?: 'SUPPLIER' | 'PO' | 'ORDER' | 'WAREHOUSE' | 'SHIPMENT' | 'EXCEPTION' | 'INVOICE' | 'DISRUPTION';
  entityType?: 'SUPPLIER' | 'PURCHASE_ORDER' | 'PO' | 'SALES_ORDER' | 'ORDER' | 'SHIPMENT' | 'WAREHOUSE' | 'INVOICE' | 'EXCEPTION';
  id?: string;
  entityId?: string;
  label?: string;
  referenceNumber?: string;
  description?: string;
  amount?: number;
  referenceUrl?: string;
  statusBadge?: string;
}

export interface ProjectMilestone {
  id?: string;
  milestoneId?: string;
  title: string;
  dueDate?: string;
  targetDate?: string;
  completedDate?: string;
  completed: boolean;
  deliverables?: string[];
  description?: string;
}

export interface ProjectRisk {
  id?: string;
  riskId?: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact?: string;
  mitigation?: string;
  mitigationPlan?: string;
  owner?: string;
  status: 'OPEN' | 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED';
}

export interface ProjectComment {
  commentId: string;
  authorId: string;
  authorName: string;
  text: string;
  content?: string;
  timestamp: string;
}

export interface WorkLogEntry {
  id: string;
  authorId: string;
  authorName: string;
  timeSpentHours: number;
  comment?: string;
  loggedAt: string;
}

export interface IssueActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  field?: string;
  from?: string;
  to?: string;
  timestamp: string;
}

export interface LinkedIssueRef {
  issueId: string;
  issueKey: string;
  summary: string;
  relationship: 'BLOCKS' | 'IS_BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES';
}

/**
 * Jira-Class Work Item / Issue Record
 * Inherits and extends ProjectTaskRecord for 100% backward compatibility
 */
export interface ProjectTaskRecord {
  id: string;
  taskId: string;
  key?: string; // e.g. SCM-101
  projectId: string;
  tenantId: string;
  title: string;
  summary?: string; // Jira alias for title
  description?: string;
  issueType?: IssueType;
  assigneeId?: string;
  assigneeName?: string;
  assignee?: string;
  reporterId?: string;
  reporterName?: string;
  team?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  resolution?: IssueResolution;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  remainingHours?: number;
  sprintId?: string;
  epicId?: string;
  parentId?: string;
  dueDate?: string;
  completedAt?: string;
  orderIndex?: number; // For backlog drag-and-drop prioritization
  labels?: string[];
  components?: string[];
  affectedVersions?: string[];
  fixVersions?: string[];
  dependencies?: string[];
  blockers?: string[];
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  linkedIssues?: LinkedIssueRef[];
  linkedScmEntity?: LinkedScmEntity;
  comments?: ProjectComment[];
  workLogs?: WorkLogEntry[];
  activityHistory?: IssueActivityEntry[];
  watchers?: string[];
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SprintRecord {
  id: string;
  sprintId: string;
  projectId: string;
  tenantId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  activatedAt?: string;
  completedAt?: string;
  plannedCapacityHours?: number;
  committedPoints?: number;
  completedPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  description?: string;
  startDate?: string;
  releaseDate?: string;
  status: 'UNRELEASED' | 'RELEASED' | 'ARCHIVED';
  releaseNotes?: string;
  createdAt: string;
}

export interface ProjectComponent {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  description?: string;
  lead?: string;
}

export interface WorkflowTransition {
  id: string;
  from: TaskStatus;
  to: TaskStatus;
  name: string;
  requiredFields?: string[];
  roles?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  initialStatus: TaskStatus;
  statuses: Array<{ id: TaskStatus; name: string; category: 'TODO' | 'IN_PROGRESS' | 'DONE' }>;
  transitions: WorkflowTransition[];
}

export interface KanbanColumnConfig {
  id: TaskStatus;
  title: string;
  wipLimit?: number;
  minLimit?: number;
}

export interface AutomationCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  value: any;
}

export interface AutomationAction {
  actionType: 'ASSIGN' | 'SET_PRIORITY' | 'TRANSITION' | 'ADD_LABEL' | 'ADD_COMMENT' | 'NOTIFY_LEAD' | 'CREATE_SCM_TASK';
  payload: any;
}

export interface AutomationRule {
  id: string;
  projectId: string;
  tenantId: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerEvent: 'ISSUE_CREATED' | 'STATUS_CHANGED' | 'ASSIGNEE_CHANGED' | 'ISSUE_OVERDUE' | 'SCM_EXCEPTION_CREATED';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export interface SavedFilter {
  id: string;
  tenantId: string;
  name: string;
  jql: string;
  ownerId: string;
  isStarred?: boolean;
  isShared?: boolean;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email?: string;
  role: 'ADMIN' | 'LEAD' | 'DEVELOPER' | 'CONTRIBUTOR' | 'VIEWER';
  avatar?: string;
}

export interface ProjectBudgetSpec {
  allocated: number;
  spent?: number;
  committed?: number;
  currency?: string;
}

export interface ProjectRecord {
  id: string;
  projectId: string;
  key?: string; // Prefix for issue keys (e.g. SCM, ORION)
  tenantId: string;
  name: string;
  description: string;
  category: ProjectCategory;
  projectType?: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerId?: string;
  ownerName?: string;
  owner?: string;
  department?: string;
  organizationId?: string;
  leadId?: string;
  leadName?: string;
  members?: ProjectMember[];
  startDate: string;
  targetDate?: string;
  targetEndDate?: string;
  actualCompletionDate?: string;
  budget: number | ProjectBudgetSpec;
  actualCost?: number;
  forecastCost?: number;
  currency?: string;
  tags?: string[];
  workflowId?: string;
  components?: ProjectComponent[];
  versions?: ProjectVersion[];
  kanbanColumns?: KanbanColumnConfig[];
  linkedScmEntities: LinkedScmEntity[];
  milestones: ProjectMilestone[];
  risks: ProjectRisk[];
  progressPercentage?: number;
  tasksCount?: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPortfolioMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  blockedProjects: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  totalStoryPoints?: number;
  completedStoryPoints?: number;
  velocityTrend?: number;
}

export interface SprintBurndownDay {
  day: string;
  idealRemainingPoints: number;
  actualRemainingPoints: number;
}
