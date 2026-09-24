import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Clock, RefreshCw, Layers, 
  Search, ShieldCheck, Box, ArrowRight, ArrowUpRight, Warehouse
} from 'lucide-react';
import { availableToPromiseEngine, AtpCalculationRecord } from '../scm';
import { useAuth } from '../store/AuthContext';

export const AtpOrderPromisingCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [calculations, setCalculations] = useState<AtpCalculationRecord[]>(() => 
    availableToPromiseEngine.getCalculations(tenantId)
  );

  // Form State for dynamic ATP simulation
  const [productId, setProductId] = useState('PROD-DRONE-X9');
  const [warehouseId, setWarehouseId] = useState('WH-NORTH-AMERICA-CENTRAL');
  const [requestedQty, setRequestedQty] = useState(150);
  const [onHandQty, setOnHandQty] = useState(220);
  const [reservedQty, setReservedQty] = useState(60);
  const [incomingSupply, setIncomingSupply] = useState(50);
  const [expectedProd, setExpectedProd] = useState(30);
  const [transferSupply, setTransferSupply] = useState(10);
  const [safetyStock, setSafetyStock] = useState(40);
  const [deliveryDate, setDeliveryDate] = useState('2026-10-15');

  const refreshList = () => {
    setCalculations(availableToPromiseEngine.getCalculations(tenantId));
  };

  const handleRunAtpCheck = () => {
    const result = availableToPromiseEngine.calculateAtp({
      tenantId,
      productId,
      warehouseId,
      requestedQuantity: requestedQty,
      requestedDeliveryDate: deliveryDate,
      onHandQuantity: onHandQty,
      reservedQuantity: reservedQty,
      confirmedIncomingSupply: incomingSupply,
      expectedProductionSupply: expectedProd,
      transferSupply,
      safetyStockProtected: safetyStock,
      alternativeWarehouses: [
        { warehouseId: 'WH-EMEA-WEST-ROTTERDAM', onHand: 400, reserved: 80 }
      ]
    });

    refreshList();
  };

  const handleAllocate = (atpId: string) => {
    availableToPromiseEngine.allocateAtp(tenantId, atpId);
    refreshList();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="atp-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Box className="w-6 h-6 text-blue-400" />
              Available-to-Promise (ATP) & Order Promising Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              REAL-TIME MATHEMATICS ACTIVE
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Governed ATP Equation: <code className="text-blue-300">OnHand - Reserved + Incoming + Prod + Transfer - SafetyStock</code>
          </p>
        </div>
        <button 
          onClick={refreshList}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Simulate Order Promising
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-white/60 block mb-1">Product Reference</label>
              <input 
                type="text" 
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Primary Warehouse Node</label>
              <input 
                type="text" 
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/60 block mb-1">Requested Qty</label>
                <input 
                  type="number" 
                  value={requestedQty}
                  onChange={e => setRequestedQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1">Delivery Target</label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <div>
                <label className="text-white/50 block text-[10px]">On Hand</label>
                <input 
                  type="number" 
                  value={onHandQty}
                  onChange={e => setOnHandQty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-white/50 block text-[10px]">Reserved</label>
                <input 
                  type="number" 
                  value={reservedQty}
                  onChange={e => setReservedQty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-white/50 block text-[10px]">Safety Stock</label>
                <input 
                  type="number" 
                  value={safetyStock}
                  onChange={e => setSafetyStock(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-white/50 block text-[10px]">Incoming POs</label>
                <input 
                  type="number" 
                  value={incomingSupply}
                  onChange={e => setIncomingSupply(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-white/50 block text-[10px]">Expected Prod</label>
                <input 
                  type="number" 
                  value={expectedProd}
                  onChange={e => setExpectedProd(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-white/50 block text-[10px]">Transfers</label>
                <input 
                  type="number" 
                  value={transferSupply}
                  onChange={e => setTransferSupply(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <button 
              onClick={handleRunAtpCheck}
              className="w-full py-2.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Calculate Deterministic ATP
            </button>
          </div>
        </div>

        {/* Real-time Ledger */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-400" />
              Active ATP Calculations & Allocations
            </h2>
            <span className="text-xs text-white/40">{calculations.length} records</span>
          </div>

          <div className="space-y-3">
            {calculations.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
                No ATP calculations run yet. Simulate an order calculation on the left.
              </div>
            ) : (
              calculations.map(calc => (
                <div key={calc.atpId} className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{calc.productId}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{calc.warehouseId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          calc.fulfillmentStatus === 'FULL_PROMISE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          calc.fulfillmentStatus === 'PARTIAL_PROMISE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          calc.fulfillmentStatus === 'SPLIT_FULFILLMENT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {calc.fulfillmentStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">
                        Requested: {calc.requestedQuantity} units by {calc.requestedDeliveryDate} → Promised Date: <span className="text-white font-medium">{calc.promisedDeliveryDate}</span>
                      </p>
                    </div>

                    {!calc.allocated ? (
                      <button 
                        onClick={() => handleAllocate(calc.atpId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Allocate Stock
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Allocated
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-white/40 block">Net ATP Units</span>
                      <span className="font-bold text-emerald-400 text-sm">{calc.availableToPromiseQuantity}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Physical On Hand</span>
                      <span className="font-medium text-white">{calc.onHandQuantity}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Active Reserves</span>
                      <span className="font-medium text-amber-300">{calc.reservedQuantity}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Incoming POs</span>
                      <span className="font-medium text-blue-300">+{calc.confirmedIncomingSupply}</span>
                    </div>
                  </div>

                  {calc.alternativeWarehouseId && (
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      Alternative fulfillment routed via node: <span className="font-semibold text-white">{calc.alternativeWarehouseId}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
