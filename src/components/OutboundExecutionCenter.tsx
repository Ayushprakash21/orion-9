import React, { useState } from 'react';
import { 
  Boxes, PackageCheck, Layers, RefreshCw, CheckCircle2, 
  AlertCircle, QrCode, ArrowRight, Truck, User
} from 'lucide-react';
import { outboundExecutionEngine, PickTaskRecord, CartonPackageRecord } from '../scm';
import { useAuth } from '../store/AuthContext';

export const OutboundExecutionCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [pickTasks, setPickTasks] = useState<PickTaskRecord[]>(() => 
    outboundExecutionEngine.getPickTasks(tenantId)
  );
  const [packages, setPackages] = useState<CartonPackageRecord[]>(() => 
    outboundExecutionEngine.getPackages(tenantId)
  );

  const [activeTab, setActiveTab] = useState<'PICKING' | 'PACKING'>('PICKING');

  const refreshAll = () => {
    setPickTasks(outboundExecutionEngine.getPickTasks(tenantId));
    setPackages(outboundExecutionEngine.getPackages(tenantId));
  };

  const handleSimulateWave = () => {
    outboundExecutionEngine.createPickWave({
      tenantId,
      orderId: `ORD-${Date.now().toString().slice(-5)}`,
      items: [
        { productId: 'PROD-NAV-SENSOR', quantity: 24, sourceLocation: 'Aisle-02-Bin-A1' },
        { productId: 'PROD-OPTIC-LENS', quantity: 12, sourceLocation: 'Aisle-05-Bin-C3' },
        { productId: 'PROD-SERVO-MOTOR', quantity: 48, sourceLocation: 'Aisle-08-Bin-D2' }
      ],
      pickerId: profile?.id || 'OPERATOR-101'
    });
    refreshAll();
  };

  const handleCompletePick = (taskId: string, requestedQty: number) => {
    outboundExecutionEngine.completePickTask(tenantId, taskId, requestedQty, 0);
    refreshAll();
  };

  const handlePackCarton = () => {
    outboundExecutionEngine.packCarton({
      tenantId,
      orderId: `ORD-${Date.now().toString().slice(-5)}`,
      waveId: 'WAVE-AUTO-BATCH',
      packingStationId: 'STATION-04-NORTH',
      weightKg: 8.45,
      dimensionsCm: { length: 40, width: 30, height: 25 },
      items: [
        { productId: 'PROD-NAV-SENSOR', quantity: 24 },
        { productId: 'PROD-OPTIC-LENS', quantity: 12 }
      ]
    });
    refreshAll();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="outbound-execution-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Boxes className="w-6 h-6 text-blue-400" />
              Outbound Warehouse Execution (Pick & Pack)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              WAVE PICKING & STAGING
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Governed Aisle/Bin Routing, Pick Confirmation, Short-Pick Exception Handling, and Carton Staging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {activeTab === 'PICKING' ? (
            <button 
              onClick={handleSimulateWave}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Dispatch Pick Wave
            </button>
          ) : (
            <button 
              onClick={handlePackCarton}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Pack New Carton
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('PICKING')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'PICKING' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Pick Tasks & Wave Routing ({pickTasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('PACKING')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'PACKING' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Packing Station & Sealed Cartons ({packages.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PICKING' ? (
        <div className="space-y-4">
          {pickTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No active pick tasks. Click "Dispatch Pick Wave" to generate wave pick tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pickTasks.map(task => (
                <div key={task.taskId} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">{task.productId}</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">{task.taskId}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      task.status === 'SHORT_PICKED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-white/60">
                      <span>Source Location:</span>
                      <span className="font-mono text-blue-300 font-semibold">{task.sourceLocation}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Requested Quantity:</span>
                      <span className="font-semibold text-white">{task.requestedQuantity} units</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Assigned Picker:</span>
                      <span className="text-white/80">{task.pickerId}</span>
                    </div>
                  </div>

                  {task.status !== 'COMPLETED' && task.status !== 'SHORT_PICKED' && (
                    <button 
                      onClick={() => handleCompletePick(task.taskId, task.requestedQuantity)}
                      className="w-full py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Complete Pick
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {packages.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No sealed cartons staged yet. Pack a carton using the action button above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.packageId} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-bold text-sm text-white">{pkg.cartonBarcode}</span>
                      </div>
                      <span className="text-[10px] text-white/40 block mt-0.5">Order: {pkg.orderId}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {pkg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-black/40 border border-white/5">
                    <div>
                      <span className="text-white/40 block">Gross Weight</span>
                      <span className="font-semibold text-white">{pkg.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Dimensions (L×W×H)</span>
                      <span className="font-semibold text-white">{pkg.dimensionsCm.length}×{pkg.dimensionsCm.width}×{pkg.dimensionsCm.height} cm</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-white/60">
                    <span className="font-medium text-white/80 block mb-1">Packed Content:</span>
                    {pkg.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-white/60">
                        <span>{it.productId}</span>
                        <span className="font-semibold text-white">{it.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
