import React, { useState } from 'react';
import { 
  Globe, ShieldCheck, AlertTriangle, RefreshCw, 
  FileText, CheckCircle2, Lock, Unlock, ArrowRight
} from 'lucide-react';
import { customsTradeEngine, CustomsDeclarationRecord } from '../scm';
import { useAuth } from '../store/AuthContext';

export const CustomsTradeCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [declarations, setDeclarations] = useState<CustomsDeclarationRecord[]>(() => 
    customsTradeEngine.getDeclarations(tenantId)
  );

  const [shipmentId, setShipmentId] = useState('SHIP-INTL-9982');
  const [exportCountry, setExportCountry] = useState('US');
  const [importCountry, setImportCountry] = useState('NL (Rotterdam Port)');
  const [hsCode, setHsCode] = useState('8806.90.00 (Autonomous Drones)');
  const [declaredValue, setDeclaredValue] = useState(48500);

  const refreshList = () => {
    setDeclarations(customsTradeEngine.getDeclarations(tenantId));
  };

  const handleFileDeclaration = () => {
    customsTradeEngine.fileDeclaration({
      tenantId,
      shipmentId,
      declarationNumber: `CUST-${Date.now().toString().slice(-6)}`,
      exportCountry,
      importCountry,
      hsCode,
      commercialInvoiceRef: `doc://invoices/cinv-${Date.now()}.pdf`,
      billOfLadingRef: `doc://bol/bol-${Date.now()}.pdf`,
      certificateOfOriginRef: `doc://coo/coo-${Date.now()}.pdf`,
      declaredValue,
      dutyCalculatedAmount: Math.round(declaredValue * 0.042),
      taxCalculatedAmount: Math.round(declaredValue * 0.21),
      currency: 'USD',
      clearanceStatus: 'SUBMITTED'
    });
    refreshList();
  };

  const handleToggleHold = (dec: CustomsDeclarationRecord) => {
    if (dec.clearanceStatus === 'CUSTOMS_HOLD') {
      customsTradeEngine.releaseCustomsHold(tenantId, dec.declarationId);
    } else {
      customsTradeEngine.setCustomsHold(tenantId, dec.declarationId, 'Random Port Tariff & Origin Verification');
    }
    refreshList();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="customs-trade-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-400" />
              Customs & International Trade Compliance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              CROSS-BORDER TRADE BOUNDARY
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            HS Code Harmonization, Electronic Declarations, Tariff Calculations, and Port Authority Inspection Clearance.
          </p>
        </div>
        <button 
          onClick={refreshList}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Declarations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filing Panel */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            File Customs Declaration
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/60 block mb-1">Origin Country</label>
                <input 
                  type="text" 
                  value={exportCountry}
                  onChange={e => setExportCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1">Destination Port</label>
                <input 
                  type="text" 
                  value={importCountry}
                  onChange={e => setImportCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 block mb-1">Harmonized Tariff (HS Code)</label>
              <input 
                type="text" 
                value={hsCode}
                onChange={e => setHsCode(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Declared Value (USD)</label>
              <input 
                type="number" 
                value={declaredValue}
                onChange={e => setDeclaredValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[11px]">
              <div className="flex justify-between text-white/60">
                <span>Calculated Duty (4.2%):</span>
                <span className="text-white font-medium">${Math.round(declaredValue * 0.042).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Estimated Import VAT (21%):</span>
                <span className="text-white font-medium">${Math.round(declaredValue * 0.21).toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleFileDeclaration}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Submit Customs Filing
            </button>
          </div>
        </div>

        {/* Declarations Ledger */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Active Declarations & Port Hold Manager
            </h2>
            <span className="text-xs text-white/40">{declarations.length} records</span>
          </div>

          <div className="space-y-3">
            {declarations.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
                No customs declarations registered. File a new declaration on the left.
              </div>
            ) : (
              declarations.map(dec => (
                <div key={dec.declarationId} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{dec.declarationNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80 font-mono">{dec.shipmentId}</span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">
                        Route: <span className="text-white">{dec.exportCountry} → {dec.importCountry}</span> • HS Code: {dec.hsCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        dec.clearanceStatus === 'CLEARED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        dec.clearanceStatus === 'CUSTOMS_HOLD' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {dec.clearanceStatus}
                      </span>

                      <button 
                        onClick={() => handleToggleHold(dec)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                          dec.clearanceStatus === 'CUSTOMS_HOLD'
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/50'
                            : 'bg-red-600/30 text-red-300 border border-red-500/30 hover:bg-red-600/50'
                        }`}
                      >
                        {dec.clearanceStatus === 'CUSTOMS_HOLD' ? (
                          <>
                            <Unlock className="w-3 h-3" /> Release Hold
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Flag Port Hold
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {dec.holdReason && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Hold Reason: <span className="text-white font-medium">{dec.holdReason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded bg-white/5 border border-white/5">
                    <div>
                      <span className="text-white/40 block">Declared Value</span>
                      <span className="font-semibold text-white">${dec.declaredValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Duty Assessed</span>
                      <span className="font-semibold text-amber-300">${dec.dutyCalculatedAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">VAT / Tax</span>
                      <span className="font-semibold text-blue-300">${dec.taxCalculatedAmount.toLocaleString()}</span>
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
