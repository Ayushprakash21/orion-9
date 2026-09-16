import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Plus, Play, Check, ArrowDown, Trash2, Settings, 
  Sparkles, Pause, ShieldCheck, Activity, AlertCircle, FileText, CheckCircle2, ChevronUp, ChevronDown 
} from 'lucide-react';
import { workflowEngine } from '../core/workflows/WorkflowEngine';
import { Workflow, WorkflowStep, WorkflowStepType } from '../core/types';

const AVAILABLE_STEP_TYPES: { type: WorkflowStepType; label: string; desc: string }[] = [
  { type: 'EVALUATE_RISK', label: 'Evaluate Risk', desc: 'Assess operational variance and disruption severity' },
  { type: 'EVALUATE_INVENTORY', label: 'Evaluate Inventory', desc: 'Query stock coverage and safety stock deficits' },
  { type: 'CREATE_EXCEPTION', label: 'Create Exception', desc: 'Log deterministic supply chain exception record' },
  { type: 'CREATE_ACTION', label: 'Create Action', desc: 'Generate autonomous or human-in-the-loop mitigation' },
  { type: 'REQUIRE_APPROVAL', label: 'Require Approval', desc: 'Enforce management authorization gate' },
  { type: 'UPDATE_ENTITY', label: 'Update Entity', desc: 'Apply state mutations to PO, shipment, or inventory' },
  { type: 'CREATE_COMMUNICATION', label: 'Create Communication', desc: 'Draft or dispatch supplier/carrier notification' },
  { type: 'WAIT', label: 'Wait / Barrier', desc: 'Register milestone delay or synchronization window' },
  { type: 'VERIFY_OUTCOME', label: 'Verify Outcome', desc: 'Audit KPIs and confirm operational stabilization' },
];

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    executedSteps: { step: number; name: string; type: string; status: string; log: string }[];
    summary: string;
  } | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const list = workflowEngine.getWorkflows();
    setWorkflows([...list]);
    if (list.length > 0) {
      setSelectedWorkflowId(list[0].id);
      setCurrentWorkflow(JSON.parse(JSON.stringify(list[0])));
    }
  }, []);

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflowId(id);
    const found = workflows.find(w => w.id === id);
    if (found) {
      setCurrentWorkflow(JSON.parse(JSON.stringify(found)));
      setTestResults(null);
    }
  };

  const showBanner = (type: 'success' | 'info' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner(null);
    }, 4000);
  };

  const handleCreateNewWorkflow = () => {
    const newWf = workflowEngine.createWorkflow({
      name: `Custom Orchestration Pipeline ${workflows.length + 1}`,
      description: 'Event-driven automated mitigation pipeline for supply chain disruptions.',
      trigger: 'INVENTORY_STOCKOUT_RISK',
      status: 'DRAFT'
    });
    setWorkflows([...workflowEngine.getWorkflows()]);
    setSelectedWorkflowId(newWf.id);
    setCurrentWorkflow(JSON.parse(JSON.stringify(newWf)));
    showBanner('success', `Created new workflow pipeline '${newWf.name}'.`);
  };

  const handleStepTypeChange = (stepIndex: number, newType: WorkflowStepType) => {
    if (!currentWorkflow) return;
    const updatedSteps = [...currentWorkflow.steps];
    const defaultMeta = AVAILABLE_STEP_TYPES.find(t => t.type === newType);
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      type: newType,
      name: defaultMeta ? `${defaultMeta.label}: Operational Step` : updatedSteps[stepIndex].name
    };
    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const handleStepNameChange = (stepIndex: number, newName: string) => {
    if (!currentWorkflow) return;
    const updatedSteps = [...currentWorkflow.steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      name: newName
    };
    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const addStep = () => {
    if (!currentWorkflow) return;
    const nextStepNum = currentWorkflow.steps.length + 1;
    const newStep: WorkflowStep = {
      step: nextStepNum,
      id: `st-${Date.now()}`,
      name: `Verify Operational Stabilization`,
      type: 'VERIFY_OUTCOME',
      status: 'PENDING'
    };
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    });
  };

  const removeStep = (stepIndex: number) => {
    if (!currentWorkflow) return;
    if (currentWorkflow.steps.length <= 1) {
      showBanner('error', 'A workflow pipeline must contain at least one step.');
      return;
    }
    const updatedSteps = currentWorkflow.steps
      .filter((_, idx) => idx !== stepIndex)
      .map((s, idx) => ({ ...s, step: idx + 1 }));
    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!currentWorkflow) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentWorkflow.steps.length) return;

    const reordered = [...currentWorkflow.steps];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedSteps = reordered.map((s, idx) => ({ ...s, step: idx + 1 }));
    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;
    try {
      workflowEngine.updateWorkflow(currentWorkflow.id, {
        name: currentWorkflow.name,
        description: currentWorkflow.description,
        trigger: currentWorkflow.trigger,
        steps: currentWorkflow.steps,
        status: currentWorkflow.status
      });
      setWorkflows([...workflowEngine.getWorkflows()]);
      showBanner('success', `Workflow '${currentWorkflow.name}' successfully persisted to Orion Control Plane.`);
    } catch (err: any) {
      showBanner('error', `Failed to save workflow: ${err?.message}`);
    }
  };

  const handleToggleActive = () => {
    if (!currentWorkflow) return;
    const newStatus = currentWorkflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = workflowEngine.updateWorkflow(currentWorkflow.id, { status: newStatus });
      setCurrentWorkflow({ ...currentWorkflow, status: newStatus });
      setWorkflows([...workflowEngine.getWorkflows()]);
      showBanner('info', `Workflow status switched to ${newStatus}.`);
    } catch (err: any) {
      showBanner('error', `Could not update status: ${err?.message}`);
    }
  };

  const handleRunTest = async () => {
    if (!currentWorkflow) return;
    setIsTesting(true);
    setTestResults(null);
    try {
      // Save current edits first
      workflowEngine.updateWorkflow(currentWorkflow.id, {
        name: currentWorkflow.name,
        steps: currentWorkflow.steps
      });
      const res = await workflowEngine.testWorkflow(currentWorkflow.id);
      setTestResults(res);
      showBanner('success', 'Pipeline dry-run completed successfully.');
    } catch (err: any) {
      showBanner('error', `Pipeline execution error: ${err?.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Feedback Toast */}
      {feedbackBanner && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between transition-all shadow-md ${
          feedbackBanner.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
            : feedbackBanner.type === 'error'
            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackBanner.message}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-os-text-muted hover:text-os-text-primary">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              CONTROL PLANE
            </span>
            <span className="text-xs font-mono text-os-text-muted">EVENT-DRIVEN WORKFLOW ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Workflow Builder & Orchestration</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Visual deterministic step-by-step pipeline for autonomous and human-supervised supply chain interventions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNewWorkflow}
            className="px-3.5 py-2 bg-os-surface border border-os-border hover:border-cyan-500/50 text-os-text-primary text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={14} /> New Pipeline
          </button>
          <button
            onClick={addStep}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow"
          >
            <Plus size={14} /> Add Step
          </button>
        </div>
      </div>

      {/* Pipeline Selector and Meta */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="text-[11px] font-mono text-os-text-muted uppercase tracking-wider block mb-1">
              Select Active Pipeline
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => handleSelectWorkflow(e.target.value)}
              className="w-full bg-os-surface-secondary border border-os-border rounded-lg px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500"
            >
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.status})
                </option>
              ))}
            </select>
          </div>

          {currentWorkflow && (
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 text-[11px] font-mono uppercase rounded-md border ${
                currentWorkflow.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : currentWorkflow.status === 'PAUSED'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
              }`}>
                {currentWorkflow.status}
              </span>

              <button
                onClick={handleToggleActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  currentWorkflow.status === 'ACTIVE'
                    ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {currentWorkflow.status === 'ACTIVE' ? <Pause size={14} /> : <Play size={14} />}
                {currentWorkflow.status === 'ACTIVE' ? 'Pause Pipeline' : 'Activate Pipeline'}
              </button>

              <button
                onClick={handleSaveWorkflow}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shadow transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {currentWorkflow && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-os-border">
            <div>
              <label className="text-[11px] font-mono text-os-text-muted uppercase tracking-wider block mb-1">
                Pipeline Name
              </label>
              <input
                type="text"
                value={currentWorkflow.name || ''}
                onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, name: e.target.value })}
                className="w-full bg-os-surface-secondary border border-os-border rounded-lg px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-os-text-muted uppercase tracking-wider block mb-1">
                Trigger Event
              </label>
              <input
                type="text"
                value={currentWorkflow.trigger || ''}
                onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, trigger: e.target.value })}
                className="w-full bg-os-surface-secondary border border-os-border rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Visual Pipeline Steps */}
      {currentWorkflow && (
        <div className="bg-os-surface border border-os-border rounded-xl p-8 max-w-4xl mx-auto space-y-4 shadow-sm">
          <div className="text-center pb-4 border-b border-os-border">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Orchestration Sequence</span>
            <h3 className="text-base font-semibold text-os-text-primary mt-1">{currentWorkflow.name}</h3>
            <p className="text-xs text-os-text-secondary mt-0.5">{currentWorkflow.description}</p>
          </div>

          <div className="space-y-3 pt-2">
            {currentWorkflow.steps.map((step, idx) => (
              <React.Fragment key={step.id || idx}>
                <div className="p-4 bg-os-surface-secondary border border-os-border hover:border-cyan-500/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 shrink-0 mt-0.5">
                      {idx < 9 ? `0${idx + 1}` : idx + 1}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={step.type}
                          onChange={(e) => handleStepTypeChange(idx, e.target.value as WorkflowStepType)}
                          className="text-[11px] font-mono uppercase bg-os-surface border border-os-border text-cyan-400 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                        >
                          {AVAILABLE_STEP_TYPES.map(t => (
                            <option key={t.type} value={t.type}>{t.label} ({t.type})</option>
                          ))}
                        </select>
                        <span className="text-[10px] font-mono text-os-text-muted">
                          {AVAILABLE_STEP_TYPES.find(t => t.type === step.type)?.desc}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => handleStepNameChange(idx, e.target.value)}
                        className="w-full bg-os-surface border border-os-border rounded px-2.5 py-1 text-xs text-os-text-primary font-medium focus:outline-none focus:border-cyan-500"
                        placeholder="Step description or action title..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    <button
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-os-text-muted hover:text-os-text-primary disabled:opacity-30 rounded transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === currentWorkflow.steps.length - 1}
                      className="p-1.5 text-os-text-muted hover:text-os-text-primary disabled:opacity-30 rounded transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button 
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-os-text-muted hover:text-rose-400 rounded transition-colors"
                      title="Remove step"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {idx < currentWorkflow.steps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown size={16} className="text-os-text-muted" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Test and Execute Controls */}
          <div className="pt-6 border-t border-os-border flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={addStep}
              className="px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5"
            >
              <Plus size={14} /> Append Step
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleRunTest}
                disabled={isTesting}
                className="px-4 py-2 bg-os-surface-secondary border border-os-border hover:border-cyan-500/40 text-os-text-primary text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                <Play size={13} className={isTesting ? 'animate-spin' : ''} />
                {isTesting ? 'Validating Pipeline...' : 'Test Pipeline (Dry-Run)'}
              </button>
              <button 
                onClick={handleSaveWorkflow}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center gap-2"
              >
                <Check size={14} />
                Save & Deploy
              </button>
            </div>
          </div>

          {/* Test Trace Output */}
          {testResults && (
            <div className="mt-6 p-5 rounded-xl bg-os-surface-secondary border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-os-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-os-text-primary">Pipeline Dry-Run Verification</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ALL STEPS VALIDATED
                </span>
              </div>
              <p className="text-xs text-os-text-secondary">{testResults.summary}</p>
              
              <div className="space-y-2 pt-2">
                {testResults.executedSteps.map((s) => (
                  <div key={s.step} className="p-2.5 rounded-lg bg-os-surface border border-os-border text-xs flex items-start gap-3">
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0 mt-0.5">0{s.step}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-os-text-primary">{s.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400">STATUS: {s.status}</span>
                      </div>
                      <p className="text-[11px] text-os-text-secondary mt-0.5">{s.log}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
