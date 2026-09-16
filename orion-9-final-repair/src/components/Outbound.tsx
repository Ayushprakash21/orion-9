import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { 
  ArrowUpFromLine, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck, 
  ListOrdered, 
  Search, 
  Filter, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Boxes, 
  Send,
  Star,
  Check,
  X
} from 'lucide-react';
import { CustomerOrder, Carrier, Route } from '../types';

export const Outbound: React.FC = () => {
  const { 
    customerOrders, 
    customers, 
    carriers, 
    routes, 
    currency, 
    updateCustomerOrder 
  } = useSupplyChain();

  const [activeTab, setActiveTab] = useState<'orders' | 'carriers' | 'routes'>('orders');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Compute Outbound KPIs
  const kpis = useMemo(() => {
    const total = customerOrders.length;
    const open = customerOrders.filter(o => o.status === 'Open').length;
    const allocated = customerOrders.filter(o => o.status === 'Allocated').length;
    const inAssembly = customerOrders.filter(o => o.status === 'In Assembly').length;
    const shipped = customerOrders.filter(o => o.status === 'Shipped').length;
    const delivered = customerOrders.filter(o => o.status === 'Delivered').length;
    const atRisk = customerOrders.filter(o => o.status === 'At Risk' || o.status === 'Delayed').length;
    const totalVal = customerOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const onTimeRate = total > 0 ? (((total - atRisk) / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      open,
      allocated,
      inAssembly,
      shipped,
      delivered,
      atRisk,
      totalVal,
      onTimeRate
    };
  }, [customerOrders]);

  // Workflow Stages
  const stages = [
    { key: 'ALL', label: 'All Orders', count: kpis.total },
    { key: 'Open', label: '1. Open / New', count: kpis.open },
    { key: 'Allocated', label: '2. Stock Allocated', count: kpis.allocated },
    { key: 'In Assembly', label: '3. Assembly / Pick', count: kpis.inAssembly },
    { key: 'Shipped', label: '4. In Transit', count: kpis.shipped },
    { key: 'Delivered', label: '5. Delivered', count: kpis.delivered },
    { key: 'At Risk', label: 'At Risk / Delayed', count: kpis.atRisk }
  ];

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return customerOrders.filter(o => {
      if (selectedStage !== 'ALL') {
        if (selectedStage === 'At Risk') {
          if (o.status !== 'At Risk' && o.status !== 'Delayed') return false;
        } else if (o.status !== selectedStage) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesCust = o.customerName.toLowerCase().includes(q);
        const matchesStatus = o.status.toLowerCase().includes(q);
        if (!matchesId && !matchesCust && !matchesStatus) return false;
      }

      return true;
    });
  }, [customerOrders, selectedStage, searchQuery]);

  // Operational Transitions
  const handleAdvanceStatus = (order: CustomerOrder) => {
    let nextStatus: CustomerOrder['status'] = 'Allocated';
    let actionLabel = 'Stock allocated';

    if (order.status === 'Open') {
      nextStatus = 'Allocated';
      actionLabel = 'Stock allocated to order';
    } else if (order.status === 'Allocated') {
      nextStatus = 'In Assembly';
      actionLabel = 'Order moved to pick & assembly';
    } else if (order.status === 'In Assembly') {
      nextStatus = 'Shipped';
      actionLabel = 'Order dispatched with carrier';
    } else if (order.status === 'Shipped') {
      nextStatus = 'Delivered';
      actionLabel = 'Delivery confirmed & order fulfilled';
    } else if (order.status === 'At Risk' || order.status === 'Delayed') {
      nextStatus = 'In Assembly';
      actionLabel = 'Order expedited into assembly';
    }

    updateCustomerOrder(order.id, { status: nextStatus });
    showToast(`${order.id}: ${actionLabel}. Status is now "${nextStatus}".`);
  };

  const handleMarkAtRisk = (order: CustomerOrder) => {
    const nextStatus = order.status === 'At Risk' ? 'Open' : 'At Risk';
    updateCustomerOrder(order.id, { status: nextStatus });
    showToast(`${order.id} status updated to ${nextStatus}.`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto box-border min-h-full min-w-0 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-os-border">
        <div>
          <div className="flex items-center gap-2 text-os-text-secondary text-xs mb-1 font-mono">
            <ArrowUpFromLine size={14} className="text-cyan-400" />
            <span>LOGISTICS & FULFILLMENT</span>
            <span>/</span>
            <span className="text-os-text-primary">OUTBOUND COMMAND</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-os-text-primary tracking-tight">
            Outbound Fulfillment Command
          </h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Real-time customer orders, warehouse allocation stages, carrier fleet tracking, and delivery route performance.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-os-surface border border-os-border rounded-lg p-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'orders'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                : 'text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            Customer Orders ({customerOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'carriers'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                : 'text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            Carriers ({carriers.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'routes'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                : 'text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            Freight Lanes ({routes.length})
          </button>
        </div>
      </div>
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-os-text-muted font-semibold">Total Outbound</div>
          <div className="text-xl font-bold font-mono text-os-text-primary mt-1">{kpis.total} Orders</div>
          <div className="text-[10px] text-os-text-muted mt-0.5">₹{kpis.totalVal.toLocaleString()} pipeline</div>
        </div>

        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">Ready / Open</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{kpis.open} Orders</div>
          <div className="text-[10px] text-os-text-muted mt-0.5">Awaiting allocation</div>
        </div>

        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-amber-400 font-semibold">Allocated & Assembly</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{kpis.allocated + kpis.inAssembly}</div>
          <div className="text-[10px] text-os-text-muted mt-0.5">Floor processing</div>
        </div>

        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-blue-400 font-semibold">In Transit</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">{kpis.shipped}</div>
          <div className="text-[10px] text-os-text-muted mt-0.5">Active carrier freight</div>
        </div>

        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">Delivered / Fulfilled</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{kpis.delivered}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">SLA satisfied</div>
        </div>

        <div className="bg-os-surface border border-os-border p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-red-400 font-semibold">At Risk / Delayed</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">{kpis.atRisk}</div>
          <div className="text-[10px] text-os-text-muted mt-0.5">{kpis.onTimeRate}% on-time</div>
        </div>
      </div>

      {activeTab === 'orders' && (
        <>
          {/* Outbound Fulfillment Lifecycle Stages Bar */}
          <div className="bg-os-surface border border-os-border p-4 sm:p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-mono font-bold">
                Outbound Fulfillment Pipeline
              </div>
              <span className="text-[10px] text-os-text-secondary font-mono">
                Click any stage to filter orders
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {stages.map((st) => (
                <button
                  key={st.key}
                  onClick={() => setSelectedStage(st.key)}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                    selectedStage === st.key
                      ? 'bg-cyan-500/20 border-cyan-500/50 shadow-sm'
                      : 'bg-os-bg border-os-border hover:border-os-border-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-os-text-primary truncate">{st.label}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400 ml-1">{st.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Action Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-os-surface p-3 rounded-xl border border-os-border">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer name, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-os-bg border border-os-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="text-xs text-os-text-muted font-mono">
              Displaying {filteredOrders.length} of {customerOrders.length} customer orders
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-os-surface-secondary border-b border-os-border text-[10px] font-mono uppercase text-os-text-muted">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Promised Delivery</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-os-border/70">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-os-text-muted">
                        No orders match the selected stage and search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;

                      return (
                        <React.Fragment key={order.id}>
                          <tr 
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="hover:bg-os-surface-hover/80 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-os-text-primary flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="text-os-text-muted" />}
                              <span>{order.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-os-text-primary">{order.customerName}</span>
                              <span className="block text-[10px] text-os-text-muted font-mono">{order.customerId}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                                order.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                order.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-os-surface text-os-text-muted border border-os-border'
                              }`}>
                                {order.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-os-text-primary font-medium">
                              ₹{(order.totalValue || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-os-text-secondary">
                              {order.promisedDate}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                                order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                order.status === 'In Assembly' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                order.status === 'Allocated' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                                order.status === 'At Risk' || order.status === 'Delayed' ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse' :
                                'bg-os-surface text-os-text-muted border border-os-border'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {order.status !== 'Delivered' && (
                                  <button
                                    onClick={() => handleAdvanceStatus(order)}
                                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm"
                                  >
                                    <span>
                                      {order.status === 'Open' ? 'Allocate' :
                                       order.status === 'Allocated' ? 'Pick & Pack' :
                                       order.status === 'In Assembly' ? 'Dispatch' :
                                       order.status === 'Shipped' ? 'Mark Delivered' : 'Expedite'}
                                    </span>
                                    <ArrowRight size={11} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleMarkAtRisk(order)}
                                  className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                                    order.status === 'At Risk' 
                                      ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                                      : 'bg-os-surface hover:bg-os-surface-hover text-os-text-muted border-os-border'
                                  }`}
                                  title="Flag / Unflag Risk"
                                >
                                  <AlertTriangle size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Order Detail View */}
                          {isExpanded && (
                            <tr className="bg-os-surface-secondary/60">
                              <td colSpan={7} className="p-4 border-b border-os-border">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
                                      Order Line Items ({order.lines?.length || 0})
                                    </div>
                                    <div className="text-[11px] font-mono text-os-text-secondary">
                                      Order Date: {order.orderDate} • Promised: {order.promisedDate}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {(order.lines || []).map((line, idx) => (
                                      <div key={idx} className="bg-os-bg p-2.5 rounded-lg border border-os-border flex items-center justify-between text-xs">
                                        <div>
                                          <span className="font-mono font-bold text-cyan-400">{line.productId}</span>
                                          <div className="text-[10px] text-os-text-muted">
                                            Status: {line.status || 'Allocated'}
                                          </div>
                                        </div>
                                        <div className="text-right font-mono">
                                          <span className="font-semibold text-os-text-primary">{line.quantity} units</span>
                                          <span className="block text-[10px] text-os-text-muted">₹{line.unitPrice} / unit</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Carriers View */}
      {activeTab === 'carriers' && (
        <div className="space-y-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-os-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-os-text-primary">Contracted Carrier Fleets</h3>
                <p className="text-xs text-os-text-muted">Multi-modal transportation providers and on-time performance reliability.</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {carriers.length} ACTIVE CARRIERS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriers.map(c => (
                <div key={c.id} className="bg-os-bg border border-os-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-os-text-primary">{c.name}</h4>
                      <span className="text-[10px] font-mono text-cyan-400">{c.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      c.status === 'Preferred' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      c.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-os-surface p-2.5 rounded-lg border border-os-border">
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">On-Time Rate</span>
                      <span className="font-mono font-bold text-emerald-400">{c.onTimeReliability}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Avg Delay</span>
                      <span className="font-mono text-os-text-primary">+{c.averageDelayDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Active Loads</span>
                      <span className="font-mono text-os-text-primary">{c.activeShipmentsCount} Shipments</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Freight Modes</span>
                      <span className="font-mono text-os-text-secondary truncate block">{c.modes.join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-os-text-secondary pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      Rating: {c.rating} / 5.0
                    </span>
                    <span className="font-mono text-[11px]">₹{c.costPerTonKm}/ton-km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Freight Routes / Lanes View */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-os-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-os-text-primary">Transportation Lanes & Freight Corridors</h3>
                <p className="text-xs text-os-text-muted">Origin to destination freight risk, current congestion, and transit lead times.</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {routes.length} MONITORED LANES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map(r => (
                <div key={r.id} className="bg-os-bg border border-os-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{r.id}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-os-surface border border-os-border text-os-text-muted">
                          {r.mode}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-os-text-primary mt-1">
                        {r.origin} &rarr; {r.destination}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                      r.currentCongestionLevel === 'Severe' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      r.currentCongestionLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {r.currentCongestionLevel} Congestion
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-os-surface p-2.5 rounded-lg border border-os-border">
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Standard Lead Time</span>
                      <span className="font-mono font-semibold text-os-text-primary">{r.standardLeadTimeDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Delay Risk</span>
                      <span className={`font-mono font-semibold ${r.typicalDelayRisk > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {r.typicalDelayRisk}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-os-text-muted uppercase font-mono block">Freight Index</span>
                      <span className="font-mono text-os-text-primary">₹{r.freightIndexPerTeu}/TEU</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
