/**
 * ORION-9 MULTIMODAL FREIGHT DISPATCH & LOGISTICS INTELLIGENCE SERVICE
 * Layer 4 Kernel & Layer 2 Intelligence Services
 * 
 * Orchestrates:
 * - Multimodal Freight Consignment Dispatch across Ocean, Air, Rail, and FTL
 * - Real-Time IoT Telemetry Tracking (Temperature, Humidity, Shock, Tamper Seals)
 * - Yard Management System (Dock Door Allocation, Dwell Times, Demurrage Risk Clocks)
 * - AI Freight Consolidation with SHA-256 validation seals
 * - Kernel State Machine transitions & Governance Policy Enforcement (POL-LOG-001, POL-LOG-002)
 */

import { 
  MultimodalFreightShipment, 
  YardDockAppointment, 
  FreightConsolidationPlan, 
  LaneCongestionMetric, 
  IoTTelemetrySample 
} from '../types/logistics';
import { shipmentStateMachine, yardAppointmentStateMachine, consolidationStateMachine } from '../kernel/StateMachine';
import { KernelCommandBus } from '../kernel/CommandBus';
import { kernelEventBus } from '../kernel/EventBus';
import { KernelAuditEngine } from '../kernel/AuditEngine';
import { KernelPolicyEngine } from '../kernel/PolicyEngine';
import { db, saveData } from '../data/db';
import { sha256 } from '../kernel/security/crypto';
import { 
  INITIAL_FREIGHT_CONSIGNMENTS, 
  INITIAL_YARD_APPOINTMENTS, 
  INITIAL_CONSOLIDATION_PLANS, 
  INITIAL_LANE_CONGESTION 
} from '../data/db/logisticsSeed';

export class LogisticsService {
  private static instance: LogisticsService;
  private commandBus: KernelCommandBus;
  private auditEngine: KernelAuditEngine;
  private policyEngine: KernelPolicyEngine;

  private constructor() {
    this.commandBus = KernelCommandBus.getInstance();
    this.auditEngine = KernelAuditEngine.getInstance();
    this.policyEngine = KernelPolicyEngine.getInstance();
    this.registerKernelCommands();
  }

  public static getInstance(): LogisticsService {
    if (!LogisticsService.instance) {
      LogisticsService.instance = new LogisticsService();
    }
    return LogisticsService.instance;
  }

  public async getFreightConsignments(): Promise<MultimodalFreightShipment[]> {
    let items = ((await db.freightConsignments.getItem('all')) as MultimodalFreightShipment[]) || [];
    if (!items || items.length === 0) {
      items = [...INITIAL_FREIGHT_CONSIGNMENTS];
      await saveData(db.freightConsignments, items);
    }
    return items;
  }

  public async getYardAppointments(): Promise<YardDockAppointment[]> {
    let items = ((await db.yardAppointments.getItem('all')) as YardDockAppointment[]) || [];
    if (!items || items.length === 0) {
      items = [...INITIAL_YARD_APPOINTMENTS];
      await saveData(db.yardAppointments, items);
    }
    return items;
  }

  public async getConsolidationPlans(): Promise<FreightConsolidationPlan[]> {
    let items = ((await db.consolidationPlans.getItem('all')) as FreightConsolidationPlan[]) || [];
    if (!items || items.length === 0) {
      items = [...INITIAL_CONSOLIDATION_PLANS];
      await saveData(db.consolidationPlans, items);
    }
    return items;
  }

  public async getLaneCongestion(): Promise<LaneCongestionMetric[]> {
    let items = ((await db.laneCongestionMetrics.getItem('all')) as LaneCongestionMetric[]) || [];
    if (!items || items.length === 0) {
      items = [...INITIAL_LANE_CONGESTION];
      await saveData(db.laneCongestionMetrics, items);
    }
    return items;
  }

  private registerKernelCommands(): void {
    // 1. DISPATCH_FREIGHT_CONSIGNMENT
    this.commandBus.registerHandler('DISPATCH_FREIGHT_CONSIGNMENT', async (envelope) => {
      const consignment = envelope.payload as MultimodalFreightShipment;
      return this.handleDispatchConsignment(consignment, envelope);
    });

    // 2. RECORD_IOT_TELEMETRY
    this.commandBus.registerHandler('RECORD_IOT_TELEMETRY', async (envelope) => {
      const { consignmentId, sample } = envelope.payload as { consignmentId: string; sample: IoTTelemetrySample };
      return this.handleRecordTelemetry(consignmentId, sample, envelope);
    });

    // 3. SCHEDULE_YARD_APPOINTMENT
    this.commandBus.registerHandler('SCHEDULE_YARD_APPOINTMENT', async (envelope) => {
      const appointment = envelope.payload as YardDockAppointment;
      return this.handleScheduleAppointment(appointment, envelope);
    });

    // 4. CHECK_IN_YARD_GATE
    this.commandBus.registerHandler('CHECK_IN_YARD_GATE', async (envelope) => {
      const { appointmentId, targetStatus } = envelope.payload as { appointmentId: string; targetStatus?: string };
      return this.handleCheckInGate(appointmentId, targetStatus, envelope);
    });

    // 5. DISPATCH_CONSOLIDATION_TO_APPROVAL
    this.commandBus.registerHandler('DISPATCH_CONSOLIDATION_TO_APPROVAL', async (envelope) => {
      const { planId } = envelope.payload as { planId: string };
      return this.handleDispatchConsolidation(planId, envelope);
    });

    // 6. APPROVE_CONSOLIDATION_PLAN
    this.commandBus.registerHandler('APPROVE_CONSOLIDATION_PLAN', async (envelope) => {
      const { planId } = envelope.payload as { planId: string };
      return this.handleApproveConsolidation(planId, envelope);
    });

    // 7. TRIGGER_EMERGENCY_REROUTE
    this.commandBus.registerHandler('TRIGGER_EMERGENCY_REROUTE', async (envelope) => {
      const { consignmentId, newRouteName, additionalCost, reason } = envelope.payload as { 
        consignmentId: string; 
        newRouteName: string; 
        additionalCost: number; 
        reason: string; 
      };
      return this.handleEmergencyReroute(consignmentId, newRouteName, additionalCost, reason, envelope);
    });
  }

  /**
   * Dispatch Freight Consignment with Policy Evaluation
   */
  public async handleDispatchConsignment(consignment: MultimodalFreightShipment, envelope?: any): Promise<MultimodalFreightShipment> {
    const actor = envelope?.actor || { id: 'usr-logistics-dir', type: 'USER', role: 'supply_chain_manager' };

    // Evaluate POL-LOG-001
    const policyResult = this.policyEngine.evaluate({
      actor,
      tenantId: 'orion-global',
      action: 'DISPATCH_FREIGHT_CONSIGNMENT',
      entityType: 'freight_consignment',
      entityId: consignment.id,
      amount: consignment.freightCost,
    });

    const requiresApproval = policyResult.result === 'REQUIRE_APPROVAL' || policyResult.result === 'ESCALATE';
    const sealData = `${consignment.id}:${consignment.consignmentNumber}:${consignment.freightCost}:${Date.now()}`;
    const cryptographicSeal = await sha256(sealData);

    const updatedConsignment: MultimodalFreightShipment = {
      ...consignment,
      status: requiresApproval ? 'PLANNED' : 'IN_TRANSIT',
      policyCompliance: {
        cleared: !requiresApproval,
        policyId: policyResult.ruleId,
        requiresApproval,
        approvalId: requiresApproval ? `APV-${Date.now().toString().slice(-6)}` : undefined,
        sha256Seal: cryptographicSeal,
      }
    };

    const currentList = await this.getFreightConsignments();
    const existingIndex = currentList.findIndex(c => c.id === consignment.id);
    let newList: MultimodalFreightShipment[];
    if (existingIndex >= 0) {
      newList = [...currentList];
      newList[existingIndex] = updatedConsignment;
    } else {
      newList = [updatedConsignment, ...currentList];
    }

    await saveData(db.freightConsignments, newList);

    await this.auditEngine.record({
      actor,
      action: 'DISPATCH_FREIGHT_CONSIGNMENT',
      entityType: 'freight_consignment',
      entityId: updatedConsignment.id,
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      details: {
        mode: updatedConsignment.mode,
        freightCost: updatedConsignment.freightCost,
        origin: updatedConsignment.origin.name,
        destination: updatedConsignment.destination.name,
        sha256Seal: cryptographicSeal,
        policyOutcome: policyResult.result,
      }
    });

    kernelEventBus.publish(
      'FREIGHT_CONSIGNMENT_DISPATCHED',
      { consignment: updatedConsignment, policyResult },
      { correlationId: envelope?.id || `disp-${Date.now()}` }
    );

    return updatedConsignment;
  }

  /**
   * Record IoT Telemetry Sample with Cold-Chain Excursion Checks (POL-LOG-002)
   */
  public async handleRecordTelemetry(consignmentId: string, sample: IoTTelemetrySample, envelope?: any): Promise<MultimodalFreightShipment> {
    const actor = envelope?.actor || { id: 'iot-sensor-node', type: 'SYSTEM', role: 'telemetry_agent' };
    const currentList = await this.getFreightConsignments();
    const target = currentList.find(c => c.id === consignmentId);

    if (!target) {
      throw new Error(`Consignment ${consignmentId} not found in database.`);
    }

    let isBreached = target.coldChain?.isBreached || false;
    let breachReason = target.coldChain?.breachReason;

    // Cold chain boundaries check
    if (target.coldChain && target.coldChain.required) {
      if (sample.temperatureCelsius > target.coldChain.maxTempCelsius) {
        isBreached = true;
        breachReason = `Temperature ceiling breach: Current ${sample.temperatureCelsius}°C exceeds max ${target.coldChain.maxTempCelsius}°C.`;
      } else if (sample.temperatureCelsius < target.coldChain.minTempCelsius) {
        isBreached = true;
        breachReason = `Temperature floor breach: Current ${sample.temperatureCelsius}°C below min ${target.coldChain.minTempCelsius}°C.`;
      }
    }

    // High Shock / Tamper breach check
    if (sample.shockGForce > 2.5) {
      isBreached = true;
      breachReason = `Severe mechanical shock detected: ${sample.shockGForce}G spike exceeding 2.5G threshold.`;
    }

    if (!sample.tamperSealIntact) {
      isBreached = true;
      breachReason = 'Physical tamper-evident electronic seal compromised in transit.';
    }

    const updatedConsignment: MultimodalFreightShipment = {
      ...target,
      status: isBreached ? 'EXCEPTION_DIVERTED' : target.status,
      coldChain: target.coldChain ? {
        ...target.coldChain,
        isBreached,
        breachReason,
      } : {
        required: false,
        minTempCelsius: -40,
        maxTempCelsius: 60,
        targetHumidityPercent: 50,
        isBreached,
        breachReason,
      },
      latestTelemetry: sample,
      telemetryHistory: [sample, ...(target.telemetryHistory || []).slice(0, 19)],
    };

    const updatedList = currentList.map(c => c.id === consignmentId ? updatedConsignment : c);
    await saveData(db.freightConsignments, updatedList);

    if (isBreached) {
      await this.auditEngine.record({
        actor,
        action: 'TRIGGER_COLD_CHAIN_QUARANTINE',
        entityType: 'freight_consignment',
        entityId: target.id,
        result: 'SUCCESS',
        classification: 'RESTRICTED',
        details: {
          breachReason,
          recordedTemp: sample.temperatureCelsius,
          shockGForce: sample.shockGForce,
          tamperSealIntact: sample.tamperSealIntact,
        }
      });

      kernelEventBus.publish(
        'COLD_CHAIN_EXCEPTION_TRIGGERED',
        { consignmentId, breachReason, sample },
        { correlationId: `exc-${Date.now()}` }
      );
    }

    return updatedConsignment;
  }

  /**
   * Schedule or Update Yard Dock Appointment
   */
  public async handleScheduleAppointment(appointment: YardDockAppointment, envelope?: any): Promise<YardDockAppointment> {
    const actor = envelope?.actor || { id: 'usr-dock-lead', type: 'USER', role: 'warehouse_lead' };
    const currentList = await this.getYardAppointments();

    const existingIndex = currentList.findIndex(a => a.id === appointment.id);
    let newList: YardDockAppointment[];
    if (existingIndex >= 0) {
      newList = [...currentList];
      newList[existingIndex] = appointment;
    } else {
      newList = [appointment, ...currentList];
    }

    await saveData(db.yardAppointments, newList);

    await this.auditEngine.record({
      actor,
      action: 'SCHEDULE_YARD_APPOINTMENT',
      entityType: 'yard_appointment',
      entityId: appointment.id,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: {
        facilityName: appointment.facilityName,
        dockDoor: appointment.dockDoor,
        carrier: appointment.carrier,
        status: appointment.status,
      }
    });

    kernelEventBus.publish(
      'YARD_APPOINTMENT_SCHEDULED',
      { appointment },
      { correlationId: `yard-${Date.now()}` }
    );

    return appointment;
  }

  /**
   * Check in Carrier at Yard Gate / Move to Dock Door
   */
  public async handleCheckInGate(appointmentId: string, targetStatus?: string, envelope?: any): Promise<YardDockAppointment> {
    const actor = envelope?.actor || { id: 'usr-gate-guard', type: 'USER', role: 'receiving_operator' };
    const currentList = await this.getYardAppointments();
    const target = currentList.find(a => a.id === appointmentId);

    if (!target) {
      throw new Error(`Yard Appointment ${appointmentId} not found.`);
    }

    let nextStatus = (targetStatus as any) || 'GATE_CHECKED_IN';
    if (!targetStatus) {
      if (target.status === 'SCHEDULED') nextStatus = 'GATE_CHECKED_IN';
      else if (target.status === 'GATE_CHECKED_IN') nextStatus = 'AT_DOCK_DOOR';
      else if (target.status === 'AT_DOCK_DOOR') nextStatus = 'UNLOADING';
      else if (target.status === 'UNLOADING') nextStatus = 'COMPLETED';
    }

    // State machine check
    yardAppointmentStateMachine.transition(appointmentId, target.status, nextStatus);

    const updated: YardDockAppointment = {
      ...target,
      status: nextStatus,
      checkInTime: target.checkInTime || new Date().toISOString(),
      unloadStartTime: nextStatus === 'UNLOADING' ? new Date().toISOString() : target.unloadStartTime,
      completedTime: nextStatus === 'COMPLETED' ? new Date().toISOString() : target.completedTime,
    };

    const updatedList = currentList.map(a => a.id === appointmentId ? updated : a);
    await saveData(db.yardAppointments, updatedList);

    await this.auditEngine.record({
      actor,
      action: 'UPDATE_YARD_GATE_STATUS',
      entityType: 'yard_appointment',
      entityId: appointmentId,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: {
        from: target.status,
        to: nextStatus,
        dockDoor: target.dockDoor,
      }
    });

    kernelEventBus.publish(
      'YARD_GATE_STATUS_UPDATED',
      { appointment: updated },
      { correlationId: `gate-${Date.now()}` }
    );

    return updated;
  }

  /**
   * Dispatch Consolidation Plan to Approval Center
   */
  public async handleDispatchConsolidation(planId: string, envelope?: any): Promise<FreightConsolidationPlan> {
    const actor = envelope?.actor || { id: 'usr-logistics-dir', type: 'USER', role: 'supply_chain_manager' };
    const currentList = await this.getConsolidationPlans();
    const target = currentList.find(p => p.id === planId);

    if (!target) {
      throw new Error(`Consolidation plan ${planId} not found.`);
    }

    consolidationStateMachine.transition(planId, target.status, 'ROUTED_TO_APPROVAL');

    const approvalRequestId = `APV-CNS-${Date.now().toString().slice(-6)}`;
    const updated: FreightConsolidationPlan = {
      ...target,
      status: 'ROUTED_TO_APPROVAL',
      approvalRequestId,
    };

    const updatedList = currentList.map(p => p.id === planId ? updated : p);
    await saveData(db.consolidationPlans, updatedList);

    await this.auditEngine.record({
      actor,
      action: 'DISPATCH_CONSOLIDATION_TO_APPROVAL',
      entityType: 'freight_consolidation',
      entityId: planId,
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      details: {
        netCostSavings: target.netCostSavings,
        carbonSavingsKg: target.carbonSavingsKg,
        approvalRequestId,
        sha256Seal: target.sha256Seal,
      }
    });

    kernelEventBus.publish(
      'CONSOLIDATION_ROUTED_TO_APPROVAL',
      { plan: updated },
      { correlationId: `appr-cns-${Date.now()}` }
    );

    return updated;
  }

  /**
   * Commit / Approve Consolidation Plan
   */
  public async handleApproveConsolidation(planId: string, envelope?: any): Promise<FreightConsolidationPlan> {
    const actor = envelope?.actor || { id: 'usr-exec-vp', type: 'USER', role: 'platform_admin' };
    const currentList = await this.getConsolidationPlans();
    const target = currentList.find(p => p.id === planId);

    if (!target) {
      throw new Error(`Consolidation plan ${planId} not found.`);
    }

    consolidationStateMachine.transition(planId, target.status, 'APPROVED');

    const updated: FreightConsolidationPlan = {
      ...target,
      status: 'APPROVED',
    };

    const updatedList = currentList.map(p => p.id === planId ? updated : p);
    await saveData(db.consolidationPlans, updatedList);

    await this.auditEngine.record({
      actor,
      action: 'APPROVE_CONSOLIDATION_PLAN',
      entityType: 'freight_consolidation',
      entityId: planId,
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      details: {
        netCostSavings: target.netCostSavings,
        carbonSavingsKg: target.carbonSavingsKg,
        sha256Seal: target.sha256Seal,
      }
    });

    kernelEventBus.publish(
      'CONSOLIDATION_PLAN_APPROVED',
      { plan: updated },
      { correlationId: `cns-appv-${Date.now()}` }
    );

    return updated;
  }

  /**
   * Trigger Emergency Multimodal Reroute
   */
  public async handleEmergencyReroute(
    consignmentId: string, 
    newRouteName: string, 
    additionalCost: number, 
    reason: string, 
    envelope?: any
  ): Promise<MultimodalFreightShipment> {
    const actor = envelope?.actor || { id: 'usr-traffic-mgr', type: 'USER', role: 'supply_chain_manager' };
    const currentList = await this.getFreightConsignments();
    const target = currentList.find(c => c.id === consignmentId);

    if (!target) {
      throw new Error(`Consignment ${consignmentId} not found.`);
    }

    const policyResult = this.policyEngine.evaluate({
      actor,
      tenantId: 'orion-global',
      action: 'TRIGGER_EMERGENCY_REROUTE',
      entityType: 'freight_consignment',
      entityId: consignmentId,
      amount: target.freightCost + additionalCost,
    });

    const requiresApproval = policyResult.result === 'REQUIRE_APPROVAL' || policyResult.result === 'ESCALATE';
    const sealData = `${consignmentId}:REROUTE:${newRouteName}:${Date.now()}`;
    const newSeal = await sha256(sealData);

    const updated: MultimodalFreightShipment = {
      ...target,
      freightCost: target.freightCost + additionalCost,
      status: 'EXCEPTION_DIVERTED',
      demurrageRisk: {
        ...target.demurrageRisk,
        isAtRisk: false,
        chokePoint: `Rerouted via ${newRouteName} (${reason})`,
      },
      policyCompliance: {
        cleared: !requiresApproval,
        requiresApproval,
        approvalId: requiresApproval ? `APV-REROUTE-${Date.now().toString().slice(-6)}` : undefined,
        sha256Seal: newSeal,
      },
      notes: `[EMERGENCY REROUTE]: Diverted to ${newRouteName}. Reason: ${reason}. Additional expedite expense: $${additionalCost}.`
    };

    const updatedList = currentList.map(c => c.id === consignmentId ? updated : c);
    await saveData(db.freightConsignments, updatedList);

    await this.auditEngine.record({
      actor,
      action: 'TRIGGER_EMERGENCY_REROUTE',
      entityType: 'freight_consignment',
      entityId: consignmentId,
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      details: {
        newRouteName,
        additionalCost,
        reason,
        sha256Seal: newSeal,
      }
    });

    kernelEventBus.publish(
      'FREIGHT_REROUTE_EXECUTED',
      { consignment: updated, newRouteName, additionalCost, reason },
      { correlationId: `reroute-${Date.now()}` }
    );

    return updated;
  }
}

export const logisticsService = LogisticsService.getInstance();
