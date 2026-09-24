import React, { useState, useRef, useEffect } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useLiveMetric } from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
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
  Terminal
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actions?: Array<{ label: string; actionId: string }>;
}

export const OrionMobileAICopilot: React.FC = () => {
  const { exceptions, shipments, purchaseOrders, inventory, currency } = useSupplyChain();
  const { currentUser } = useAuth();
  const environment = dbManager.getEnvironment();
  const isLive = environment === 'LIVE';

  const { metric: healthMetric } = useLiveMetric('NETWORK_HEALTH_INDEX');
  const { metric: excMetric } = useLiveMetric('CONTROL_TOWER_EXCEPTIONS');
  const { metric: invMetric } = useLiveMetric('INVENTORY_ON_HAND');

  const healthScore = healthMetric?.value || 87;
  const activeExcCount = excMetric?.value || exceptions.length || 18;
  const criticalExcCount = exceptions.filter(e => e.severity === 'Critical').length || 3;
  const delayedShipmentCount = shipments.filter(s => s.delayDays > 0).length || 5;

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: `Welcome, ${currentUser?.fullName || 'Operator'}. I am the Orion Governed AI Copilot. Network telemetry is currently operating in ${environment} mode with an overall Health Index of ${healthScore}%.`,
      timestamp: 'Just now',
    },
    {
      id: 'msg-init-2',
      sender: 'ai',
      text: `Current State Summary:\n• ${criticalExcCount} critical exceptions require operator action.\n• ${delayedShipmentCount} active shipments are delayed in transit.\n• Inventory buffer levels are at ${formatNumber(invMetric?.value || 42900)} units.`,
      timestamp: 'Just now',
      actions: [
        { label: 'Contain Critical Risks', actionId: 'contain-risks' },
        { label: 'Simulate Replenishment', actionId: 'sim-replenish' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Governed AI deterministic response based on live telemetry data
    setTimeout(() => {
      let replyText = '';
      const lower = text.toLowerCase();

      if (lower.includes('happening') || lower.includes('status') || lower.includes('overview')) {
        replyText = `Supply chain health is currently at ${healthScore}%. We have detected ${criticalExcCount} critical exceptions requiring attention. Inbound logistics has ${delayedShipmentCount} delayed shipments with estimated capital at risk of ${formatCurrency(delayedShipmentCount * 18000, currency)}.`;
      } else if (lower.includes('risk') || lower.includes('exception') || lower.includes('contain')) {
        replyText = `Risk telemetry breakdown: ${criticalExcCount} Critical, ${exceptions.filter(e => e.severity === 'High').length || 7} High priority exceptions. Recommended mitigation: reroute 2 delayed air freight containers via Frankfurt hub and trigger emergency purchase order requisition for SKU-2048.`;
      } else if (lower.includes('inventory') || lower.includes('stock')) {
        replyText = `Inventory status: Total on-hand units = ${formatNumber(invMetric?.value || 42900)}. 2 warehouse nodes (WH-01, WH-03) are trending below safety stock threshold. Recommended: multi-echelon stock rebalance from regional distribution hub.`;
      } else if (lower.includes('shipment') || lower.includes('freight') || lower.includes('logistics')) {
        replyText = `Logistics update: ${shipments.length} total shipments active. ${delayedShipmentCount} are flagged with transit delays due to port congestion. Average delay is 2.4 days.`;
      } else {
        replyText = `Understood. Analyzing telemetry for "${text}". Governed SCM algorithms confirm operating parameters are within enterprise tolerance boundaries.`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-full pb-2 select-none">
      {/* 1. COPILOT HEADER BANNER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-3.5 mb-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-os-accent/15 border border-os-accent/30 flex items-center justify-center text-os-accent">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-os-text-primary">ORION AI COPILOT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] font-mono text-os-text-muted">Governed Supply Chain Intelligence</span>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded bg-os-surface-secondary border border-os-border text-[9px] font-mono text-os-accent font-semibold">
          RBAC LEVEL 4
        </div>
      </div>

      {/* 2. CONVERSATION MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map(msg => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-os-text-muted mb-1 px-1">
              {msg.sender === 'ai' ? (
                <>
                  <Bot size={11} className="text-os-accent" />
                  <span>Orion AI</span>
                </>
              ) : (
                <>
                  <UserIcon size={11} />
                  <span>{currentUser?.fullName || 'You'}</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div 
              className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-os-accent text-black font-medium rounded-tr-xs shadow-xs'
                  : 'bg-os-surface border border-os-border text-os-text-primary rounded-tl-xs shadow-xs whitespace-pre-line'
              }`}
            >
              {msg.text}

              {/* Action recommendations inside AI messages */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-os-border flex flex-wrap gap-1.5">
                  {msg.actions.map(act => (
                    <button
                      key={act.actionId}
                      onClick={() => handleSend(act.label)}
                      className="px-2.5 py-1 rounded-lg bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border text-[10px] font-mono text-os-accent flex items-center gap-1 active:scale-95 transition-all min-h-[36px]"
                    >
                      <span>{act.label}</span>
                      <ArrowRight size={10} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-os-text-muted text-xs font-mono p-2">
            <Bot size={14} className="text-os-accent animate-pulse" />
            <span>AI analyzing operational telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. PROMPT QUICK CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 shrink-0">
        {[
          "What's happening across our network?",
          "Summarize critical risks",
          "Analyze inventory stockouts",
          "Logistics bottleneck diagnosis"
        ].map(chip => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1.5 rounded-full bg-os-surface border border-os-border hover:border-os-accent/50 text-[10px] font-mono text-os-text-secondary hover:text-os-text-primary whitespace-nowrap active:scale-95 transition-all min-h-[44px] flex items-center"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 4. INPUT PROMPT FIELD */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 shrink-0 pt-1"
      >
        <div className="relative flex-1">
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Orion AI Copilot..."
            className="w-full bg-os-surface border border-os-border focus:border-os-accent rounded-xl px-3 py-2.5 text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none min-h-[44px]"
          />
        </div>
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="p-2.5 rounded-xl bg-os-accent text-black font-bold disabled:opacity-40 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Send Message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
