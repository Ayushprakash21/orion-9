/**
 * ORION-9 PROJECT MANAGEMENT ENGINE
 * Authoritative business engine for supply chain projects, task workstreams,
 * Gantt timeline milestones, SCM cross-referencing, and durable persistence.
 */

import {
  ProjectRecord,
  ProjectTaskRecord,
  ProjectMilestone,
  ProjectRisk,
  ProjectCategory,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  ProjectPortfolioMetrics,
  LinkedScmEntity
} from './ProjectTypes';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { KernelEventBus } from '../../kernel/EventBus';

export class ProjectManagementEngine {
  private static instance: ProjectManagementEngine;
  private projects: Map<string, ProjectRecord[]> = new Map(); // tenantId -> projects
  private tasks: Map<string, ProjectTaskRecord[]> = new Map(); // tenantId -> tasks
  private initializedTenants: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): ProjectManagementEngine {
    if (!ProjectManagementEngine.instance) {
      ProjectManagementEngine.instance = new ProjectManagementEngine();
    }
    return ProjectManagementEngine.instance;
  }

  /**
   * Hydrates projects and tasks from durable persistence.
   */
  public async hydrateTenant(tenantId: string): Promise<void> {
    if (this.initializedTenants.has(tenantId)) return;
    this.initializedTenants.add(tenantId);

    try {
      const persistence = ScmPersistenceService.getInstance();
      const [persistedProjects, persistedTasks] = await Promise.all([
        persistence.listRecords<ProjectRecord>('projects', tenantId),
        persistence.listRecords<ProjectTaskRecord>('project_tasks', tenantId)
      ]);

      if (persistedProjects && persistedProjects.length > 0) {
        this.projects.set(tenantId, persistedProjects);
      } else {
        this.seedDemoProjects(tenantId);
      }

      if (persistedTasks && persistedTasks.length > 0) {
        this.tasks.set(tenantId, persistedTasks);
      } else {
        this.seedDemoTasks(tenantId);
      }
    } catch (err) {
      console.warn(`[PROJECT-ENGINE] Hydration notice for ${tenantId}:`, err);
      this.seedDemoProjects(tenantId);
      this.seedDemoTasks(tenantId);
    }
  }

  private seedDemoProjects(tenantId: string): void {
    const demoProjects: ProjectRecord[] = [
      {
        id: 'PRJ-2026-001',
        projectId: 'PRJ-2026-001',
        tenantId,
        name: 'Aerospace Composite Supplier Dual-Sourcing Program',
        description: 'Qualify secondary domestic tier-1 suppliers for carbon-fiber prepreg to mitigate 60-day maritime bottleneck.',
        category: 'SUPPLIER_ONBOARDING',
        status: 'ACTIVE',
        priority: 'CRITICAL',
        ownerId: 'usr-procurement-lead',
        ownerName: 'Elena Rostova',
        owner: 'Elena Rostova',
        department: 'Strategic Procurement',
        organizationId: tenantId,
        startDate: '2026-08-01',
        targetDate: '2026-11-30',
        targetEndDate: '2026-11-30',
        budget: 350000,
        actualCost: 182000,
        forecastCost: 340000,
        currency: 'USD',
        tags: ['Procurement', 'Dual-Sourcing', 'Aerospace', 'Risk-Mitigation'],
        linkedScmEntities: [
          { type: 'SUPPLIER', id: 'SUP-001', label: 'Titan Micro Materials' },
          { type: 'PO', id: 'PO-2026-0001', label: 'Titanium Ingot Master Order' }
        ],
        milestones: [
          {
            id: 'MS-101',
            milestoneId: 'MS-101',
            title: 'AS9100 Quality Audit Verification',
            targetDate: '2026-09-15',
            completedDate: '2026-09-12',
            completed: true
          },
          {
            id: 'MS-102',
            milestoneId: 'MS-102',
            title: 'PPAP Level 3 Pilot Batch Production',
            targetDate: '2026-10-31',
            completed: false
          }
        ],
        risks: [
          {
            id: 'RSK-01',
            riskId: 'RSK-01',
            title: 'Resin Curing Autoclave Capacity Shortage',
            severity: 'HIGH',
            impact: 'Potential 3-week delay in qualification coupon testing',
            mitigation: 'Book backup testing facility in Munich',
            mitigationPlan: 'Book backup testing facility in Munich',
            status: 'MITIGATING'
          }
        ],
        createdAt: '2026-08-01T08:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'PRJ-2026-002',
        projectId: 'PRJ-2026-002',
        tenantId,
        name: 'Warehouse Automation & Autonomous Mobile Robots (AMR)',
        description: 'Deploy 48 autonomous pallet movers in Chicago Fulfillment Center to cut order pick-to-ship cycle time by 45%.',
        category: 'WAREHOUSE_IMPLEMENTATION',
        status: 'ACTIVE',
        priority: 'HIGH',
        ownerId: 'usr-ops-dir',
        ownerName: 'Marcus Vance',
        owner: 'Marcus Vance',
        department: 'Logistics Operations',
        organizationId: tenantId,
        startDate: '2026-09-01',
        targetDate: '2027-01-15',
        targetEndDate: '2027-01-15',
        budget: 680000,
        actualCost: 245000,
        forecastCost: 650000,
        currency: 'USD',
        tags: ['Robotics', 'WMS', 'Automation', 'Chicago-DC'],
        linkedScmEntities: [
          { type: 'WAREHOUSE', id: 'WH-001', label: 'Chicago Central Fulfillment Hub' }
        ],
        milestones: [
          {
            id: 'MS-201',
            milestoneId: 'MS-201',
            title: 'Floor Grid Optical QR Marker Installation',
            targetDate: '2026-09-25',
            completedDate: '2026-09-24',
            completed: true
          },
          {
            id: 'MS-202',
            milestoneId: 'MS-202',
            title: 'Fleet Management System WMS API Integration',
            targetDate: '2026-11-10',
            completed: false
          }
        ],
        risks: [
          {
            id: 'RSK-02',
            riskId: 'RSK-02',
            title: 'Industrial Wi-Fi Dead Zones in Aisle 14-18',
            severity: 'CRITICAL',
            impact: 'AMR disconnects causing navigation pauses',
            mitigation: 'Install 6 additional IP67 access points',
            mitigationPlan: 'Install 6 additional IP67 access points',
            status: 'OPEN'
          }
        ],
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    this.projects.set(tenantId, demoProjects);
  }

  private seedDemoTasks(tenantId: string): void {
    const demoTasks: ProjectTaskRecord[] = [
      {
        id: 'TSK-001',
        taskId: 'TSK-001',
        projectId: 'PRJ-2026-001',
        tenantId,
        title: 'Review Metallurgy Tensile Strength Reports',
        description: 'Verify Yield Strength exceeds 850 MPa according to ASTM E8 standard specifications.',
        assigneeName: 'Dr. Aris Thorne',
        assignee: 'Dr. Aris Thorne',
        status: 'COMPLETED',
        priority: 'HIGH',
        estimatedHours: 16,
        actualHours: 14,
        dueDate: '2026-09-10',
        completedAt: '2026-09-09T16:00:00Z',
        dependencies: [],
        subtasks: [
          { id: 'sub-1', title: 'Verify calibration certificates', completed: true },
          { id: 'sub-2', title: 'Sign off certification package', completed: true }
        ],
        comments: [],
        createdAt: '2026-08-05T09:00:00Z',
        updatedAt: '2026-09-09T16:00:00Z'
      },
      {
        id: 'TSK-002',
        taskId: 'TSK-002',
        projectId: 'PRJ-2026-001',
        tenantId,
        title: 'Conduct On-Site Quality Cleanroom Inspection',
        description: 'Audit cleanroom ISO Class 7 particulate levels and temperature control sensors.',
        assigneeName: 'Elena Rostova',
        assignee: 'Elena Rostova',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        estimatedHours: 24,
        actualHours: 12,
        dueDate: '2026-10-18',
        dependencies: ['TSK-001'],
        subtasks: [
          { id: 'sub-3', title: 'Check particulate counter logs', completed: true },
          { id: 'sub-4', title: 'Audit personnel gowning SOPs', completed: false }
        ],
        comments: [],
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    this.tasks.set(tenantId, demoTasks);
  }

  /**
   * Creates a new Project and durably persists it.
   */
  public async createProject(params: any): Promise<ProjectRecord> {
    const tenantId = params.tenantId;
    const projectId = params.projectId || params.id || `PRJ-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const project: ProjectRecord = {
      id: projectId,
      projectId,
      tenantId,
      name: params.name,
      description: params.description || '',
      category: params.category || 'GENERAL',
      status: params.status || 'PLANNING',
      priority: params.priority || 'MEDIUM',
      ownerId: params.ownerId || 'usr-default',
      ownerName: params.ownerName || params.owner || 'Project Owner',
      owner: params.owner || params.ownerName || 'Project Owner',
      department: params.department || 'Operations',
      organizationId: tenantId,
      startDate: params.startDate || new Date().toISOString().split('T')[0],
      targetDate: params.targetDate || params.targetEndDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      targetEndDate: params.targetEndDate || params.targetDate,
      budget: params.budget,
      actualCost: params.actualCost || (typeof params.budget === 'object' ? params.budget.spent || 0 : 0),
      forecastCost: typeof params.budget === 'object' ? (params.budget.spent || 0) + (params.budget.committed || 0) : params.budget,
      currency: typeof params.budget === 'object' ? params.budget.currency || 'USD' : params.currency || 'USD',
      tags: params.tags || [],
      linkedScmEntities: params.linkedScmEntities || [],
      milestones: params.milestones || [],
      risks: params.risks || [],
      progressPercentage: params.progressPercentage || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.projects.get(tenantId) || [];
    list.unshift(project);
    this.projects.set(tenantId, list);

    await ScmPersistenceService.getInstance().saveRecord('projects', projectId, project);

    KernelEventBus.getInstance().publish('PROJECT_CREATED', project, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: project.ownerId || 'SYSTEM', type: 'USER', name: project.ownerName || 'Project Owner' }
    });

    return project;
  }

  public async getProject(tenantId: string, projectId: string): Promise<ProjectRecord | null> {
    const list = this.projects.get(tenantId) || [];
    const found = list.find(p => p.projectId === projectId || p.id === projectId);
    if (found) return found;

    const fromDb = await ScmPersistenceService.getInstance().getRecord<ProjectRecord>('projects', tenantId, projectId);
    if (fromDb) {
      fromDb.id = fromDb.projectId || fromDb.id;
      list.push(fromDb);
      this.projects.set(tenantId, list);
      return fromDb;
    }
    return null;
  }

  public async listProjects(tenantId: string): Promise<ProjectRecord[]> {
    await this.hydrateTenant(tenantId);
    return this.projects.get(tenantId) || [];
  }

  /**
   * Updates an existing project.
   */
  public async updateProject(
    tenantId: string,
    projectId: string,
    updates: Partial<ProjectRecord>
  ): Promise<ProjectRecord> {
    const list = this.projects.get(tenantId) || [];
    const idx = list.findIndex(p => p.projectId === projectId || p.id === projectId);
    if (idx === -1) throw new Error(`Project ${projectId} not found`);

    const updated: ProjectRecord = {
      ...list[idx],
      ...updates,
      id: list[idx].id || list[idx].projectId,
      projectId: list[idx].projectId || list[idx].id,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    this.projects.set(tenantId, list);

    await ScmPersistenceService.getInstance().saveRecord('projects', updated.projectId, updated);

    KernelEventBus.getInstance().publish('PROJECT_UPDATED', updated, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: updated.ownerId || 'SYSTEM', type: 'USER', name: updated.ownerName || 'Project Owner' }
    });

    return updated;
  }

  /**
   * Creates a new Task within a Project.
   */
  public async createTask(params: any): Promise<ProjectTaskRecord> {
    const tenantId = params.tenantId;
    const taskId = params.taskId || params.id || `TSK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const task: ProjectTaskRecord = {
      id: taskId,
      taskId,
      projectId: params.projectId,
      tenantId,
      title: params.title,
      description: params.description || '',
      assigneeName: params.assigneeName || params.assignee || 'Unassigned',
      assignee: params.assignee || params.assigneeName || 'Unassigned',
      status: params.status || 'PLANNED',
      priority: params.priority || 'MEDIUM',
      estimatedHours: params.estimatedHours || 8,
      actualHours: params.actualHours || 0,
      dueDate: params.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      dependencies: params.dependencies || [],
      subtasks: params.subtasks || [],
      linkedScmEntity: params.linkedScmEntity,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.tasks.get(tenantId) || [];
    list.unshift(task);
    this.tasks.set(tenantId, list);

    await ScmPersistenceService.getInstance().saveRecord('project_tasks', taskId, task);

    KernelEventBus.getInstance().publish('PROJECT_TASK_CREATED', task, {
      tenant: { organizationId: tenantId, organizationName: tenantId },
      actor: { id: 'PROJECT_USER', type: 'USER', name: task.assigneeName || 'Project User' }
    });

    return task;
  }

  public async updateTaskStatus(
    tenantId: string,
    taskId: string,
    status: any
  ): Promise<ProjectTaskRecord> {
    const list = this.tasks.get(tenantId) || [];
    const idx = list.findIndex(t => t.taskId === taskId || t.id === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found`);

    const isComplete = status === 'DONE' || status === 'COMPLETED';
    const now = new Date().toISOString();

    const updated: ProjectTaskRecord = {
      ...list[idx],
      status,
      completedAt: isComplete ? (list[idx].completedAt || now) : undefined,
      updatedAt: now
    };

    list[idx] = updated;
    this.tasks.set(tenantId, list);

    await ScmPersistenceService.getInstance().saveRecord('project_tasks', updated.taskId, updated);

    // Recalculate parent project progress
    const projectTasks = list.filter(t => t.projectId === updated.projectId);
    const completedCount = projectTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const progressPercentage = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
    await this.updateProject(tenantId, updated.projectId, { progressPercentage });

    return updated;
  }

  public async linkScmEntity(
    tenantId: string,
    projectId: string,
    entity: LinkedScmEntity
  ): Promise<ProjectRecord> {
    const project = await this.getProject(tenantId, projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const linked = [...(project.linkedScmEntities || []), entity];
    return this.updateProject(tenantId, projectId, { linkedScmEntities: linked });
  }

  public calculateBudgetVariance(project: ProjectRecord): {
    totalAllocated: number;
    totalCommittedAndSpent: number;
    varianceAmount: number;
    isOverBudget: boolean;
    status: 'ON_TRACK' | 'WARNING' | 'OVER_BUDGET';
  } {
    let allocated = 0;
    let spent = 0;
    let committed = 0;

    if (typeof project.budget === 'number') {
      allocated = project.budget;
      spent = project.actualCost || 0;
      committed = 0;
    } else if (project.budget && typeof project.budget === 'object') {
      allocated = project.budget.allocated || 0;
      spent = project.budget.spent || 0;
      committed = project.budget.committed || 0;
    }

    const totalCommittedAndSpent = spent + committed;
    const varianceAmount = allocated - totalCommittedAndSpent;
    const isOverBudget = varianceAmount < 0;

    let status: 'ON_TRACK' | 'WARNING' | 'OVER_BUDGET' = 'ON_TRACK';
    if (isOverBudget) {
      status = 'OVER_BUDGET';
    } else if (varianceAmount < allocated * 0.1) {
      status = 'WARNING';
    }

    return {
      totalAllocated: allocated,
      totalCommittedAndSpent,
      varianceAmount,
      isOverBudget,
      status,
    };
  }

  /**
   * Updates task status, hours, or fields.
   */
  public async updateTask(
    tenantId: string,
    taskId: string,
    updates: Partial<ProjectTaskRecord>
  ): Promise<ProjectTaskRecord> {
    const list = this.tasks.get(tenantId) || [];
    const idx = list.findIndex(t => t.taskId === taskId || t.id === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found`);

    const updated: ProjectTaskRecord = {
      ...list[idx],
      ...updates,
      id: list[idx].id || list[idx].taskId,
      taskId: list[idx].taskId || list[idx].id,
      completedAt: (updates.status === 'COMPLETED' || updates.status === 'DONE') ? (list[idx].completedAt || new Date().toISOString()) : list[idx].completedAt,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    this.tasks.set(tenantId, list);

    await ScmPersistenceService.getInstance().saveRecord('project_tasks', updated.taskId, updated);

    // Recalculate project progress
    const projectTasks = list.filter(t => t.projectId === updated.projectId);
    const completedCount = projectTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const progressPercentage = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
    await this.updateProject(tenantId, updated.projectId, { progressPercentage });

    return updated;
  }

  /**
   * Toggles completion status of a milestone on a project.
   */
  public async toggleMilestone(
    tenantId: string,
    projectId: string,
    milestoneId: string,
    completed: boolean
  ): Promise<ProjectRecord> {
    const list = this.projects.get(tenantId) || [];
    const project = list.find(p => p.projectId === projectId || p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const updatedMilestones = (project.milestones || []).map(m => {
      if (m.milestoneId === milestoneId || m.id === milestoneId) {
        return {
          ...m,
          completed,
          completedDate: completed ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return m;
    });

    return this.updateProject(tenantId, project.projectId, { milestones: updatedMilestones });
  }

  /**
   * Adds a risk item to a project.
   */
  public async addRisk(tenantId: string, projectId: string, risk: Omit<ProjectRisk, 'riskId'>): Promise<ProjectRecord> {
    const list = this.projects.get(tenantId) || [];
    const project = list.find(p => p.projectId === projectId || p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const newRisk: ProjectRisk = {
      ...risk,
      riskId: `RSK-${Date.now().toString().slice(-4)}`
    };

    return this.updateProject(tenantId, project.projectId, { risks: [...(project.risks || []), newRisk] });
  }

  /**
   * Computes portfolio summary metrics across all projects and tasks.
   */
  public getPortfolioMetrics(tenantId: string): ProjectPortfolioMetrics {
    const pList = this.projects.get(tenantId) || [];
    const tList = this.tasks.get(tenantId) || [];
    const now = new Date().getTime();

    const totalProjects = pList.length;
    const activeProjects = pList.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = pList.filter(p => p.status === 'COMPLETED').length;
    const blockedProjects = pList.filter(p => p.status === 'ON_HOLD').length;

    const totalBudget = pList.reduce((acc, p) => {
      if (typeof p.budget === 'number') return acc + p.budget;
      if (p.budget && typeof p.budget === 'object') return acc + (p.budget.allocated || 0);
      return acc;
    }, 0);
    const totalActualCost = pList.reduce((acc, p) => acc + (p.actualCost || 0), 0);
    const budgetVariance = totalBudget - totalActualCost;

    const totalTasks = tList.length;
    const completedTasks = tList.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
    const blockedTasks = tList.filter(t => t.status === 'BLOCKED').length;
    const overdueTasks = tList.filter(t => {
      if (t.status === 'COMPLETED' || t.status === 'DONE' || t.status === 'CANCELLED') return false;
      return t.dueDate ? new Date(t.dueDate).getTime() < now : false;
    }).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      blockedProjects,
      totalBudget,
      totalActualCost,
      budgetVariance,
      totalTasks,
      completedTasks,
      overdueTasks,
      blockedTasks
    };
  }

  public getProjects(tenantId: string): ProjectRecord[] {
    return this.projects.get(tenantId) || [];
  }

  public getTasks(tenantId: string, projectId?: string): ProjectTaskRecord[] {
    const all = this.tasks.get(tenantId) || [];
    if (projectId) return all.filter(t => t.projectId === projectId);
    return all;
  }

  public async listTasks(tenantId: string, projectId?: string): Promise<ProjectTaskRecord[]> {
    await this.hydrateTenant(tenantId);
    return this.getTasks(tenantId, projectId);
  }

  public clear(): void {
    this.projects.clear();
    this.tasks.clear();
    this.initializedTenants.clear();
  }
}

export const projectManagementEngine = ProjectManagementEngine.getInstance();
