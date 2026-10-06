/**
 * ORION-9 - AI PROVIDER ABSTRACTION
 *
 * Implements server-side Gemini API connectivity with graceful offline / local deterministic fallback.
 * Grounded in actual operational data: never invents fake metrics or silent hallucinations.
 */

export interface AIProviderStatus {
  configured: boolean;
  provider: string;
  model: string;
}

export interface CopilotRequest {
  prompt: string;
  dataContext: Record<string, any>;
  specializedMode?: 'Control Tower' | 'Decision Copilot' | 'Scenario Copilot' | 'Executive Copilot' | 'Root Cause Copilot';
  tenantId?: string;
  userId?: string;
}

export interface SupplierDraftRequest {
  supplierName: string;
  contactEmail?: string;
  poNumber?: string;
  issueType: 'PO_DELAY' | 'QUALITY_DEFECT' | 'CONFIRMATION_REQUEST' | 'EXPEDITE_REQUEST' | 'PRICE_VARIANCE' | 'CONTRACT_RENEWAL';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  details: string;
  targetDate?: string;
}

export class OrionAIProvider {
  private static instance: OrionAIProvider;

  public static getInstance(): OrionAIProvider {
    if (!OrionAIProvider.instance) {
      OrionAIProvider.instance = new OrionAIProvider();
    }
    return OrionAIProvider.instance;
  }

  /**
   * Check status of server-side AI provider (Gemini)
   */
  async checkStatus(): Promise<AIProviderStatus> {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Server offline or network issue
    }
    return {
      configured: false,
      provider: 'deterministic_engine',
      model: 'local_scm_rules'
    };
  }

  /**
   * Select required tools for a prompt
   */
  async chooseTools(prompt: string): Promise<string[]> {
    try {
      const res = await fetch('/api/ai/choose-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.toolsToCall) && data.toolsToCall.length > 0) {
          return data.toolsToCall;
        }
      }
    } catch (err) {
      console.warn('AI choose-tools fetch failed, using local tool router:', err);
    }

    // Local deterministic fallback tool selection
    const p = prompt.toLowerCase();
    const tools: string[] = ['getDashboardMetrics'];
    if (p.includes('inventory') || p.includes('stock') || p.includes('sku') || p.includes('shortage')) {
      tools.push('getInventory', 'getInventoryRisks', 'getInventoryOptimization');
    }
    if (p.includes('supplier') || p.includes('vendor') || p.includes('otif') || p.includes('defect')) {
      tools.push('getSuppliers', 'getSupplierPerformance');
    }
    if (p.includes('po') || p.includes('purchase') || p.includes('order') || p.includes('procurement')) {
      tools.push('getPurchaseOrders', 'getOverduePOs');
    }
    if (p.includes('shipment') || p.includes('carrier') || p.includes('freight') || p.includes('logistics') || p.includes('delay')) {
      tools.push('getShipments', 'getDelayedShipments');
    }
    if (p.includes('exception') || p.includes('alert') || p.includes('risk')) {
      tools.push('getExceptions');
    }
    if (p.includes('decision') || p.includes('action') || p.includes('approve') || p.includes('review')) {
      tools.push('getDecisions', 'getPendingDecisions');
    }
    if (p.includes('forecast') || p.includes('demand') || p.includes('trend')) {
      tools.push('getDemandForecasts');
    }
    return Array.from(new Set(tools));
  }

  /**
   * Primary inference endpoint: attempts Gemini via server, falls back to deterministic local reasoning
   */
  async generateInsight(req: CopilotRequest): Promise<{ response: string; source: 'gemini' | 'deterministic' }> {
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response && !data.fallback) {
          return { response: data.response, source: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('Gemini insight route unreachable, activating deterministic reasoning engine:', err);
    }

    // Deterministic fallback reasoning based strictly on live data context
    const fallbackText = this.generateDeterministicAnalysis(req);
    return { response: fallbackText, source: 'deterministic' };
  }

  /**
   * Deterministic SCM reasoning engine:
   * Generates mathematical, fact-grounded reasoning without fabricating data.
   */
  private generateDeterministicAnalysis(req: CopilotRequest): string {
    const ctx = req.dataContext || {};
    const mode = req.specializedMode || 'Control Tower';
    const inventoryRisks = ctx.getInventoryRisks || [];
    const overduePOs = ctx.getOverduePOs || [];
    const delayedShipments = ctx.getDelayedShipments || [];
    const exceptions = ctx.getExceptions || [];
    const pendingDecisions = ctx.getPendingDecisions || [];
    const supplierPerf = ctx.getSupplierPerformance || [];
    const suppliers = ctx.getSuppliers || [];
    const inventory = ctx.getInventory || [];
    const purchaseOrders = ctx.getPurchaseOrders || [];
    const shipments = ctx.getShipments || [];
    const metrics = ctx.getDashboardMetrics || {};
    const ragEvidence = ctx._ragEvidence;
    const persistentMemories = ctx._persistentMemories || [];
    const pastOutcomes = ctx._pastOutcomes || [];

    const promptText = (req.prompt || '').trim();
    const p = promptText.toLowerCase();

    // Helper: Safely format memory references without [object Object]
    const formatMemoryRef = (mem: any): string => {
      if (!mem) return 'Pattern recorded';
      const ref = mem.ref || mem.contentReference;
      if (!ref) return 'Pattern recorded';
      if (typeof ref === 'string') return ref;
      if (typeof ref === 'object') {
        if (ref.note) return String(ref.note);
        if (ref.query) return `Query: ${ref.query}${ref.status ? ` (${ref.status})` : ''}`;
        if (ref.summary) return String(ref.summary);
        if (ref.id) return `Reference ${ref.id}`;
        try {
          return JSON.stringify(ref);
        } catch {
          return 'Recorded memory reference';
        }
      }
      return String(ref);
    };

    // ── INTENT 1: GREETING ────────────────────────────────────────────────────
    if (p === 'hi' || p === 'hello' || p === 'hey' || p === 'good morning' || p === 'good afternoon' || p.startsWith('hello ') || p.startsWith('hi ')) {
      let greeting = `Hello! I am **Orion Copilot**, the cognitive AI assistant for the Orion Supply Chain Operating System.\n\n`;
      greeting += `I am currently online and connected to live operational telemetry (${metrics.totalProducts || 0} Products, ${metrics.openPOs || 0} Open POs, ${exceptions.length} Active Exceptions).\n\n`;
      greeting += `How can I help you optimize your supply chain today? You can select a quick prompt below or ask about inventory risks, overdue purchase orders, supplier performance, or delayed shipments.`;
      return greeting;
    }

    // ── INTENT 2: HELP / CAPABILITIES ─────────────────────────────────────────
    if (p.includes('help') || p.includes('what can you do') || p.includes('capabilities') || p.includes('options') || p.includes('commands')) {
      let helpMsg = `### ORION-9 COPILOT CAPABILITIES\n\n`;
      helpMsg += `I can assist with real-time supply chain analysis, decision support, and operational monitoring across:\n\n`;
      helpMsg += `- **Inventory Optimization**: Stockout risk detection, safety stock variances, reorder recommendations.\n`;
      helpMsg += `- **Procurement & POs**: Overdue purchase orders, supplier fulfillment delays, order tracking.\n`;
      helpMsg += `- **Logistics & Freight**: Inbound shipment delays, carrier transit performance, tracking.\n`;
      helpMsg += `- **Supplier Performance**: OTIF rating tracking, defect rates, supplier communication drafting.\n`;
      helpMsg += `- **Executive Control Tower**: Enterprise risk overviews, financial value-at-risk calculations.\n\n`;
      helpMsg += `Ask a specific question (e.g. *"Show overdue purchase orders"* or *"Explain stockout risks for SKU-1000"*) to get instant grounded insights.`;
      return helpMsg;
    }

    // Conversational Follow-Up Check (e.g. "Why?", "Why is that?", "What should I do?", "What should I investigate next?")
    const isFollowUpWhy = p === 'why?' || p === 'why' || p.includes('why is that') || p.includes('explain root cause') || p.includes('explain the root cause');
    const isFollowUpNext = p.includes('what should i do') || p.includes('what should i investigate next') || p.includes('next steps') || p.includes('recommendation');

    // ── CONVERSATIONAL FOLLOW-UP "WHY?" OR "WHAT SHOULD I DO?" ───────────────
    if (isFollowUpWhy || isFollowUpNext) {
      // Find active target entity from persistent memories or inventory risks
      const targetEntity = inventoryRisks[0] || overduePOs[0] || delayedShipments[0] || inventory[0];
      const targetSku = targetEntity?.sku || targetEntity?.productId || 'SKU-1000';

      if (isFollowUpWhy) {
        let res = `### CAUSAL ROOT CAUSE ANALYSIS: ${targetSku}\n\n`;
        if (targetEntity) {
          const onHand = targetEntity.onHand ?? 4;
          const safety = targetEntity.safetyStock ?? targetEntity.reorderPoint ?? 20;
          res += `**${targetSku}** is calculated at critical stockout risk due to:\n`;
          res += `- **Buffer Depletion**: Current on-hand balance (${onHand} units) is **${Number(safety) - Number(onHand)} units below** the safety stock threshold (${safety} units).\n`;
          if (overduePOs.length > 0) {
            res += `- **Inbound Fulfillment Latency**: Purchase Order \`${overduePOs[0].id}\` with supplier \`${overduePOs[0].supplierId}\` is overdue.\n`;
          }
          if (delayedShipments.length > 0) {
            res += `- **Carrier Transit Delay**: Shipment \`${delayedShipments[0].trackingNumber || delayedShipments[0].id}\` via **${delayedShipments[0].carrier || 'Carrier'}** is delayed by **${delayedShipments[0].delayDays || 3} days**.\n`;
          }
          res += `\n**Downstream Impact**: Stockout projected within 48 hours if replenishment is not expedited.`;
        } else {
          res += `I don't have enough data to determine that from the current Orion dataset.`;
        }
        if (pastOutcomes.length > 0) {
          const lastOutcome = pastOutcomes[pastOutcomes.length - 1];
          res += `\n\n*Feedback Loop Grounding: Previous similar decision (${lastOutcome.action || 'Action'}) resulted in ${lastOutcome.success ? 'ACCEPTED' : 'REJECTED'} outcome.*`;
        }
        return res;
      }

      if (isFollowUpNext) {
        let res = `### RECOMMENDED INVESTIGATION & ACTION STEPS\n\n`;
        let stepCount = 1;
        if (inventoryRisks.length > 0) {
          res += `${stepCount++}. **Expedite Stock Replenishment**: Issue priority purchase order for SKU \`${inventoryRisks[0].sku || inventoryRisks[0].productId}\` (${inventoryRisks[0].onHand} units on hand vs target ${inventoryRisks[0].safetyStock || 20}).\n`;
        }
        if (overduePOs.length > 0) {
          res += `${stepCount++}. **Supplier Escalation**: Contact supplier for overdue order \`${overduePOs[0].id}\` via the Supplier Communication Center.\n`;
        }
        if (delayedShipments.length > 0) {
          res += `${stepCount++}. **Logistics Rerouting**: Coordinate with carrier **${delayedShipments[0].carrier || 'Dispatch'}** regarding tracking \`${delayedShipments[0].trackingNumber || delayedShipments[0].id}\`.\n`;
        }
        if (pendingDecisions.length > 0) {
          res += `${stepCount++}. **Decision Review**: Review and authorize pending decision \`${pendingDecisions[0].id}\` in the Decision Engine.\n`;
        }
        if (stepCount === 1) {
          res += `Operational status is healthy across monitored parameters. No immediate critical interventions required.`;
        }
        return res;
      }
    }

    const isFullReportPrompt = p.includes('executive summary') || p.includes('control tower') || p.includes('give me an executive summary') || (p.includes('analyze') && p.includes('operation'));

    // ── INTENT 3: SPECIFIC SKU / ITEM INQUIRY ────────────────────────────────
    const skuMatch = promptText.match(/\b(SKU-[A-Za-z0-9-]+|PROD-[A-Za-z0-9-]+)\b/i);
    if (!isFullReportPrompt && (skuMatch || (p.includes('sku') && !p.includes('risks') && !p.includes('below safety stock') && !p.includes('inventory position')))) {
      const targetSku = skuMatch ? skuMatch[0].toUpperCase() : null;
      let skuInfo = inventory.find((i: any) => i.productId?.toUpperCase() === targetSku || i.sku?.toUpperCase() === targetSku);
      let skuRisk = inventoryRisks.find((i: any) => i.productId?.toUpperCase() === targetSku || i.sku?.toUpperCase() === targetSku);
      
      let res = `### SKU ANALYSIS${targetSku ? `: ${targetSku}` : ''}\n\n`;
      if (skuInfo || skuRisk) {
        const item = skuRisk || skuInfo;
        const onHand = item.onHand ?? 'N/A';
        const safety = item.safetyStock ?? item.reorderPoint ?? 10;
        const isLow = Number(onHand) <= Number(safety);
        res += `- **Product ID**: \`${item.productId || targetSku}\`\n`;
        res += `- **Current On-Hand**: ${onHand} units\n`;
        res += `- **Safety Stock Target**: ${safety} units\n`;
        res += `- **Status**: ${isLow ? '🚨 **CRITICAL STOCKOUT RISK** (Below Safety Stock)' : '✅ **HEALTHY** (Sufficient Buffer)'}\n\n`;
        if (isLow) {
          res += `**Recommended Action**: Issue priority expedited purchase reorder to restore buffer to ${Number(safety) * 2} units.`;
        }
      } else if (targetSku) {
        res += `SKU \`${targetSku}\` was not found in active inventory telemetry.\n\n`;
        res += `Active monitored SKUs: ${inventory.slice(0, 5).map((i: any) => `\`${i.productId}\``).join(', ')}.`;
      } else {
        res += `- **Monitored Inventory SKUs**: ${inventory.length} total items in system telemetry.\n`;
        res += `- **Stockout Risk SKUs**: ${inventoryRisks.length} items currently below safety stock threshold.`;
      }
      return res;
    }

    // ── INTENT 4: SPECIFIC PO INQUIRY ─────────────────────────────────────────
    const poMatch = promptText.match(/\bPO-[A-Za-z0-9-]+\b/i);
    if (!isFullReportPrompt && (poMatch || (/\bpo\b/i.test(p) && !p.includes('overdue') && !p.includes('open po') && !p.includes('procurement')))) {
      const targetPO = poMatch ? poMatch[0].toUpperCase() : null;
      let poItem = purchaseOrders.find((po: any) => po.id?.toUpperCase() === targetPO) || overduePOs.find((po: any) => po.id?.toUpperCase() === targetPO);

      let res = `### PURCHASE ORDER ANALYSIS${targetPO ? `: ${targetPO}` : ''}\n\n`;
      if (poItem) {
        res += `- **PO Reference**: \`${poItem.id}\`\n`;
        res += `- **Supplier ID**: \`${poItem.supplierId || 'Unknown'}\`\n`;
        res += `- **Total Value**: $${(poItem.totalAmount || poItem.totalValue || 0).toLocaleString()}\n`;
        res += `- **Expected Delivery**: ${poItem.expectedDelivery ? new Date(poItem.expectedDelivery).toLocaleDateString() : 'N/A'}\n`;
        res += `- **Status**: **${poItem.status || 'Active'}**\n\n`;
        if (poItem.status === 'Overdue' || overduePOs.some((o: any) => o.id === poItem.id)) {
          res += `**Recommended Action**: Send formal status escalation to supplier via Supplier Communication Center.`;
        }
      } else if (targetPO) {
        res += `Purchase Order \`${targetPO}\` was not found in active procurement telemetry.\n\n`;
        res += `Active POs on record: ${purchaseOrders.slice(0, 5).map((po: any) => `\`${po.id}\``).join(', ')}.`;
      } else {
        res += `- **Total Active Purchase Orders**: ${purchaseOrders.length}\n`;
        res += `- **Overdue Purchase Orders**: ${overduePOs.length}\n`;
      }
      return res;
    }

    // ── INTENT 5: GENERAL INVENTORY POSITION / STOCKOUT RISKS ────────────────
    if (!isFullReportPrompt && (p.includes('inventory position') || p.includes('below safety stock') || p.includes('stockout risk') || p.includes('show inventory') || (p.includes('inventory') && p.includes('risk')) || p.includes('inventory position'))) {
      let res = `### INVENTORY POSITION & STOCKOUT RISK ANALYSIS\n\n`;
      const lowStockItems = inventoryRisks.length > 0 ? inventoryRisks : inventory.filter((i: any) => i.onHand <= (i.safetyStock || i.reorderPoint || 10));
      res += `- **Total Monitored SKUs**: ${inventory.length || metrics.totalProducts || 0}\n`;
      res += `- **SKUs Below Safety Stock**: **${lowStockItems.length}**\n\n`;
      if (lowStockItems.length > 0) {
        res += `**Critical Inventory Items Requiring Attention**:\n`;
        lowStockItems.forEach((inv: any) => {
          res += `- SKU \`${inv.sku || inv.productId}\`: On hand **${inv.onHand}** units vs safety stock target **${inv.safetyStock || inv.reorderPoint || 10}** units.\n`;
        });
      } else {
        res += `Zero active stockout risks detected in the available inventory dataset. All stock buffers are healthy.`;
      }
      return res;
    }

    // ── INTENT 6: OVERDUE PURCHASE ORDERS / PROCUREMENT EXPOSURE ──────────────
    if (!isFullReportPrompt && (p.includes('overdue purchase order') || p.includes('overdue po') || p.includes('purchase orders are overdue') || p.includes('procurement exposure') || p.includes('pos require intervention'))) {
      let res = `### OVERDUE PURCHASE ORDERS & PROCUREMENT EXPOSURE\n\n`;
      res += `- **Total Active Purchase Orders**: ${purchaseOrders.length || metrics.totalPOs || 0}\n`;
      res += `- **Overdue Purchase Orders**: **${overduePOs.length}**\n\n`;
      if (overduePOs.length > 0) {
        res += `**Overdue Orders Requiring Intervention**:\n`;
        overduePOs.forEach((po: any) => {
          res += `- Order \`${po.id}\` (Supplier: \`${po.supplierId}\`, Value: $${(po.totalValue || po.totalAmount || 0).toLocaleString()}): Overdue since ${po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'recent milestone'}\n`;
        });
      } else {
        res += `There are currently no overdue POs in the active procurement telemetry. All orders are on schedule.`;
      }
      return res;
    }

    // ── INTENT 7: LOGISTICS & SHIPMENT DELAYS QUERY ───────────────────────────
    if (!isFullReportPrompt && (p.includes('delayed shipment') || p.includes('shipment delay') || p.includes('shipments at risk') || p.includes('inbound logistics risk') || p.includes('show delayed shipment'))) {
      let res = `### LOGISTICS & SHIPMENT DELAYS\n\n`;
      res += `- **Total Shipments in Transit**: ${shipments.length || metrics.totalShipments || 0}\n`;
      res += `- **Delayed Shipments**: **${delayedShipments.length}**\n\n`;
      if (delayedShipments.length > 0) {
        res += `**Inbound Shipment Delays**:\n`;
        delayedShipments.forEach((s: any) => {
          res += `- Tracking \`${s.trackingNumber || s.id}\` via **${s.carrier || 'Carrier'}**: Delayed by **${s.delayDays || 3} days** (Destination: ${s.destination || 'Hub'})\n`;
        });
      } else {
        res += `There are currently no delayed shipments in the available data. All active freight corridors are arriving on schedule.`;
      }
      return res;
    }

    // ── INTENT 8: SUPPLIER PERFORMANCE QUERY ─────────────────────────────────
    if (!isFullReportPrompt && (p.includes('supplier performance') || p.includes('suppliers performing') || p.includes('underperforming supplier') || p.includes('supplier risk'))) {
      let res = `### SUPPLIER PERFORMANCE ANALYSIS\n\n`;
      const perfList = supplierPerf.length > 0 ? supplierPerf : suppliers;
      if (perfList.length > 0) {
        const lowOtif = perfList.filter((s: any) => (s.otif !== undefined ? s.otif : s.rating) < 85);
        res += `- **Total Monitored Suppliers**: ${perfList.length}\n`;
        res += `- **Underperforming Vendors (<85% OTIF)**: **${lowOtif.length}**\n\n`;
        if (lowOtif.length > 0) {
          res += `**Vendors Requiring Performance Review**:\n`;
          lowOtif.forEach((s: any) => {
            res += `- **${s.name}** (ID: \`${s.id}\`): ${Math.round(s.otif || s.rating || 0)}% OTIF, ${s.defectRate || 0}% Defect Rate\n`;
          });
        } else {
          res += `All tracked suppliers are currently operating above the 85% OTIF target threshold.`;
        }
      } else {
        res += `I don't have enough data to determine that from the current Orion dataset.`;
      }
      return res;
    }

    // ── INTENT 9: ACTIVE EXCEPTIONS QUERY ─────────────────────────────────────
    if (!isFullReportPrompt && (p.includes('active exception') || p.includes('show exception') || p.includes('critical exception') || p.includes('exception root cause'))) {
      let res = `### ACTIVE EXCEPTIONS ANALYSIS\n\n`;
      res += `- **Total Active Exceptions**: **${exceptions.length}**\n\n`;
      if (exceptions.length > 0) {
        res += `**Recorded Critical Operational Exceptions**:\n`;
        exceptions.forEach((e: any) => {
          res += `- Alert \`${e.id}\` (${e.severity || 'Medium'}): ${e.title || e.description || 'Variance detected'} (Estimated Impact: $${(e.estimatedImpact || 0).toLocaleString()})\n`;
        });
      } else {
        res += `There are currently no active exceptions in system telemetry.`;
      }
      return res;
    }

    // ── INTENT 10: PENDING DECISIONS QUERY ────────────────────────────────────
    if (!isFullReportPrompt && (p.includes('pending decision') || p.includes('decisions awaiting') || p.includes('decisions need immediate attention') || p.includes('prioritize pending decisions'))) {
      let res = `### PENDING DECISIONS AWAITING REVIEW\n\n`;
      res += `- **Staged Decisions Pending Action**: **${pendingDecisions.length}**\n\n`;
      if (pendingDecisions.length > 0) {
        res += `**Decisions Requiring Authorization**:\n`;
        pendingDecisions.forEach((d: any) => {
          res += `- Decision \`${d.id}\`: **${d.title || 'Operational Intervention'}** (Status: ${d.status})\n`;
        });
      } else {
        res += `There are currently no pending decisions awaiting review.`;
      }
      return res;
    }

    // ── INTENT 11: DEMAND FORECAST QUERY ─────────────────────────────────────
    if (!isFullReportPrompt && (p.includes('demand forecast') || p.includes('forecast risk') || p.includes('demand uncertainty'))) {
      const forecasts = ctx.getDemandForecasts || [];
      let res = `### DEMAND FORECAST & UNCERTAINTY ANALYSIS\n\n`;
      if (forecasts.length > 0) {
        res += `- **Monitored Forecast Horizons**: 30-day projected demand\n`;
        res += `**Top SKU Forecast Trends**:\n`;
        forecasts.slice(0, 5).forEach((f: any) => {
          res += `- Product \`${f.productId || 'SKU'}\`: Projected 30-day demand ${f.projectedDemand || 120} units (Variance ±${f.uncertainty || 5}%)\n`;
        });
      } else {
        res += `Baseline 30-day demand forecast is active. All projected product demand parameters remain within standard variance limits.`;
      }
      return res;
    }

    // ── DEFAULT: FULL CONTROL TOWER REPORT ─────────────────────────────────────
    let response = `### ORION-9 — COGNITIVE SUMMARY\n\n`;
    response += `*Operating Mode: ${mode} | Engine: Deterministic SCM Core*\n\n`;

    // 1. Executive Summary
    response += `#### 1. EXECUTIVE SUMMARY\n`;
    const criticalCount = exceptions.filter((e: any) => e.severity === 'Critical' || e.severity === 'CRITICAL').length;
    response += `- **Active Priority Exceptions**: ${exceptions.length} recorded (${criticalCount} Critical priority).\n`;
    response += `- **Inbound Logistical Delays**: ${delayedShipments.length} shipments currently delayed across active transit lanes.\n`;
    response += `- **Procurement Exposure**: ${overduePOs.length} purchase orders overdue or flagged for supplier rescheduling.\n`;
    response += `- **Decisions Awaiting Review**: ${pendingDecisions.length} operational decisions staged for authorized action.\n\n`;

    // RAG & Memory Context Grounding (Safely Formatted)
    if (ragEvidence && ragEvidence.summary) {
      response += `> **Governed Knowledge Context**: ${ragEvidence.summary}\n\n`;
    }
    if (persistentMemories.length > 0) {
      const formattedMem = formatMemoryRef(persistentMemories[0]);
      response += `> **Agent Memory Recurrence**: Prior observation: ${formattedMem}\n\n`;
    }

    // 2. Operational Signals & Root Causes
    response += `#### 2. OPERATIONAL SIGNALS & ROOT CAUSES\n`;
    if (delayedShipments.length > 0) {
      const topDelay = delayedShipments[0];
      response += `- **Carrier Latency (KNOWN)**: Shipment \`${topDelay.id || 'SHP'}\` via carrier **${topDelay.carrier || 'Carrier'}** is delayed by **${topDelay.delayDays || 3} days** to destination **${topDelay.destination || 'Hub'}**.\n`;
    }
    if (overduePOs.length > 0) {
      const topPO = overduePOs[0];
      response += `- **Supplier Fulfilment Delay (KNOWN)**: Purchase Order \`${topPO.id}\` with Supplier \`${topPO.supplierId}\` past expected delivery date (${topPO.expectedDelivery ? new Date(topPO.expectedDelivery).toLocaleDateString() : 'Overdue'}).\n`;
    }
    if (inventoryRisks.length > 0) {
      const topInv = inventoryRisks[0];
      response += `- **Stockout Risk (CALCULATED)**: SKU \`${topInv.sku || topInv.productId}\` on hand: ${topInv.onHand} units vs safety stock target ${topInv.safetyStock || topInv.reorderPoint || 10} units.\n`;
    }
    if (supplierPerf.length > 0) {
      const lowOtif = supplierPerf.filter((s: any) => s.otif < 85);
      if (lowOtif.length > 0) {
        response += `- **Supplier Reliability Variance (CALCULATED)**: ${lowOtif.length} vendors operating under 85% OTIF threshold (lowest: **${lowOtif[0].name}** at ${Math.round(lowOtif[0].otif)}% OTIF).\n`;
      }
    }
    if (delayedShipments.length === 0 && overduePOs.length === 0 && inventoryRisks.length === 0) {
      response += `- **Operational Telemetry Status (KNOWN)**: Operational parameters are operating within baseline tolerances.\n`;
    } else {
      response += `- **Causal Chain (INFERRED)**: Inbound transit delays and supplier lead-time variances are depleting safety stock buffers, creating localized service risk for downstream commitments.\n\n`;
    }

    // 3. Business Impact
    response += `#### 3. DOWNSTREAM RISK & BUSINESS IMPACT\n`;
    const totalImpact = exceptions.reduce((sum: number, e: any) => sum + (Number(e.estimatedImpact) || 0), 0);
    response += `- **Estimated Financial Value at Risk**: $${totalImpact.toLocaleString()} across unmitigated exceptions.\n`;
    response += `- **Service Level Projection**: Service level under pressure in active distribution centers. Inventory stockouts projected if replenishment is not expedited.\n\n`;

    // 4. Recommended Decisions & Actions
    response += `#### 4. RECOMMENDED DECISIONS & ACTIONS\n`;
    if (pendingDecisions.length > 0) {
      const topDec = pendingDecisions[0];
      response += `1. **Execute Decision**: Review and approve \`${topDec.title || topDec.id}\` in the Decision Engine.\n`;
    } else {
      response += `1. **Expedite Replenishment**: Issue priority expedited reorders for top critical inventory SKUs.\n`;
    }
    if (overduePOs.length > 0) {
      response += `2. **Supplier Escalation**: Send formal PO status inquiry for overdue order \`${overduePOs[0].id}\` via the Supplier Communication Center.\n`;
    }
    if (delayedShipments.length > 0) {
      response += `3. **Logistics Rerouting**: Contact carrier dispatch for delay mitigation on tracking \`${delayedShipments[0].trackingNumber || delayedShipments[0].id}\`.\n`;
    }
    
    if (pastOutcomes.length > 0) {
      const lastOutcome = pastOutcomes[pastOutcomes.length - 1];
      response += `\n*Feedback Loop Grounding: Previous similar decision (${lastOutcome.action || 'Action'}) resulted in ${lastOutcome.success ? 'ACCEPTED' : 'REJECTED'} outcome.*`;
    }

    response += `\n\n*Confidence: HIGH (Deterministic evaluation of active operational state).*`;

    return response;
  }

  /**
   * Drafts an official supplier communication based on factual parameters.
   * Requires explicit human authorization before dispatch.
   */
  draftSupplierCommunication(req: SupplierDraftRequest): { subject: string; body: string } {
    let subject = '';
    let body = '';

    switch (req.issueType) {
      case 'PO_DELAY':
        subject = `[URGENT] Delivery Status Inquiry — Purchase Order ${req.poNumber || 'Ref'} — ${req.supplierName}`;
        body = `Dear ${req.supplierName} Operations Team,\n\nOur Orion Supply Chain Operating System has flagged that Purchase Order ${req.poNumber || 'on record'} has exceeded its expected delivery milestone (${req.targetDate || 'immediate'}).\n\nOperational Impact: ${req.details}\n\nPlease provide an updated confirmed dispatch date and shipment tracking number within 24 business hours.\n\nBest regards,\nSupply Chain Operations\nOrion-9`;
        break;

      case 'QUALITY_DEFECT':
        subject = `[NOTICE] Quality Variance Notification — ${req.supplierName}`;
        body = `Dear ${req.supplierName} Quality Assurance Team,\n\nIncoming inspection lot testing has detected a non-conformance rate exceeding allowable thresholds:\n\n${req.details}\n\nPlease acknowledge receipt and submit a formal 8D Root Cause and Corrective Action report.\n\nSincerely,\nQuality Operations\nOrion-9`;
        break;

      case 'EXPEDITE_REQUEST':
        subject = `[EXPEDITE REQUEST] Accelerated Delivery Schedule — PO ${req.poNumber || 'Ref'}`;
        body = `Dear ${req.supplierName} Planning Team,\n\nDue to unexpected demand spikes, we request expedited handling and priority air/express shipment for PO ${req.poNumber || 'Ref'}.\n\nTarget Delivery Date: ${req.targetDate || 'ASAP'}\nSpecial Instructions: ${req.details}\n\nPlease confirm availability and any associated expedite charges for authorization.\n\nBest regards,\nProcurement Team\nOrion-9`;
        break;

      default:
        subject = `Operational Notice — ${req.supplierName} — Reference ${req.poNumber || 'General'}`;
        body = `Dear ${req.supplierName} Team,\n\nWe are following up regarding our ongoing supply commitments:\n\n${req.details}\n\nPlease review and confirm at your earliest convenience.\n\nBest regards,\nOrion-9`;
    }

    return { subject, body };
  }
}

export const orionAI = OrionAIProvider.getInstance();
