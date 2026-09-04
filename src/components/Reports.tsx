import React from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { formatCurrency } from '../lib/utils';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { FileText, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';

export const Reports = () => {
  const { inventory, suppliers, purchaseOrders, shipments, exceptions, currency, settings } = useSupplyChain();
  
  const health = AnalyticsEngine.calculateOverallHealth(inventory, suppliers, purchaseOrders, shipments, settings);
  const totalValue = inventory.reduce((sum, item) => sum + (item.onHand * item.unitCost), 0);
  const criticalStockOuts = inventory.filter(i => AnalyticsEngine.calculateInventoryHealth(i, settings).status === 'Critical').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-4 sm:space-y-6 box-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-[#F5F5F5] mb-1">MISSION REPORTS</h2>
          <p className="text-sm text-[#777777]">Generate and export supply chain summaries.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#1B1B1B] border border-[#444444] text-[#F5F5F5] px-4 py-2 rounded-sm text-[10px] uppercase tracking-widest font-medium hover:bg-[#202020] transition-colors shadow-none focus:outline-none"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Paper */}
      <div className="bg-[#151515] border border-[#2A2A2A] shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:rounded-sm p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black print:backdrop-blur-none">
        <div className="border-b border-[#2A2A2A] print:border-black pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-[#F5F5F5] print:text-black uppercase">Supply Chain Executive Summary</h1>
            <p className="text-[#777777] print:text-gray-600 mt-2 font-mono text-xs uppercase">Generated on {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-[#B3B3B3] print:text-black uppercase tracking-[0.2em]">ORION SCM OS</div>
            <div className="text-[10px] text-[#777777] print:text-gray-600 uppercase tracking-widest">Internal Operations</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
          <div className="border-l-2 border-[#777777] pl-4 bg-[#161616] print:bg-transparent py-2">
            <div className="text-[10px] text-[#F5F5F5] print:text-gray-600 font-medium uppercase tracking-widest">Overall Health</div>
            <div className="text-xl font-mono text-[#F5F5F5] print:text-black">{health.overall}/100</div>
          </div>
          <div className="border-l-2 border-[#777777] pl-4 bg-[#151515] print:bg-transparent py-2">
            <div className="text-[10px] text-[#B3B3B3] print:text-gray-600 font-medium uppercase tracking-widest">Total Value</div>
            <div className="text-xl font-mono text-[#F5F5F5] print:text-black">{formatCurrency(totalValue, currency)}</div>
          </div>
          <div className="border-l-2 border-rose-500 pl-4 bg-rose-500/5 print:bg-transparent py-2">
            <div className="text-[10px] text-rose-400 print:text-gray-600 font-medium uppercase tracking-widest">Critical SKUs</div>
            <div className="text-xl font-mono text-[#F5F5F5] print:text-black">{criticalStockOuts}</div>
          </div>
          <div className="border-l-2 border-amber-500 pl-4 bg-amber-500/5 print:bg-transparent py-2">
            <div className="text-[10px] text-amber-400 print:text-gray-600 font-medium uppercase tracking-widest">Open Exceptions</div>
            <div className="text-xl font-mono text-[#F5F5F5] print:text-black">{exceptions.filter(e => e.status !== 'Resolved').length}</div>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="text-sm font-bold text-[#F5F5F5] print:text-black border-b border-[#2A2A2A] print:border-black pb-2 mb-4 uppercase tracking-widest">Inventory & Warehousing</h3>
            <p className="text-[#777777] print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Overall inventory health is rated at <span className="text-[#F5F5F5] print:text-black font-mono">{health.inventory}/100</span>. There are currently <span className="text-rose-400 print:text-black font-mono">{criticalStockOuts}</span> SKUs exhibiting critical stock-out risks across all distribution centers. 
              The total holding value is <span className="text-[#F5F5F5] print:text-black font-mono">{formatCurrency(totalValue, currency)}</span>.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#F5F5F5] print:text-black border-b border-[#2A2A2A] print:border-black pb-2 mb-4 uppercase tracking-widest">Supplier Performance</h3>
            <p className="text-[#777777] print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Aggregate supplier health stands at <span className="text-[#F5F5F5] print:text-black font-mono">{health.suppliers}/100</span>. Supplier On-Time In-Full (OTIF) delivery metrics indicate general stability, though specific regions may require targeted interventions to prevent downstream delays.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#F5F5F5] print:text-black border-b border-[#2A2A2A] print:border-black pb-2 mb-4 uppercase tracking-widest">Logistics & Shipments</h3>
            <p className="text-[#777777] print:text-gray-800 text-sm leading-relaxed mb-4 font-light">
              Logistics performance is currently at <span className="text-[#F5F5F5] print:text-black font-mono">{health.logistics}/100</span>. Of the active shipments, <span className="text-amber-400 print:text-black font-mono">{shipments.filter(s => s.delayDays > 0).length}</span> are experiencing delays exceeding expected transit times, leading to elevated freight risk profiles.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#F5F5F5] print:text-black border-b border-[#2A2A2A] print:border-black pb-2 mb-4 uppercase tracking-widest">Priority Action Items</h3>
            <ul className="list-disc pl-5 space-y-3 text-sm text-[#777777] print:text-gray-800 font-light">
              {exceptions.filter(e => e.severity === 'Critical').slice(0, 5).map(exc => (
                <li key={exc.id}>
                  <strong className="text-rose-400 print:text-black font-mono">{exc.entityId} ({exc.type}):</strong> {exc.description} — <em className="text-[#E5E5E5] print:text-gray-700 not-italic border-b border-dashed border-[#777777]">{exc.recommendedAction}</em>
                </li>
              ))}
            </ul>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-[#2A2A2A] print:border-black text-center text-[10px] font-mono text-[#777777] uppercase tracking-widest">
          CONFIDENTIAL - FOR INTERNAL MANAGEMENT USE ONLY
        </div>
      </div>
    </div>
  );
};
