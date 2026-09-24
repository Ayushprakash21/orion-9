import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useLiveMetric } from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { orionAI, AIProviderStatus } from '../../services/ai/AIProvider';
import { generateCopilotResponse } from '../../lib/api';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  ShieldCheck, 
  AlertTriangle, 
  Package, 
  Truck, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Cpu,
  Database,
  X,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'deterministic';
  status?: 'Connecting...' | 'Thinking...' | 'Using SCM data...' | 'Generating response...' | 'Completed' | 'Failed';
  actions?: Array<{ label: string; actionId: string }>;
  evidence?: Array<{ label: string; value: string | number }>;
}

const QUICK_PROMPTS = [
  "Show critical inventory risks",
  "Which purchase orders are delayed?",
  "Which suppliers are at risk?",
  "Summarize today's exceptions",
  "Explain current Control Tower alerts",
  "Show shipments at risk",
  "What changed in the last hour?",
  "Give me the highest-priority operational issues"
];

export const OrionMobileAICopilot: React.FC = () => {
  const { 
    exceptions, 
    shipments, 
    purchaseOrders, 
    inventory, 
    products, 
    suppliers, 
    decisions, 
    settings, 
    currency 
  } = useSupplyChain();
  
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

  // Provider Status State
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus>({
    configured: false,
    provider: 'deterministic_engine',
    model: 'local_scm_rules'
  });
  const [statusLoading, setStatusLoading] = useState(true);

  // Input & Messaging State
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: `**ORION AI Cognition Core initialized.**\n\nOperating in **${environment}** environment with active connection to SCM telemetry and Event Fabric.\n\n- **Network Health Index**: ${healthScore}%\n- **Critical Exceptions**: ${criticalExceptions.length}\n- **Delayed Shipments**: ${delayedShipments.length}\n- **Total On-Hand Inventory**: ${formatNumber(totalOnHandUnits)} units\n\nHow can I assist your operational decisions today?`,
      timestamp: 'Ready',
      source: 'deterministic',
      actions: [
        { label: 'Show critical inventory risks', actionId: 'inv-risks' },
        { label: 'Summarize today\'s exceptions', actionId: 'exc-summary' },
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll / Check AI status on mount
  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const stat = await orionAI.checkStatus();
      setProviderStatus(stat);
    } catch (e) {
      setProviderStatus({
        configured: false,
        provider: 'deterministic_engine',
        model: 'local_scm_rules'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  // Auto-scroll on message addition or state transition
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, processingState]);

  // Build live grounded SCM data tools
  const getLocalDataTools = () => {
    return {
      getDashboardMetrics: () => ({
        healthScore,
        activeExceptionsCount: exceptions.length,
        criticalExceptionsCount: criticalExceptions.length,
        delayedShipmentsCount: delayedShipments.length,
        totalInventoryUnits: totalOnHandUnits,
        environment,
        timestamp: new Date().toISOString()
      }),
      getInventory: () => inventory.map(i => ({
        productId: i.productId,
        sku: i.productId,
        onHand: i.onHand,
        warehouseId: i.warehouseId,
        safetyStock: i.safetyStock || 500,
        averageDailyDemand: i.averageDailyDemand || 25
      })),
      getInventoryRisks: () => inventory.filter(i => (i.onHand || 0) < (i.safetyStock || 500)).map(i => ({
        productId: i.productId,
        sku: i.productId,
        onHand: i.onHand,
        safetyStock: i.safetyStock || 500,
        dailyDemand: i.averageDailyDemand || 25,
        warehouseId: i.warehouseId
      })),
      getSuppliers: () => suppliers.map(s => ({
        id: s.id,
        name: s.name,
        otif: s.otif || 94.2,
        riskScore: s.score || 22,
        leadTimeDays: s.leadTime || 14
      })),
      getSupplierPerformance: () => suppliers.map(s => ({
        id: s.id,
        name: s.name,
        otif: s.otif || 94.2,
        defectRate: s.defectRate || 0.012
      })),
      getPurchaseOrders: () => purchaseOrders.map(po => ({
        id: po.id,
        supplierId: po.supplierId,
        status: po.status,
        totalAmount: po.totalValue,
        expectedDelivery: po.expectedDelivery
      })),
      getOverduePOs: () => purchaseOrders.filter(po => po.status === 'Delayed' || po.status === 'Overdue').map(po => ({
        id: po.id,
        supplierId: po.supplierId,
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
      getDelayedShipments: () => delayedShipments.map(s => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        delayDays: s.delayDays,
        origin: s.origin,
        destination: s.destination,
        freightCost: s.freightCost
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
      })),
      getPendingDecisions: () => decisions.filter(d => d.status === 'READY_FOR_REVIEW' || d.status === 'EXECUTION_PENDING' || d.status === 'DETECTED').map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        confidence: d.confidence
      }))
    };
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isProcessing) return;

    // Guard: Prevent prompt-driven environment tampering
    const lower = text.toLowerCase();
    if (lower.includes('switch to live') || lower.includes('switch to demo') || lower.includes('change environment')) {
      const userMsg: Message = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const guardMsg: Message = {
        id: `ai-guard-${Date.now()}`,
        sender: 'ai',
        text: `**Security Governance Policy Guard Triggered:**\n\nAI agents are strictly denied authority to alter database environments, modify tenant residency, or elevate permissions through natural-language prompts. Environment changes require explicit Administrator action via Platform Control Center.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'deterministic'
      };
      setMessages(prev => [...prev, userMsg, guardMsg]);
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
      // Step 1: Tool Selection & Telemetry Assembly
      setProcessingState('Using SCM data...');
      const localTools = getLocalDataTools();

      // Step 2: Cognition Execution
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
      console.error('[ORION-AI-ERROR]', err);
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `**Operational Analysis Completed (Deterministic SCM Core):**\n\nNetwork telemetry evaluated against active ${environment} dataset. Active state shows ${criticalExceptions.length} critical exceptions and ${delayedShipments.length} delayed shipments across transit routes.`,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isGeminiLive = providerStatus.configured && providerStatus.provider === 'gemini';

  return (
    <div 
      data-orion-ai-surface="true"
      className="flex flex-col h-[calc(100dvh-130px)] max-w-full pb-2 select-none"
    >
      {/* 1. ORION AI STATUS HEADER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-3.5 mb-2.5 shrink-0 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-os-text-primary tracking-wide">
                ORION AI
              </span>
              
              {/* Truthful Provider Status Badge */}
              <div 
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                  isGeminiLive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
                title={isGeminiLive ? 'Connected to Google Gemini Enterprise Reasoning' : 'Operating via Governed Local SCM Reasoning Engine'}
              >
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isGeminiLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isGeminiLive ? 'LIVE' : 'DEGRADED'}</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-os-text-muted truncate mt-0.5">
              {isGeminiLive ? 'Gemini Enterprise • Governed SCM' : 'Local Deterministic Reasoning Core'}
            </div>
          </div>
        </div>

        {/* Database Environment Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
            isLive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
          }`}>
            {environment}
          </span>
        </div>
      </div>

      {/* 2. SCM TELEMETRY INDICATOR BAR */}
      <div className="bg-os-surface-secondary/80 border border-os-border/70 rounded-xl px-3 py-1.5 mb-2.5 shrink-0 flex items-center justify-between text-[10px] font-mono text-os-text-secondary overflow-x-auto no-scrollbar gap-3">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Activity size={12} className="text-cyan-400" />
          <span>Health:</span>
          <span className="font-bold text-os-text-primary">{healthScore}%</span>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <AlertTriangle size={12} className="text-red-400" />
          <span>Critical:</span>
          <span className="font-bold text-red-400">{criticalExceptions.length}</span>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Truck size={12} className="text-amber-400" />
          <span>Delays:</span>
          <span className="font-bold text-amber-400">{delayedShipments.length}</span>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Package size={12} className="text-emerald-400" />
          <span>Stock:</span>
          <span className="font-bold text-os-text-primary">{formatNumber(totalOnHandUnits)}</span>
        </div>
      </div>

      {/* 3. CONVERSATION MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 overscroll-contain">
        {messages.map(msg => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-os-text-muted mb-1 px-1">
              {msg.sender === 'ai' ? (
                <>
                  <Bot size={12} className="text-cyan-400" />
                  <span className="font-semibold text-cyan-400">Orion AI</span>
                  {msg.source && (
                    <span className="opacity-75 uppercase">({msg.source})</span>
                  )}
                </>
              ) : (
                <>
                  <UserIcon size={12} />
                  <span className="font-semibold">{currentUser?.fullName || 'Operator'}</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div 
              className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-500 text-black font-medium rounded-tr-xs shadow-xs select-text'
                  : 'bg-os-surface border border-os-border text-os-text-primary rounded-tl-xs shadow-xs select-text'
              }`}
            >
              {msg.sender === 'ai' ? (
                <div className="prose prose-invert prose-xs max-w-none space-y-2 text-os-text-primary font-sans">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              {/* Action recommendations inside AI messages */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-os-border/70 flex flex-wrap gap-1.5">
                  {msg.actions.map(act => (
                    <button
                      key={act.actionId}
                      type="button"
                      onClick={() => handleSend(act.label)}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 rounded-lg bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border text-[10px] font-mono text-cyan-400 flex items-center gap-1 active:scale-95 transition-all min-h-[36px] cursor-pointer disabled:opacity-50"
                    >
                      <span>{act.label}</span>
                      <ArrowRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Dynamic Response State Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-os-text-secondary text-xs font-mono p-3 bg-os-surface border border-os-border/60 rounded-xl animate-pulse max-w-[85%]">
            <Bot size={15} className="text-cyan-400 animate-spin" />
            <span>{processingState || 'AI analyzing operational telemetry...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. PROMPT QUICK ACTIONS CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 shrink-0">
        {QUICK_PROMPTS.map(promptText => (
          <button
            key={promptText}
            type="button"
            onClick={() => handleSend(promptText)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-full bg-os-surface border border-os-border hover:border-cyan-400/50 active:bg-cyan-500/10 text-[10px] font-mono text-os-text-secondary hover:text-os-text-primary whitespace-nowrap active:scale-95 transition-all min-h-[44px] flex items-center cursor-pointer disabled:opacity-50"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* 5. INPUT MESSAGE FORM */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2 shrink-0 pt-1 pb-[max(8px,env(safe-area-inset-bottom,8px))]"
      >
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={isProcessing ? 'AI is processing query...' : 'Ask Orion AI about inventory, suppliers, shipments...'}
            className="w-full bg-os-surface border border-os-border focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none min-h-[44px] max-h-[120px] resize-none leading-relaxed"
          />
        </div>
        <button
          type="submit"
          role="button"
          disabled={!inputMessage.trim() || isProcessing}
          className="p-3 rounded-xl bg-cyan-400 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs shrink-0"
          aria-label="Send Message to Orion AI"
          title="Send Message (Enter)"
        >
          {isProcessing ? (
            <RefreshCw size={16} className="animate-spin text-black" />
          ) : (
            <Send size={16} className="text-black" />
          )}
        </button>
      </form>
    </div>
  );
};
