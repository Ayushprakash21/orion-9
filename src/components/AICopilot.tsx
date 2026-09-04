import React, { useState, useRef, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { generateCopilotResponse } from '../lib/api';
import { Send, Loader2 } from 'lucide-react';
import { OrionMark } from './brand/OrionLogo';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export const AICopilot = () => {
  const { inventory, suppliers, purchaseOrders, shipments, exceptions, decisions, settings } = useSupplyChain();
  
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {
      role: 'assistant',
      content: 'Hello. I am ORION AI, your supply-chain decision assistant. I can analyze inventory, supplier performance, purchase orders, exceptions, and system decisions. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const localDataTools: Record<string, () => any> = {
        getInventory: () => inventory.map(i => ({ 
          sku: i.productId, 
          onHand: i.onHand, 
          reserved: i.reserved,
          dailyDemand: i.averageDailyDemand
        })),
        getInventoryRisks: () => inventory.filter(i => {
          const available = i.onHand - i.reserved;
          const daysOfSupply = (i.averageDailyDemand && i.averageDailyDemand > 0) ? available / i.averageDailyDemand : null;
          return daysOfSupply !== null && daysOfSupply <= settings.criticalStockOutDays;
        }).map(i => ({ sku: i.productId, onHand: i.onHand, dailyDemand: i.averageDailyDemand })),
        getSuppliers: () => suppliers.map(s => ({ name: s.name, category: s.category })),
        getSupplierPerformance: () => suppliers.map(s => ({ 
          name: s.name, 
          otif: s.otif, 
          qualityRate: s.qualityRate, 
          score: s.score
        })).sort((a, b) => (b.score || 0) - (a.score || 0)),
        getPurchaseOrders: () => purchaseOrders.map(po => ({ id: po.id, supplierId: po.supplierId, status: po.status })),
        getOverduePOs: () => purchaseOrders.filter(po => po.status === 'Overdue' || po.status === 'Delayed'),
        getShipments: () => shipments.map(s => ({ id: s.id, status: s.status, carrier: s.carrier })),
        getDelayedShipments: () => shipments.filter(s => s.delayDays > 0),
        getExceptions: () => exceptions.filter(e => e.status !== 'Resolved'),
        getDecisions: () => decisions,
        getPendingDecisions: () => decisions.filter(d => d.status === 'READY_FOR_REVIEW'),
        getDashboardMetrics: () => ({
          totalSKUs: inventory.length,
          delayedShipments: shipments.filter(s => s.delayDays > 0).length,
          openExceptions: exceptions.filter(e => e.status !== 'Resolved').length,
          pendingDecisions: decisions.filter(d => d.status === 'READY_FOR_REVIEW').length
        })
      };

      const response = await generateCopilotResponse(userMessage, localDataTools);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**Error:** Failed to generate insight. Please ensure the Gemini API key is configured. (${error.message})` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the pending decisions requiring my review?",
    "Which suppliers need immediate attention?",
    "Which SKUs are likely to stock out this week?",
    "Summarize the current priority exceptions."
  ];

  return (
    <div className="flex flex-col absolute inset-0 z-20 sm:relative sm:inset-auto sm:z-auto h-full sm:h-[calc(100vh-8rem)] bg-[#151515] sm:rounded-xl sm:border border-b-0 border-[#2A2A2A] overflow-hidden w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A] bg-[#111111] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#1B1B1B] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5]">
          <OrionMark size={16} />
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#F5F5F5]">ORION AI</h2>
          <p className="text-[11px] text-[#777777]">Your supply-chain decision assistant.</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex max-w-2xl", msg.role === 'user' ? "ml-auto" : "")}>
            <div className={cn(
              "flex gap-4 p-4 rounded-xl border text-xs leading-relaxed",
              msg.role === 'user' 
                ? "bg-[#202020] border-[#2A2A2A] text-[#F5F5F5]" 
                : "bg-[#111111] border-[#2A2A2A] text-[#B3B3B3]"
            )}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] flex items-center justify-center shrink-0 mt-0.5">
                  <OrionMark size={12} />
                </div>
              )}
              
              <div className="flex-1 space-y-3 font-mono">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex max-w-2xl">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#111111] border border-[#2A2A2A] text-xs font-mono text-[#777777]">
              <Loader2 size={14} className="animate-spin text-[#F5F5F5]" />
              <span>ORION is checking your supply-chain data…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#111111] border-t border-[#2A2A2A] shrink-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="text-[10px] uppercase tracking-wider font-mono text-[#B3B3B3] bg-[#1B1B1B] border border-[#2A2A2A] hover:text-[#F5F5F5] hover:bg-[#202020] px-3 py-1.5 rounded-lg transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask ORION anything about your supply chain..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-[#2A2A2A] bg-[#151515] focus:outline-none focus:border-[#777777] disabled:opacity-50 text-xs font-mono text-[#F5F5F5] placeholder:text-[#777777]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#202020] disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
