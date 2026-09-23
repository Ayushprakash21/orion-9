import React, { useState } from 'react';
import { 
  Users2, ShieldCheck, CheckCircle2, XCircle, Play, 
  RefreshCw, Plus, Key, FileCode, Check, AlertTriangle
} from 'lucide-react';
import { tradingPartnerRegistry } from '../../integration/tradingPartner/TradingPartnerRegistry';
import { TradingPartnerRecord } from '../../integration/types';
import { 
  integrationCertificationService, 
  PartnerCertificationReport 
} from '../../integration/partner/IntegrationCertificationService';
import { useAuth } from '../../store/AuthContext';

export const TradingPartnerCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  // Seed sample partners if empty
  const [partners, setPartners] = useState<TradingPartnerRecord[]>(() => {
    let list = tradingPartnerRegistry.listPartners(tenantId);
    if (list.length === 0) {
      tradingPartnerRegistry.registerPartner({
        partnerId: 'PARTNER-ACME-GLOBAL',
        tenantId,
        name: 'Acme Global Components Ltd',
        code: 'ACME',
        ediQualifier: 'ZZ',
        ediIdentifier: 'ACMEGLOBAL01',
        status: 'ACTIVE',
        certificateReference: 'cert://vault/demo-tenant/partners/acme-x509',
        secretReference: 'secret://vault/demo-tenant/partners/acme-as2-key',
        supportedCapabilities: [
          { transactionType: '850', direction: 'INBOUND', transportId: 'trans-as2-01', mappingContractId: 'map-po-850', active: true, standard: 'X12', version: '004010' },
          { transactionType: '855', direction: 'OUTBOUND', transportId: 'trans-as2-01', mappingContractId: 'map-ack-855', active: true, standard: 'X12', version: '004010' },
          { transactionType: '856', direction: 'INBOUND', transportId: 'trans-as2-01', mappingContractId: 'map-asn-856', active: true, standard: 'X12', version: '004010' }
        ]
      });
      tradingPartnerRegistry.registerPartner({
        partnerId: 'PARTNER-NIPPON-TRANS',
        tenantId,
        name: 'Nippon Logistics Forwarding KK',
        code: 'NIPPON',
        ediQualifier: '01',
        ediIdentifier: '998210344',
        status: 'ONBOARDING',
        certificateReference: 'cert://vault/demo-tenant/partners/nippon-tls',
        supportedCapabilities: [
          { transactionType: '850', direction: 'INBOUND', transportId: 'trans-as2-02', mappingContractId: 'map-po-850', active: true, standard: 'X12', version: '004010' },
          { transactionType: '810', direction: 'INBOUND', transportId: 'trans-as2-02', mappingContractId: 'map-inv-810', active: true, standard: 'X12', version: '004010' }
        ]
      });
      list = tradingPartnerRegistry.listPartners(tenantId);
    }
    return list;
  });

  const [selectedPartner, setSelectedPartner] = useState<TradingPartnerRecord | null>(() => partners[0] || null);
  const [certReport, setCertReport] = useState<PartnerCertificationReport | null>(null);
  const [isCertifying, setIsCertifying] = useState(false);

  const refreshPartners = () => {
    const list = tradingPartnerRegistry.listPartners(tenantId);
    setPartners(list);
    if (selectedPartner) {
      const p = tradingPartnerRegistry.getPartner(tenantId, selectedPartner.partnerId);
      if (p) setSelectedPartner(p);
    }
  };

  const handleRunCertification = async (partnerId: string) => {
    setIsCertifying(true);
    setCertReport(null);
    try {
      const report = await integrationCertificationService.executeCertification(tenantId, partnerId, profile?.fullName || profile?.displayName || 'admin');
      setCertReport(report);
      refreshPartners();
    } catch (err: any) {
      console.error('Certification failed:', err);
    } finally {
      setIsCertifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CERTIFICATION': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'TESTING': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'ONBOARDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'SUSPENDED': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'RETIRED': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="trading-partner-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Users2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Trading Partner Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              EDI Partner Lifecycle & Mandatory 8-Point Integration Certification Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshPartners}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Partners"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Partner Directory */}
        <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 border-b border-os-border">
            <span className="text-sm font-bold text-white font-mono">Partner Directory ({partners.length})</span>
            <span className="text-xs text-os-text-muted font-mono">Zero Plaintext Keys</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {partners.map(p => (
              <div
                key={p.partnerId}
                onClick={() => { setSelectedPartner(p); setCertReport(null); }}
                className={`p-3 bg-black/30 border rounded cursor-pointer transition-colors ${
                  selectedPartner?.partnerId === p.partnerId
                    ? 'border-[#00F2FE] bg-[#00F2FE]/10'
                    : 'border-os-border hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{p.name}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-os-text-muted mt-1">
                  EDI: {p.ediQualifier}:{p.ediIdentifier}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-os-text-secondary mt-2">
                  <span>{p.supportedCapabilities.length} Capabilities</span>
                  <span className="text-[#00F2FE]">ID: {p.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Partner Inspector & 8-Point Certification Suite */}
        <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[640px] overflow-y-auto space-y-4">
          {selectedPartner ? (
            <>
              {/* Partner Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-os-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedPartner.name}</h2>
                    <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${getStatusColor(selectedPartner.status)}`}>
                      {selectedPartner.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-os-text-muted mt-0.5">
                    {selectedPartner.partnerId} | EDI Qualifier: <strong className="text-white">{selectedPartner.ediQualifier}</strong> | ID: <strong className="text-white">{selectedPartner.ediIdentifier}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCertifying}
                  onClick={() => handleRunCertification(selectedPartner.partnerId)}
                  className={`px-4 py-2 font-mono text-xs font-bold rounded border transition-all flex items-center gap-1.5 shrink-0 ${
                    isCertifying
                      ? 'bg-white/10 text-os-text-muted border-os-border cursor-not-allowed'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40 cursor-pointer'
                  }`}
                >
                  <Play size={13} /> {isCertifying ? 'Executing 8-Point Suite...' : 'Run 8-Point Certification'}
                </button>
              </div>

              {/* Security Credential References (Zero Plaintext) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/40 border border-os-border rounded space-y-1">
                  <div className="text-[10px] text-os-text-muted uppercase flex items-center gap-1">
                    <Key size={12} className="text-amber-400" /> Certificate Reference
                  </div>
                  <div className="text-emerald-400 font-bold truncate text-[11px]">
                    {selectedPartner.certificateReference || 'cert://vault/demo-tenant/default-x509'}
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-os-border rounded space-y-1">
                  <div className="text-[10px] text-os-text-muted uppercase flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#00F2FE]" /> Secret Reference
                  </div>
                  <div className="text-[#00F2FE] font-bold truncate text-[11px]">
                    {selectedPartner.secretReference || 'secret://vault/demo-tenant/as2-keys'}
                  </div>
                </div>
              </div>

              {/* Supported Transaction Capabilities */}
              <div className="p-3 bg-black/30 border border-os-border rounded space-y-2">
                <div className="text-xs font-bold text-white font-mono">Supported Transaction Capabilities</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.supportedCapabilities.map((cap, i) => (
                    <div key={i} className="px-2.5 py-1 bg-black/40 border border-os-border rounded text-[11px] font-mono flex items-center gap-1.5">
                      <span className="font-bold text-white">{cap.standard} {cap.transactionType}</span>
                      <span className="text-[9px] text-cyan-400 font-bold">({cap.direction})</span>
                      <span className="text-[9px] text-os-text-muted">v{cap.version}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8-Point Automated Certification Report Card */}
              {certReport ? (
                <div className="p-4 bg-black/50 border border-purple-500/30 rounded space-y-3">
                  <div className="flex items-center justify-between border-b border-os-border pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="font-bold text-white text-xs font-mono">Certification Report ({certReport.reportId})</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      SCORE: {certReport.overallScore}/100 {certReport.overallPassed ? '(PASSED)' : '(FAILED)'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {certReport.gates.map((g) => (
                      <div key={g.gate} className="p-2 bg-black/40 border border-os-border rounded flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          {g.passed ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle size={14} className="text-rose-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-white text-[11px]">{g.name}</div>
                            <div className="text-[10px] text-os-text-muted truncate max-w-md">{g.details}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold ${g.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {g.passed ? 'PASS' : 'FAIL'}
                          </span>
                          <div className="text-[9px] text-os-text-muted">{g.latencyMs}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-os-border rounded text-center text-xs font-mono text-os-text-muted space-y-2">
                  <p>No active certification report loaded for this trading partner.</p>
                  <p className="text-[11px]">Click "Run 8-Point Certification" to execute the compliance test suite.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
              Select a trading partner to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
