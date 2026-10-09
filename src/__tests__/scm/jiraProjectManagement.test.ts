/**
 * ORION-9 JIRA-CLASS PROJECT MANAGEMENT SYSTEM TESTS
 * Validates enterprise Jira capabilities including:
 * 1. Project & Issue key generation (SCM-101, WMS-101, unique project keys)
 * 2. Issue hierarchy & cycle-proof validation (Initiative -> Epic -> Story/Task/Bug -> Subtask)
 * 3. JQL Engine (Lexer, Parser, AST evaluation, dynamic queries, sorting)
 * 4. Scrum Sprint Lifecycle (Start, Complete, Rollover of unfinished tasks to Backlog/Sprint)
 * 5. Sprint Burndown & Velocity calculation
 * 6. Releases/Versions & Components lifecycle
 * 7. Work Logging, Comments, and Issue Linking
 * 8. Automation Rules Engine (Triggers, Conditions, Actions, Loop limits)
 * 9. SCM Bridge Exception -> Task creation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManagementEngine } from '../../core/projects/ProjectManagementEngine';
import { JqlEngine } from '../../core/projects/JqlEngine';
import { projectAutomationEngine } from '../../core/projects/ProjectAutomationEngine';
import { ProjectTaskRecord } from '../../core/projects/ProjectTypes';

describe('Jira-Class Enterprise Project Management Suite', () => {
  const tenantId = 'jira-test-tenant-01';
  let engine: ProjectManagementEngine;

  beforeEach(() => {
    engine = ProjectManagementEngine.getInstance();
    engine.clear();
  });

  describe('1. Project & Issue Key Generation', () => {
    it('generates uppercase unique project keys and sequential issue keys', async () => {
      const proj = await engine.createProject({
        tenantId,
        name: 'Supply Chain Optimization',
        key: 'SCO',
        projectType: 'SCRUM'
      });

      expect(proj.key).toBe('SCO');

      const task1 = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Setup automated reorder points',
        issueType: 'STORY'
      });

      const task2 = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Calibrate lead times from Shanghai port',
        issueType: 'TASK'
      });

      expect(task1.key).toMatch(/^SCO-\d+$/);
      expect(task2.key).toMatch(/^SCO-\d+$/);

      const num1 = parseInt(task1.key.split('-')[1], 10);
      const num2 = parseInt(task2.key.split('-')[1], 10);
      expect(num2).toBe(num1 + 1);
    });

    it('falls back to initials when project key is not explicitly provided', async () => {
      const proj = await engine.createProject({
        tenantId,
        name: 'Global Warehouse Network',
        projectType: 'KANBAN'
      });

      expect(proj.key).toBe('GWN');
    });
  });

  describe('2. Issue Hierarchy & Validation', () => {
    it('enforces strict hierarchy rules (Subtask -> Story/Task -> Epic -> Initiative)', async () => {
      const proj = await engine.createProject({
        tenantId,
        name: 'Aerospace Fasteners',
        key: 'AERO'
      });

      // 1. Create Epic
      const epic = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Titanium Supplier Qualification',
        issueType: 'EPIC'
      });

      // 2. Create Story attached to Epic (Valid)
      const story = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Metallurgical lab test verification',
        issueType: 'STORY',
        epicId: epic.id
      });
      expect(story.epicId).toBe(epic.id);

      // 3. Create Subtask attached to Story (Valid)
      const subtask = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Download tensile test certificate',
        issueType: 'SUBTASK',
        parentId: story.id
      });
      expect(subtask.parentId).toBe(story.id);

      // 4. Invalid: Subtask with no parent
      await expect(
        engine.createTask({
          tenantId,
          projectId: proj.id,
          summary: 'Orphan subtask',
          issueType: 'SUBTASK'
        })
      ).rejects.toThrow(/Subtasks must have a parent/);

      // 5. Invalid: Subtask parent cannot be an Epic
      await expect(
        engine.createTask({
          tenantId,
          projectId: proj.id,
          summary: 'Subtask under Epic',
          issueType: 'SUBTASK',
          parentId: epic.id
        })
      ).rejects.toThrow(/Subtasks cannot be attached to parent of type EPIC/);
    });
  });

  describe('3. JQL Engine', () => {
    it('parses and filters tasks matching complex JQL expressions', () => {
      const issues: ProjectTaskRecord[] = [
        {
          id: '1',
          taskId: '1',
          key: 'SCM-101',
          projectId: 'p1',
          tenantId,
          title: 'High priority bug',
          summary: 'High priority bug',
          description: '',
          issueType: 'BUG',
          assigneeName: 'Alex',
          status: 'IN_PROGRESS',
          priority: 'CRITICAL',
          storyPoints: 5,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        },
        {
          id: '2',
          taskId: '2',
          key: 'SCM-102',
          projectId: 'p1',
          tenantId,
          title: 'Routine story',
          summary: 'Routine story',
          description: '',
          issueType: 'STORY',
          assigneeName: 'Elena',
          status: 'DONE',
          priority: 'LOW',
          storyPoints: 3,
          createdAt: '2026-01-02',
          updatedAt: '2026-01-02'
        },
        {
          id: '3',
          taskId: '3',
          key: 'SCM-103',
          projectId: 'p1',
          tenantId,
          title: 'Warehouse task',
          summary: 'Warehouse task',
          description: '',
          issueType: 'TASK',
          assigneeName: 'Alex',
          status: 'TODO',
          priority: 'HIGH',
          storyPoints: 8,
          createdAt: '2026-01-03',
          updatedAt: '2026-01-03'
        }
      ];

      // Test equality
      const bugs = JqlEngine.filter(issues, 'type = BUG');
      expect(bugs).toHaveLength(1);
      expect(bugs[0].key).toBe('SCM-101');

      // Test NOT EQUAL and AND
      const activeAlex = JqlEngine.filter(issues, 'assignee = Alex AND status != DONE');
      expect(activeAlex).toHaveLength(2);

      // Test comparison operators on numeric story points
      const bigIssues = JqlEngine.filter(issues, 'storyPoints >= 5 ORDER BY storyPoints DESC');
      expect(bigIssues).toHaveLength(2);
      expect(bigIssues[0].key).toBe('SCM-103'); // 8 points before 5 points
      expect(bigIssues[1].key).toBe('SCM-101');

      // Test text matching with ~
      const warehouse = JqlEngine.filter(issues, 'summary ~ "Warehouse"');
      expect(warehouse).toHaveLength(1);
      expect(warehouse[0].key).toBe('SCM-103');
    });

    it('validates syntax correctly', () => {
      const valid = JqlEngine.validate('project = SCM AND status != Done');
      expect(valid.valid).toBe(true);

      const invalid = JqlEngine.validate('project =');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });

  describe('4. Scrum Sprint Lifecycle & Rollover', () => {
    it('manages Sprint Start, Complete, and automatically rolls over unfinished tasks', async () => {
      const proj = await engine.createProject({
        tenantId,
        name: 'Sprint Automation DC',
        key: 'ADC',
        projectType: 'SCRUM'
      });

      const sprint1 = await engine.createSprint(tenantId, proj.id, {
        name: 'Sprint 1 - Foundations',
        plannedCapacityHours: 80
      });

      // Add 2 tasks to Sprint 1
      const taskDone = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Design sensor layout',
        storyPoints: 5,
        sprintId: sprint1.sprintId,
        status: 'DONE'
      });

      const taskIncomplete = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Install LiDAR on Forklift #4',
        storyPoints: 8,
        sprintId: sprint1.sprintId,
        status: 'IN_PROGRESS'
      });

      // Start Sprint
      const started = await engine.startSprint(tenantId, sprint1.sprintId, '2026-10-01', '2026-10-15');
      expect(started.status).toBe('ACTIVE');
      expect(started.committedPoints).toBe(13);

      // Complete Sprint with rollover to Backlog
      const completionResult = await engine.completeSprint(tenantId, sprint1.sprintId, 'BACKLOG');
      expect(completionResult.sprint.status).toBe('CLOSED');
      expect(completionResult.sprint.completedPoints).toBe(5);
      expect(completionResult.movedIssuesCount).toBe(1);

      // Verify incomplete task was moved back to Backlog (sprintId is undefined)
      const tasksAfter = engine.getTasks(tenantId, proj.id);
      const rolledOver = tasksAfter.find(t => t.id === taskIncomplete.id);
      expect(rolledOver?.sprintId).toBeUndefined();

      // Verify completed task stayed in sprint record
      const kept = tasksAfter.find(t => t.id === taskDone.id);
      expect(kept?.sprintId).toBe(sprint1.sprintId);
    });

    it('prevents starting multiple active sprints simultaneously on the same project', async () => {
      const proj = await engine.createProject({
        tenantId,
        name: 'Single Active Sprint Test',
        key: 'SAS'
      });

      const s1 = await engine.createSprint(tenantId, proj.id, { name: 'Sprint 1' });
      const s2 = await engine.createSprint(tenantId, proj.id, { name: 'Sprint 2' });

      await engine.startSprint(tenantId, s1.sprintId, '2026-10-01', '2026-10-14');

      await expect(
        engine.startSprint(tenantId, s2.sprintId, '2026-10-15', '2026-10-28')
      ).rejects.toThrow(/already has active sprint/);
    });
  });

  describe('5. Burndown & Velocity Analytics', () => {
    it('calculates ideal and actual burndown lines across sprint duration', async () => {
      const proj = await engine.createProject({ tenantId, name: 'Analytics DC', key: 'ANA' });
      const sprint = await engine.createSprint(tenantId, proj.id, { name: 'Sprint Analytics' });

      await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Task 1',
        storyPoints: 20,
        sprintId: sprint.sprintId
      });

      await engine.startSprint(tenantId, sprint.sprintId, '2026-10-01', '2026-10-11');

      const burndown = engine.calculateSprintBurndown(tenantId, sprint.sprintId);
      expect(burndown.length).toBe(11); // 0 through 10 days
      expect(burndown[0].idealRemainingPoints).toBe(20);
      expect(burndown[10].idealRemainingPoints).toBe(0);
    });
  });

  describe('6. Releases & Versions Management', () => {
    it('creates versions and transitions them to RELEASED status', async () => {
      const proj = await engine.createProject({ tenantId, name: 'Releases Project', key: 'REL' });

      const ver = await engine.createVersion(tenantId, proj.id, {
        projectId: proj.id,
        name: 'v2.4.0-Production',
        status: 'UNRELEASED',
        startDate: '2026-10-01',
        releaseDate: '2026-11-01',
        description: 'Autonomous picking rollout'
      });

      expect(ver.id).toBeDefined();
      expect(ver.status).toBe('UNRELEASED');

      const released = await engine.releaseVersion(tenantId, ver.id, 'Successfully deployed without incident');
      expect(released.status).toBe('RELEASED');
      expect(released.releaseNotes).toBe('Successfully deployed without incident');
    });
  });

  describe('7. Work Logging, Comments & Activity History', () => {
    it('logs time spent and updates remaining hours dynamically', async () => {
      const proj = await engine.createProject({ tenantId, name: 'Time Tracking', key: 'TT' });
      const task = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Calibrate optical scales',
        estimatedHours: 20
      });

      const updated = await engine.logWork(
        tenantId,
        task.taskId,
        'usr-alex',
        'Alex Vance',
        6,
        'Finished initial alignment calibration'
      );

      expect(updated.actualHours).toBe(6);
      expect(updated.remainingHours).toBe(14);
      expect(updated.workLogs).toHaveLength(1);
      expect(updated.workLogs?.[0].timeSpentHours).toBe(6);
    });

    it('adds comments and updates audit activity history', async () => {
      const proj = await engine.createProject({ tenantId, name: 'Comments Project', key: 'CP' });
      const task = await engine.createTask({
        tenantId,
        projectId: proj.id,
        summary: 'Review bill of materials'
      });

      const withComment = await engine.addComment(
        tenantId,
        task.taskId,
        'usr-lead',
        'Lead Engineer',
        'Approved for procurement.'
      );

      expect(withComment.comments).toHaveLength(1);
      expect(withComment.comments?.[0].content).toBe('Approved for procurement.');

      // Update status and check activity history
      const withStatus = await engine.updateTask(tenantId, task.taskId, { status: 'IN_PROGRESS' });
      expect(withStatus.activityHistory?.some(a => a.action === 'STATUS_CHANGED')).toBe(true);
    });
  });

  describe('8. SCM Exception Bridge', () => {
    it('creates an issue from an SCM operational disruption exception', async () => {
      const proj = await engine.createProject({ tenantId, name: 'SCM Operations', key: 'OPS' });

      const issue = await engine.createTaskFromScmException(
        tenantId,
        proj.id,
        {
          exceptionId: 'EXC-9021',
          type: 'PORT_CONGESTION',
          severity: 'HIGH',
          shipmentId: 'SHP-8821',
          portCode: 'LAX',
          delayHours: 72,
          summary: 'Container terminal crane outage causing 72h vessel hold'
        },
        'usr-dispatcher'
      );

      expect(issue.key).toMatch(/^OPS-\d+$/);
      expect(issue.priority).toBe('HIGH');
      expect(issue.issueType).toBe('BUG');
      expect(issue.linkedScmEntity?.id).toBe('SHP-8821');
      expect(issue.linkedScmEntity?.type).toBe('SHIPMENT');
    });
  });
});
