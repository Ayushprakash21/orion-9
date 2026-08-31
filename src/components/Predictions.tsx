import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { Lightbulb, TrendingDown, Clock, ShieldAlert, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export const Predictions = () => {
  const { exceptions, inventory, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  const predictions = useMemo(() => {
    const preds = [];
    const stockOuts = exceptions.filter(e => e.type === 'Stock-Out Risk');
    preds.push({
      id: 'pred-1',
      title: 'Stock-Out Risk',
      horizon: '7 Days',
      confidence: 'HIGH',
      evidence: `Identified ${stockOuts.length} SKUs currently at risk of stock-out based on average daily demand and inbound delays.`,
      impact: stockOuts.reduce((sum, e) => sum + e.estimatedImpact, 0),
      related: stockOuts.length
    });

    const delays = exceptions.filter(e => e.type === 'Shipment Delay');
    preds.push({
      id: 'pred-2',
      title: 'Shipment Delay Risk',
      horizon: '14 Days',
      confidence: 'MEDIUM',
      evidence: `Carrier performance trends suggest ${delays.length} active shipments are likely to be delayed beyond ETA.`,
      impact: delays.reduce((sum, e) => sum + e.estimatedImpact, 0),
      related: delays.length
    });
    
    preds.push({
      id: 'pred-3',
      title: 'Demand Anomaly',
      horizon: '30 Days',
      confidence: 'LOW',
      evidence: 'Insufficient historical data to make a reliable prediction on demand spikes.',
      impact: 0,
      related: 0
    });

    return preds;
  }, [exceptions]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Predictive Intelligence</h2>
          <p className="text-xs text-[#777777] mt-1 hidden sm:block">AI reasoning engine forecasting risks, stock-outs, and lead-time anomalies.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {predictions.map(pred => {
          let confColor = "text-[#B3B3B3] bg-[#1B1B1B] border-[#2A2A2A]";
          if (pred.confidence === 'HIGH') confColor = "text-[#FF453A] bg-[#1B1B1B] border-[#2A2A2A]";
          if (pred.confidence === 'MEDIUM') confColor = "text-[#FF9F0A] bg-[#1B1B1B] border-[#2A2A2A]";

          return (
            <div 
              key={pred.id} 
              onClick={() => openEntity({ type: 'prediction', id: pred.id })}
              className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl hover:border-[#777777] transition-colors group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-center text-[#B3B3B3]">
                    <Lightbulb size={18} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-1 bg-[#111111] text-[#B3B3B3] border border-[#2A2A2A] rounded-md">
                      {pred.horizon}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-base text-[#F5F5F5] font-medium mb-2">{pred.title}</h3>
                <p className="text-xs text-[#777777] mb-4 min-h-[60px]">{pred.evidence}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#2A2A2A]">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Exposure</div>
                    <div className="text-sm font-mono text-[#F5F5F5]">{formatCurrency(pred.impact, currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Confidence</div>
                    <div className={`inline-block text-[10px] uppercase font-mono px-2 py-1 border rounded-md ${confColor}`}>
                      {pred.confidence}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[#777777] group-hover:text-[#F5F5F5] transition-colors pt-2">
                <span className="text-xs font-mono uppercase tracking-wider">View {pred.related} Related Events</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
