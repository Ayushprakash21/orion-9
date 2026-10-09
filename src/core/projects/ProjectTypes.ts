/**
 * ORION-9 PROJECT MANAGEMENT DATA CONTRACTS & GOVERNANCE TYPES
 * Supports portfolio tracking, Kanban task management, milestones,
 * Gantt timeline scheduling, budget variance, and direct SCM entity linkage.
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

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE' | 'COMPLETED' | 'CANCELLED';

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
  timestamp: string;
}

export interface ProjectTaskRecord {
  id: string;
  taskId: string;
  projectId: string;
  tenantId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  assignee?: string;
  team?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  completedAt?: string;
  dependencies?: string[];
  blockers?: string[];
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  linkedScmEntity?: LinkedScmEntity;
  comments?: ProjectComment[];
  createdAt: string;
  updatedAt: string;
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
  tenantId: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerId?: string;
  ownerName?: string;
  owner?: string;
  department?: string;
  organizationId?: string;
  startDate: string;
  targetDate?: string;
  targetEndDate?: string;
  actualCompletionDate?: string;
  budget: number | ProjectBudgetSpec;
  actualCost?: number;
  forecastCost?: number;
  currency?: string;
  tags?: string[];
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
}
