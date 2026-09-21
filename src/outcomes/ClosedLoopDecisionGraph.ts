/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Closed Loop Decision Graph
 * 
 * Tracks end-to-end lineage across the complete closed loop:
 * EVENT → SIGNAL → EXCEPTION → ROOT CAUSE → RISK → SCENARIO → DECISION → WORKFLOW → ACTION → EXPECTATION → OBSERVATION → VARIANCE → ATTRIBUTION → LEARNING SIGNAL → PROPOSAL → VERSION
 */

import { DecisionTraceNode } from './types';

export interface TraceLink {
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
}

export interface DecisionTraceGraph {
  traceId: string;
  tenantId: string;
  nodes: DecisionTraceNode[];
  links: TraceLink[];
  rootEventId?: string;
  finalVersionId?: string;
  generatedAt: string;
}

export class ClosedLoopDecisionGraph {
  private static instance: ClosedLoopDecisionGraph;
  private traces: Map<string, DecisionTraceGraph> = new Map(); // key: `${tenantId}:${traceId}`

  private constructor() {}

  public static getInstance(): ClosedLoopDecisionGraph {
    if (!ClosedLoopDecisionGraph.instance) {
      ClosedLoopDecisionGraph.instance = new ClosedLoopDecisionGraph();
    }
    return ClosedLoopDecisionGraph.instance;
  }

  /**
   * Builds an end-to-end synthetic or live trace graph for closed loop verification
   */
  public buildFullTrace(params: {
    tenantId: string;
    eventId: string;
    decisionId: string;
    workflowId: string;
    expectationId: string;
    observationId: string;
    varianceId: string;
    attributionId: string;
    signalId: string;
    proposalId: string;
    versionId: string;
  }): DecisionTraceGraph {
    const traceId = `TRACE-${params.tenantId}-${Date.now()}`;
    const now = new Date().toISOString();

    const nodes: DecisionTraceNode[] = [
      {
        nodeId: `node-evt-${params.eventId}`,
        nodeType: 'EVENT',
        referenceId: params.eventId,
        timestamp: now,
        summary: 'Port congestion AIS beacon alert detected',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-sig-${params.eventId}`,
        nodeType: 'SIGNAL',
        referenceId: `SIG-${params.eventId}`,
        timestamp: now,
        summary: 'Lead time delay signal magnitude +4 days',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-exc-${params.eventId}`,
        nodeType: 'EXCEPTION',
        referenceId: `EXC-${params.eventId}`,
        timestamp: now,
        summary: 'Critical inventory stockout risk at distribution center',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-dec-${params.decisionId}`,
        nodeType: 'DECISION',
        referenceId: params.decisionId,
        timestamp: now,
        summary: 'Reroute high-priority freight via air cargo expedited',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-wf-${params.workflowId}`,
        nodeType: 'WORKFLOW',
        referenceId: params.workflowId,
        timestamp: now,
        summary: 'Governed carrier booking and PO adjustment saga',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-exp-${params.expectationId}`,
        nodeType: 'EXPECTATION',
        referenceId: params.expectationId,
        timestamp: now,
        summary: 'Target OTIF 95.0%, Expected Cost Savings $12,500',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-obs-${params.observationId}`,
        nodeType: 'OBSERVATION',
        referenceId: params.observationId,
        timestamp: now,
        summary: 'Actual OTIF 92.4%, Actual Incurred Cost $13,800 (SAP GRN)',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-var-${params.varianceId}`,
        nodeType: 'VARIANCE',
        referenceId: params.varianceId,
        timestamp: now,
        summary: 'Composite variance 8.4% (Moderate)',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-attr-${params.attributionId}`,
        nodeType: 'ATTRIBUTION',
        referenceId: params.attributionId,
        timestamp: now,
        summary: 'Attributed to carrier air-freight fuel surcharge spike',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-siglearn-${params.signalId}`,
        nodeType: 'LEARNING_SIGNAL',
        referenceId: params.signalId,
        timestamp: now,
        summary: 'Air freight surcharge escalation learning signal',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-prop-${params.proposalId}`,
        nodeType: 'PROPOSAL',
        referenceId: params.proposalId,
        timestamp: now,
        summary: 'Governed threshold revision proposal approved by Admin',
        tenantId: params.tenantId,
      },
      {
        nodeId: `node-ver-${params.versionId}`,
        nodeType: 'VERSION',
        referenceId: params.versionId,
        timestamp: now,
        summary: 'Intelligence configuration promoted to production',
        tenantId: params.tenantId,
      },
    ];

    const links: TraceLink[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        fromNodeId: nodes[i].nodeId,
        toNodeId: nodes[i + 1].nodeId,
        relationship: 'CAUSED_OR_TRIGGERED',
      });
    }

    const graph: DecisionTraceGraph = {
      traceId,
      tenantId: params.tenantId,
      nodes,
      links,
      rootEventId: params.eventId,
      finalVersionId: params.versionId,
      generatedAt: now,
    };

    this.traces.set(`${params.tenantId}:${traceId}`, graph);
    return graph;
  }

  public getTrace(tenantId: string, traceId: string): DecisionTraceGraph | undefined {
    return this.traces.get(`${tenantId}:${traceId}`);
  }

  public listTraces(tenantId: string): DecisionTraceGraph[] {
    const list: DecisionTraceGraph[] = [];
    for (const [key, value] of this.traces.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public clear(): void {
    this.traces.clear();
  }
}
