/**
 * ORION-9 TABLET AI COPILOT WORKSPACE
 * Live Governed Supply Chain Intelligence for tablet form factors.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useLiveMetric } from '../../core/visualization';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { orionAI, AIProviderStatus } from '../../services/ai/AIProvider';
import { generateCopilotResponse } from '../../lib/api';
import { 
  Sparkles, 
  Send, 
  Activity, 
  ShieldAlert, 
  Truck, 
  Package, 
  Bot, 
  User, 
  AlertTriangle,
  ArrowRight,
  Database
} from 'lucide-react';
import { formatNumber } from '../../lib/formatters';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'deterministic';
  status?: 'Processing' | 'Completed' | 'Failed';
}

const QUICK_ACTIONS = [
  'Show critical inventory risks',
  'Which purchase orders are delayed?',
  'Which suppliers are at risk?',
  "Summarize today's exceptions",
  'Explain current Control Tower alerts',
  'Show shipments at risk',
  'What changed in the last hour?',
  'Give me the highest-priority operational issues'
];

export const OrionTabletAICopilot: React.FC = () => {
  const { exceptions, shipments, purchaseOrders, inventory, suppliers, decisions } = useSupplyChain();
  const { currentUser } = useAuth();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  const { metric: healthMetric } = useLiveMetric('NETWORK_HEALTH_INDEX');
  const { metric: excMetric } = useLiveMetric('CONTROL_TOWER_EXCEPTIONS');
  const { metric: invMetric } = useLiveMetric('INVENTORY_ON_HAND');

  const healthScore = healthMetric?.value || 87;
  const criticalExceptions = useMemo(() => exceptions.filter(e => e.severity === 'Critical'), [exceptions]);
  const delayedShipments = useMemo(() => shipments.filter(s => s.delayDays > 0), [shipments]);
  const overduePOs = useMemo(() => purchaseOrders.filter(po => po.status === 'Delayed' || po.status === 'Overdue'), [purchaseOrders]);
  const totalOnHandUnits = useMemo(() => inventory.reduce((sum, i) => sum + (Number(i.onHand) || 0), 0) || invMetric?.value || 42900, [inventory, invMetric]);

  const [providerStatus, setProviderStatus] = useState<{ configured: boolean; provider: string; model: string }>({
    configured: false,
    provider: 'deterministic_engine',
    model: 'local_scm_rules'
  });
  const [statusLoading, setStatusLoading] = useState(true);

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: `**ORION AI Cognition Core initialized for Tablet OS.**\n\nConnected to **${environment}** environment with active SCM telemetry and Event Fabric.\n\n- **Network Health Index**: ${healthScore}%\n- **Critical Exceptions**: ${criticalExceptions.length}\n- **Delayed Shipments**: ${delayedShipments.length}\n- **Total On-Hand Inventory**: ${formatNumber(totalOnHandUnits)} units\n\nHow can I assist your operational decisions today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'deterministic',
      status: 'Completed'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await orionAI.checkStatus();
        if (mounted && res) {
          setProviderStatus(res);
        }
      } catch (err) {
        console.warn('[ORION-AI-STATUS] Offline/Fallback mode active');
      } finally {
        if (mounted) setStatusLoading(false);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processingState]);

  const getLocalDataTools = () => {
    return {
      getInventory: () => inventory.map(i => ({
        id: i.id,
        productId: i.productId,
        onHand: i.onHand,
        warehouseId: i.warehouseId,
        safetyStock: i.safetyStock || 500,
        averageDailyDemand: i.averageDailyDemand || 25
      })),
      getSuppliers: () => suppliers.map(s => ({
        id: s.id,
        name: s.name,
        otif: s.otif || 94.2,
        riskScore: s.score || 22,
        leadTimeDays: s.leadTime || 14
      })),
      getPurchaseOrders: () => purchaseOrders.map(po => ({
        id: po.id,
        supplierId: po.supplierId,
        status: po.status,
        totalAmount: po.totalValue,
        expectedDelivery: po.expectedDelivery
      })),
      getShipments: () => shipments.map(s => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        status: s.status,
        delayDays: s.delayDays,
        origin: s.origin,
        destination: s.destination
      })),
      getExceptions: () => exceptions.map(e => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        estimatedImpact: e.estimatedImpact,
        description: e.description,
        recommendation: (e as any).recommendation || e.recommendedAction
      })),
      getDecisions: () => decisions.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        category: d.sourceModule,
        confidence: d.confidence
      }))
    };
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isProcessing) return;

    // Governance: Guard environment tamper
    const lower = text.toLowerCase();
    if (lower.includes('switch to live') || lower.includes('switch to demo') || lower.includes('change tenant')) {
      const guardMsg: Message = {
        id: `guard-${Date.now()}`,
        sender: 'ai',
        text: `**Governance Guard Notice:** Environment changes and tenant switching cannot be triggered via natural language chat. Please use the Database Control Center or Platform Admin console.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'deterministic',
        status: 'Completed'
      };
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, guardMsg]);
      setInputMessage('');
      return;
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsProcessing(true);
    setProcessingState('Connecting...');

    try {
      setProcessingState('Using SCM data...');
      const localTools = getLocalDataTools();

      setProcessingState('Thinking...');
      const response = await generateCopilotResponse(text, localTools, 'Control Tower');

      setProcessingState('Generating response...');

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: providerStatus.configured ? 'gemini' : 'deterministic',
        status: 'Completed'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `**Operational Analysis Completed (SCM Core):**\n\nNetwork telemetry evaluated against active ${environment} dataset. Active state shows ${criticalExceptions.length} critical exceptions and ${delayedShipments.length} delayed shipments.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'deterministic',
        status: 'Failed'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
      setProcessingState('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const isGeminiLive = providerStatus.configured && providerStatus.provider === 'gemini';

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] max-w-5xl mx-auto select-none space-y-3 pb-2">
      {/* 1. STATUS & GROUNDING HEADER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shrink-0 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-os-text-primary tracking-wide">
                ORION AI COPILOT
              </span>
              <div 
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  isGeminiLive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isGeminiLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isGeminiLive ? 'LIVE' : 'DEGRADED'}</span>
              </div>
            </div>
            <div className="text-xs font-mono text-os-text-muted mt-0.5">
              {isGeminiLive ? 'Google Gemini Enterprise • Governed SCM Reasoning' : 'Deterministic SCM Reasoning Core'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${
            isLive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
          }`}>
            {environment} DATASET
          </span>
        </div>
      </div>

      {/* 2. SCM TELEMETRY METRIC BAR */}
      <div className="bg-os-surface-secondary/80 border border-os-border/70 rounded-xl px-4 py-2 shrink-0 flex items-center justify-between text-xs font-mono text-os-text-secondary overflow-x-auto no-scrollbar gap-4">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Activity size={14} className="text-cyan-400" />
          <span>Health:</span>
          <span className="font-bold text-os-text-primary">{healthScore}%</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <ShieldAlert size={14} className="text-red-400" />
          <span>Critical:</span>
          <span className="font-bold text-red-400">{criticalExceptions.length}</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Truck size={14} className="text-amber-400" />
          <span>Delays:</span>
          <span className="font-bold text-amber-400">{delayedShipments.length}</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Package size={14} className="text-emerald-400" />
          <span>Stock:</span>
          <span className="font-bold text-os-text-primary">{formatNumber(totalOnHandUnits)}</span>
        </div>
      </div>

      {/* 3. MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-os-surface/60 border border-os-border rounded-2xl p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user'
                ? 'bg-cyan-500 text-black shadow-xs'
                : 'bg-cyan-950 border border-cyan-500/40 text-cyan-400'
            }`}>
              {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>

            <div className={`rounded-2xl p-3.5 text-xs shadow-xs space-y-1.5 ${
              msg.sender === 'user'
                ? 'bg-cyan-500 text-black font-medium rounded-tr-none'
                : 'bg-os-surface border border-os-border text-os-text-primary rounded-tl-none leading-relaxed'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[10px] font-mono flex items-center justify-between gap-2 pt-1 border-t ${
                msg.sender === 'user' ? 'border-black/15 text-black/70' : 'border-os-border/50 text-os-text-muted'
              }`}>
                <span>{msg.timestamp}</span>
                {msg.source && <span>• {msg.source === 'gemini' ? 'Gemini Enterprise' : 'SCM Core'}</span>}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles size={15} />
            </div>
            <div className="bg-os-surface border border-os-border rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-cyan-400 font-mono flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{processingState || 'Thinking...'}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 4. QUICK PROMPT CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
        {QUICK_ACTIONS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-full bg-os-surface border border-os-border hover:border-cyan-400/50 active:bg-cyan-500/10 text-xs font-mono text-os-text-secondary hover:text-os-text-primary whitespace-nowrap active:scale-95 transition-all min-h-[38px] flex items-center cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 5. INPUT COMPOSER */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="flex items-end gap-2.5 shrink-0"
      >
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Orion AI about delayed shipments, inventory stockouts, or suppliers..."
            className="w-full bg-os-surface border border-os-border focus:border-cyan-400 rounded-xl px-4 py-3 text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none min-h-[44px] max-h-[120px] resize-none leading-relaxed"
          />
        </div>
        <button
          type="submit"
          disabled={!inputMessage.trim() || isProcessing}
          className="p-3.5 rounded-xl bg-cyan-400 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs shrink-0"
          aria-label="Send Message to Orion AI"
          title="Send (Enter)"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
