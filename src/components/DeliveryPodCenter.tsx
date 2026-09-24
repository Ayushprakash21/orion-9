import React, { useState } from 'react';
import { 
  Truck, CheckCircle2, AlertTriangle, RefreshCw, 
  MapPin, FileText, UserCheck, ShieldCheck, QrCode
} from 'lucide-react';
import { deliveryPodEngine, DeliveryPodRecord } from '../scm';
import { useAuth } from '../store/AuthContext';

export const DeliveryPodCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [pods, setPods] = useState<DeliveryPodRecord[]>(() => 
    deliveryPodEngine.getPods(tenantId)
  );

  const [shipmentId, setShipmentId] = useState('SHIP-2026-9042');
  const [orderId, setOrderId] = useState('ORD-CUST-8831');
  const [carrierId, setCarrierId] = useState('FEDEX-FREIGHT-EXP');
  const [trackingNumber, setTrackingNumber] = useState('TRK-983021948');
  const [recipientName, setRecipientName] = useState('Marcus Vance (Warehouse Lead)');
  const [status, setStatus] = useState<DeliveryPodRecord['deliveryStatus']>('DELIVERED_CLEAN');

  const refreshList = () => {
    setPods(deliveryPodEngine.getPods(tenantId));
  };

  const handleCapturePod = () => {
    deliveryPodEngine.recordProofOfDelivery({
      tenantId,
      shipmentId,
      orderId,
      carrierId,
      carrierTrackingNumber: trackingNumber,
      recipientName,
      recipientSignatureRef: `doc://signatures/pod-${Date.now()}.png`,
      deliveryStatus: status,
      deliveryLatitude: 37.7749,
      deliveryLongitude: -122.4194
    });
    refreshList();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="delivery-pod-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-400" />
              Last-Mile Delivery & Proof of Delivery (POD) Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AUDITED POD SYSTEM
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Authoritative Carrier Hand-off, Recipient Geo-Stamps, Digital Signatures, and Billing Triggers.
          </p>
        </div>
        <button 
          onClick={refreshList}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POD Capture Station */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            Capture Driver Proof of Delivery
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-white/60 block mb-1">Shipment Reference</label>
              <input 
                type="text" 
                value={shipmentId}
                onChange={e => setShipmentId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Customer Order Reference</label>
              <input 
                type="text" 
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/60 block mb-1">Carrier ID</label>
                <input 
                  type="text" 
                  value={carrierId}
                  onChange={e => setCarrierId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1">Tracking Number</label>
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 block mb-1">Recipient Authorized Name</label>
              <input 
                type="text" 
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Delivery Condition</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              >
                <option value="DELIVERED_CLEAN">DELIVERED_CLEAN (Perfect OTIF)</option>
                <option value="DELIVERED_DAMAGED">DELIVERED_DAMAGED (Transit Issue)</option>
                <option value="PARTIAL_DELIVERY">PARTIAL_DELIVERY (Shortage)</option>
                <option value="ATTEMPTED_FAILED">ATTEMPTED_FAILED (Recipient Absent)</option>
              </select>
            </div>

            <button 
              onClick={handleCapturePod}
              className="w-full py-2.5 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign & Authorize POD
            </button>
          </div>
        </div>

        {/* POD Ledger */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Verified Proof of Delivery Archive
            </h2>
            <span className="text-xs text-white/40">{pods.length} records</span>
          </div>

          <div className="space-y-3">
            {pods.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
                No POD records logged yet. Capture a new delivery on the left.
              </div>
            ) : (
              pods.map(pod => (
                <div key={pod.podId} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{pod.shipmentId}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80 font-mono">{pod.carrierTrackingNumber}</span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">
                        Recipient: <span className="text-white font-medium">{pod.recipientName}</span> • Delivered at: {new Date(pod.deliveredAt).toLocaleString()}
                      </p>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      pod.deliveryStatus === 'DELIVERED_CLEAN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {pod.deliveryStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded bg-white/5 border border-white/5">
                    <div>
                      <span className="text-white/40 block">Carrier</span>
                      <span className="font-medium text-white">{pod.carrierId}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Geo GPS Stamp</span>
                      <span className="font-medium text-blue-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {pod.deliveryLatitude?.toFixed(4)}, {pod.deliveryLongitude?.toFixed(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Digital Signature</span>
                      <span className="font-medium text-emerald-300 font-mono text-[10px]">
                        {pod.recipientSignatureRef || 'SIGNED_ON_GLASS'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
