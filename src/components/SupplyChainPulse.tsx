import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { BrainCircuit, Activity, Clock, FileText, Package, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { format, subHours, subDays, isAfter } from 'date-fns';

export const SupplyChainPulse: React.FC = () => {
  const { inventory, purchaseOrders, shipments, exceptions, dataMode } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'INVENTORY' | 'PROCUREMENT' | 'SHIPMENTS' | 'EXCEPTIONS'>('ALL');
  const [isLive, setIsLive] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedBucket, setSelectedBucket] = useState<any>(null);

  // Auto-refresh simulation when LIVE is checked
  useEffect(() => {
    if (isLive && dataMode === 'demo') {
      const interval = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 30000); // 30s refresh to show it's active
      return () => clearInterval(interval);
    }
  }, [isLive, dataMode]);

  const graphData = useMemo(() => {
    // We construct a time series based on the current time and selected filter
    const now = new Date();
    
    // Determine the start time and the number of buckets
    let startTime: Date;
    let numBuckets: number;
    let timeFormat: string;
    
    if (timeFilter === '24h') {
      startTime = subHours(now, 24);
      numBuckets = 24; // hourly
      timeFormat = 'HH:00';
    } else if (timeFilter === '7d') {
      startTime = subDays(now, 7);
      numBuckets = 7; // daily
      timeFormat = 'MMM dd';
    } else {
      startTime = subDays(now, 30);
      numBuckets = 15; // every 2 days
      timeFormat = 'MMM dd';
    }

    const durationMs = now.getTime() - startTime.getTime();
    const bucketDurationMs = durationMs / numBuckets;

    // Initialize buckets
    const buckets = Array.from({ length: numBuckets }).map((_, i) => {
      const bucketStart = new Date(startTime.getTime() + i * bucketDurationMs);
      return {
        timeStr: format(bucketStart, timeFormat),
        timestamp: bucketStart.getTime(),
        inventory: 0,
        po: 0,
        shipments: 0,
        exceptions: 0,
        inventoryEvents: [] as any[],
        poEvents: [] as any[],
        shipmentEvents: [] as any[],
        exceptionEvents: [] as any[],
      };
    });

    // Helper to find bucket
    const placeInBucket = (dateStr: string | undefined, type: 'inventory' | 'po' | 'shipments' | 'exceptions', event: any) => {
      if (!dateStr) return;
      const t = new Date(dateStr).getTime();
      if (t < startTime.getTime()) return; // too old
      
      const bucketIndex = Math.floor((t - startTime.getTime()) / bucketDurationMs);
      const targetIndex = bucketIndex >= numBuckets ? numBuckets - 1 : bucketIndex;
      
      if (targetIndex >= 0) {
        buckets[targetIndex][type]++;
        
        if (type === 'inventory') buckets[targetIndex].inventoryEvents.push(event);
        else if (type === 'po') buckets[targetIndex].poEvents.push(event);
        else if (type === 'shipments') buckets[targetIndex].shipmentEvents.push(event);
        else if (type === 'exceptions') buckets[targetIndex].exceptionEvents.push(event);
      }
    };

    // Note: To make the graph look alive and realistic without fabricating history,
    // we take actual data but also if dataMode === 'DEMO' we might synthesize *a few* timestamps 
    // strictly relative to now if the demo data is completely static.
    // However, the prompt says: "Do not fabricate historical data... build the graph from available timestamps... 
    // DO NOT invent a fake 24-hour history."
    // So we strictly use real dates.
    
    // Inventory
    inventory.forEach(item => {
      placeInBucket(item.lastUpdated, 'inventory', item);
    });

    // POs
    purchaseOrders.forEach(po => {
      placeInBucket(po.orderDate, 'po', po);
    });

    // Shipments
    shipments.forEach(s => {
      placeInBucket(s.shipDate || s.expectedArrival, 'shipments', s);
    });

    // Exceptions
    exceptions.forEach(e => {
      placeInBucket(e.date, 'exceptions', e);
    });
    
    return buckets;
  }, [inventory, purchaseOrders, shipments, exceptions, timeFilter, refreshTrigger]);

  const activeSeries = {
    inventory: activityFilter === 'ALL' || activityFilter === 'INVENTORY',
    po: activityFilter === 'ALL' || activityFilter === 'PROCUREMENT',
    shipments: activityFilter === 'ALL' || activityFilter === 'SHIPMENTS',
    exceptions: activityFilter === 'ALL' || activityFilter === 'EXCEPTIONS',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-[#2A2A2A] p-3 rounded-lg shadow-xl min-w-[150px]">
          <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2 pb-2 border-b border-[#2A2A2A]">
            {label}
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
                <span className="font-mono text-[#F5F5F5] ml-4">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate a realistic insight based on graphData
  const getInsight = () => {
    if (graphData.length < 2) return "Collecting supply-chain activity data...";
    
    const recent = graphData.slice(-3); // last few buckets
    const recentExceptions = recent.reduce((sum, b) => sum + b.exceptions, 0);
    const recentPOs = recent.reduce((sum, b) => sum + b.po, 0);

    let parts = [];
    if (recentExceptions > 0) {
      parts.push(`${recentExceptions} exceptions generated recently`);
    }
    if (recentPOs > 0) {
      parts.push(`Procurement active with ${recentPOs} recent orders`);
    }

    if (parts.length === 0) return "Normal operational activity volume detected.";
    return parts.join(". ") + ".";
  };

  // Determine if we have any data to show
  const hasData = graphData.some(b => b.inventory > 0 || b.po > 0 || b.shipments > 0 || b.exceptions > 0);

  return (
    <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl flex flex-col w-full h-[450px]">
      
      {/* HEADER */}
      <div className="p-4 sm:p-5 border-b border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#F5F5F5] font-semibold flex items-center gap-2">
            <Activity size={14} className="text-[#30D158]" />
            Supply Chain Pulse
          </div>
          <div className="text-[10px] text-[#777777] uppercase tracking-wider mt-1">Live operational activity across inventory, orders and logistics.</div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-[#111111] border border-[#2A2A2A] text-xs text-[#B3B3B3] rounded-md px-2 py-1 outline-none"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <select 
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as any)}
            className="bg-[#111111] border border-[#2A2A2A] text-xs text-[#B3B3B3] rounded-md px-2 py-1 outline-none"
          >
            <option value="ALL">All Activity</option>
            <option value="INVENTORY">Inventory</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="SHIPMENTS">Shipments</option>
            <option value="EXCEPTIONS">Exceptions</option>
          </select>
          <div className="flex items-center gap-1.5 ml-2 cursor-pointer" onClick={() => setIsLive(!isLive)}>
            <div className={`w-2 h-2 rounded-full ${isLive && dataMode !== 'demo' ? 'bg-[#30D158]' : (dataMode === 'demo' ? 'bg-[#777777]' : 'bg-[#FF453A]')}`} />
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#B3B3B3]">
              {dataMode === 'demo' ? 'LOCAL' : (isLive ? 'LIVE' : 'OFFLINE')}
            </span>
          </div>
        </div>
      </div>

      {/* GRAPH AREA */}
      <div className="flex-1 p-4 relative min-h-0 overflow-hidden">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={graphData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e?.activePayload?.length) {
                  setSelectedBucket(e.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis 
                dataKey="timeStr" 
                stroke="#555555" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
              />
              <YAxis 
                stroke="#555555" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {activeSeries.inventory && (
                <Line type="monotone" dataKey="inventory" name="Inventory Events" stroke="#F5F5F5" strokeWidth={2} dot={{ r: 3, fill: '#151515', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#F5F5F5', cursor: 'pointer' }} />
              )}
              {activeSeries.po && (
                <Line type="monotone" dataKey="po" name="Purchase Orders" stroke="#8E8E93" strokeWidth={2} dot={{ r: 3, fill: '#151515', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#8E8E93', cursor: 'pointer' }} />
              )}
              {activeSeries.shipments && (
                <Line type="monotone" dataKey="shipments" name="Shipments" stroke="#555555" strokeWidth={2} dot={{ r: 3, fill: '#151515', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#555555', cursor: 'pointer' }} />
              )}
              {activeSeries.exceptions && (
                <Line type="monotone" dataKey="exceptions" name="Exceptions" stroke="#FF453A" strokeWidth={2} dot={{ r: 3, fill: '#151515', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#FF453A', cursor: 'pointer' }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <Clock size={32} className="text-[#555555] mb-3" />
            <div className="text-sm text-[#F5F5F5] font-medium mb-1">No activity history available yet</div>
            <div className="text-xs text-[#777777] max-w-xs">Connect a data source or perform an import to populate this view with operational events.</div>
          </div>
        )}

        {/* ACTIVITY DETAIL DRAWER OVERLAY */}
        {selectedBucket && (
          <div className="absolute top-0 right-0 w-full sm:w-80 h-full bg-[#151515] border-l border-[#2A2A2A] shadow-2xl flex flex-col z-20 transition-transform transform translate-x-0 overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center bg-[#111111]">
              <div className="text-[11px] uppercase tracking-wider text-[#F5F5F5] font-semibold flex items-center gap-2">
                <Clock size={14} className="text-[#B3B3B3]" />
                Activity Detail
              </div>
              <button onClick={() => setSelectedBucket(null)} className="text-[#777777] hover:text-[#F5F5F5] transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="text-center pb-4 border-b border-[#2A2A2A]">
                <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">Time Period</div>
                <div className="text-sm font-mono text-[#F5F5F5]">{selectedBucket.timeStr}</div>
              </div>

              {selectedBucket.inventoryEvents.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2 flex justify-between">
                    <span>Inventory Updates</span>
                    <span className="text-[#F5F5F5]">{selectedBucket.inventoryEvents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedBucket.inventoryEvents.slice(0, 5).map((inv: any, i: number) => (
                      <div key={i} onClick={() => openEntity('inventory', inv.id)} className="p-2 bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-md text-xs cursor-pointer flex justify-between items-center transition-colors">
                        <span className="font-mono text-[#B3B3B3]">{inv.id}</span>
                        <ArrowRight size={12} className="text-[#555555]" />
                      </div>
                    ))}
                    {selectedBucket.inventoryEvents.length > 5 && <div className="text-[10px] text-[#777777] italic text-center">+ {selectedBucket.inventoryEvents.length - 5} more</div>}
                  </div>
                </div>
              )}

              {selectedBucket.poEvents.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2 flex justify-between">
                    <span>Purchase Orders</span>
                    <span className="text-[#F5F5F5]">{selectedBucket.poEvents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedBucket.poEvents.slice(0, 5).map((po: any, i: number) => (
                      <div key={i} onClick={() => openEntity('po', po.id)} className="p-2 bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-md text-xs cursor-pointer flex justify-between items-center transition-colors">
                        <span className="font-mono text-[#B3B3B3]">{po.id}</span>
                        <ArrowRight size={12} className="text-[#555555]" />
                      </div>
                    ))}
                    {selectedBucket.poEvents.length > 5 && <div className="text-[10px] text-[#777777] italic text-center">+ {selectedBucket.poEvents.length - 5} more</div>}
                  </div>
                </div>
              )}

              {selectedBucket.shipmentEvents.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2 flex justify-between">
                    <span>Shipments</span>
                    <span className="text-[#F5F5F5]">{selectedBucket.shipmentEvents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedBucket.shipmentEvents.slice(0, 5).map((ship: any, i: number) => (
                      <div key={i} onClick={() => openEntity('shipment', ship.id)} className="p-2 bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-md text-xs cursor-pointer flex justify-between items-center transition-colors">
                        <span className="font-mono text-[#B3B3B3]">{ship.id}</span>
                        <ArrowRight size={12} className="text-[#555555]" />
                      </div>
                    ))}
                    {selectedBucket.shipmentEvents.length > 5 && <div className="text-[10px] text-[#777777] italic text-center">+ {selectedBucket.shipmentEvents.length - 5} more</div>}
                  </div>
                </div>
              )}

              {selectedBucket.exceptionEvents.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2 flex justify-between">
                    <span className="text-[#FF453A]">Exceptions</span>
                    <span className="text-[#F5F5F5]">{selectedBucket.exceptionEvents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedBucket.exceptionEvents.slice(0, 5).map((ex: any, i: number) => (
                      <div key={i} onClick={() => openEntity('exception', ex.id)} className="p-2 bg-[#111111] border border-[#2A2A2A] hover:border-[#777777] rounded-md text-xs cursor-pointer flex justify-between items-center transition-colors">
                        <span className="truncate pr-2 text-[#B3B3B3]">{ex.type}</span>
                        <ArrowRight size={12} className="text-[#555555] flex-shrink-0" />
                      </div>
                    ))}
                    {selectedBucket.exceptionEvents.length > 5 && <div className="text-[10px] text-[#777777] italic text-center">+ {selectedBucket.exceptionEvents.length - 5} more</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER INSIGHT */}
      <div className="p-3 bg-[#111111] border-t border-[#2A2A2A] rounded-b-xl flex items-center justify-between">
        <div className="text-xs text-[#B3B3B3] flex items-center gap-2 px-2">
          <BrainCircuit size={14} className="text-[#777777]" />
          {getInsight()}
        </div>
        <button className="text-[10px] uppercase font-mono px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#202020] text-[#F5F5F5] border border-[#2A2A2A] rounded-md transition-colors flex items-center gap-1.5">
          Ask ORION
        </button>
      </div>
      
    </div>
  );
};
