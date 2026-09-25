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
    recommendation?: string,
    governanceStatus?: 'ANSWER' | 'RECOMMENDATION' | 'DRAFT' | 'ACTION REQUEST' | 'PENDING APPROVAL' | 'EXECUTED' | 'REJECTED',
    approvalId?: string,
    commandId?: string
  }[]>([
    {
      role: 'assistant',
      content: 'I am ORION AI, the platform intelligence core. How can I assist you with supply chain analysis today?',
      governanceStatus: 'ANSWER'
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

      let govStatus: any = 'ANSWER';
      const pLower = promptText.toLowerCase();
      if (pLower.includes('release') || pLower.includes('create po') || pLower.includes('order')) {
        govStatus = 'PENDING APPROVAL';
      } else if (pLower.includes('recommend') || pLower.includes('suggest') || parsedResponse?.strategicRoadmap?.length) {
        govStatus = 'RECOMMENDATION';
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: parsedResponse ? (parsedResponse.executiveSummary || response) : response,
        evidence: parsedResponse?.telemetryEvidence || undefined,
        recommendation: parsedResponse?.strategicRoadmap?.[0]?.actionDetails || undefined,
        governanceStatus: govStatus
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
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#0c0e11]">
      <div className="flex-1 min-h-0 max-w-[1200px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-3.5 sm:gap-5 overflow-hidden">
        
        {/* Header Console */}
        <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-3.5 sm:p-5 md:p-6 flex items-center justify-between relative overflow-hidden shrink-0 shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white tracking-normal mb-0.5 flex items-center gap-2">
                Orion Copilot <span className="text-[10px] font-medium text-sky-400 px-2 py-0.5 border border-sky-500/30 bg-sky-500/10 rounded-md">Enterprise Intelligence</span>
              </h1>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                Engine Status: 
                <span className={cn(
                  "font-medium",
                  aiState === 'ready' || aiState === 'idle' ? 'text-emerald-400' : 'text-sky-400'
                )}>
                  {aiState === 'ready' || aiState === 'idle' ? 'Ready' : 'Analyzing Telemetry...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end gap-1 text-right">
            <div className="text-[10px] text-slate-400">Intelligence Core</div>
            <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              Gemini Pro Grounding <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#12151a] border border-white/[0.08] rounded-2xl flex flex-col min-h-0 overflow-hidden relative shadow-lg">
          
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 min-h-0 custom-scrollbar">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-200",
                  message.role === 'user' ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "text-[11px] font-medium mb-1.5 flex items-center gap-2",
                  message.role === 'user' ? "justify-end text-slate-400" : "text-sky-400"
                )}>
                  {message.role === 'user' ? 'You' : (
                    <>
                      <span className="font-semibold">Orion Copilot</span>
                      {message.governanceStatus && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-medium border",
                          message.governanceStatus === 'EXECUTED' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                          message.governanceStatus === 'PENDING APPROVAL' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                          message.governanceStatus === 'RECOMMENDATION' && "bg-sky-500/10 text-sky-400 border-sky-500/30",
                          message.governanceStatus === 'REJECTED' && "bg-rose-500/10 text-rose-400 border-rose-500/30",
                          message.governanceStatus === 'ANSWER' && "bg-white/5 text-slate-400 border-white/10"
                        )}>
                          {message.governanceStatus}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                <div className={cn(
                  "p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed",
                  message.role === 'user' 
                    ? "bg-sky-600 text-white shadow-sm" 
                    : "bg-white/[0.04] border border-white/[0.08] text-slate-200"
                )}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  
                  {message.evidence && (
                    <div className="mt-3.5 p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl">
                      <div className="text-[10px] font-semibold tracking-wide text-sky-400 uppercase mb-1 flex items-center gap-1.5">
                        <Database size={12} /> Grounded Telemetry Evidence
                      </div>
                      <div className="text-xs font-mono text-slate-300">{message.evidence}</div>
                    </div>
                  )}
                  
                  {message.recommendation && (
                    <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <div className="text-[10px] font-semibold tracking-wide text-emerald-400 uppercase mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Strategic Recommendation
                      </div>
                      <div className="text-xs text-slate-300">{message.recommendation}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="max-w-[80%] mr-auto animate-in fade-in duration-200">
                <div className="text-[11px] font-semibold text-sky-400 mb-1.5">
                  Orion Copilot
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span className="text-xs">{aiState === 'thinking' ? 'Synthesizing response...' : 'Analyzing real-time SCM data...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length < 3 && !isLoading && (
            <div className="px-3.5 sm:px-6 pb-2.5 pt-1 shrink-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CornerDownRight size={11} /> Suggested Actions
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-24 overflow-x-auto custom-scrollbar">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(undefined, action.prompt)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-sky-500/30 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <action.icon size={13} className="text-sky-400" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 sm:p-4 bg-[#0c0e11] border-t border-white/[0.08] shrink-0 z-10">
            <form onSubmit={(e) => handleSubmit(e)} className="relative flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Orion Copilot about stock levels, supply risks, POs..."
                className="w-full pl-4 pr-12 py-3 sm:py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <div className="text-center mt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck size={11} /> Orion Copilot operates under governed enterprise supply chain telemetry
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
