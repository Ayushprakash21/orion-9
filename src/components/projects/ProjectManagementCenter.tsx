/**
 * ORION-9 JIRA-CLASS PROJECT MANAGEMENT CENTER
 * Comprehensive enterprise platform for SCM Initiative Governance,
 * Scrum Sprint cycles, Kanban WIP management, JQL filtering, Backlog planning,
 * Burndown/Velocity reporting, Releases/Versions, Workflow Automation, and SCM Bridge.
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
  ChevronDown,
  User,
  Tag,
  Link as LinkIcon,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  ListTodo,
  Columns3,
  BarChart3,
  BookOpen,
  Milestone,
  Package,
  Boxes,
  MessageSquare,
  FileText,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';
import {
  ProjectRecord,
  ProjectTaskRecord,
  ProjectCategory,
  ProjectPriority,
  TaskStatus,
  ProjectMilestone,
  SprintRecord,
  ProjectVersion,
  ProjectComponent,
  IssueType
} from '../../core/projects/ProjectTypes';
import { projectManagementEngine } from '../../core/projects/ProjectManagementEngine';
import { JqlEngine } from '../../core/projects/JqlEngine';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency } from '../../lib/formatters';

type CenterNavTab =
  | 'PORTFOLIO'
  | 'BACKLOG'
  | 'ACTIVE_SPRINT'
  | 'KANBAN'
  | 'ISSUES_JQL'
  | 'BURNDOWN'
  | 'RELEASES'
  | 'SCM_LINKS';

const getBudgetValue = (budget: any): number => {
  if (typeof budget === 'number') return budget;
  if (budget && typeof budget === 'object' && typeof budget.allocated === 'number') return budget.allocated;
  return 0;
};

export const ProjectManagementCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<CenterNavTab>('PORTFOLIO');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [jqlQuery, setJqlQuery] = useState('status != DONE ORDER BY priority DESC');
  const [jqlError, setJqlError] = useState<string | null>(null);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [showStartSprintModal, setShowStartSprintModal] = useState(false);
  const [showCompleteSprintModal, setShowCompleteSprintModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);

  // Form states: New Project
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectType, setNewProjectType] = useState<'SCRUM' | 'KANBAN'>('SCRUM');
  const [newProjectCategory, setNewProjectCategory] = useState<ProjectCategory>('SUPPLIER_ONBOARDING');
  const [newProjectPriority, setNewProjectPriority] = useState<ProjectPriority>('HIGH');
  const [newProjectBudget, setNewProjectBudget] = useState(150000);
  const [newProjectTargetDate, setNewProjectTargetDate] = useState('2026-12-31');

  // Form states: New Task / Issue
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<IssueType>('STORY');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskSprintId, setNewTaskSprintId] = useState<string>('');
  const [newTaskEpicId, setNewTaskEpicId] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectPriority>('HIGH');
  const [newTaskAssignee, setNewTaskAssignee] = useState(profile?.fullName || 'Senior Engineer');
  const [newTaskStoryPoints, setNewTaskStoryPoints] = useState<number>(5);
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-11-15');
  const [newTaskHours, setNewTaskHours] = useState(16);

  // Form states: Sprint
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState(new Date().toISOString().split('T')[0]);
  const [newSprintEnd, setNewSprintEnd] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [activeSprintToManage, setActiveSprintToManage] = useState<SprintRecord | null>(null);

  // Form states: Version
  const [newVerName, setNewVerName] = useState('');
  const [newVerDesc, setNewVerDesc] = useState('');
  const [newVerReleaseDate, setNewVerReleaseDate] = useState('2026-12-15');

  // Work Log / Comment Form states (Inspector Drawer)
  const [logHoursInput, setLogHoursInput] = useState<number>(2);
  const [logCommentInput, setLogCommentInput] = useState('');
  const [commentInput, setCommentInput] = useState('');

  // Engine state
  const [projects, setProjects] = useState<ProjectRecord[]>(() => projectManagementEngine.getProjects(tenantId));
  const [tasks, setTasks] = useState<ProjectTaskRecord[]>(() => projectManagementEngine.getTasks(tenantId));
  const [sprints, setSprints] = useState<SprintRecord[]>(() => projectManagementEngine.getSprints(tenantId));
  const [versions, setVersions] = useState<ProjectVersion[]>(() => projectManagementEngine.getVersions(tenantId));

  const refreshState = () => {
    setProjects(projectManagementEngine.getProjects(tenantId));
    setTasks(projectManagementEngine.getTasks(tenantId));
    setSprints(projectManagementEngine.getSprints(tenantId));
    setVersions(projectManagementEngine.getVersions(tenantId));
  };

  useEffect(() => {
    projectManagementEngine.hydrateTenant(tenantId).then(() => {
      refreshState();
    });
  }, [tenantId]);

  const activeProject = useMemo(() => {
    if (!selectedProjectId) return projects[0] || null;
    return projects.find(p => p.projectId === selectedProjectId || p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const activeProjectSprints = useMemo(() => {
    if (!activeProject) return [];
    return sprints.filter(s => s.projectId === activeProject.projectId || s.projectId === activeProject.id);
  }, [sprints, activeProject]);

  const activeSprint = useMemo(() => {
    return activeProjectSprints.find(s => s.status === 'ACTIVE') || null;
  }, [activeProjectSprints]);

  const activeProjectTasks = useMemo(() => {
    if (!activeProject) return [];
    return tasks.filter(t => t.projectId === activeProject.projectId || t.projectId === activeProject.id);
  }, [tasks, activeProject]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.taskId === selectedTaskId || t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const metrics = useMemo(() => {
    return projectManagementEngine.getPortfolioMetrics(tenantId);
  }, [projects, tasks, tenantId]);

  // JQL Filtered tasks
  const jqlFilteredTasks = useMemo(() => {
    if (!jqlQuery.trim()) return activeProject ? activeProjectTasks : tasks;
    const validation = JqlEngine.validate(jqlQuery);
    if (!validation.valid) {
      setJqlError(validation.error || 'Syntax error');
      return activeProject ? activeProjectTasks : tasks;
    }
    setJqlError(null);
    const scope = activeProject ? activeProjectTasks : tasks;
    return JqlEngine.filter(scope, jqlQuery);
  }, [jqlQuery, tasks, activeProject, activeProjectTasks]);

  // Burndown points calculation
  const burndownData = useMemo(() => {
    if (!activeSprint) return [];
    return projectManagementEngine.calculateSprintBurndown(tenantId, activeSprint.sprintId);
  }, [activeSprint, tenantId]);

  const velocity = useMemo(() => {
    if (!activeProject) return 0;
    return projectManagementEngine.calculateVelocity(tenantId, activeProject.projectId || activeProject.id);
  }, [activeProject, tenantId, sprints]);

  // Handler: Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    await projectManagementEngine.createProject({
      tenantId,
      name: newProjectName,
      key: newProjectKey ? newProjectKey.toUpperCase() : undefined,
      description: newProjectDesc,
      category: newProjectCategory,
      projectType: newProjectType,
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
    setNewProjectKey('');
    setShowNewProjectModal(false);
    refreshState();
  };

  // Handler: Create Task / Issue
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjId = newTaskProjectId || activeProject?.projectId || activeProject?.id;
    if (!newTaskTitle.trim() || !targetProjId) return;

    try {
      await projectManagementEngine.createTask({
        tenantId,
        projectId: targetProjId,
        title: newTaskTitle,
        summary: newTaskTitle,
        description: newTaskDesc,
        issueType: newTaskType,
        sprintId: newTaskSprintId || undefined,
        epicId: newTaskEpicId || undefined,
        storyPoints: Number(newTaskStoryPoints),
        assigneeName: newTaskAssignee,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        estimatedHours: Number(newTaskHours)
      });

      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowNewTaskModal(false);
      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error creating issue');
    }
  };

  // Handler: Status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await projectManagementEngine.updateTask(tenantId, taskId, { status: newStatus });
    refreshState();
  };

  // Handler: Create Sprint
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newSprintName.trim()) return;

    await projectManagementEngine.createSprint(tenantId, activeProject.projectId || activeProject.id, {
      name: newSprintName,
      goal: newSprintGoal,
      startDate: newSprintStart,
      endDate: newSprintEnd
    });

    setNewSprintName('');
    setNewSprintGoal('');
    setShowNewSprintModal(false);
    refreshState();
  };

  // Handler: Start Sprint
  const handleStartSprint = async () => {
    if (!activeSprintToManage) return;
    try {
      await projectManagementEngine.startSprint(
        tenantId,
        activeSprintToManage.sprintId,
        newSprintStart,
        newSprintEnd,
        newSprintGoal
      );
      setShowStartSprintModal(false);
      setActiveSprintToManage(null);
      refreshState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Complete Sprint
  const handleCompleteSprint = async (rolloverTarget: 'BACKLOG' | string) => {
    if (!activeSprint) return;
    await projectManagementEngine.completeSprint(tenantId, activeSprint.sprintId, rolloverTarget);
    setShowCompleteSprintModal(false);
    refreshState();
  };

  // Handler: Create Version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newVerName.trim()) return;

    await projectManagementEngine.createVersion(tenantId, activeProject.projectId || activeProject.id, {
      projectId: activeProject.projectId || activeProject.id,
      name: newVerName,
      description: newVerDesc,
      status: 'UNRELEASED',
      releaseDate: newVerReleaseDate
    });

    setNewVerName('');
    setNewVerDesc('');
    setShowNewVersionModal(false);
    refreshState();
  };

  // Handler: Release Version
  const handleReleaseVersion = async (verId: string) => {
    await projectManagementEngine.releaseVersion(tenantId, verId, 'Released from Orion-9 Project Center');
    refreshState();
  };

  // Handler: Work Log
  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || logHoursInput <= 0) return;

    await projectManagementEngine.logWork(
      tenantId,
      selectedTask.taskId,
      profile?.id || 'usr-current',
      profile?.fullName || 'Project Engineer',
      logHoursInput,
      logCommentInput || undefined
    );
    setLogCommentInput('');
    refreshState();
  };

  // Handler: Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentInput.trim()) return;

    await projectManagementEngine.addComment(
      tenantId,
      selectedTask.taskId,
      profile?.id || 'usr-current',
      profile?.fullName || 'Project Engineer',
      commentInput.trim()
    );
    setCommentInput('');
    refreshState();
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-[#03060E] text-white overflow-hidden font-sans select-none"
      data-testid="project-management-center"
    >
      {/* Top Application Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Project Management Center</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                JIRA SOFTWARE CLASS
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
              <span>Selected Project:</span>
              <select
                value={activeProject?.projectId || activeProject?.id || ''}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-cyan-300 font-semibold focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.projectId || p.id} value={p.projectId || p.id} className="bg-slate-900 text-white">
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshState}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button
            onClick={() => {
              setNewTaskProjectId(activeProject?.projectId || activeProject?.id || '');
              setShowNewTaskModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 border border-blue-500/30 text-xs font-medium text-white transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Issue
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 px-6 py-2.5 border-b border-white/5 bg-slate-900/30 text-xs shrink-0">
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Active Projects</div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">{metrics.activeProjects} / {metrics.totalProjects}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Velocity (Avg Pts)</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">{velocity} pts / sprint</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Sprint Status</div>
          <div className="text-base font-bold text-white mt-0.5">
            {activeSprint ? (
              <span className="text-cyan-300 font-mono text-xs">{activeSprint.name}</span>
            ) : (
              <span className="text-white/40 text-xs italic">No active sprint</span>
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Story Points</div>
          <div className="text-base font-bold text-blue-400 mt-0.5">{metrics.completedStoryPoints || 0} / {metrics.totalStoryPoints || 0}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Budget Committed</div>
          <div className="text-base font-bold text-white mt-0.5">{formatCurrency(metrics.totalBudget, 'USD')}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Overdue Issues</div>
          <div className={`text-base font-bold mt-0.5 ${metrics.overdueTasks > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {metrics.overdueTasks}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-white/40 text-[9px] uppercase font-mono">Blocked Workstreams</div>
          <div className={`text-base font-bold mt-0.5 ${metrics.blockedTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {metrics.blockedTasks}
          </div>
        </div>
      </div>

      {/* Main Workspace Frame (Sidebar Navigation + Workspace Body + Detail Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Jira Module Navigation Sidebar */}
        <div className="w-56 border-r border-white/10 bg-slate-950/60 flex flex-col justify-between shrink-0 p-3">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-white/40 tracking-wider">
              Planning & Boards
            </div>

            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Portfolio Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('BACKLOG')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'BACKLOG'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListTodo className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Backlog & Sprints</span>
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE_SPRINT')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'ACTIVE_SPRINT'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Columns3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Active Sprint Board</span>
            </button>

            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'KANBAN'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Kanban WIP Board</span>
            </button>

            <div className="pt-3 px-3 py-1.5 text-[10px] font-mono uppercase text-white/40 tracking-wider">
              Search & Reporting
            </div>

            <button
              onClick={() => setActiveTab('ISSUES_JQL')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'ISSUES_JQL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4 text-violet-400 shrink-0" />
              <span>JQL Query Search</span>
            </button>

            <button
              onClick={() => setActiveTab('BURNDOWN')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'BURNDOWN'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Sprint Burndown</span>
            </button>

            <button
              onClick={() => setActiveTab('RELEASES')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'RELEASES'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Releases & Versions</span>
            </button>

            <button
              onClick={() => setActiveTab('SCM_LINKS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                activeTab === 'SCM_LINKS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>SCM Entity Bridge</span>
            </button>
          </div>

          {/* Sidebar Project Summary Footer */}
          {activeProject && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <div className="font-semibold text-white truncate">[{activeProject.key}] {activeProject.name}</div>
              <div className="text-[10px] text-white/50 mt-1">Lead: {activeProject.ownerName}</div>
              <div className="text-[10px] text-white/50">Type: {activeProject.projectType || 'SCRUM'}</div>
            </div>
          )}
        </div>

        {/* Center Main Tab Content Body */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 min-w-0">
          {/* TAB 1: PORTFOLIO OVERVIEW */}
          {activeTab === 'PORTFOLIO' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Strategic SCM Portfolio</h2>
                  <p className="text-xs text-white/50">Enterprise workstreams, facilities investments, and supplier programs.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none w-48"
                  />
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="SUPPLIER_ONBOARDING">Supplier Onboarding</option>
                    <option value="WAREHOUSE_IMPLEMENTATION">Warehouse Automation</option>
                    <option value="LOGISTICS_REDESIGN">Logistics Redesign</option>
                    <option value="FINANCE_IMPROVEMENT">Finance Improvement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => {
                  const pTasks = tasks.filter(t => t.projectId === project.projectId || t.projectId === project.id);
                  const completedCount = pTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
                  const pct = pTasks.length > 0 ? Math.round((completedCount / pTasks.length) * 100) : 0;
                  const bVal = getBudgetValue(project.budget);

                  return (
                    <div
                      key={project.projectId || project.id}
                      onClick={() => setSelectedProjectId(project.projectId || project.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                        (selectedProjectId === project.projectId || selectedProjectId === project.id)
                          ? 'bg-slate-900/80 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                          : 'bg-slate-950/50 hover:bg-slate-900/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                          {project.key}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">{project.projectType || 'SCRUM'}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-white mt-3 group-hover:text-cyan-300">
                        {project.name}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1">
                        {project.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-white/60">
                          <span>Progress</span>
                          <span className="font-mono text-white font-medium">{pct}% ({completedCount}/{pTasks.length} issues)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5 text-[11px] text-white/40 font-mono">
                        <span>Lead: {project.ownerName}</span>
                        <span>Budget: {formatCurrency(bVal, project.currency || 'USD')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BACKLOG & SPRINTS */}
          {activeTab === 'BACKLOG' && activeProject && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Backlog Planning
                    <span className="text-xs font-mono font-normal text-cyan-400">[{activeProject.key}]</span>
                  </h2>
                  <p className="text-xs text-white/50">Organize sprint commitments, prioritize backlog issues, and plan capacities.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewSprintName(`${activeProject.key} Sprint ${activeProjectSprints.length + 1}`);
                      setShowNewSprintModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Sprint
                  </button>
                </div>
              </div>

              {/* Sprints Grouping */}
              {activeProjectSprints.map(sprint => {
                const sprintTasks = activeProjectTasks.filter(t => t.sprintId === sprint.sprintId);
                const sprintPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

                return (
                  <div key={sprint.sprintId} className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${sprint.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                        <h3 className="text-sm font-bold text-white">{sprint.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
                          {sprint.status}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {sprintPoints} story points ({sprintTasks.length} issues)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sprint.status === 'FUTURE' && (
                          <button
                            onClick={() => {
                              setActiveSprintToManage(sprint);
                              setShowStartSprintModal(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            <Play className="w-3 h-3" />
                            Start Sprint
                          </button>
                        )}
                        {sprint.status === 'ACTIVE' && (
                          <button
                            onClick={() => setShowCompleteSprintModal(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Complete Sprint
                          </button>
                        )}
                      </div>
                    </div>

                    {sprint.goal && (
                      <div className="text-xs text-white/60 bg-white/[0.02] p-2 rounded border border-white/5">
                        Sprint Goal: {sprint.goal}
                      </div>
                    )}

                    {/* Sprint issues list */}
                    <div className="divide-y divide-white/5 bg-slate-900/40 rounded-lg border border-white/5">
                      {sprintTasks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-white/30 italic">
                          No issues assigned to this sprint. Drag or assign issues from the backlog.
                        </div>
                      ) : (
                        sprintTasks.map(task => (
                          <div
                            key={task.taskId}
                            onClick={() => setSelectedTaskId(task.taskId)}
                            className="flex items-center justify-between p-2.5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                                {task.key}
                              </span>
                              <span className="text-xs font-medium text-white">{task.summary || task.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60">
                                {task.storyPoints || 0} pts
                              </span>
                              <span className="text-white/40">{task.assigneeName}</span>
                              <span className="font-mono text-[10px] text-white/40">{task.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Unassigned Backlog Section */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Product Backlog</h3>
                    <span className="text-xs font-mono text-white/40">
                      ({activeProjectTasks.filter(t => !t.sprintId).length} issues)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-white/5 bg-slate-900/40 rounded-lg border border-white/5">
                  {activeProjectTasks.filter(t => !t.sprintId).map(task => (
                    <div
                      key={task.taskId}
                      onClick={() => setSelectedTaskId(task.taskId)}
                      className="flex items-center justify-between p-2.5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                          {task.key}
                        </span>
                        <span className="text-xs font-medium text-white">{task.summary || task.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60">
                          {task.storyPoints || 0} pts
                        </span>
                        <span className="text-white/40">{task.assigneeName}</span>
                        {activeProjectSprints.length > 0 && (
                          <select
                            onClick={e => e.stopPropagation()}
                            onChange={async e => {
                              await projectManagementEngine.updateTask(tenantId, task.taskId, {
                                sprintId: e.target.value || undefined
                              });
                              refreshState();
                            }}
                            className="bg-white/5 border border-white/10 text-[10px] rounded px-1.5 py-0.5 text-cyan-300 focus:outline-none"
                            defaultValue=""
                          >
                            <option value="">Move to Sprint...</option>
                            {activeProjectSprints.map(s => (
                              <option key={s.sprintId} value={s.sprintId} className="bg-slate-900 text-white">
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE SPRINT BOARD */}
          {activeTab === 'ACTIVE_SPRINT' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Active Sprint: {activeSprint ? activeSprint.name : 'No Active Sprint'}
                  </h2>
                  <p className="text-xs text-white/50">
                    {activeSprint ? `Goal: ${activeSprint.goal || 'Sprint execution in progress'}` : 'Start a sprint from the Backlog tab.'}
                  </p>
                </div>
                {activeSprint && (
                  <button
                    onClick={() => setShowCompleteSprintModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                  >
                    Complete Sprint
                  </button>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
                {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map(statusCol => {
                  const sprintTasks = activeProjectTasks.filter(
                    t => (activeSprint ? t.sprintId === activeSprint.sprintId : true) && t.status === statusCol
                  );
                  return (
                    <div key={statusCol} className="flex flex-col bg-slate-950/50 rounded-xl border border-white/10 p-3 h-full overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusCol === 'DONE' ? 'bg-emerald-400' : statusCol === 'IN_PROGRESS' ? 'bg-cyan-400' : 'bg-slate-400'}`} />
                          {statusCol.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-white/60">
                          {sprintTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {sprintTasks.map(task => (
                          <div
                            key={task.taskId}
                            onClick={() => setSelectedTaskId(task.taskId)}
                            className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 cursor-pointer shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono text-cyan-300 font-bold">{task.key}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-white/60">
                                {task.storyPoints || 0} pts
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-white mt-1.5 group-hover:text-cyan-200">
                              {task.summary || task.title}
                            </h4>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-white/40">
                              <span>{task.assigneeName}</span>
                              <span className="font-mono">{task.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: KANBAN WIP BOARD */}
          {activeTab === 'KANBAN' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-white">Kanban Continuous Flow Board</h2>
                  <p className="text-xs text-white/50">WIP limit enforcement across operational task stages.</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
                {activeProject?.kanbanColumns?.map(col => {
                  const colTasks = activeProjectTasks.filter(t => t.status === col.id);
                  const isWipExceeded = col.wipLimit ? colTasks.length > col.wipLimit : false;

                  return (
                    <div key={col.id} className="flex flex-col bg-slate-950/50 rounded-xl border border-white/10 p-3 h-full overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            isWipExceeded ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/5 text-white/60'
                          }`}>
                            {colTasks.length} {col.wipLimit ? `/ ${col.wipLimit}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {colTasks.map(task => (
                          <div
                            key={task.taskId}
                            onClick={() => setSelectedTaskId(task.taskId)}
                            className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 cursor-pointer shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono text-cyan-300 font-bold">{task.key}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                                task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-white mt-1.5 group-hover:text-cyan-200">
                              {task.summary || task.title}
                            </h4>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-white/40">
                              <span>{task.assigneeName}</span>
                              <span className="font-mono">{task.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: JQL QUERY SEARCH */}
          {activeTab === 'ISSUES_JQL' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Jira Query Language (JQL) Search</h2>
                <p className="text-xs text-white/50">Execute structured filtering using Jira-compatible syntax.</p>
              </div>

              {/* JQL Search Bar */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={jqlQuery}
                    onChange={e => setJqlQuery(e.target.value)}
                    placeholder="e.g. project = SCM AND priority = HIGH ORDER BY duedate ASC"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {jqlError ? (
                  <div className="text-[11px] text-rose-400 font-mono">Syntax Error: {jqlError}</div>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> JQL syntax valid · Found {jqlFilteredTasks.length} matching issues
                  </div>
                )}
              </div>

              {/* JQL Results Table */}
              <div className="bg-slate-950/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-white/40 font-mono">
                      <th className="py-2.5 px-4">Key</th>
                      <th className="py-2.5 px-4">Summary</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Assignee</th>
                      <th className="py-2.5 px-4">Story Points</th>
                      <th className="py-2.5 px-4">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jqlFilteredTasks.map(task => (
                      <tr
                        key={task.taskId}
                        onClick={() => setSelectedTaskId(task.taskId)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-cyan-300">{task.key}</td>
                        <td className="py-2.5 px-4 font-medium text-white">{task.summary || task.title}</td>
                        <td className="py-2.5 px-4 font-mono text-white/60">{task.issueType || 'TASK'}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/70">
                            {task.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px]">{task.priority}</td>
                        <td className="py-2.5 px-4 text-white/60">{task.assigneeName}</td>
                        <td className="py-2.5 px-4 font-mono text-cyan-400">{task.storyPoints || 0}</td>
                        <td className="py-2.5 px-4 font-mono text-white/40">{task.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: BURNDOWN & ANALYTICS */}
          {activeTab === 'BURNDOWN' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Sprint Burndown & Velocity</h2>
                <p className="text-xs text-white/50">Tracking sprint burn trajectory against ideal linear commitment.</p>
              </div>

              {activeSprint ? (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{activeSprint.name} Burndown Trajectory</h3>
                      <p className="text-xs text-white/50">{activeSprint.startDate} to {activeSprint.endDate}</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-cyan-400">
                      Total Points: {activeSprint.committedPoints || 20} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {burndownData.map(day => (
                      <div key={day.day} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="text-[10px] font-mono text-white/40">{day.day}</div>
                        <div className="text-xs flex justify-between">
                          <span className="text-white/40">Ideal:</span>
                          <span className="font-mono text-white">{day.idealRemainingPoints}</span>
                        </div>
                        <div className="text-xs flex justify-between">
                          <span className="text-cyan-400">Actual:</span>
                          <span className="font-mono font-bold text-cyan-300">{day.actualRemainingPoints}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-white/40 border border-white/5 rounded-xl">
                  No active sprint currently running. Activate a sprint in the Backlog view to generate live burndown trajectories.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: RELEASES & VERSIONS */}
          {activeTab === 'RELEASES' && activeProject && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Releases & Versions</h2>
                  <p className="text-xs text-white/50">Manage release milestones, release notes, and deploy schedules.</p>
                </div>
                <button
                  onClick={() => setShowNewVersionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Version
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {versions.filter(v => v.projectId === activeProject.projectId || v.projectId === activeProject.id).map(ver => (
                  <div key={ver.id} className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-bold text-white text-sm">{ver.name}</h3>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        ver.status === 'RELEASED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/60'
                      }`}>
                        {ver.status}
                      </span>
                    </div>

                    <p className="text-xs text-white/60">{ver.description || 'Production release milestone'}</p>

                    <div className="flex items-center justify-between text-xs font-mono text-white/40 pt-2 border-t border-white/5">
                      <span>Target: {ver.releaseDate || 'TBD'}</span>
                      {ver.status !== 'RELEASED' && (
                        <button
                          onClick={() => handleReleaseVersion(ver.id)}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                        >
                          Release Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SCM ENTITY BRIDGE */}
          {activeTab === 'SCM_LINKS' && activeProject && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">SCM Entity Cross-Reference Bridge</h2>
                <p className="text-xs text-white/50">Authoritative ties between strategic projects and operational SCM records.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProject.linkedScmEntities?.map((link, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                        {link.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1.5">{link.label}</h4>
                      <p className="text-xs text-white/40 font-mono mt-0.5">{link.id}</p>
                    </div>
                    <LinkIcon className="w-5 h-5 text-white/20" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Issue Detail Inspector Drawer */}
        {selectedTask && (
          <div className="w-96 border-l border-white/10 bg-slate-950/90 flex flex-col justify-between shrink-0 overflow-y-auto p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-xs font-bold text-cyan-300">{selectedTask.key}</span>
                <button onClick={() => setSelectedTaskId(null)} className="text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedTask.summary || selectedTask.title}</h3>
                <p className="text-xs text-white/60 mt-1">{selectedTask.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-white/40 block text-[10px]">Status</span>
                  <select
                    value={selectedTask.status}
                    onChange={e => handleStatusChange(selectedTask.taskId, e.target.value as TaskStatus)}
                    className="bg-transparent text-cyan-300 font-semibold focus:outline-none"
                  >
                    <option value="TODO" className="bg-slate-900 text-white">To Do</option>
                    <option value="IN_PROGRESS" className="bg-slate-900 text-white">In Progress</option>
                    <option value="IN_REVIEW" className="bg-slate-900 text-white">In Review</option>
                    <option value="DONE" className="bg-slate-900 text-white">Done</option>
                    <option value="BLOCKED" className="bg-slate-900 text-white">Blocked</option>
                  </select>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px]">Assignee</span>
                  <span className="text-white font-medium">{selectedTask.assigneeName}</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px]">Story Points</span>
                  <span className="font-mono text-cyan-300 font-bold">{selectedTask.storyPoints || 0} pts</span>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px]">Due Date</span>
                  <span className="font-mono text-white/70">{selectedTask.dueDate}</span>
                </div>
              </div>

              {/* Work Logging Box */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Time Tracking ({selectedTask.actualHours || 0}h logged / {selectedTask.remainingHours || 8}h left)
                </span>
                <form onSubmit={handleLogWork} className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={logHoursInput}
                    onChange={e => setLogHoursInput(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    placeholder="Work note..."
                    value={logCommentInput}
                    onChange={e => setLogCommentInput(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white"
                  />
                  <button type="submit" className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white">
                    Log
                  </button>
                </form>
              </div>

              {/* Comments Feed */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  Activity & Comments
                </span>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTask.comments?.map(c => (
                    <div key={c.commentId} className="p-2 rounded bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex justify-between text-[10px] text-white/40 font-mono">
                        <span>{c.authorName}</span>
                        <span>{c.timestamp.split('T')[0]}</span>
                      </div>
                      <p className="text-white/80 mt-1">{c.text || c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  />
                  <button type="submit" className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
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
                Initialize Project Workspace
              </h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-white/60 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cold-Chain Automation Hub"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Key Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. CCA"
                    value={newProjectKey}
                    onChange={e => setNewProjectKey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Description / Strategic Scope</label>
                <textarea
                  rows={2}
                  placeholder="Goals, business outcome, and delivery milestones..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Template / Process</label>
                  <select
                    value={newProjectType}
                    onChange={e => setNewProjectType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="SCRUM">Scrum (Sprints & Burndown)</option>
                    <option value="KANBAN">Kanban (Continuous Flow)</option>
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ISSUE */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Create Work Item
              </h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Project</label>
                  <select
                    value={newTaskProjectId || activeProject?.projectId || activeProject?.id || ''}
                    onChange={e => setNewTaskProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.projectId || p.id} value={p.projectId || p.id}>
                        [{p.key}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 mb-1">Issue Type</label>
                  <select
                    value={newTaskType}
                    onChange={e => setNewTaskType(e.target.value as IssueType)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                  >
                    <option value="STORY">Story</option>
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="EPIC">Epic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Summary</label>
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
                  <label className="block text-white/60 mb-1">Story Points</label>
                  <input
                    type="number"
                    min="0"
                    value={newTaskStoryPoints}
                    onChange={e => setNewTaskStoryPoints(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
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
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SPRINT */}
      {showNewSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Sprint</h3>
            <form onSubmit={handleCreateSprint} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={e => setNewSprintName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Sprint Goal</label>
                <textarea
                  rows={2}
                  value={newSprintGoal}
                  onChange={e => setNewSprintGoal(e.target.value)}
                  placeholder="What is this sprint's deliverable target?"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowNewSprintModal(false)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Save Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: START SPRINT */}
      {showStartSprintModal && activeSprintToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Start Sprint: {activeSprintToManage.name}</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSprintStart}
                    onChange={e => setNewSprintStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSprintEnd}
                    onChange={e => setNewSprintEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowStartSprintModal(false)} className="px-3 py-1.5 rounded bg-white/5 text-white">
                  Cancel
                </button>
                <button onClick={handleStartSprint} className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE SPRINT */}
      {showCompleteSprintModal && activeSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-white/20 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Complete Sprint: {activeSprint.name}</h3>
            <p className="text-xs text-white/60">
              Completed issues will be archived in the sprint record. Where should incomplete issues be moved?
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button onClick={() => setShowCompleteSprintModal(false)} className="px-3 py-1.5 rounded bg-white/5 text-white text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleCompleteSprint('BACKLOG')}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              >
                Roll Over to Backlog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementCenter;
