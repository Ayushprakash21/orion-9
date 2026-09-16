#!/bin/bash
cat << 'INNEREOF' > src/components/LiveSupplyChainFlow.tsx
import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';
import { Box, Truck, Factory, Users, ShoppingCart, Package, Archive } from 'lucide-react';

export const LiveSupplyChainFlow: React.FC = () => {
  const { suppliers, shipments, warehouses, inventory, purchaseOrders, currency } = useSupplyChain();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Safely aggregate stats
  const stats = useMemo(() => {
    try {
      const activeSuppliers = (suppliers || []).filter(s => s.status === 'Active' || s.status === 'Approved').length;
      const suppliersAtRisk = (suppliers || []).filter(s => (s.riskLevel && s.riskLevel !== 'Low') || (s.riskScore && s.riskScore > 50)).length;
      
      const activeInbound = (shipments || []).filter(s => ['In Transit', 'Planned', 'Booked', 'Picked Up'].includes(s.status)).length;
      const delayedInbound = (shipments || []).filter(s => s.status === 'Delayed').length;
      
      const criticalSkus = (inventory || []).filter(i => (i.onHand || 0) <= (i.safetyStock || 0)).length;
      const invValue = (inventory || []).reduce((acc, curr) => acc + ((curr.onHand || 0) * (curr.unitCost || 0)), 0);
      
      const openOrders = (purchaseOrders || []).filter(po => ['Draft', 'Submitted', 'Approved', 'Partially Received'].includes(po.status)).length;
      const atRiskOrders = (purchaseOrders || []).filter(po => po.status === 'Delayed' || po.status === 'Overdue').length;

      return {
        suppliers: {
          total: (suppliers || []).length,
          atRisk: suppliersAtRisk,
          active: activeSuppliers || (suppliers || []).length
        },
        inbound: {
          active: activeInbound,
          delayed: delayedInbound,
          onTime: "N/A"
        },
        warehouses: {
          count: (warehouses || []).length,
          capacity: "N/A",
          riskStatus: "Normal"
        },
        inventory: {
          totalSkus: (inventory || []).length,
          critical: criticalSkus,
          value: invValue
        },
        orders: {
          open: openOrders,
          atRisk: atRiskOrders,
          backlog: "N/A"
        },
        outbound: {
          ready: "N/A",
          delayed: "N/A",
          atRisk: "N/A"
        },
        customers: {
          active: "N/A",
          affected: "N/A"
        }
      };
    } catch (err) {
      console.error("LiveSupplyChainFlow Stats Error:", err);
      // Fallback safe zeros
      return {
        suppliers: { total: 0, atRisk: 0, active: 0 },
        inbound: { active: 0, delayed: 0, onTime: "N/A" },
        warehouses: { count: 0, capacity: "N/A", riskStatus: "N/A" },
        inventory: { totalSkus: 0, critical: 0, value: 0 },
        orders: { open: 0, atRisk: 0, backlog: "N/A" },
        outbound: { ready: "N/A", delayed: "N/A", atRisk: "N/A" },
        customers: { active: "N/A", affected: "N/A" }
      };
    }
  }, [suppliers, shipments, warehouses, inventory, purchaseOrders]);

  const nodesInfo = [
    { id: 'suppliers', label: 'SUPPLIERS', icon: Factory, details: [
      { label: 'Total Suppliers', value: stats.suppliers.total },
      { label: 'At Risk', value: stats.suppliers.atRisk, isError: stats.suppliers.atRisk > 0 },
      { label: 'Active', value: stats.suppliers.active }
    ]},
    { id: 'inbound', label: 'INBOUND', icon: Truck, details: [
      { label: 'Active Shipments', value: stats.inbound.active },
      { label: 'Delayed', value: stats.inbound.delayed, isError: stats.inbound.delayed > 0 },
      { label: 'On-Time', value: stats.inbound.onTime }
    ]},
    { id: 'warehouses', label: 'WAREHOUSES', icon: Archive, details: [
      { label: 'Facilities', value: stats.warehouses.count },
      { label: 'Capacity', value: stats.warehouses.capacity },
      { label: 'Status', value: stats.warehouses.riskStatus }
    ]},
    { id: 'inventory', label: 'INVENTORY', icon: Box, details: [
      { label: 'Total SKUs', value: stats.inventory.totalSkus },
      { label: 'Critical SKUs', value: stats.inventory.critical, isError: stats.inventory.critical > 0 },
      { label: 'Value', value: formatCurrency(stats.inventory.value, currency || 'USD') }
    ]},
    { id: 'orders', label: 'ORDERS', icon: ShoppingCart, details: [
      { label: 'Open Orders', value: stats.orders.open },
      { label: 'At Risk', value: stats.orders.atRisk, isError: stats.orders.atRisk > 0 },
      { label: 'Backlog', value: stats.orders.backlog }
    ]},
    { id: 'outbound', label: 'OUTBOUND', icon: Package, details: [
      { label: 'Ready to Ship', value: stats.outbound.ready },
      { label: 'Delayed', value: stats.outbound.delayed },
      { label: 'At Risk', value: stats.outbound.atRisk }
    ]},
    { id: 'customers', label: 'CUSTOMERS', icon: Users, details: [
      { label: 'Active Customers', value: stats.customers.active },
      { label: 'Affected Orders', value: stats.customers.affected }
    ]}
  ];

  return (
    <div className="bg-[#151515] border border-[#2A2A2A] p-4 sm:p-6 rounded-xl w-full relative">
      <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-8">
        Live Supply Chain Flow
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .flow-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #30D158;
          border-radius: 50%;
          box-shadow: 0 0 6px 1px rgba(48, 209, 88, 0.6);
          top: 50%;
          transform: translateY(-50%);
          animation: flowAnim 2.5s infinite linear;
        }
        .flow-particle-vert {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #30D158;
          border-radius: 50%;
          box-shadow: 0 0 6px 1px rgba(48, 209, 88, 0.6);
          left: 50%;
          transform: translateX(-50%);
          animation: flowAnimVert 1.5s infinite linear;
        }
        @keyframes flowAnim {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes flowAnimVert {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .flow-particle, .flow-particle-vert { animation: none; display: none; }
        }
      `}} />

      {/* DESKTOP LAYOUT (sm and up) */}
      <div className="hidden sm:block relative w-full pb-8">
        {/* LINE 1 */}
        <div className="grid grid-cols-4 gap-4 relative z-10 mb-12">
          {nodesInfo.slice(0, 4).map((node, i) => (
            <div key={node.id} className="relative flex flex-col items-center">
              {/* Connector right */}
              {i < 3 && (
                <div className="absolute top-8 left-[60%] right-[-40%] h-[2px] bg-[#2A2A2A] z-0">
                   <div className="flow-particle" style={{ animationDelay: \`\${i * 0.8}s\` }}></div>
                </div>
              )}
              
              <div 
                className="relative z-10 w-full max-w-[140px] bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-lg p-3 cursor-pointer group transition-colors flex flex-col items-center justify-center text-center"
                onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
              >
                <node.icon size={20} className="text-[#B3B3B3] mb-2 group-hover:text-[#F5F5F5] transition-colors" />
                <span className="text-[10px] font-mono tracking-wider text-[#F5F5F5]">{node.label}</span>
                
                {activeNode === node.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-[#1A1A1A] border border-[#333333] shadow-2xl rounded-lg p-3 z-50 text-left">
                    {node.details.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-1.5 last:mb-0">
                        <span className="text-[10px] text-[#777777]">{d.label}</span>
                        <span className={\`text-xs font-mono \${d.isError ? 'text-[#FF453A]' : 'text-[#F5F5F5]'}\`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vertical Connector from INVENTORY to ORDERS (Col 4 down to Col 1 via absolute SVG or CSS) */}
        {/* For simplicity and robustness, we drop down from INVENTORY, go left, and drop into ORDERS */}
        <div className="absolute right-[12.5%] top-[80px] w-[75%] h-[40px] z-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[2px] h-[20px] bg-[#2A2A2A]">
             <div className="flow-particle-vert" style={{ animationDelay: '2.4s', animationDuration: '0.5s' }}></div>
          </div>
          <div className="absolute right-0 top-[20px] left-0 h-[2px] bg-[#2A2A2A]">
             {/* Particle moving right to left */}
             <div className="absolute w-1 h-1 bg-[#30D158] rounded-full shadow-[0_0_6px_1px_rgba(48,209,88,0.6)] top-1/2 -translate-y-1/2" style={{ animation: 'flowAnimLeft 1.5s infinite linear', animationDelay: '2.9s' }}></div>
          </div>
          <div className="absolute left-0 top-[20px] w-[2px] h-[20px] bg-[#2A2A2A]">
             <div className="flow-particle-vert" style={{ animationDelay: '4.4s', animationDuration: '0.5s' }}></div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: \`
          @keyframes flowAnimLeft {
            0% { right: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { right: 100%; opacity: 0; }
          }
        \`}} />

        {/* LINE 2 */}
        <div className="grid grid-cols-4 gap-4 relative z-10">
          {nodesInfo.slice(4).map((node, i) => (
            <div key={node.id} className="relative flex flex-col items-center">
              {/* Connector right */}
              {i < 2 && (
                <div className="absolute top-8 left-[60%] right-[-40%] h-[2px] bg-[#2A2A2A] z-0">
                  <div className="flow-particle" style={{ animationDelay: \`\${(i + 5) * 0.8}s\` }}></div>
                </div>
              )}
              
              <div 
                className="relative z-10 w-full max-w-[140px] bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-lg p-3 cursor-pointer group transition-colors flex flex-col items-center justify-center text-center"
                onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
              >
                <node.icon size={20} className="text-[#B3B3B3] mb-2 group-hover:text-[#F5F5F5] transition-colors" />
                <span className="text-[10px] font-mono tracking-wider text-[#F5F5F5]">{node.label}</span>
                
                {activeNode === node.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#1A1A1A] border border-[#333333] shadow-2xl rounded-lg p-3 z-50 text-left">
                    {node.details.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-1.5 last:mb-0">
                        <span className="text-[10px] text-[#777777]">{d.label}</span>
                        <span className={\`text-xs font-mono \${d.isError ? 'text-[#FF453A]' : 'text-[#F5F5F5]'}\`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Empty 4th column to balance grid */}
          <div className="hidden sm:block"></div>
        </div>
      </div>

      {/* MOBILE LAYOUT (Stack) */}
      <div className="sm:hidden flex flex-col items-center gap-6 relative py-4">
        {/* Continuous vertical line behind all */}
        <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[2px] bg-[#2A2A2A] z-0">
           <div className="flow-particle-vert" style={{ height: '20px', animationDuration: '4s' }}></div>
        </div>

        {nodesInfo.map((node, i) => (
          <div key={node.id} className="relative z-10 w-full max-w-[240px]">
            <div 
              className="bg-[#111111] border border-[#2A2A2A] active:border-[#777777] rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
            >
              <div className="bg-[#1A1A1A] p-2 rounded-md">
                <node.icon size={16} className="text-[#F5F5F5]" />
              </div>
              <span className="text-xs font-mono tracking-wider text-[#F5F5F5] flex-1">{node.label}</span>
              
              <div className={\`w-2 h-2 rounded-full \${node.details.some(d => d.isError) ? 'bg-[#FF453A]' : 'bg-[#30D158]'}\`} />
            </div>

            {activeNode === node.id && (
              <div className="mt-2 w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-3 z-50 animate-in slide-in-from-top-2">
                {node.details.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-2 last:mb-0">
                    <span className="text-xs text-[#777777]">{d.label}</span>
                    <span className={\`text-xs font-mono \${d.isError ? 'text-[#FF453A]' : 'text-[#F5F5F5]'}\`}>{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
INNEREOF
