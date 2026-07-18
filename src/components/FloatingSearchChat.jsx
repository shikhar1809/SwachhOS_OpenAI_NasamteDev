import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, Search } from 'lucide-react';
import { askRagAgent } from '../services/gemini';

export default function FloatingSearchChat({ points }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'Hello! I am the SwachhOS AI Assistant for Lucknow. You can ask me about LMC wards, cleanliness status, or official contact details.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!isOpen) {
      setIsOpen(true);
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    // Prepare history, excluding the initial greeting
    const chatHistory = messages.filter((m, i) => i !== 0);

    const responseText = await askRagAgent(userMessage, chatHistory, points);

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-3 md:px-4 z-[2000] flex flex-col items-center pointer-events-none">
      
      {/* Search Bar / Input Area */}
      <div className="w-full bg-white rounded-full shadow-2xl border border-gray-200 p-2 pointer-events-auto transition-all duration-300">
        <form onSubmit={handleSend} className="relative flex items-center">
          <div className="pl-4 pr-2 text-emerald-600">
            <Search size={20} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Ask AI about Lucknow wards, cleanliness, or track Complaint ID (e.g. SWC-0001)..."
            className="w-full bg-transparent border-none py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shadow-md"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
          </button>
        </form>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-full mt-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden pointer-events-auto transition-all duration-300" style={{ maxHeight: '60vh' }}>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Bot size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">SwachhOS AI</h2>
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Lucknow Municipal Corporation</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-3xl rounded-tr-sm shadow-md' 
                      : 'bg-gray-100/80 text-gray-800 rounded-3xl rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1.5 px-2 font-medium uppercase tracking-wider">
                  {msg.role === 'user' ? 'You' : 'AI Agent'}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="bg-gray-100/80 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2 text-gray-500 text-[15px]">
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
