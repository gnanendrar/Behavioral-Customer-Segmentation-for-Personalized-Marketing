import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { askCopilot } from '../services/api';
import { motion } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

const SUGGESTIONS = [
  "Which customers are at risk of churning?",
  "Which segment has the highest revenue potential?",
  "Create a re-engagement campaign",
  "What percentage of customers are high-value?",
  "Which segment should I target for a new product?",
  "Why are customers leaving?"
];

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your BehaviorIQ Copilot. I can analyze segments, generate campaigns, or answer questions about your customer data. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, followups]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setFollowups([]);

    try {
      const response = await askCopilot(userMsg);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        data: response.data 
      }]);
      if (response.suggested_followups) {
        setFollowups(response.suggested_followups);
      }
    } catch (error) {
      console.error("Copilot error", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error processing your request. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 p-4 lg:p-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-w-5xl w-full mx-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AI Marketing Copilot</h2>
            <p className="text-xs text-gray-500">Ask questions about your data or get campaign ideas</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.data && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100 text-xs font-mono text-gray-600 overflow-x-auto">
                    <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}

          {followups.length > 0 && !loading && (
            <div className="flex gap-2 flex-wrap pl-12 mt-2">
              {followups.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(f)}
                  className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> {f}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          {messages.length === 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(s)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition flex items-center gap-1 border border-transparent"
                >
                  {s} <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
              placeholder="Ask anything about your customer data..."
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-gray-400">
            Copilot can make mistakes. Verify important data before taking action.
          </div>
        </div>

      </div>
    </div>
  );
}
