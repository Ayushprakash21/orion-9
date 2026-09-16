import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useBranding } from '../store/BrandingContext';
import { formatCurrency } from '../lib/utils';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { FileText, Printer, ChevronDown, Download, ShieldCheck, BarChart3, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { generatePlatformIntelligencePdf } from '../services/platformPdfService';

type ReportType = 
  | 'Monthly Executive Report' 
  | 'Daily Operational Brief' 
  | 'Weekly Supply Chain Report'
  | 'Supply Chain Risk Report'
  | 'Supplier Performance Report'
  | 'Inventory Optimization Report'
  | 'Logistics & Inbound Report'
  | 'AI Management Report';

export const Reports = () => {
  const { inventory, suppliers, purchaseOrders, shipments, exceptions, currency, settings } = useSupplyChain();
  const { appName } = useBranding();
  const [reportType, setReportType] = useState<ReportType>('Monthly Executive Report');
  
  const health = AnalyticsEngine.calculateOverallHealth(inventory, suppliers, purchaseOrders, shipments, settings);
  const totalValue = inventory.reduce((sum, item) => sum + (item.onHand * item.unitCost), 0);
  const criticalStockOuts = inventory.filter(i => AnalyticsEngine.calculateInventoryHealth(i, settings).status === 'Critical').length;
  const delayedCount = shipments.filter(s => s.delayDays > 0).length;
  const criticalExceptions = exceptions.filter(e => e.severity === 'Critical');
  const capitalAtRisk = exceptions.reduce((sum, e) => sum + (e.estimatedImpact || 0), 0);
  const openPoValue = purchaseOrders.filter(po => po.status !== 'Received' && po.status !== 'Cancelled').reduce((sum, po) => sum + (po.totalValue || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const otifList = suppliers.map(s => s.otif || 100);
    const avgOtd = otifList.length > 0 ? otifList.reduce((a, b) => a + b, 0) / otifList.length : 95;

    const reportData = {
      reportId: `REP-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      adminUser: {
        name: 'Orion Operations Officer',
        username: 'admin',
        email: 'admin@orion-scm.io',
        role: 'Platform Admin',
        organization: 'Global Supply Chain Operations'
      },
      dataMode: 'real' as const,
      currency: currency || 'USD',
      kpis: {
        totalInventoryValue: totalValue,
        capitalAtRisk: capitalAtRisk,
        stockoutSkus: criticalStockOuts,
        delayedShipments: delayedCount,
        openPoValue: openPoValue,
        avgSupplierOtd: avgOtd,
        criticalExceptions: criticalExceptions.length
      },
      analysis: {
        executiveSummary: `Executive briefing for ${reportType}. Overall system health index is rated at ${health.overall}/100. There are currently ${criticalStockOuts} critical SKU stockouts, with total holding capital of ${formatCurrency(totalValue, currency)}. ${criticalExceptions.length} critical exceptions require immediate executive oversight. Capital currently exposed across high-severity risk signals is estimated at ${formatCurrency(capitalAtRisk, currency)}.`,
        systemHealthScore: health.overall,
        systemHealthRationale: `Composite score derived from weighted operational indicators: Inventory (${health.inventory}/100), Suppliers (${health.suppliers}/100), Logistics (${health.logistics}/100).`,
        vulnerabilities: exceptions.filter(e => e.severity === 'Critical' || e.severity === 'High').slice(0, 5).map(e => ({
          id: e.id,
          title: e.type,
          domain: 'OPERATIONS',
          severity: e.severity.toUpperCase(),
          affectedEntity: e.entityId,
          financialExposure: e.estimatedImpact || 0,
          probability: 'HIGH',
          rootCauseCategory: 'Supply Disruption',
          description: e.description
        })),
        rootCauses: [
          {
            category: 'Logistics Volatility',
            title: 'Inbound Freight Lane Congestion',
            explanation: 'Lead time variances in primary supply routes are driving buffer stock exhaustion.',
            entities: shipments.filter(s => s.delayDays > 0).slice(0, 3).map(s => s.id)
          }
        ],
        strategicRoadmap: exceptions.filter(e => e.severity === 'Critical').slice(0, 4).map((e, idx) => ({
          id: `ACT-0${idx + 1}`,
          title: e.recommendedAction || 'Expedite replenishment purchase order',
          priority: 'CRITICAL',
          category: 'Inventory',
          targetEntity: e.entityId,
          expectedImpact: 'Prevent immediate stockout',
          actionDetails: e.description,
          estimatedCapitalImpact: e.estimatedImpact || 0
        })),
        confidenceScore: 94
      }
    };

    generatePlatformIntelligencePdf(reportData);
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'Daily Operational Brief': return 'Tactical overview of immediate risks, critical stockouts, and pending decisions for today.';
      case 'Weekly Supply Chain Report': return 'Aggregate view of supplier performance, logistics delays, and inventory trends for the week.';
      case 'Supply Chain Risk Report': return 'Comprehensive audit of operational bottlenecks, financial exposure, and at-risk supplier nodes.';
      case 'Supplier Performance Report': return 'Detailed scoring of OTIF compliance, quality acceptance rates, and strategic dependency.';
      case 'Inventory Optimization Report': return 'Working capital efficiency, safety stock buffers, and excess SKU liquidation opportunities.';
      case 'Logistics & Inbound Report': return 'Freight lane transit times, carrier performance, and customs exception monitoring.';
      case 'AI Management Report': return 'Autonomous synthesis of telemetry data, root cause discoveries, and recommended interventions.';
      case 'Monthly Executive Report': 
      default:
        return 'Strategic summary of supply chain health, financial exposure, and long-term KPI compliance.';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1400px] mx-auto space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-os-text-primary font-bold mb-1">MISSION REPORTS</h2>
          <p className="text-xs text-os-text-muted">Generate, analyze, and export executive supply chain intelligence.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="appearance-none bg-os-surface border border-os-border text-os-text-primary px-3.5 py-2 pr-8 rounded-lg text-xs font-medium hover:bg-os-surface-hover transition-colors shadow-sm focus:outline-none"
            >
              <option value="Monthly Executive Report">Monthly Executive Report</option>
              <option value="Daily Operational Brief">Daily Operational Brief</option>
              <option value="Weekly Supply Chain Report">Weekly Supply Chain Report</option>
              <option value="Supply Chain Risk Report">Supply Chain Risk Report</option>
              <option value="Supplier Performance Report">Supplier Performance Report</option>
              <option value="Inventory Optimization Report">Inventory Optimization Report</option>
              <option value="Logistics & Inbound Report">Logistics & Inbound Report</option>
              <option value="AI Management Report">AI Management Report</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-os-text-muted pointer-events-none" />
          </div>

          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-os-text-primary text-os-bg px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm"
          >
            <Download size={14} />
            Download PDF
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-os-surface border border-os-border text-os-text-primary px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-os-surface-hover transition-colors shadow-sm"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Report Paper */}
      <div className="bg-os-surface border border-os-border shadow-sm backdrop-blur-sm sm:rounded-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black print:backdrop-blur-none">
        <div className="border-b border-os-border print:border-black pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-os-text-primary print:text-black uppercase">{reportType}</h1>
            <p className="text-os-text-muted print:text-gray-600 mt-2 text-sm">{getReportDescription()}</p>
            <p className="text-os-text-muted print:text-gray-600 mt-2 font-mono text-xs uppercase">Generated on {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-os-text-secondary print:text-black uppercase tracking-[0.2em]">{appName}</div>
            <div className="text-[10px] text-os-text-muted print:text-gray-600 uppercase tracking-widest">Internal Operations</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
          <div className="border-l-2 border-os-border pl-4 bg-os-surface print:bg-transparent py-2">
            <div className="text-[10px] text-os-text-primary print:text-gray-600 font-medium uppercase tracking-widest">Overall Health</div>
            <div className="text-xl font-mono text-os-text-primary print:text-black">{health.overall}/100</div>
          </div>
          <div className="border-l-2 border-os-border pl-4 bg-os-surface print:bg-transparent py-2">
            <div className="text-[10px] text-os-text-secondary print:text-gray-600 font-medium uppercase tracking-widest">Total Value</div>
            <div className="text-xl font-mono text-os-text-primary print:text-black">{formatCurrency(totalValue, currency)}</div>
          </div>
          <div className="border-l-2 border-rose-500 pl-4 bg-rose-500/5 print:bg-transparent py-2">
            <div className="text-[10px] text-rose-400 print:text-gray-600 font-medium uppercase tracking-widest">Critical SKUs</div>
            <div className="text-xl font-mono text-os-text-primary print:text-black">{criticalStockOuts}</div>
          </div>
          <div className="border-l-2 border-amber-500 pl-4 bg-amber-500/5 print:bg-transparent py-2">
            <div className="text-[10px] text-amber-400 print:text-gray-600 font-medium uppercase tracking-widest">Open Exceptions</div>
            <div className="text-xl font-mono text-os-text-primary print:text-black">{exceptions.filter(e => e.status !== 'Resolved').length}</div>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="text-sm font-bold text-os-text-primary print:text-black border-b border-os-border print:border-black pb-2 mb-4 uppercase tracking-widest">Inventory & Warehousing</h3>
            <p className="text-os-text-muted print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Overall inventory health is rated at <span className="text-os-text-primary print:text-black font-mono">{health.inventory}/100</span>. There are currently <span className="text-rose-400 print:text-black font-mono">{criticalStockOuts}</span> SKUs exhibiting critical stock-out risks across all distribution centers. 
              The total holding value is <span className="text-os-text-primary print:text-black font-mono">{formatCurrency(totalValue, currency)}</span>.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-os-text-primary print:text-black border-b border-os-border print:border-black pb-2 mb-4 uppercase tracking-widest">Supplier Performance</h3>
            <p className="text-os-text-muted print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Aggregate supplier health stands at <span className="text-os-text-primary print:text-black font-mono">{health.suppliers}/100</span>. Supplier On-Time In-Full (OTIF) delivery metrics indicate general stability, though specific regions may require targeted interventions to prevent downstream delays.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-os-text-primary print:text-black border-b border-os-border print:border-black pb-2 mb-4 uppercase tracking-widest">Logistics & Shipments</h3>
            <p className="text-os-text-muted print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Logistics performance is currently at <span className="text-os-text-primary print:text-black font-mono">{health.logistics}/100</span>. Of the active shipments, <span className="text-amber-400 print:text-black font-mono">{shipments.filter(s => s.delayDays > 0).length}</span> are experiencing delays exceeding expected transit times, leading to elevated freight risk profiles.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-os-text-primary print:text-black border-b border-os-border print:border-black pb-2 mb-4 uppercase tracking-widest">Planning Intelligence</h3>
            <p className="text-os-text-muted print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Demand forecast accuracy remains stable. Short-term inventory optimization analysis recommends reviewing <span className="text-amber-400 print:text-black font-mono">safety stock</span> levels for high-volatility items. Scenario models indicate potential exposure to <span className="text-rose-400 print:text-black font-mono">supplier delays</span> in the upcoming quarter.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-os-text-primary print:text-black border-b border-os-border print:border-black pb-2 mb-4 uppercase tracking-widest">Priority Action Items</h3>
            <ul className="list-disc pl-5 space-y-3 text-sm text-os-text-muted print:text-gray-800 font-light">
              {exceptions.filter(e => e.severity === 'Critical').slice(0, 5).map(exc => (
                <li key={exc.id}>
                  <strong className="text-rose-400 print:text-black font-mono">{exc.entityId} ({exc.type}):</strong> {exc.description} — <em className="text-os-text-primary print:text-gray-700 not-italic border-b border-dashed border-os-border">{exc.recommendedAction}</em>
                </li>
              ))}
            </ul>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-os-border print:border-black text-center text-[10px] font-mono text-os-text-muted uppercase tracking-widest">
          CONFIDENTIAL - FOR INTERNAL MANAGEMENT USE ONLY
        </div>
      </div>
    </div>
  );
};
