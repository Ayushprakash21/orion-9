import React, { useState, useRef, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { generateCopilotResponse } from '../lib/api';
import { Send, Loader2, Cpu, Box, AlertTriangle, ShieldCheck, Database, Search, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { DemandForecastEngine } from '../core/planning/DemandForecastEngine';
import { InventoryOptimizationEngine } from '../core/planning/InventoryOptimizationEngine';

const QUICK_ACTIONS = [
  { label: 'Analyze Inventory', prompt: 'Analyze current inventory position and highlight stockout risks.', icon: Box },
  { label: 'Explain Exceptions', prompt: 'Summarize recent supply chain exceptions and their root causes.', icon: AlertTriangle },
  { label: 'Analyze Supplier Risk', prompt: 'Evaluate supplier performance and identify high-risk vendors.', icon: ShieldCheck },
  { label: 'Review Procurement', prompt: 'Review open purchase orders and identify potential delays.', icon: Database },
];

export const AICopilot = () => {
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, decisions, settings } = useSupplyChain();
  
  const [messages, setMessages] = useState<{
    role: 'user' | 'assistant', 
    content: string,
    evidence?: string,
    recommendation?: string
  }[]>([
    {
      role: 'assistant',
      content: 'I am ORION AI, the platform intelligence core. How can I assist you with supply chain analysis today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'analyzing' | 'ready'>('ready');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiState]);

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptText = customPrompt || input;
    if (!promptText.trim()) return;

    const userMessage = { role: 'user' as const, content: promptText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setAiState('thinking');

    // Simulate analysis phases
    setTimeout(() => setAiState('analyzing'), 1000);

    try {
      const forecasts = DemandForecastEngine.generateForecast(inventory, products, 30, 0);
      const optimizations = InventoryOptimizationEngine.optimize(inventory, forecasts, purchaseOrders, suppliers, settings);

      const contextData = {
        getInventory: () => inventory.map(i => ({
          productId: i.productId,
          onHand: i.onHand,
          warehouseId: i.warehouseId
        })),
        getOptimizations: () => optimizations.slice(0, 10), // Send top 10 for context limits
        getExceptions: () => exceptions.slice(0, 5),
        getRecentDecisions: () => decisions.slice(0, 3)
      };

      const response = await generateCopilotResponse(
        promptText,
        contextData,
        'Control Tower'
      );
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (e) {
        parsedResponse = null;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: parsedResponse ? (parsedResponse.executiveSummary || response) : response,
        evidence: parsedResponse?.telemetryEvidence || undefined,
        recommendation: parsedResponse?.strategicRoadmap?.[0]?.actionDetails || undefined
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**AI SERVICE UNAVAILABLE**\n\nUnable to process request: ${error.message || 'Connection failed'}.` 
      }]);
    } finally {
      setIsLoading(false);
      setAiState('ready');
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-os-bg">
      <div className="flex-1 min-h-0 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-hidden">
        
        {/* Header Console */}
        <div className="bg-[#0A0C0E] border border-os-border rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden shrink-0 shadow-lg">
          {/* Background grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #00F2FE 1px, transparent 1px), linear-gradient(to bottom, #00F2FE 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }} 
          />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className={`absolute inset-0 border border-[#00F2FE]/20 rounded-full transition-all duration-1000 ${
                aiState === 'thinking' ? 'animate-[spin_2s_linear_infinite]' :
                aiState === 'analyzing' ? 'animate-[spin_1s_linear_infinite]' :
                'animate-[spin_10s_linear_infinite]'
              }`} />
              <div className={`absolute inset-2 border border-dashed border-[#00F2FE]/40 rounded-full transition-all duration-700 ${
                aiState === 'thinking' ? 'animate-[spin_1.5s_linear_infinite_reverse]' :
                aiState === 'analyzing' ? 'animate-[spin_0.5s_linear_infinite_reverse]' :
                'animate-[spin_8s_linear_infinite_reverse]'
              }`} />
              <Cpu className={`text-[#00F2FE] w-6 h-6 transition-opacity duration-300 ${
                aiState === 'analyzing' ? 'opacity-100 animate-pulse' : 'opacity-70'
              }`} />
            </div>
            
            <div>
              <h1 className="text-xl md:text-2xl font-light text-white tracking-widest uppercase mb-1 flex items-center gap-3">
                ORION AI <span className="text-[10px] font-mono tracking-widest text-[#00F2FE] px-2 py-0.5 border border-[#00F2FE]/30 bg-[#00F2FE]/10 rounded uppercase">Intelligence Console</span>
              </h1>
              <div className="text-xs font-mono text-os-text-muted flex items-center gap-2 uppercase tracking-wider">
                System Status: 
                <span className={`font-bold ${aiState === 'ready' || aiState === 'idle' ? 'text-[#30D158]' : 'text-[#00F2FE]'}`}>
                  {aiState === 'ready' || aiState === 'idle' ? 'ONLINE' : aiState.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end gap-1.5 opacity-60">
            <div className="text-[9px] font-mono tracking-widest text-os-text-muted uppercase">Engine Core</div>
            <div className="text-[10px] font-mono tracking-widest text-[#00F2FE] uppercase flex items-center gap-2">
              Gemini Intelligence <span className="w-1.5 h-1.5 bg-[#00F2FE] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-os-surface border border-os-border rounded-2xl flex flex-col min-h-0 overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 min-h-0">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300",
                  message.role === 'user' ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "text-[10px] font-mono tracking-widest uppercase mb-1.5 flex items-center gap-2",
                  message.role === 'user' ? "justify-end text-os-text-muted" : "text-[#00F2FE]"
                )}>
                  {message.role === 'user' ? 'Operator' : 'ORION AI'}
                </div>
                
                <div className={cn(
                  "p-4 rounded-xl text-sm leading-relaxed",
                  message.role === 'user' 
                    ? "bg-[#0A0C0E] border border-os-border text-white shadow-sm" 
                    : "bg-transparent text-os-text-primary"
                )}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  
                  {message.evidence && (
                    <div className="mt-4 p-3 bg-[#00F2FE]/5 border border-[#00F2FE]/20 rounded-lg">
                      <div className="text-[9px] font-mono font-bold tracking-widest text-[#00F2FE] uppercase mb-1 flex items-center gap-1.5">
                        <Database size={10} /> TELEMETRY EVIDENCE
                      </div>
                      <div className="text-xs font-mono text-os-text-secondary">{message.evidence}</div>
                    </div>
                  )}
                  
                  {message.recommendation && (
                    <div className="mt-3 p-3 bg-[#30D158]/5 border border-[#30D158]/20 rounded-lg">
                      <div className="text-[9px] font-mono font-bold tracking-widest text-[#30D158] uppercase mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={10} /> STRATEGIC RECOMMENDATION
                      </div>
                      <div className="text-xs text-os-text-secondary">{message.recommendation}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="max-w-[80%] mr-auto animate-in fade-in duration-300">
                <div className="text-[10px] font-mono tracking-widest uppercase text-[#00F2FE] mb-1.5">
                  ORION AI
                </div>
                <div className="p-4 rounded-xl bg-transparent border border-os-border/50 flex items-center gap-3 text-os-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00F2FE]" />
                  <span className="text-xs font-mono uppercase tracking-widest">{aiState === 'thinking' ? 'Synthesizing Request...' : 'Analyzing Telemetry...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (only show when few messages to not clutter) */}
          {messages.length < 3 && !isLoading && (
            <div className="px-6 pb-4">
              <div className="text-[9px] font-mono text-os-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <CornerDownRight size={10} /> Quick Intelligence Actions
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(undefined, action.prompt)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-os-border bg-os-bg hover:bg-os-surface-hover hover:border-[#00F2FE]/30 text-xs text-os-text-secondary hover:text-[#00F2FE] transition-colors group"
                  >
                    <action.icon size={12} className="group-hover:text-[#00F2FE]" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-[#0A0C0E] border-t border-os-border shrink-0 z-10">
            <form onSubmit={(e) => handleSubmit(e)} className="relative flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ORION AI about your supply chain..."
                className="w-full pl-5 pr-14 py-4 bg-os-surface border border-os-border rounded-xl text-sm text-white placeholder:text-os-text-muted focus:outline-none focus:border-[#00F2FE]/50 focus:ring-1 focus:ring-[#00F2FE]/50 transition-all font-mono"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 rounded-lg bg-[#00F2FE]/10 text-[#00F2FE] hover:bg-[#00F2FE] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <div className="text-center mt-3 text-[9px] font-mono text-os-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={10} /> ORION AI utilizes deterministic supply chain data for analysis
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
