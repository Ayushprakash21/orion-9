import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';

export const OrionAIDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'ORION AI active. Connected to Event Bus and Live SCM Data Model. How can I assist your operations today?' }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }, { sender: 'ai', text: `Analyzing operational telemetry for: "${userText}". All indicators normal, 3 recommended workflow adjustments identified.` }]);
    setInput('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-os-surface border-l border-os-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-os-border bg-os-surface-secondary">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} />
          <h3 className="text-sm font-bold text-os-text-primary">ORION AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-os-text-muted hover:text-os-text-primary p-1 rounded">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-os-surface-hover text-cyan-400 border border-os-border'}`}>
              {m.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-3 rounded-xl text-xs max-w-[80%] ${m.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-os-surface-secondary border border-os-border text-os-text-primary'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-os-border bg-os-surface-secondary flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask ORION anything (e.g., 'Where will we stock out?')..."
          className="flex-1 bg-os-surface border border-os-border text-xs text-os-text-primary rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
