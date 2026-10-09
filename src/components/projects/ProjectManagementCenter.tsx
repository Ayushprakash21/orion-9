/**
 * ORION-9 PROJECT MANAGEMENT CENTER
 * First-class OS Application for Enterprise SCM Initiative Governance,
 * Portfolio Health, Kanban Execution, Milestones, and Budget Controls.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  User,
  Tag,
  Link as LinkIcon,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import {
  ProjectRecord,
  ProjectTaskRecord,
  ProjectCategory,
  ProjectPriority,
  TaskStatus,
  ProjectMilestone
} from '../../core/projects/ProjectTypes';
import { projectManagementEngine } from '../../core/projects/ProjectManagementEngine';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency } from '../../lib/formatters';

const getBudgetValue = (budget: any): number => {
  if (typeof budget === 'number') return budget;
  if (budget && typeof budget === 'object' && typeof budget.allocated === 'number') return budget.allocated;
  return 0;
};

export const ProjectManagementCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'KANBAN' | 'TIMELINE' | 'TASKS' | 'SCM_LINKS'>('PORTFOLIO');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Form states for New Project
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<ProjectCategory>('SUPPLIER_ONBOARDING');
  const [newProjectPriority, setNewProjectPriority] = useState<ProjectPriority>('HIGH');
  const [newProjectBudget, setNewProjectBudget] = useState(150000);
  const [newProjectTargetDate, setNewProjectTargetDate] = useState('2026-12-31');

  // Form states for New Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectPriority>('HIGH');
  const [newTaskAssignee, setNewTaskAssignee] = useState(profile?.fullName || 'Senior Engineer');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-11-15');
  const [newTaskHours, setNewTaskHours] = useState(16);

  // Engine state
  const [projects, setProjects] = useState<ProjectRecord[]>(() => projectManagementEngine.getProjects(tenantId));
  const [tasks, setTasks] = useState<ProjectTaskRecord[]>(() => projectManagementEngine.getTasks(tenantId));

  const refreshState = () => {
    setProjects(projectManagementEngine.getProjects(tenantId));
    setTasks(projectManagementEngine.getTasks(tenantId));
  };

  useEffect(() => {
    projectManagementEngine.hydrateTenant(tenantId).then(() => {
      refreshState();
    });
  }, [tenantId]);

  const metrics = useMemo(() => {
    return projectManagementEngine.getPortfolioMetrics(tenantId);
  }, [projects, tasks, tenantId]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, categoryFilter]);

  const activeProject = useMemo(() => {
    if (!selectedProjectId) return projects[0] || null;
    return projects.find(p => p.projectId === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    await projectManagementEngine.createProject({
      tenantId,
      name: newProjectName,
      description: newProjectDesc,
      category: newProjectCategory,
      priority: newProjectPriority,
      ownerId: profile?.id || 'usr-current',
      ownerName: profile?.fullName || 'Project Owner',
      department: 'Supply Chain Operations',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: newProjectTargetDate,
      budget: Number(newProjectBudget),
      currency: 'USD',
      tags: [newProjectCategory.replace(/_/g, ' ')],
      milestones: [
        {
          milestoneId: `MS-${Date.now().toString().slice(-4)}`,
          title: 'Phase 1 Scoping & Baseline Sign-Off',
          targetDate: newProjectTargetDate,
          completed: false
        }
      ]
    });

    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectModal(false);
    refreshState();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId) return;

    await projectManagementEngine.createTask({
      tenantId,
      projectId: newTaskProjectId,
      title: newTaskTitle,
      description: newTaskDesc,
      assigneeName: newTaskAssignee,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      estimatedHours: Number(newTaskHours)
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowNewTaskModal(false);
    refreshState();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await projectManagementEngine.updateTask(tenantId, taskId, { status: newStatus });
    refreshState();
  };

  const handleMilestoneToggle = async (projectId: string, milestoneId: string, currentVal: boolean) => {
    await projectManagementEngine.toggleMilestone(tenantId, projectId, milestoneId, !currentVal);
    refreshState();
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-[#03060E] text-white overflow-hidden font-sans select-none"
      data-testid="project-management-center"
    >
      {/* Top Application Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Project Management Center
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SCM PORTFOLIO & EXECUTION
              </span>
            </h1>
            <p className="text-xs text-white/50">
              Cross-functional strategic programs, warehouse implementations, supplier onboarding, and SCM workstreams.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshState}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button
            onClick={() => {
              setNewTaskProjectId(projects[0]?.projectId || '');
              setShowNewTaskModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-500/30 text-xs font-medium text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-6 py-3 border-b border-white/5 bg-slate-900/30 text-xs">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Active Projects</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">{metrics.activeProjects} / {metrics.totalProjects}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Budget Committed</div>
          <div className="text-lg font-bold text-white mt-0.5">{formatCurrency(metrics.totalBudget, 'USD')}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Actual Expenditure</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(metrics.totalActualCost, 'USD')}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Tasks Completed</div>
          <div className="text-lg font-bold text-blue-400 mt-0.5">{metrics.completedTasks} / {metrics.totalTasks}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Overdue Tasks</div>
          <div className={`text-lg font-bold mt-0.5 ${metrics.overdueTasks > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {metrics.overdueTasks}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[10px] uppercase font-mono">Blocked Workstreams</div>
          <div className={`text-lg font-bold mt-0.5 ${metrics.blockedTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {metrics.blockedTasks}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/10 bg-slate-950/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'PORTFOLIO'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Portfolio Overview
          </button>
          <button
            onClick={() => setActiveTab('KANBAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'KANBAN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TIMELINE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Gantt Milestones
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TASKS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Task Register
          </button>
          <button
            onClick={() => setActiveTab('SCM_LINKS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SCM_LINKS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            SCM Entity Bridge
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search projects or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 w-52"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Categories</option>
            <option value="SUPPLIER_ONBOARDING">Supplier Onboarding</option>
            <option value="WAREHOUSE_IMPLEMENTATION">Warehouse Automation</option>
            <option value="LOGISTICS_REDESIGN">Logistics Redesign</option>
            <option value="FINANCE_IMPROVEMENT">Finance & Cash</option>
            <option value="DISRUPTION_RECOVERY">Disruption Recovery</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* VIEW 1: PORTFOLIO OVERVIEW */}
        {activeTab === 'PORTFOLIO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project.projectId);
              const completedTasksCount = projectTasks.filter(t => t.status === 'COMPLETED').length;
              const progressPct = projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0;
              const budgetVal = getBudgetValue(project.budget);
              const budgetSpentPct = budgetVal > 0 ? Math.round(((project.actualCost || 0) / budgetVal) * 100) : 0;

              return (
                <div
                  key={project.projectId}
                  onClick={() => setSelectedProjectId(project.projectId)}
                  className={`flex flex-col p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedProjectId === project.projectId
                      ? 'bg-slate-900/80 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                      : 'bg-slate-950/50 hover:bg-slate-900/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                      project.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      project.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {project.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-3 group-hover:text-cyan-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1">
                    {project.description}
                  </p>

                  {/* SCM Links Pill Strip */}
                  {project.linkedScmEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.linkedScmEntities.map((link, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 font-mono">
                          <LinkIcon className="w-2.5 h-2.5 text-cyan-400" />
                          {link.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress & Budget Bars */}
                  <div className="mt-5 space-y-3 pt-3 border-t border-white/5">
                    <div>
                      <div className="flex justify-between text-[11px] text-white/50 mb-1">
                        <span>Task Completion</span>
                        <span className="font-mono text-white font-medium">{progressPct}% ({completedTasksCount}/{projectTasks.length})</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-white/50 mb-1">
                        <span>Budget Spent</span>
                        <span className="font-mono text-white font-medium">{formatCurrency(project.actualCost || 0, project.currency)} / {formatCurrency(budgetVal, project.currency)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            budgetSpentPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, budgetSpentPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 text-[11px] text-white/40 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" />
                      {project.ownerName}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-white/40" />
                      Due {project.targetDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: KANBAN BOARD */}
        {activeTab === 'KANBAN' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
            {(['PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'] as TaskStatus[]).map(statusCol => {
              const colTasks = tasks.filter(t => t.status === statusCol);
              const colTitle = statusCol.replace(/_/g, ' ');
              const colColor = statusCol === 'COMPLETED' ? 'border-emerald-500/30' :
                statusCol === 'BLOCKED' ? 'border-rose-500/30' :
                statusCol === 'IN_PROGRESS' ? 'border-cyan-500/30' : 'border-white/10';

              return (
                <div key={statusCol} className="flex flex-col bg-slate-950/40 rounded-xl border border-white/10 p-3 h-full">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        statusCol === 'COMPLETED' ? 'bg-emerald-400' :
                        statusCol === 'BLOCKED' ? 'bg-rose-400' :
                        statusCol === 'IN_PROGRESS' ? 'bg-cyan-400' : 'bg-slate-400'
                      }`} />
                      {colTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-white/60">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colTasks.map(task => {
                      const proj = projects.find(p => p.projectId === task.projectId);
                      return (
                        <div
                          key={task.taskId}
                          className={`p-3.5 rounded-xl bg-slate-900/60 border ${colColor} shadow-md hover:bg-slate-900 transition-all group`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono text-cyan-400/80 font-semibold">
                              {proj?.name?.slice(0, 24)}...
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                              task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-white mt-1.5 group-hover:text-cyan-200">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-white/50 line-clamp-2 mt-1">
                            {task.description}
                          </p>

                          {task.blockers && task.blockers.length > 0 && (
                            <div className="mt-2 p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                              <span className="truncate">{task.blockers[0]}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-white/40">
                            <span>{task.assigneeName}</span>
                            <span className="font-mono">{task.dueDate}</span>
                          </div>

                          {/* Quick Status Action Buttons */}
                          <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-white/5">
                            {statusCol !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(task.taskId, 'IN_PROGRESS')}
                                className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                              >
                                In Progress
                              </button>
                            )}
                            {statusCol !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStatusChange(task.taskId, 'COMPLETED')}
                                className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              >
                                Complete
                              </button>
                            )}
                            {statusCol !== 'BLOCKED' && (
                              <button
                                onClick={() => handleStatusChange(task.taskId, 'BLOCKED')}
                                className="px-2 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                              >
                                Block
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: GANTT MILESTONES */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-6">
            {projects.map(project => (
              <div key={project.projectId} className="p-5 rounded-2xl bg-slate-950/50 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {project.name}
                      <span className="text-xs font-mono font-normal text-white/40">({project.startDate} to {project.targetDate})</span>
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">{project.description}</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-400">
                    Budget: {formatCurrency(getBudgetValue(project.budget), project.currency)}
                  </span>
                </div>

                {/* Milestone Stepper */}
                <div className="mt-5 space-y-3">
                  {project.milestones.map((milestone, idx) => (
                    <div
                      key={milestone.milestoneId}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleMilestoneToggle(project.projectId, milestone.milestoneId, milestone.completed)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            milestone.completed
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                              : 'border border-white/30 text-transparent hover:border-cyan-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <div>
                          <div className={`text-xs font-semibold ${milestone.completed ? 'text-white line-through opacity-70' : 'text-white'}`}>
                            {milestone.title}
                          </div>
                          {milestone.deliverables && (
                            <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                              Deliverables: {milestone.deliverables.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className={milestone.completed ? 'text-emerald-400' : 'text-white/50'}>
                          Target: {milestone.targetDate}
                        </span>
                        {milestone.completed && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                            PASSED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 4: TASK REGISTER */}
        {activeTab === 'TASKS' && (
          <div className="bg-slate-950/50 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-white/40 font-mono">
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Est. Hours</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map(task => {
                  const proj = projects.find(p => p.projectId === task.projectId);
                  return (
                    <tr key={task.taskId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-400">{task.taskId}</td>
                      <td className="py-3 px-4 text-white/70 max-w-[150px] truncate">{proj?.name || task.projectId}</td>
                      <td className="py-3 px-4 font-medium text-white">{task.title}</td>
                      <td className="py-3 px-4 text-white/60">{task.assigneeName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                          task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                          task.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300' :
                          task.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/60'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-white/50">{task.dueDate}</td>
                      <td className="py-3 px-4 font-mono text-white/50">{task.estimatedHours}h</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStatusChange(task.taskId, task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED')}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
                        >
                          {task.status === 'COMPLETED' ? 'Reopen' : 'Done'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 5: SCM ENTITY BRIDGE */}
        {activeTab === 'SCM_LINKS' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300">
              Projects reference authoritative SCM records (Vendors, Purchase Orders, Warehouses, Shipments) without duplicating persistence.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(proj => (
                <div key={proj.projectId} className="p-4 rounded-xl bg-slate-950/50 border border-white/10">
                  <h4 className="font-semibold text-white text-sm">{proj.name}</h4>
                  <p className="text-xs text-white/50 mt-1">{proj.category} ({proj.ownerName})</p>

                  <div className="mt-3 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-white/40">Connected SCM Entities:</div>
                    {proj.linkedScmEntities.length === 0 ? (
                      <span className="text-xs text-white/30 italic">No external SCM dependencies configured.</span>
                    ) : (
                      proj.linkedScmEntities.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                          <span className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold">
                              {link.type}
                            </span>
                            <span className="text-white font-medium">{link.label}</span>
                          </span>
                          <span className="font-mono text-white/40 text-[11px]">{link.id}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE PROJECT */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                Initialize Strategic SCM Project
              </h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Guided Vehicle (AGV) Fleet Expansion"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Strategic Objective / Scope</label>
                <textarea
                  rows={2}
                  placeholder="Describe purpose, business outcome, and operational milestones..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Category</label>
                  <select
                    value={newProjectCategory}
                    onChange={e => setNewProjectCategory(e.target.value as ProjectCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="SUPPLIER_ONBOARDING">Supplier Dual-Sourcing</option>
                    <option value="WAREHOUSE_IMPLEMENTATION">Warehouse Automation</option>
                    <option value="LOGISTICS_REDESIGN">Logistics Redesign</option>
                    <option value="ERP_INTEGRATION">ERP Integration</option>
                    <option value="FINANCE_IMPROVEMENT">Finance Improvement</option>
                    <option value="DISRUPTION_RECOVERY">Disruption Recovery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 mb-1">Priority</label>
                  <select
                    value={newProjectPriority}
                    onChange={e => setNewProjectPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Authorized Budget ($)</label>
                  <input
                    type="number"
                    value={newProjectBudget}
                    onChange={e => setNewProjectBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={newProjectTargetDate}
                    onChange={e => setNewProjectTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TASK */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add Project Task
              </h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Assign to Project</label>
                <select
                  required
                  value={newTaskProjectId}
                  onChange={e => setNewTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calibrate optical barcode scanners"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTaskHours}
                    onChange={e => setNewTaskHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectManagementCenter;
